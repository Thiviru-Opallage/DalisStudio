import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generalLimiter } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const rateCheck = generalLimiter(req);
  if (!rateCheck.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const hero = await prisma.hero_section.findFirst();
    return NextResponse.json(hero || {
      title: "Dalis Studio",
      base_image: "/hero-base.jpg",
      hover_image: "/hero-hover.jpg"
    });
  } catch (err) {
    console.error("[HeroPublicAPI] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
