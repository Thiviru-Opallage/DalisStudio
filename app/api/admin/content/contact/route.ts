import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { safeUrl } from "@/lib/validation";

const schema = z.object({
  card_image_url: safeUrl(),
  showreel_url: safeUrl(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contact = await prisma.contact_content.findFirst();
    return NextResponse.json(contact || {});
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch contact content" }, { status: 500 });
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

    const { card_image_url, showreel_url } = parsed.data;

    const contact = await prisma.contact_content.findFirst();
    let result;
    if (contact) {
      result = await prisma.contact_content.update({
        where: { id: contact.id },
        data: { card_image_url, showreel_url },
      });
    } else {
      result = await prisma.contact_content.create({
        data: { card_image_url, showreel_url },
      });
    }

    return NextResponse.json({ success: true, contact: result });
  } catch (err) {
    console.error("[ContactAdminAPI] Error:", err);
    return NextResponse.json({ error: "Failed to update contact content" }, { status: 500 });
  }
}
