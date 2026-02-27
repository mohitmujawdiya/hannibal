import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(
      "⚠️  UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set — rate limiting disabled"
    );
    return null;
  }

  return new Redis({ url, token });
}

const redis = createRedis();

export const chatLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 m"),
      prefix: "rl:chat",
    })
  : null;

export const trpcLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      prefix: "rl:trpc",
    })
  : null;

export function getRateLimitIdentifier(
  userId: string | null,
  request: Request
): string {
  if (userId) return userId;
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "anonymous";
}

export function rateLimitResponse(reset: number): Response {
  const retryAfter = Math.ceil((reset - Date.now()) / 1000);
  return new Response("Too Many Requests", {
    status: 429,
    headers: {
      "Retry-After": String(Math.max(retryAfter, 1)),
    },
  });
}
