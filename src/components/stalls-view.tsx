'use client';

import { ArrowRight, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { StallView } from '@/lib/ui-types';

/** HU-04: directorio de puestos del mercado. */
export function StallsView({ stalls, onViewProducts }: { stalls: StallView[]; onViewProducts: (stallId: string) => void }) {
  if (stalls.length === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Puestos del Mercado de Flores de Acho (Rímac) que ya venden en línea.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stalls.map((s) => (
          <Card key={s.id} className="flex flex-col gap-3 p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-rose-50 text-primary" aria-hidden>
                  <Store className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold leading-tight text-slate-900">{s.name}</h3>
                  <p className="text-xs text-slate-600">Puesto {s.code}</p>
                </div>
              </div>
              <Badge variant="secondary">{s.productCount} productos</Badge>
            </div>
            <p className="flex-1 text-sm text-slate-700">{s.description || 'Puesto del mercado.'}</p>
            <Button variant="outline" size="sm" className="w-fit" onClick={() => onViewProducts(s.id)}>
              Ver productos <ArrowRight />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
