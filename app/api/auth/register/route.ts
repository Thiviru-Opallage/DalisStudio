import { NextRequest, NextResponse } from "next/server";
import { prisma }          from "@/lib/prisma";
import bcrypt              from "bcrypt";
import { registerLimiter } from "@/lib/rateLimit";
import { registerSchema }  from "@/lib/validation";

export async function POST(req: NextRequest) {
  const rateCheck = registerLimiter(req);
  if (!rateCheck.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait 10 minutes before trying again." },
      { status: 429 }
    );
  }

  try {
    const body   = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // Always hash first — normalises response time, prevents timing attacks
    const hashed = await bcrypt.hash(password, 12);

    const existing = await prisma.users.findUnique({ where: { email } });

    if (existing) {
      // SECURITY: neutral 200 — never confirm whether email exists
      return NextResponse.json({
        success: true,
        message: "If this email is available, your account has been created. You can now log in.",
      });
    }

    await prisma.users.create({
      data: {
        name:           name.trim(),
        email,
        password_hash:  hashed,
        role:           "user",
        is_active:      true,
        email_verified: true, // TODO: flip + send verification email in Step 7
      },
    });

    return NextResponse.json(
      { success: true, message: "Account created. Logging you in…" },
      { status: 201 }
    );
  } catch (err) {
    console.error("[Register] Error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}