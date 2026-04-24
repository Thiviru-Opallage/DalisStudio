import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  role: z.enum(["user", "admin"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(params.id);
  if (isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  // Prevent demoting yourself
  if (String(userId) === session.user.id) {
    return NextResponse.json(
      { error: "You cannot change your own role." },
      { status: 403 }
    );
  }

  try {
    const body   = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid role value" }, { status: 400 });
    }

    const updated = await prisma.users.update({
      where: { id: userId },
      data:  { role: parsed.data.role },
    });

    return NextResponse.json({
      success: true,
      user: { id: updated.id, role: updated.role },
    });
  } catch (err) {
    console.error("[SetRole] Error:", err);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}