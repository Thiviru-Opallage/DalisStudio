import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id:    session.user.id,
        name:  session.user.name || "Guest",
        email: session.user.email,
        role:  session.user.role,
      },
    });
  } catch (err) {
    console.error("[Login route] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}