'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@/lib/ui-types';

const KEY = 'flores-session';

/** Sesión del usuario (JWT) guardada en sessionStorage; se borra al cerrar la pestaña. */
export function useSession() {
  const [session, setSessionState] = useState<Session | null>(null);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(KEY);
      if (raw) setSessionState(JSON.parse(raw) as Session);
    } catch {
      /* sesión corrupta: se ignora */
    }
  }, []);

  const setSession = useCallback((s: Session) => {
    window.sessionStorage.setItem(KEY, JSON.stringify(s));
    setSessionState(s);
  }, []);

  const logout = useCallback(() => {
    window.sessionStorage.removeItem(KEY);
    setSessionState(null);
  }, []);

  return { session, setSession, logout };
}
