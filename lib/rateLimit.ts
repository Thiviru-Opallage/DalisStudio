import { LRUCache } from "lru-cache";
import { NextRequest } from "next/server";

type Options = {
  interval:    number;
  maxRequests: number;
};

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

export const loginLimiter    = (req: NextRequest) =>
  checkRateLimit(req, { interval: 10 * 60 * 1000, maxRequests: 5 });

export const registerLimiter = (req: NextRequest) =>
  checkRateLimit(req, { interval: 10 * 60 * 1000, maxRequests: 3 });

export const contactLimiter  = (req: NextRequest) =>
  checkRateLimit(req, { interval: 10 * 60 * 1000, maxRequests: 3 });