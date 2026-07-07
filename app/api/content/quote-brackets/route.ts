import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generalLimiter } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const rateCheck = generalLimiter(req);
  if (!rateCheck.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const items = await prisma.quote_bracket_image.findMany({
      orderBy: { sort_order: "asc" },
    });

    const bracketOne = items.filter(x => x.bracket_group === 1).map(x => x.image_url);
    const bracketTwo = items.filter(x => x.bracket_group === 2).map(x => x.image_url);
    const bracketThree = items.filter(x => x.bracket_group === 3).map(x => x.image_url);

    return NextResponse.json({
      bracketOne,
      bracketTwo,
      bracketThree,
    });
  } catch (err) {
    console.error("[QuoteBracketsPublicAPI] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
