'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Banknote, CreditCard, LoaderCircle, LogIn, Minus, Plus, ShoppingBag, Smartphone, Store, Trash2, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { lineTotal, round2, unitPriceFor } from '@/lib/domain/pricing';
import { money, unitLabel } from '@/lib/format';
import type { CartLine, CheckoutForm, DeliveryZone, PaymentForm, ProductView, Session } from '@/lib/ui-types';
import { cn } from '@/lib/utils';

const selectCls = 'flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const METHODS: { id: PaymentForm['method']; label: string; hint: string; icon: typeof Smartphone }[] = [
  { id: 'yape', label: 'Yape', hint: 'Pago con celular', icon: Smartphone },
  { id: 'plin', label: 'Plin', hint: 'Pago con celular', icon: Smartphone },
  { id: 'tarjeta', label: 'Tarjeta', hint: 'Crédito o débito', icon: CreditCard },
  { id: 'contraentrega', label: 'Contra entrega', hint: 'Efectivo al recibir', icon: Banknote },
];

interface Props {
  lines: CartLine[];
  products: ProductView[];
  zones: DeliveryZone[];
  session: Session | null;
  busy: boolean;
  onQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onCheckout: (form: CheckoutForm) => void;
  onBrowse: () => void;
}

export function CartView({ lines, products, zones, session, busy, onQty, onRemove, onCheckout, onBrowse }: Props) {
  const [fulfillment, setFulfillment] = useState<CheckoutForm['fulfillment']>('recojo');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState(session?.user.name ?? '');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<PaymentForm['method']>('yape');
  const [payPhone, setPayPhone] = useState('');
  const [card, setCard] = useState({ cardNumber: '', expiry: '', cvv: '' });

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const detailed = lines
    .map((l) => ({ line: l, product: byId.get(l.productId) }))
    .filter((x): x is { line: CartLine; product: ProductView } => x.product !== undefined);

  const stallCount = new Set(detailed.map((d) => d.product.stallId)).size;
  const subtotal = round2(detailed.reduce((s, d) => s + lineTotal(d.product, d.line.quantity), 0));
  const zone = zones.find((z) => z.district === district);
  const deliveryFee = fulfillment === 'delivery' && zone ? zone.fee * stallCount : 0;
  const total = round2(subtotal + deliveryFee);

  if (lines.length === 0) {
    return (
      <Card className="mx-auto flex max-w-lg flex-col items-center gap-3 p-10 text-center">
        <ShoppingBag className="h-10 w-10 text-slate-400" aria-hidden />
        <h2 className="text-lg font-semibold">Tu carrito está vacío</h2>
        <p className="text-sm text-slate-600">Explora el catálogo y agrega flores de los puestos del mercado.</p>
        <Button onClick={onBrowse}>Ver catálogo</Button>
      </Card>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payment: PaymentForm =
      method === 'tarjeta'
        ? { method, cardNumber: card.cardNumber.replace(/\s/g, ''), expiry: card.expiry, cvv: card.cvv }
        : method === 'contraentrega'
          ? { method }
          : { method, phone: payPhone };
    onCheckout({ fulfillment, district, address, contactName, phone, payment });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <section aria-label="Productos del carrito" className="space-y-3 lg:col-span-7">
        <h2 className="text-lg font-semibold text-slate-900">Tu carrito</h2>
        {detailed.map(({ line, product: p }) => {
          const unit = unitPriceFor(p, line.quantity);
          const wholesale = line.quantity >= p.wholesaleMinQty;
          return (
            <Card key={p.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-[10rem] flex-1">
                <h3 className="font-semibold leading-tight text-slate-900">{p.name}</h3>
                <p className="flex items-center gap-1 text-xs text-slate-600"><Store className="h-3 w-3" aria-hidden /> {p.stallName}</p>
                <p className="mt-1 text-sm text-slate-700">
                  {money(unit)} / {p.unit} {wholesale && <Badge variant="safe" className="ml-1">Precio mayorista</Badge>}
                </p>
                {!wholesale && (
                  <p className="text-xs text-slate-500">Mayorista {money(p.priceWholesale)} desde {p.wholesaleMinQty} {unitLabel(p.unit, p.wholesaleMinQty)}</p>
                )}
              </div>
              <div className="flex items-center rounded-md border border-input bg-white">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onQty(p.id, line.quantity - 1)} aria-label={`Menos ${p.name}`}><Minus /></Button>
                <span className="w-10 text-center text-sm font-medium">{line.quantity}</span>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onQty(p.id, Math.min(p.stock, line.quantity + 1))} aria-label={`Más ${p.name}`}><Plus /></Button>
              </div>
              <p className="w-24 text-right font-semibold">{money(lineTotal(p, line.quantity))}</p>
              <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(p.id)} aria-label={`Quitar ${p.name}`}><Trash2 /></Button>
            </Card>
          );
        })}
        {detailed.length < lines.length && (
          <p className="text-sm text-amber-800">Algún producto de tu carrito ya no está disponible y no se incluirá.</p>
        )}
      </section>

      <form onSubmit={submit} aria-label="Datos de entrega y pago" className="space-y-4 lg:col-span-5">
        <Card className="space-y-4 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Entrega</h2>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de entrega">
            {([['recojo', 'Recojo en el mercado', Store], ['delivery', 'Delivery', Truck]] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={fulfillment === id}
                onClick={() => setFulfillment(id)}
                className={cn('flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', fulfillment === id ? 'border-primary bg-rose-50 text-primary' : 'border-input bg-white text-slate-700 hover:bg-slate-50')}
              >
                <Icon className="h-4 w-4" aria-hidden /> {label}
              </button>
            ))}
          </div>
          {fulfillment === 'delivery' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-district">Distrito</Label>
                <select id="c-district" required className={selectCls} value={district} onChange={(e) => setDistrict(e.target.value)}>
                  <option value="">Elige tu distrito</option>
                  {zones.map((z) => (
                    <option key={z.district} value={z.district}>{z.district} · {money(z.fee)} · ~{z.etaMinutes} min</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-address">Dirección</Label>
                <Input id="c-address" required minLength={5} maxLength={120} placeholder="Av. / Jr., número, referencia" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Nombre de contacto</Label>
              <Input id="c-name" required minLength={2} maxLength={60} value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-phone">Celular</Label>
              <Input id="c-phone" required inputMode="numeric" pattern="9[0-9]{8}" placeholder="9XXXXXXXX" title="9 dígitos, empieza con 9" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Pago</h2>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Medio de pago">
            {METHODS.map(({ id, label, hint, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={method === id}
                onClick={() => setMethod(id)}
                className={cn('flex flex-col items-start rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', method === id ? 'border-primary bg-rose-50' : 'border-input bg-white hover:bg-slate-50')}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Icon className="h-4 w-4" aria-hidden /> {label}</span>
                <span className="text-xs text-slate-600">{hint}</span>
              </button>
            ))}
          </div>
          {(method === 'yape' || method === 'plin') && (
            <div className="space-y-1.5">
              <Label htmlFor="p-phone">Celular de tu cuenta {method === 'yape' ? 'Yape' : 'Plin'}</Label>
              <Input id="p-phone" required inputMode="numeric" pattern="9[0-9]{8}" placeholder="9XXXXXXXX" value={payPhone} onChange={(e) => setPayPhone(e.target.value)} />
            </div>
          )}
          {method === 'tarjeta' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-card">Número de tarjeta</Label>
                <Input id="p-card" required inputMode="numeric" autoComplete="off" placeholder="4111 1111 1111 1111" maxLength={23} value={card.cardNumber} onChange={(e) => setCard({ ...card, cardNumber: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="p-exp">Vence (MM/AA)</Label>
                  <Input id="p-exp" required autoComplete="off" placeholder="12/29" maxLength={5} value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-cvv">CVV</Label>
                  <Input id="p-cvv" required type="password" inputMode="numeric" autoComplete="off" maxLength={4} value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} />
                </div>
              </div>
            </div>
          )}
          <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-900">
            Pasarela de pago <strong>simulada</strong> para la demostración: no uses datos reales. Tarjeta de prueba: 4111 1111 1111 1111 (la que termina en 0002 se rechaza).
          </p>
        </Card>

        <Card className="space-y-2 p-5" aria-label="Resumen">
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{money(subtotal)}</span></div>
          <div className="flex justify-between text-sm">
            <span>Delivery {fulfillment === 'delivery' && stallCount > 1 ? `(${stallCount} puestos)` : ''}</span>
            <span>{fulfillment === 'delivery' ? (zone ? money(deliveryFee) : 'Elige distrito') : 'Gratis (recojo)'}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-bold"><span>Total</span><span>{money(total)}</span></div>
          {session?.user.role === 'comerciante' ? (
            <p className="text-sm text-amber-800">Las cuentas de comerciante no pueden comprar. Ingresa como cliente.</p>
          ) : session ? (
            <Button type="submit" size="lg" className="w-full" disabled={busy || detailed.length === 0 || (fulfillment === 'delivery' && !zone)}>
              {busy ? <LoaderCircle className="animate-spin" /> : <ShoppingBag />} Confirmar pedido
            </Button>
          ) : (
            <Button asChild size="lg" className="w-full">
              <Link href="/login"><LogIn /> Ingresa para comprar</Link>
            </Button>
          )}
        </Card>
      </form>
    </div>
  );
}
