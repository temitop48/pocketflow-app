type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

export function rateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      ok: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
    };
  }

  if (entry.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count += 1;
  store.set(key, entry);

  return {
    ok: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}