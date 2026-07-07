import { LRUCache } from "lru-cache";
import { NextRequest, NextResponse } from "next/server";

type Options = {
  interval:    number;
  maxRequests: number;
};

// ─────────────────────────────────────────
// Shared in-memory sliding-window rate limiter.
//
// NOTE FOR PRODUCTION (multi-instance / serverless):
// This limiter lives in process memory — it resets on every restart
// and is NOT shared across instances. For production deployments
// with multiple replicas or serverless functions, replace this
// with a persistent store such as Redis or Upstash:
//
//   import { Ratelimit } from "@upstash/ratelimit";
//   import { Redis }     from "@upstash/redis";
//   const ratelimit = new Ratelimit({
//     redis:   Redis.fromEnv(),
//     limiter: Ratelimit.slidingWindow(10, "10 m"),
//   });
//
// For single-instance deployments (VPS, Docker), this is sufficient.
// ─────────────────────────────────────────

const cache = new LRUCache<string, number[]>({
  max: 500,
  ttl: 10 * 60 * 1000,
});

function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}

export function checkRateLimit(
  req: NextRequest,
  options: Options
): { success: boolean; remaining: number } {
  if (process.env.NODE_ENV === "development") {
    return { success: true, remaining: options.maxRequests };
  }

  const ip         = getIP(req);
  const now        = Date.now();
  const windowStart = now - options.interval;
  const timestamps  = (cache.get(ip) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= options.maxRequests) {
    return { success: false, remaining: 0 };
  }

  timestamps.push(now);
  cache.set(ip, timestamps);

  return { success: true, remaining: options.maxRequests - timestamps.length };
}

// ─────────────────────────────────────────
// Pre-configured limiters for each endpoint category
// ─────────────────────────────────────────

// Auth — tight limits to prevent brute-force
export const loginLimiter    = (req: NextRequest) =>
  checkRateLimit(req, { interval: 10 * 60 * 1000, maxRequests: 5 });

export const registerLimiter = (req: NextRequest) =>
  checkRateLimit(req, { interval: 10 * 60 * 1000, maxRequests: 3 });

// Contact form — prevent spam
export const contactLimiter  = (req: NextRequest) =>
  checkRateLimit(req, { interval: 10 * 60 * 1000, maxRequests: 3 });

// Analytics tracking — generous but bounded
export const visitLimiter    = (req: NextRequest) =>
  checkRateLimit(req, { interval: 60 * 1000, maxRequests: 30 });

// Public content reads — generous
export const generalLimiter  = (req: NextRequest) =>
  checkRateLimit(req, { interval: 60 * 1000, maxRequests: 60 });

// Admin API — moderate
export const adminLimiter    = (req: NextRequest) =>
  checkRateLimit(req, { interval: 60 * 1000, maxRequests: 30 });

// File uploads — very tight
export const uploadLimiter   = (req: NextRequest) =>
  checkRateLimit(req, { interval: 60 * 1000, maxRequests: 5 });

/** Returns a 429 response when the admin rate limit is exceeded, otherwise null. */
export function enforceAdminRateLimit(req: NextRequest): NextResponse | null {
  const rateCheck = adminLimiter(req);
  if (!rateCheck.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }
  return null;
}