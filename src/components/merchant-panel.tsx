'use client';

import { useState } from 'react';
import { Banknote, ClipboardList, ImagePlus, LoaderCircle, PackageCheck, Plus, Save, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { CATEGORIES, CATEGORY_LABEL, OCCASIONS, OCCASION_LABEL, UNITS, type Category, type Occasion, type Unit } from '@/lib/data/catalog';
import { money } from '@/lib/format';
import { fileToDataUrl } from '@/lib/image-resize';
import type { Product } from '@/lib/repo/types';
import type { MerchantData, OrderView } from '@/lib/ui-types';
import { OrdersView } from './orders-view';
import { ProductImage } from './product-card';

const selectCls = 'flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export interface NewProductForm {
  name: string;
  category: Category;
  occasions: Occasion[];
  description: string;
  unit: Unit;
  priceRetail: number;
  priceWholesale: number;
  wholesaleMinQty: number;
  stock: number;
  imageUrl: string | null;
}

const EMPTY: NewProductForm = { name: '', category: 'rosas', occasions: [], description: '', unit: 'docena', priceRetail: 40, priceWholesale: 32, wholesaleMinQty: 10, stock: 20, imageUrl: null };

function Stat({ icon: Icon, label, value }: { icon: typeof Store; label: string; value: string }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-rose-50 text-primary" aria-hidden><Icon className="h-5 w-5" /></span>
      <div>
        <p className="text-xs text-slate-600">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
    </Card>
  );
}

function ProductRow({ p, busy, onSave }: { p: Product; busy: boolean; onSave: (id: string, patch: Partial<Pick<Product, 'priceRetail' | 'priceWholesale' | 'stock' | 'active'>>) => void }) {
  const [retail, setRetail] = useState(String(p.priceRetail));
  const [wholesale, setWholesale] = useState(String(p.priceWholesale));
  const [stock, setStock] = useState(String(p.stock));
  const dirty = Number(retail) !== p.priceRetail || Number(wholesale) !== p.priceWholesale || Number(stock) !== p.stock;
  return (
    <tr className="border-t border-slate-100 align-middle">
      <td className="py-2 pr-3">
        <div className="flex items-center gap-3">
          <ProductImage product={p} className="h-12 w-12 shrink-0 rounded-md" />
          <div>
            <p className="font-medium text-slate-900">{p.name}</p>
            <p className="text-xs text-slate-600">{CATEGORY_LABEL[p.category]} · por {p.unit}</p>
          </div>
        </div>
      </td>
      <td className="py-2 pr-2"><Input aria-label={`Precio minorista de ${p.name}`} type="number" min={0.1} step="any" className="h-9 w-24" value={retail} onChange={(e) => setRetail(e.target.value)} /></td>
      <td className="py-2 pr-2"><Input aria-label={`Precio mayorista de ${p.name}`} type="number" min={0.1} step="any" className="h-9 w-24" value={wholesale} onChange={(e) => setWholesale(e.target.value)} /></td>
      <td className="py-2 pr-2"><Input aria-label={`Stock de ${p.name}`} type="number" min={0} className="h-9 w-20" value={stock} onChange={(e) => setStock(e.target.value)} /></td>
      <td className="py-2 pr-2">
        <label className="flex items-center gap-1.5 text-xs">
          <input type="checkbox" className="h-4 w-4" checked={p.active} disabled={busy} onChange={(e) => onSave(p.id, { active: e.target.checked })} />
          {p.active ? 'Visible' : 'Oculto'}
        </label>
      </td>
      <td className="py-2">
        <Button size="sm" disabled={!dirty || busy} onClick={() => onSave(p.id, { priceRetail: Number(retail), priceWholesale: Number(wholesale), stock: Number(stock) })}>
          {busy ? <LoaderCircle className="animate-spin" /> : <Save />} Guardar
        </Button>
      </td>
    </tr>
  );
}

interface Props {
  data: MerchantData | null;
  orders: OrderView[];
  loading: boolean;
  busyId: string | null;
  onSaveProduct: (id: string, patch: Partial<Pick<Product, 'priceRetail' | 'priceWholesale' | 'stock' | 'active'>>) => void;
  onAddProduct: (form: NewProductForm) => Promise<boolean>;
  onAdvance: (orderId: string) => void;
}

