import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { safeUrl } from "@/lib/validation";

const schema = z.object({
  one: safeUrl(),
  two: safeUrl(),
  three: safeUrl(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await prisma.about_quote_image.findMany();
    const mapped = items.reduce((acc, curr) => {
      acc[curr.position] = curr.image_url;
      return acc;
    }, {} as Record<string, string>);
    return NextResponse.json(mapped);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch about quote images" }, { status: 500 });
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

    const { one, two, three } = parsed.data;

    await prisma.about_quote_image.upsert({
      where: { position: "one" },
      update: { image_url: one },
      create: { position: "one", image_url: one },
    });

    await prisma.about_quote_image.upsert({
      where: { position: "two" },
      update: { image_url: two },
      create: { position: "two", image_url: two },
    });

    await prisma.about_quote_image.upsert({
      where: { position: "three" },
      update: { image_url: three },
      create: { position: "three", image_url: three },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[AboutQuoteAdminAPI] Error:", err);
    return NextResponse.json({ error: "Failed to update about quote images" }, { status: 500 });
  }
}
