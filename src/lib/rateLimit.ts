interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Limitador de ventana fija en memoria.
 * Limitación conocida: en despliegues serverless cada instancia tiene su propio contador;
 * para producción real se usaría un almacén compartido (Redis/Upstash).
 */
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }
  current.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
  if (current.count > limit) return { ok: false, remaining: 0, retryAfterSeconds };
  return { ok: true, remaining: limit - current.count, retryAfterSeconds: 0 };
}

export function resetRateLimits(): void {
  buckets.clear();
}