/** HU-18, HU-19, HU-20, HU-21: panel del comerciante. */
export function MerchantPanel({ data, orders, loading, busyId, onSaveProduct, onAddProduct, onAdvance }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewProductForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [photoError, setPhotoError] = useState('');

  if (!data) return <div className="space-y-3"><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ok = await onAddProduct(form);
    setSaving(false);
    if (ok) {
      setForm(EMPTY);
      setOpen(false);
    }
  };
  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhotoError('');
      setForm((f) => ({ ...f, imageUrl: null }));
      const url = await fileToDataUrl(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'No se pudo cargar la foto');
    }
  };
  const toggleOccasion = (o: Occasion) => setForm((f) => ({ ...f, occasions: f.occasions.includes(o) ? f.occasions.filter((x) => x !== o) : [...f.occasions, o] }));
  const num = (k: 'priceRetail' | 'priceWholesale' | 'wholesaleMinQty' | 'stock') => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: Number(e.target.value) });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{data.stall.name}</h2>
          <p className="text-sm text-slate-600">Puesto {data.stall.code} · Mercado de Flores de Acho</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus /> Publicar producto</Button>
      </div>

      <section aria-label="Resumen de ventas" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={ClipboardList} label="Pedidos" value={String(data.summary.orders)} />
        <Stat icon={LoaderCircle} label="Por atender" value={String(data.summary.pending)} />
        <Stat icon={PackageCheck} label="Entregados" value={String(data.summary.delivered)} />
        <Stat icon={Banknote} label="Ventas" value={money(data.summary.revenue)} />
      </section>

      <section aria-label="Mis productos" className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-900">Mis productos <Badge variant="secondary">{data.products.length}</Badge></h3>
        {data.products.length === 0 ? (
          <Card className="p-8 text-center text-sm text-slate-600">Aún no publicas productos. Usa «Publicar producto» para empezar a vender en línea.</Card>
        ) : (
          <Card className="overflow-x-auto p-4">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs text-slate-600">
                <tr><th className="pb-2 font-medium">Producto</th><th className="pb-2 font-medium">Minorista (S/)</th><th className="pb-2 font-medium">Mayorista (S/)</th><th className="pb-2 font-medium">Stock</th><th className="pb-2 font-medium">Estado</th><th /></tr>
              </thead>
              <tbody>
                {data.products.map((p) => (
                  <ProductRow key={`${p.id}-${p.priceRetail}-${p.priceWholesale}-${p.stock}`} p={p} busy={busyId === p.id} onSave={onSaveProduct} />
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      <section aria-label="Pedidos recibidos" className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-900">Pedidos recibidos</h3>
        <OrdersView orders={orders} loading={loading} mode="comerciante" busyId={busyId} onAdvance={onAdvance} />
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Publicar producto</DialogTitle>
            <DialogDescription>Se mostrará de inmediato en el catálogo del mercado.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="np-name">Nombre</Label>
              <Input id="np-name" required minLength={3} maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="np-cat">Tipo</Label>
                <select id="np-cat" className={selectCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="np-unit">Se vende por</Label>
                <select id="np-unit" className={selectCls} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value as Unit })}>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="np-desc">Descripción</Label>
              <Textarea id="np-desc" rows={2} maxLength={200} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="np-photo" className="flex items-center gap-1.5"><ImagePlus className="h-4 w-4" aria-hidden /> Foto del producto (opcional)</Label>
              <Input id="np-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto} />
              {photoError && <p role="alert" className="text-xs text-red-700">{photoError}</p>}
              {form.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.imageUrl} alt="Vista previa de la foto" className="h-32 w-full rounded-md object-cover" />
              )}
            </div>
            <fieldset className="space-y-1.5">
              <legend className="text-sm font-medium">Ocasiones</legend>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {OCCASIONS.map((o) => (
                  <label key={o} className="flex items-center gap-1.5 text-sm"><input type="checkbox" className="h-4 w-4" checked={form.occasions.includes(o)} onChange={() => toggleOccasion(o)} /> {OCCASION_LABEL[o]}</label>
                ))}
              </div>
            </fieldset>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1.5"><Label htmlFor="np-pr">Minorista (S/)</Label><Input id="np-pr" type="number" required min={0.1} step="any" value={form.priceRetail} onChange={num('priceRetail')} /></div>
              <div className="space-y-1.5"><Label htmlFor="np-pw">Mayorista (S/)</Label><Input id="np-pw" type="number" required min={0.1} step="any" max={form.priceRetail} value={form.priceWholesale} onChange={num('priceWholesale')} /></div>
              <div className="space-y-1.5"><Label htmlFor="np-mq">Mayor. desde</Label><Input id="np-mq" type="number" required min={2} value={form.wholesaleMinQty} onChange={num('wholesaleMinQty')} /></div>
              <div className="space-y-1.5"><Label htmlFor="np-st">Stock</Label><Input id="np-st" type="number" required min={0} value={form.stock} onChange={num('stock')} /></div>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>{saving ? <LoaderCircle className="animate-spin" /> : <Plus />} Publicar</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
