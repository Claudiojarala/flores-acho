'use client';

import { Check, LoaderCircle, PackageOpen, Store, Truck, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { canCancel, nextStatus, STATUS_LABEL, type OrderStatus } from '@/lib/domain/orderFlow';
import { money, shortTime, timeAgo, unitLabel } from '@/lib/format';
import type { OrderView } from '@/lib/ui-types';
import { cn } from '@/lib/utils';

const FLOW: Record<'delivery' | 'recojo', OrderStatus[]> = {
  delivery: ['pendiente', 'preparando', 'en_camino', 'entregado'],
  recojo: ['pendiente', 'preparando', 'listo_recojo', 'entregado'],
};

const PAY_LABEL = { pendiente: 'Pago pendiente', pagado: 'Pagado', reembolsado: 'Reembolsado' } as const;
const METHOD_LABEL = { yape: 'Yape', plin: 'Plin', tarjeta: 'Tarjeta', contraentrega: 'Contra entrega' } as const;

/** HU-17: línea de tiempo del estado del pedido. */
export function Timeline({ order }: { order: OrderView }) {
  if (order.status === 'cancelado') return <Badge variant="critical">Pedido cancelado</Badge>;
  const steps = FLOW[order.fulfillment];
  const current = steps.indexOf(order.status);
  return (
    <ol className="flex items-center gap-1" aria-label="Seguimiento del pedido">
      {steps.map((s, i) => {
        const done = i <= current;
        const at = order.history.find((h) => h.status === s)?.at;
        return (
          <li key={s} className="flex flex-1 flex-col items-center gap-1 text-center" aria-current={i === current ? 'step' : undefined}>
            <span className={cn('grid h-7 w-7 place-items-center rounded-full border text-xs font-bold', done ? 'border-primary bg-primary text-primary-foreground' : 'border-slate-300 bg-white text-slate-500')}>
              {done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
            </span>
            <span className={cn('text-[11px] leading-tight', done ? 'font-semibold text-slate-900' : 'text-slate-500')}>{STATUS_LABEL[s]}</span>
            <span className="text-[10px] text-slate-500">{at ? shortTime(at) : ' '}</span>
          </li>
        );
      })}
    </ol>
  );
}

interface Props {
  orders: OrderView[];
  loading: boolean;
  mode: 'cliente' | 'comerciante';
  busyId: string | null;
  onCancel?: (id: string) => void;
  onAdvance?: (id: string) => void;
  onBrowse?: () => void;
}

export function OrdersView({ orders, loading, mode, busyId, onCancel, onAdvance, onBrowse }: Props) {
  if (loading && orders.length === 0) return <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>;
  if (orders.length === 0) {
    return (
      <Card className="mx-auto flex max-w-lg flex-col items-center gap-3 p-10 text-center">
        <PackageOpen className="h-10 w-10 text-slate-400" aria-hidden />
        <h2 className="text-lg font-semibold">{mode === 'cliente' ? 'Aún no tienes pedidos' : 'Todavía no recibes pedidos'}</h2>
        {mode === 'cliente' && onBrowse && <Button onClick={onBrowse}>Ver catálogo</Button>}
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      {orders.map((o) => {
        const next = nextStatus(o.status, o.fulfillment);
        const busy = busyId === o.id;
        return (
          <Card key={o.id} className="space-y-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                  <Store className="h-4 w-4" aria-hidden /> {mode === 'cliente' ? o.stallName : o.contactName}
                </h3>
                <p className="text-xs text-slate-600">
                  Pedido #{o.id.slice(0, 8)} · {timeAgo(o.createdAt)} ·{' '}
                  {o.fulfillment === 'delivery' ? <span className="inline-flex items-center gap-1"><Truck className="h-3 w-3" aria-hidden />Delivery a {o.district}</span> : 'Recojo en el mercado'}
                </p>
                {mode === 'comerciante' && (
                  <p className="text-xs text-slate-600">
                    Cel. {o.phone}{o.address ? ` · ${o.address}` : ''}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant={o.paymentStatus === 'pagado' ? 'safe' : o.paymentStatus === 'reembolsado' ? 'secondary' : 'caution'}>
                  {PAY_LABEL[o.paymentStatus]} · {METHOD_LABEL[o.paymentMethod]}
                </Badge>
              </div>
            </div>
            <ul className="divide-y rounded-lg border border-slate-100 text-sm">
              {o.items.map((it) => (
                <li key={it.productId} className="flex justify-between gap-2 px-3 py-1.5">
                  <span>{it.quantity} {unitLabel(it.unit, it.quantity)} · {it.name}</span>
                  <span className="text-slate-700">{money(it.subtotal)}</span>
                </li>
              ))}
              {o.deliveryFee > 0 && (
                <li className="flex justify-between px-3 py-1.5 text-slate-600"><span>Delivery</span><span>{money(o.deliveryFee)}</span></li>
              )}
              <li className="flex justify-between px-3 py-1.5 font-bold"><span>Total</span><span>{money(o.total)}</span></li>
            </ul>
            <Timeline order={o} />
            <div className="flex flex-wrap justify-end gap-2">
              {mode === 'cliente' && canCancel(o.status) && onCancel && (
                <Button variant="outline" size="sm" disabled={busy} onClick={() => onCancel(o.id)}>
                  {busy ? <LoaderCircle className="animate-spin" /> : <X />} Cancelar pedido
                </Button>
              )}
              {mode === 'comerciante' && next && onAdvance && (
                <Button size="sm" disabled={busy} onClick={() => onAdvance(o.id)}>
                  {busy ? <LoaderCircle className="animate-spin" /> : <Check />} Marcar como «{STATUS_LABEL[next]}»
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
