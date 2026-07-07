import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generalLimiter } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const rateCheck = generalLimiter(req);
  if (!rateCheck.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const data = await prisma.about_hero.findFirst();
    return NextResponse.json(data || {
      base_image_dark: "/about-hero-face.png",
      hover_image_dark: "/about-colour.png",
      base_image_light: "/about-hero-face-light.png",
      hover_image_light: "/about-colour-light.png",
    });
  } catch (err) {
    console.error("[AboutHeroPublicAPI] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
