'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CartLine } from '@/lib/ui-types';

const KEY = 'flores-cart';

/** Carrito del cliente; se recuerda en localStorage (solo ids y cantidades, nunca datos sensibles). */
export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        if (Array.isArray(parsed)) setLines(parsed.filter((l) => typeof l.productId === 'string' && Number.isInteger(l.quantity) && l.quantity > 0));
      }
    } catch {
      /* carrito corrupto o storage no disponible: se ignora */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* sin storage: el carrito vive solo en memoria */
    }
  }, [lines, loaded]);

  const add = useCallback((productId: string, quantity = 1) => {
    setLines((prev) => {
      const found = prev.find((l) => l.productId === productId);
      return found
        ? prev.map((l) => (l.productId === productId ? { ...l, quantity: Math.min(500, l.quantity + quantity) } : l))
        : [...prev, { productId, quantity: Math.min(500, quantity) }];
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) => (quantity <= 0 ? prev.filter((l) => l.productId !== productId) : prev.map((l) => (l.productId === productId ? { ...l, quantity: Math.min(500, quantity) } : l))));
  }, []);

  const remove = useCallback((productId: string) => setLines((prev) => prev.filter((l) => l.productId !== productId)), []);
  const clear = useCallback(() => setLines([]), []);

  return { lines, count: lines.reduce((s, l) => s + l.quantity, 0), add, setQuantity, remove, clear };
}
