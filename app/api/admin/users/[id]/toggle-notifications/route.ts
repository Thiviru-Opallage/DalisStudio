import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  email_notifications: z.boolean(),
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

  try {
    const body   = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const updated = await prisma.users.update({
      where: { id: userId },
      data:  { email_notifications: parsed.data.email_notifications },
    });

    return NextResponse.json({
      success: true,
      user: { id: updated.id, email_notifications: updated.email_notifications },
    });
  } catch (err) {
    console.error("[ToggleNotifications] Error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}