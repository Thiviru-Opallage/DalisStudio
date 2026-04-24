import { NextRequest, NextResponse } from "next/server";
import { getServerSession }       from "next-auth";
import { authOptions }            from "@/app/api/auth/[...nextauth]/route";
import { prisma }                 from "@/lib/prisma";
import { contactLimiter }         from "@/lib/rateLimit";
import { contactSchema }          from "@/lib/validation";
import { mailContactSubmission }  from "@/lib/mailer";

// ── POST — public, no login required ────────────────────────
export async function POST(req: NextRequest) {
  const rateCheck = contactLimiter(req);
  if (!rateCheck.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  try {
    const body   = await req.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, phone, message } = parsed.data;

    await prisma.contact_messages.create({
      data: { name, email, phone: phone ?? null, message },
    });

    // Email admin — fire and forget, never blocks response
    mailContactSubmission({ name, email, phone, message }).catch(() => {});

    return NextResponse.json(
      { message: "Message sent! We'll be in touch soon." },
      { status: 201 }
    );
  } catch (err) {
    console.error("[Contact POST] Error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// ── GET — admin only ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const messages = await prisma.contact_messages.findMany({
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json({ messages });
  } catch (err) {
    console.error("[Contact GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch messages." },
      { status: 500 }
    );
  }
}