import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { safeUrl } from "@/lib/validation";

const schema = z.object({
  bracket_group: z.number().int().min(1).max(3),
  image_url: safeUrl(),
  sort_order: z.number().int().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await prisma.quote_bracket_image.findMany({
      orderBy: [
        { bracket_group: "asc" },
        { sort_order: "asc" }
      ],
    });
    return NextResponse.json(items);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch quote bracket images" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const { bracket_group, image_url, sort_order } = parsed.data;

    let order = sort_order;
    if (order === undefined) {
      const lastItem = await prisma.quote_bracket_image.findFirst({
        where: { bracket_group },
        orderBy: { sort_order: "desc" },
      });
      order = lastItem ? lastItem.sort_order + 1 : 0;
    }

    const newItem = await prisma.quote_bracket_image.create({
      data: {
        bracket_group,
        image_url,
        sort_order: order,
      },
    });

    return NextResponse.json({ success: true, item: newItem });
  } catch (err) {
    console.error("[QuoteBracketsAdminAPI] Error:", err);
    return NextResponse.json({ error: "Failed to create bracket image" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const parsed = schema.partial().safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 });
    }

    const updated = await prisma.quote_bracket_image.update({
      where: { id: parseInt(id) },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (err) {
    console.error("[QuoteBracketsAdminAPI] Update Error:", err);
    return NextResponse.json({ error: "Failed to update bracket image" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const idStr = searchParams.get("id");
    if (!idStr) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await prisma.quote_bracket_image.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[QuoteBracketsAdminAPI] Delete Error:", err);
    return NextResponse.json({ error: "Failed to delete bracket image" }, { status: 500 });
  }
}
