import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";
import { safeUrl } from "@/lib/validation";

const schema = z.object({
  title: z.string().min(1).max(255),
  base_image: safeUrl(),
  hover_image: safeUrl(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const hero = await prisma.hero_section.findFirst();
    return NextResponse.json(hero || {});
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch hero section" }, { status: 500 });
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

    const { title, base_image, hover_image } = parsed.data;
    const sanitizedTitle = sanitizeHtml(title, { allowedTags: [], allowedAttributes: {} });

    const hero = await prisma.hero_section.findFirst();
    let result;
    if (hero) {
      result = await prisma.hero_section.update({
        where: { id: hero.id },
        data: { title: sanitizedTitle, base_image, hover_image },
      });
    } else {
      result = await prisma.hero_section.create({
        data: { title: sanitizedTitle, base_image, hover_image },
      });
    }

    return NextResponse.json({ success: true, hero: result });
  } catch (err) {
    console.error("[HeroAdminAPI] Error:", err);
    return NextResponse.json({ error: "Failed to update hero section" }, { status: 500 });
  }
}
