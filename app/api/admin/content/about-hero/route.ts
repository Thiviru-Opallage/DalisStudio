import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { safeUrl } from "@/lib/validation";

const schema = z.object({
  base_image_dark: safeUrl(),
  hover_image_dark: safeUrl(),
  base_image_light: safeUrl(),
  hover_image_light: safeUrl(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const hero = await prisma.about_hero.findFirst();
    return NextResponse.json(hero || {});
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch about hero" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 });
    }

    const { base_image_dark, hover_image_dark, base_image_light, hover_image_light } = parsed.data;

    const hero = await prisma.about_hero.findFirst();
    let result;
    if (hero) {
      result = await prisma.about_hero.update({
        where: { id: hero.id },
        data: { base_image_dark, hover_image_dark, base_image_light, hover_image_light },
      });
    } else {
      result = await prisma.about_hero.create({
        data: { base_image_dark, hover_image_dark, base_image_light, hover_image_light },
      });
    }

    return NextResponse.json({ success: true, hero: result });
  } catch (err) {
    console.error("[AboutHeroAdminAPI] Error:", err);
    return NextResponse.json({ error: "Failed to update about hero" }, { status: 500 });
  }
}
