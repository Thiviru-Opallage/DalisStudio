import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Health check endpoint
export async function GET() {
  try {
    // Minimal query to check DB connectivity
    await prisma.$queryRaw`SELECT 1`;

    // Only return safe info
    return NextResponse.json({
      status: "ok",
      db: "connected",
    });
  } catch (_error) {
    // Do NOT expose the raw error to users
    console.error("Database connection failed:", _error);

    return NextResponse.json(
      {
        status: "error",
        db: "not connected",
        message: "Database connection failed",
      },
      { status: 500 }
    );
  }
}
