import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { visitId, duration, isBounce } = body;

    if (!visitId || typeof visitId !== "number") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await prisma.visits.update({
      where: { id: visitId },
      data: {
        session_duration: typeof duration === "number" ? duration : null,
        is_bounce:        isBounce === true,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[TrackVisit/End] Error:", err);
    return NextResponse.json({ ok: true });
  }
}