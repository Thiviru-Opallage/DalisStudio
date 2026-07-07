import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { uploadFile } from "@/lib/upload";
import { uploadLimiter } from "@/lib/rateLimit";

export const maxDuration = 60; // Route segment config
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50MB

export async function POST(req: NextRequest) {
  // Check admin session
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit — 5 uploads per minute
  const rateCheck = uploadLimiter(req);
  if (!rateCheck.success) {
    return NextResponse.json(
      { error: "Too many uploads. Please wait a moment." },
      { status: 429 }
    );
  }

  // Pre-check Content-Length before buffering the body into memory
  const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
  if (contentLength > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `File too large. Maximum size is ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.` },
      { status: 413 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const url = await uploadFile(file);

    return NextResponse.json({ success: true, url });
  } catch (err: any) {
    console.error("[UploadAPI] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to upload file" }, { status: 500 });
  }
}
