// Simple in-memory rate limiter (Node.js runtime only)
//
// For multi-instance or serverless production deployments,
// replace with a Redis-backed solution (e.g. @upstash/ratelimit).
//
// This implementation is safe for single-instance setups (dev, single Vercel instance, etc.)

interface Entry {
  count: number;
  windowStart: number;
}

const store = new Map<string, Entry>();

// Config
const MAX_ATTEMPTS = 10;        // attempts per window
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    // New or expired window
    store.set(ip, { count: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfterMs = WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, retryAfterMs };
  }

  entry.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

// Per-route rate limiter — uses a separate store so it never interferes with login limiting
const routeStore = new Map<string, Entry>();

export function checkRouteLimit(
  key: string,
  max: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = routeStore.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    routeStore.set(key, { count: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= max) {
    const retryAfterMs = windowMs - (now - entry.windowStart);
    return { allowed: false, retryAfterMs };
  }

  entry.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}
