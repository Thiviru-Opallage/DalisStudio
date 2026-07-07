import { withAuth }      from "next-auth/middleware";
import { NextResponse }  from "next/server";

// ─────────────────────────────────────────
// UNIFIED MIDDLEWARE
// Handles: security headers + auth-based route protection.
//
// Next.js only runs the ROOT middleware file — any middleware
// inside the /app directory is ignored. This file is the single
// source of truth for edge-level request processing.
// ─────────────────────────────────────────

export default withAuth(
  function middleware(req) {
    const res   = NextResponse.next();
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // ── Security headers (applied to ALL responses) ──
    res.headers.set("X-Frame-Options",        "DENY");
    res.headers.set("X-Content-Type-Options",  "nosniff");
    res.headers.set("Referrer-Policy",         "strict-origin-when-cross-origin");

    // ── Admin route protection ──
    if (pathname.startsWith("/admin") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return res;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        // Require a valid session for protected routes
        if (pathname.startsWith("/admin"))     return !!token;
        if (pathname.startsWith("/dashboard")) return !!token;
        if (pathname.startsWith("/profile"))   return !!token;
        // All other routes are publicly accessible
        return true;
      },
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: [
    // Protected routes — must have a session
    "/dashboard/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
};
