'use client';

import { useEffect, useState } from 'react';

export type HealthState = { status: 'checking' | 'ok' | 'down'; latencyMs: number | null };

/** Consulta /api/health al cargar y cada 30 s. */
export function useSystemHealth(): HealthState {
  const [state, setState] = useState<HealthState>({ status: 'checking', latencyMs: null });

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const t0 = performance.now();
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        if (!cancelled) setState({ status: res.ok ? 'ok' : 'down', latencyMs: Math.round(performance.now() - t0) });
      } catch {
        if (!cancelled) setState({ status: 'down', latencyMs: null });
      }
    };
    check();
    const id = window.setInterval(check, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return state;
}
