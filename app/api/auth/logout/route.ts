import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/app/api/auth/[...nextauth]/route";
import { prisma }           from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (session?.user?.id) {
      await prisma.sessions.deleteMany({
        where: { user_id: parseInt(session.user.id) },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Logout route] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}