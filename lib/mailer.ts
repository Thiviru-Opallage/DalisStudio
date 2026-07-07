import nodemailer from "nodemailer";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

// ── Defense-in-depth: escape before inserting into an HTML email.
// sanitize-html already neutralizes contact-form input upstream (verified),
// but this file shouldn't depend on that staying true forever.
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── Gmail transport — used only for internal login alerts ──────
function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

// ── Resend client — used for public contact form submissions ───
function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[Mailer] RESEND_API_KEY not set — contact emails will not send.");
    return null;
  }
  return new Resend(key);
}

// Recipients come from the users table (role=admin, active, opted in).
// ADMIN_EMAIL is only used as a fallback when no admin account exists at
// all yet (e.g. fresh install) — it never overrides an admin's own
// is_active or email_notifications choice.
async function getAdminEmails(): Promise<string[]> {
  // Single query: fetch all admins (including inactive/opted-out) to check existence,
  // then filter in-app. Avoids the extra findFirst round-trip.
  const allAdmins = await prisma.users.findMany({
    where: { role: "admin" },
    select: { email: true, is_active: true, email_notifications: true },
  });

  if (allAdmins.length === 0) {
    // No admin accounts exist yet — use env fallback for fresh installs
    const fallback = process.env.ADMIN_EMAIL;
    return fallback ? [fallback] : [];
  }

  // Only return admins who are active AND opted in to notifications
  const emails = allAdmins
    .filter((a) => a.is_active && a.email_notifications)
    .map((a) => a.email);

  return emails;
}

async function sendViaGmail(subject: string, html: string): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) return;

  const recipients = await getAdminEmails();
  if (recipients.length === 0) return;

  try {
    await transporter.sendMail({
      from: `"Dalis Studio" <${process.env.GMAIL_USER}>`,
      to: recipients.join(", "),
      subject,
      html,
    });
  } catch (err) {
    console.error("[Mailer] Gmail send failed:", err);
  }
}

async function sendViaResend(subject: string, html: string): Promise<void> {
  const resend = getResendClient();
  if (!resend) return;

  const recipients = await getAdminEmails();
  if (recipients.length === 0) return;

  const from = process.env.RESEND_FROM_EMAIL ?? "Dalis Studio <onboarding@resend.dev>";

  try {
    const { error } = await resend.emails.send({
      from,
      to: recipients,
      subject,
      html,
    });
    if (error) console.error("[Mailer] Resend send failed:", error);
  } catch (err) {
    console.error("[Mailer] Resend send threw:", err);
  }
}

export async function mailContactSubmission(data: {
  name: string; email: string; phone?: string | null; message: string;
}): Promise<void> {
  const time = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Colombo", dateStyle: "medium", timeStyle: "short",
  });

  const name    = escapeHtml(data.name);
  const email   = escapeHtml(data.email);
  const phone   = data.phone ? escapeHtml(data.phone) : null;
  const message = escapeHtml(data.message);

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;
                padding:32px 24px;border:1px solid #e5e5e5;border-radius:10px;">
      <h2 style="margin:0 0 4px;font-size:20px;color:#111;">📩 New Contact Message</h2>
      <p style="margin:0 0 28px;font-size:13px;color:#888;">Received ${time} (Sri Lanka time)</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#111;">
        <tr>
          <td style="padding:12px 0;color:#888;width:90px;vertical-align:top;font-weight:600;border-top:1px solid #f0f0f0;">Name</td>
          <td style="padding:12px 0;border-top:1px solid #f0f0f0;">${name}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;color:#888;vertical-align:top;font-weight:600;border-top:1px solid #f0f0f0;">Email</td>
          <td style="padding:12px 0;border-top:1px solid #f0f0f0;">
            <a href="mailto:${email}" style="color:#000;text-decoration:underline;">${email}</a>
          </td>
        </tr>
        ${phone ? `
        <tr>
          <td style="padding:12px 0;color:#888;vertical-align:top;font-weight:600;border-top:1px solid #f0f0f0;">Phone</td>
          <td style="padding:12px 0;border-top:1px solid #f0f0f0;">${phone}</td>
        </tr>` : ""}
        <tr>
          <td style="padding:12px 0;color:#888;vertical-align:top;font-weight:600;border-top:1px solid #f0f0f0;">Message</td>
          <td style="padding:12px 0;border-top:1px solid #f0f0f0;white-space:pre-wrap;line-height:1.6;">${message}</td>
        </tr>
      </table>
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e5e5;">
        <a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/admin/messages"
           style="display:inline-block;background:#000;color:#fff;padding:11px 22px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:500;">
          View in Admin Panel →
        </a>
      </div>
      <p style="margin-top:24px;font-size:11px;color:#bbb;">Dalis Studio — automated notification</p>
    </div>
  `;
  await sendViaResend("📩 New Contact Message — Dalis Studio", html);
}

export async function mailLoginAlert(data: {
  name: string | null; email: string; method: "google" | "credentials";
  ip?: string; userAgent?: string;
}): Promise<void> {
  const time = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Colombo", dateStyle: "medium", timeStyle: "short",
  });
  const who       = escapeHtml(data.name?.trim() || "Unknown user");
  const email     = escapeHtml(data.email);
  const ip        = data.ip ? escapeHtml(data.ip) : undefined;
  const userAgent = data.userAgent ? escapeHtml(data.userAgent) : undefined;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;
                padding:32px 24px;border:1px solid #e5e5e5;border-radius:10px;">
      <h2 style="margin:0 0 4px;font-size:20px;color:#111;">🔐 Login Alert</h2>
      <p style="margin:0 0 28px;font-size:13px;color:#888;">${time} (Sri Lanka time)</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#111;">
        <tr>
          <td style="padding:12px 0;color:#888;width:110px;vertical-align:top;font-weight:600;border-top:1px solid #f0f0f0;">Name</td>
          <td style="padding:12px 0;border-top:1px solid #f0f0f0;">${who}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;color:#888;vertical-align:top;font-weight:600;border-top:1px solid #f0f0f0;">Email</td>
          <td style="padding:12px 0;border-top:1px solid #f0f0f0;">${email}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;color:#888;vertical-align:top;font-weight:600;border-top:1px solid #f0f0f0;">Method</td>
          <td style="padding:12px 0;border-top:1px solid #f0f0f0;text-transform:capitalize;">${data.method}</td>
        </tr>
        ${ip ? `
        <tr>
          <td style="padding:12px 0;color:#888;vertical-align:top;font-weight:600;border-top:1px solid #f0f0f0;">IP</td>
          <td style="padding:12px 0;border-top:1px solid #f0f0f0;font-family:monospace;font-size:13px;">${ip}</td>
        </tr>` : ""}
        ${userAgent ? `
        <tr>
          <td style="padding:12px 0;color:#888;vertical-align:top;font-weight:600;border-top:1px solid #f0f0f0;">Device</td>
          <td style="padding:12px 0;border-top:1px solid #f0f0f0;font-size:12px;color:#555;">${userAgent}</td>
        </tr>` : ""}
      </table>
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e5e5;">
        <a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/admin"
           style="display:inline-block;background:#000;color:#fff;padding:11px 22px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:500;">
          Open Admin Panel →
        </a>
      </div>
      <p style="margin-top:24px;font-size:11px;color:#bbb;">Dalis Studio — automated notification</p>
    </div>
  `;
  await sendViaGmail("🔐 Login Alert — Dalis Studio", html);
}