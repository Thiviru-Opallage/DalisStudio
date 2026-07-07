import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generalLimiter } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const rateCheck = generalLimiter(req);
  if (!rateCheck.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const items = await prisma.works_grid_item.findMany({
      orderBy: { sort_order: "asc" },
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error("[WorksGridPublicAPI] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
