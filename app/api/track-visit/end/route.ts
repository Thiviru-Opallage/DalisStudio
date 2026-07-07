import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { visitLimiter } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // Rate limit
  const rateCheck = visitLimiter(req);
  if (!rateCheck.success) {
    return NextResponse.json({ ok: true });
  }

  try {
    const body = await req.json();
    const { visitId, duration, isBounce } = body;

    if (!visitId || typeof visitId !== "number" || visitId < 1 || visitId > 2147483647) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Clamp duration to a sane range (max 24 hours)
    const safeDuration = typeof duration === "number" ? Math.min(Math.max(0, Math.round(duration)), 86400) : null;

    await prisma.visits.update({
      where: { id: visitId },
      data: {
        session_duration: safeDuration,
        is_bounce:        isBounce === true,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[TrackVisit/End] Error:", err);
    return NextResponse.json({ ok: true });
  }
}