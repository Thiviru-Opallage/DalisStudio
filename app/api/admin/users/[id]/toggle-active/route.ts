import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  is_active: z.boolean(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // ── Admin only ──
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(params.id);
  if (isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  // ── Prevent admin from deactivating themselves ──
  if (String(userId) === session.user.id) {
    return NextResponse.json(
      { error: "You cannot deactivate your own account." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const updated = await prisma.users.update({
      where: { id: userId },
      data: { is_active: parsed.data.is_active },
    });

    return NextResponse.json({
      success: true,
      user: { id: updated.id, is_active: updated.is_active },
    });
  } catch (err) {
    console.error("[ToggleActive] Error:", err);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}