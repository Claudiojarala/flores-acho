'use client';

import { CalendarHeart, Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { CATEGORIES, CATEGORY_LABEL, OCCASIONS, OCCASION_LABEL, type Occasion } from '@/lib/data/catalog';
import { EMPTY_FILTERS, type ProductFilters, type ProductView, type StallView } from '@/lib/ui-types';
import { cn } from '@/lib/utils';
import { ProductCard } from './product-card';

const selectCls = 'flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const OCCASION_STYLE: Record<Occasion, string> = {
  san_valentin: 'from-rose-600 to-pink-500',
  dia_madre: 'from-fuchsia-600 to-rose-500',
  todos_santos: 'from-slate-700 to-slate-500',
  eventos: 'from-amber-600 to-orange-500',
  condolencias: 'from-slate-600 to-zinc-500',
  cumpleanos: 'from-violet-600 to-fuchsia-500',
};

interface Props {
  products: ProductView[];
  loading: boolean;
  filters: ProductFilters;
  onFilters: (f: ProductFilters) => void;
  stalls: StallView[];
  onAdd: (id: string, qty: number) => void;
  onDetail: (p: ProductView) => void;
}

export function CatalogView({ products, loading, filters, onFilters, stalls, onAdd, onDetail }: Props) {
  const set = <K extends keyof ProductFilters>(k: K, v: ProductFilters[K]) => onFilters({ ...filters, [k]: v });
  const active = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  return (
    <div className="space-y-6">
      {/* HU-05: fechas pico */}
      <section aria-label="Fechas de mayor demanda" className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <CalendarHeart className="h-5 w-5 text-primary" aria-hidden /> Fechas de mayor demanda
        </h2>
        <Carousel opts={{ align: 'start' }} className="px-10">
          <CarouselContent>
            {OCCASIONS.map((o) => (
              <CarouselItem key={o} className="basis-2/3 sm:basis-1/3 lg:basis-1/4">
                <button
                  type="button"
                  onClick={() => set('occasion', filters.occasion === o ? '' : o)}
                  aria-pressed={filters.occasion === o}
                  className={cn(
                    'h-24 w-full rounded-xl bg-gradient-to-br p-4 text-left text-white shadow transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    OCCASION_STYLE[o],
                    filters.occasion === o ? 'ring-2 ring-slate-900 ring-offset-2' : 'hover:brightness-110',
                  )}
                >
                  <span className="block text-base font-semibold">{OCCASION_LABEL[o]}</span>
                  <span className="text-xs text-white/90">{filters.occasion === o ? 'Quitar filtro' : 'Ver productos'}</span>
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </section>

      {/* HU-02: búsqueda y filtros */}
      <section aria-label="Filtros del catálogo" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <SlidersHorizontal className="h-4 w-4" aria-hidden /> Buscar y filtrar
          </h2>
          {active && (
            <Button variant="ghost" size="sm" onClick={() => onFilters(EMPTY_FILTERS)}>
              <X /> Limpiar filtros
            </Button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5 lg:col-span-2">
            <Label htmlFor="f-q">Buscar</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
              <Input id="f-q" className="pl-9" placeholder="Rosas, girasoles, corona, puesto…" value={filters.q} maxLength={60} onChange={(e) => set('q', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-cat">Tipo</Label>
            <select id="f-cat" className={selectCls} value={filters.category} onChange={(e) => set('category', e.target.value as ProductFilters['category'])}>
              <option value="">Todos</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-stall">Puesto</Label>
            <select id="f-stall" className={selectCls} value={filters.stallId} onChange={(e) => set('stallId', e.target.value)}>
              <option value="">Todos</option>
              {stalls.map((s) => (
                <option key={s.id} value={s.id}>{s.code} · {s.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-price">Precio máx. (S/)</Label>
            <Input id="f-price" type="number" min={0} step={5} placeholder="Sin límite" value={filters.maxPrice} onChange={(e) => set('maxPrice', e.target.value)} />
          </div>
        </div>
        <label className="mt-3 flex w-fit items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" className="h-4 w-4" checked={filters.inStock} onChange={(e) => set('inStock', e.target.checked)} />
          Solo con stock disponible
        </label>
      </section>

      <section aria-label="Productos" aria-busy={loading}>
        <p className="mb-3 text-sm text-slate-600" role="status">
          {loading ? 'Buscando…' : `${products.length} producto${products.length === 1 ? '' : 's'}`}
        </p>
        {loading && products.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
            No encontramos productos con esos filtros. Prueba quitando alguno.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={onAdd} onDetail={onDetail} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
