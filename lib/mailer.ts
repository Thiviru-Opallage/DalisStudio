import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

// Only send to admins who have email_notifications = true
async function getAdminEmails(): Promise<string[]> {
  const admins = await prisma.users.findMany({
    where: { role: "admin", is_active: true, email_notifications: true },
    select: { email: true },
  });
  return admins.map((a) => a.email);
}

async function sendEmail(subject: string, html: string): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) return;

  const recipients = await getAdminEmails();
  if (recipients.length === 0) return;

  try {
    await transporter.sendMail({
      from:    `"Dalis Studio" <${process.env.GMAIL_USER}>`,
      to:      recipients.join(", "),
      subject,
      html,
    });
  } catch (err) {
    console.error("[Mailer] Failed to send email:", err);
  }
}

export async function mailContactSubmission(data: {
  name: string; email: string; phone?: string | null; message: string;
}): Promise<void> {
  const time = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Colombo", dateStyle: "medium", timeStyle: "short",
  });

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;
                padding:32px 24px;border:1px solid #e5e5e5;border-radius:10px;">
      <h2 style="margin:0 0 4px;font-size:20px;color:#111;">📩 New Contact Message</h2>
      <p style="margin:0 0 28px;font-size:13px;color:#888;">Received ${time} (Sri Lanka time)</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#111;">
        <tr>
          <td style="padding:12px 0;color:#888;width:90px;vertical-align:top;font-weight:600;border-top:1px solid #f0f0f0;">Name</td>
          <td style="padding:12px 0;border-top:1px solid #f0f0f0;">${data.name}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;color:#888;vertical-align:top;font-weight:600;border-top:1px solid #f0f0f0;">Email</td>
          <td style="padding:12px 0;border-top:1px solid #f0f0f0;">
            <a href="mailto:${data.email}" style="color:#000;text-decoration:underline;">${data.email}</a>
          </td>
        </tr>
        ${data.phone ? `
        <tr>
          <td style="padding:12px 0;color:#888;vertical-align:top;font-weight:600;border-top:1px solid #f0f0f0;">Phone</td>
          <td style="padding:12px 0;border-top:1px solid #f0f0f0;">${data.phone}</td>
        </tr>` : ""}
        <tr>
          <td style="padding:12px 0;color:#888;vertical-align:top;font-weight:600;border-top:1px solid #f0f0f0;">Message</td>
          <td style="padding:12px 0;border-top:1px solid #f0f0f0;white-space:pre-wrap;line-height:1.6;">${data.message}</td>
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
  await sendEmail("📩 New Contact Message — Dalis Studio", html);
}

export async function mailLoginAlert(data: {
  name: string | null; email: string; method: "google" | "credentials";
  ip?: string; userAgent?: string;
}): Promise<void> {
  const time = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Colombo", dateStyle: "medium", timeStyle: "short",
  });
  const who = data.name?.trim() || "Unknown user";

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
          <td style="padding:12px 0;border-top:1px solid #f0f0f0;">${data.email}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;color:#888;vertical-align:top;font-weight:600;border-top:1px solid #f0f0f0;">Method</td>
          <td style="padding:12px 0;border-top:1px solid #f0f0f0;text-transform:capitalize;">${data.method}</td>
        </tr>
        ${data.ip ? `
        <tr>
          <td style="padding:12px 0;color:#888;vertical-align:top;font-weight:600;border-top:1px solid #f0f0f0;">IP</td>
          <td style="padding:12px 0;border-top:1px solid #f0f0f0;font-family:monospace;font-size:13px;">${data.ip}</td>
        </tr>` : ""}
        ${data.userAgent ? `
        <tr>
          <td style="padding:12px 0;color:#888;vertical-align:top;font-weight:600;border-top:1px solid #f0f0f0;">Device</td>
          <td style="padding:12px 0;border-top:1px solid #f0f0f0;font-size:12px;color:#555;">${data.userAgent}</td>
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
  await sendEmail("🔐 Login Alert — Dalis Studio", html);
}