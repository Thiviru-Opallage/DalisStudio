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
  width_class: z.string().max(20).optional(),
  height_class: z.string().max(20).optional(),
  top_class: z.string().max(30).optional(),
  left_class: z.string().max(30).optional(),
  z_index: z.number().int().optional(),
  ambient_dark: z.string().max(100).optional(),
  ambient_light: z.string().max(100).optional(),
  sort_order: z.number().int().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await prisma.works_grid_item.findMany({
      orderBy: { sort_order: "asc" },
    });
    return NextResponse.json(items);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch works grid items" }, { status: 500 });
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

    const data = parsed.data;
    const sanitizedTitle = sanitizeHtml(data.title, { allowedTags: [], allowedAttributes: {} });
    const sanitizedDescription = sanitizeHtml(data.description, { allowedTags: [], allowedAttributes: {} });

    let top_class = data.top_class;
    let left_class = data.left_class;

    if (!top_class || !left_class) {
      const existing = await prisma.works_grid_item.findMany({
        select: { left_class: true, top_class: true },
      });
      const existingCoords = existing.map(item => {
        const leftMatch = item.left_class.match(/\[(\d+)%\]/);
        const topMatch = item.top_class.match(/\[(\d+)%\]/);
        return {
          left: leftMatch ? parseInt(leftMatch[1]) : 50,
          top: topMatch ? parseInt(topMatch[1]) : 50,
        };
      });

      const candidateLefts = [12, 20, 30, 42, 52, 62, 74, 15, 25, 35, 45, 55, 65, 75];
      const candidateTops = [12, 20, 26, 32, 38, 42, 46, 58, 60, 15, 25, 35, 50, 65];

      let bestLeft = 50;
      let bestTop = 50;
      let maxMinDist = -1;

      if (existingCoords.length === 0) {
        bestLeft = 12;
        bestTop = 40;
      } else {
        for (const l of candidateLefts) {
          for (const t of candidateTops) {
            let minDist = 999999;
            for (const ext of existingCoords) {
              const dist = Math.hypot(ext.left - l, ext.top - t);
              if (dist < minDist) {
                minDist = dist;
              }
            }
            if (minDist > maxMinDist) {
              maxMinDist = minDist;
              bestLeft = l;
              bestTop = t;
            }
          }
        }
      }
      top_class = top_class || `top-[${bestTop}%]`;
      left_class = left_class || `left-[${bestLeft}%]`;
    }

    let order = data.sort_order;
    if (order === undefined) {
      const lastItem = await prisma.works_grid_item.findFirst({
        orderBy: { sort_order: "desc" },
      });
      order = lastItem ? lastItem.sort_order + 1 : 0;
    }

    const newItem = await prisma.works_grid_item.create({
      data: {
        title: sanitizedTitle,
        description: sanitizedDescription,
        image_url: data.image_url,
        width_class: data.width_class || "w-48",
        height_class: data.height_class || "h-64",
        top_class,
        left_class,
        z_index: data.z_index !== undefined ? data.z_index : 10,
        ambient_dark: data.ambient_dark || "from-emerald-950 to-neutral-950",
        ambient_light: data.ambient_light || "from-emerald-100 via-white to-white",
        sort_order: order,
      },
    });

    return NextResponse.json({ success: true, item: newItem });
  } catch (err) {
    console.error("[WorksGridAdminAPI] Error:", err);
    return NextResponse.json({ error: "Failed to create works grid item" }, { status: 500 });
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
    if (parsed.data.width_class !== undefined) updateData.width_class = parsed.data.width_class;
    if (parsed.data.height_class !== undefined) updateData.height_class = parsed.data.height_class;
    if (parsed.data.top_class !== undefined) updateData.top_class = parsed.data.top_class;
    if (parsed.data.left_class !== undefined) updateData.left_class = parsed.data.left_class;
    if (parsed.data.z_index !== undefined) updateData.z_index = parsed.data.z_index;
    if (parsed.data.ambient_dark !== undefined) updateData.ambient_dark = parsed.data.ambient_dark;
    if (parsed.data.ambient_light !== undefined) updateData.ambient_light = parsed.data.ambient_light;
    if (parsed.data.sort_order !== undefined) updateData.sort_order = parsed.data.sort_order;

    const updated = await prisma.works_grid_item.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (err) {
    console.error("[WorksGridAdminAPI] Update Error:", err);
    return NextResponse.json({ error: "Failed to update works grid item" }, { status: 500 });
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

    await prisma.works_grid_item.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[WorksGridAdminAPI] Delete Error:", err);
    return NextResponse.json({ error: "Failed to delete works grid item" }, { status: 500 });
  }
}
