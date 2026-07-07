import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";
import { safeUrl } from "@/lib/validation";

const schema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  image_url: safeUrl(),
  sort_order: z.number().int().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const works = await prisma.signature_work.findMany({
      orderBy: { sort_order: "asc" },
    });
    return NextResponse.json(works);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch signature works" }, { status: 500 });
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

    const { title, description, image_url, sort_order } = parsed.data;
    const sanitizedTitle = sanitizeHtml(title, { allowedTags: [], allowedAttributes: {} });
    const sanitizedDescription = sanitizeHtml(description, { allowedTags: [], allowedAttributes: {} });

    let order = sort_order;
    if (order === undefined) {
      const lastItem = await prisma.signature_work.findFirst({
        orderBy: { sort_order: "desc" },
      });
      order = lastItem ? lastItem.sort_order + 1 : 0;
    }

    const newWork = await prisma.signature_work.create({
      data: {
        title: sanitizedTitle,
        description: sanitizedDescription,
        image_url,
        sort_order: order,
      },
    });

    return NextResponse.json({ success: true, work: newWork });
  } catch (err) {
    console.error("[SignatureWorksAdminAPI] Error:", err);
    return NextResponse.json({ error: "Failed to create signature work" }, { status: 500 });
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

    const updateData: any = {};
    if (parsed.data.title !== undefined) {
      updateData.title = sanitizeHtml(parsed.data.title, { allowedTags: [], allowedAttributes: {} });
    }
    if (parsed.data.description !== undefined) {
      updateData.description = sanitizeHtml(parsed.data.description, { allowedTags: [], allowedAttributes: {} });
    }
    if (parsed.data.image_url !== undefined) {
      updateData.image_url = parsed.data.image_url;
    }
    if (parsed.data.sort_order !== undefined) {
      updateData.sort_order = parsed.data.sort_order;
    }

    const updatedWork = await prisma.signature_work.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json({ success: true, work: updatedWork });
  } catch (err) {
    console.error("[SignatureWorksAdminAPI] Update Error:", err);
    return NextResponse.json({ error: "Failed to update signature work" }, { status: 500 });
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

    await prisma.signature_work.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[SignatureWorksAdminAPI] Delete Error:", err);
    return NextResponse.json({ error: "Failed to delete signature work" }, { status: 500 });
  }
}
