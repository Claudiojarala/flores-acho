'use client';

import { ShoppingCart, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CATEGORY_LABEL, OCCASION_LABEL } from '@/lib/data/catalog';
import type { ProductView } from '@/lib/ui-types';
import { PriceBlock, ProductImage, StockBadge } from './product-card';

/** HU-03: detalle del producto con precio minorista y mayorista. */
export function ProductDialog({ product, onClose, onAdd }: { product: ProductView | null; onClose: () => void; onAdd: (id: string, qty: number) => void }) {
  return (
    <Dialog open={product !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        {product && (
          <>
            <DialogHeader>
              <DialogTitle>{product.name}</DialogTitle>
              <DialogDescription className="flex items-center gap-1">
                <Store className="h-4 w-4" aria-hidden /> {product.stallName} · Puesto {product.stallCode}
              </DialogDescription>
            </DialogHeader>
            <ProductImage product={product} className="h-56 w-full rounded-lg" />
            <p className="text-sm text-slate-700">{product.description || 'Sin descripción.'}</p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary">{CATEGORY_LABEL[product.category]}</Badge>
              {product.occasions.map((o) => (
                <Badge key={o} variant="outline">{OCCASION_LABEL[o]}</Badge>
              ))}
            </div>
            <div className="flex items-end justify-between gap-3">
              <PriceBlock p={product} />
              <StockBadge stock={product.stock} />
            </div>
            <Button disabled={product.stock === 0} onClick={() => { onAdd(product.id, 1); onClose(); }}>
              <ShoppingCart /> Agregar al carrito
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
