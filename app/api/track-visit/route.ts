import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { visitLimiter } from "@/lib/rateLimit";

function detectDevice(ua: string): "mobile" | "tablet" | "desktop" {
  if (/mobile/i.test(ua))      return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
}

export async function POST(req: NextRequest) {
  // Rate limit — prevent analytics spam
  const rateCheck = visitLimiter(req);
  if (!rateCheck.success) {
    return NextResponse.json({ ok: true }); // Silent — don't reveal rate limit to bots
  }

  try {
    const body = await req.json();
    const { page_path } = body;

    if (!page_path || typeof page_path !== "string" || page_path.length > 500) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    if (page_path.startsWith("/admin")) {
      return NextResponse.json({ ok: true });
    }

    const ip       = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? null;
    const ua       = req.headers.get("user-agent") ?? "";
    const referrer = req.headers.get("referer") ?? null;
    const device   = detectDevice(ua);

    const token        = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const visitorName  = token?.name  ? String(token.name)  : null;
    const visitorEmail = token?.email ? String(token.email) : null;

    const visit = await prisma.visits.create({
      data: {
        ip_address:    ip,
        user_agent:    ua || null,
        referrer,
        device_type:   device,
        visitor_name:  visitorName,
        visitor_email: visitorEmail,
        is_bounce:     true,      // default true, updated on end
        session_duration: null,
      },
    });

    await prisma.page_views.create({
      data: { page_path, visit_id: visit.id },
    });

    return NextResponse.json({ ok: true, visitId: visit.id });
  } catch (err) {
    console.error("[TrackVisit] Error:", err);
    return NextResponse.json({ ok: true });
  }
}