'use client';

import { useState } from 'react';
import { Minus, Plus, ShoppingCart, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CATEGORY_LABEL, OCCASION_LABEL } from '@/lib/data/catalog';
import { money, unitLabel } from '@/lib/format';
import type { ProductView } from '@/lib/ui-types';
import { CategoryArt } from './category-art';

/** Foto del producto si existe; si no, la ilustración por categoría. */
export function ProductImage({ product, className }: { product: Pick<ProductView, 'name' | 'category' | 'imageUrl'>; className?: string }) {
  if (!product.imageUrl) return <CategoryArt category={product.category} className={className} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={product.imageUrl} alt={product.name} loading="lazy" className={`${className ?? ''} object-cover`} />;
}

export function PriceBlock({ p }: { p: Pick<ProductView, 'priceRetail' | 'priceWholesale' | 'wholesaleMinQty' | 'unit'> }) {
  return (
    <div>
      <p className="text-lg font-bold text-slate-900">
        {money(p.priceRetail)} <span className="text-xs font-normal text-slate-600">/ {p.unit}</span>
      </p>
      <p className="text-xs text-emerald-800">
        Mayorista: {money(p.priceWholesale)} desde {p.wholesaleMinQty} {unitLabel(p.unit, p.wholesaleMinQty)}
      </p>
    </div>
  );
}

export function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <Badge variant="critical">Agotado</Badge>;
  if (stock <= 10) return <Badge variant="caution">Quedan {stock}</Badge>;
  return <Badge variant="safe">Disponible</Badge>;
}

interface Props {
  product: ProductView;
  onAdd: (productId: string, quantity: number) => void;
  onDetail: (p: ProductView) => void;
}

export function ProductCard({ product: p, onAdd, onDetail }: Props) {
  const [qty, setQty] = useState(1);
  const soldOut = p.stock === 0;
  return (
    <Card className="flex flex-col overflow-hidden">
      <button type="button" onClick={() => onDetail(p)} className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Ver detalle de ${p.name}`}>
        <ProductImage product={p} className="h-40 w-full" />
      </button>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight text-slate-900">{p.name}</h3>
            <StockBadge stock={p.stock} />
          </div>
          <p className="flex items-center gap-1 text-xs text-slate-600">
            <Store className="h-3.5 w-3.5" aria-hidden /> {p.stallName} · Puesto {p.stallCode}
          </p>
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary">{CATEGORY_LABEL[p.category]}</Badge>
            {p.occasions.slice(0, 2).map((o) => (
              <Badge key={o} variant="outline">{OCCASION_LABEL[o]}</Badge>
            ))}
          </div>
        </div>
        <PriceBlock p={p} />
        <div className="mt-auto flex items-center gap-2">
          <div className="flex items-center rounded-md border border-input bg-white">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Menos">
              <Minus />
            </Button>
            <span className="w-8 text-center text-sm font-medium" aria-live="polite">{qty}</span>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQty((q) => Math.min(p.stock || 1, q + 1))} aria-label="Más" disabled={soldOut}>
              <Plus />
            </Button>
          </div>
          <Button type="button" className="flex-1" disabled={soldOut} onClick={() => onAdd(p.id, qty)}>
            <ShoppingCart /> Agregar
          </Button>
        </div>
      </div>
    </Card>
  );
}
