import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generalLimiter } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const rateCheck = generalLimiter(req);
  if (!rateCheck.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const data = await prisma.contact_content.findFirst();
    return NextResponse.json(data || {
      card_image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
      showreel_url: "/videos/showreel.mp4",
    });
  } catch (err) {
    console.error("[ContactPublicAPI] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
