/**
 * Capa de negocio – carrito, pedidos y entrega (HU-06…HU-10, HU-15…HU-17, HU-20).
 * Un checkout genera un pedido por puesto. El stock se reserva antes de cobrar y se compensa si el pago falla.
 */
import { HttpError } from '@/lib/errors';
import { canCancel, nextStatus } from '@/lib/domain/orderFlow';
import { deliveryFeeFor, lineTotal, round2, unitPriceFor } from '@/lib/domain/pricing';
import { logEvent, type AuthUser } from '@/lib/http';
import { getRepo } from '@/lib/repo';
import type { Order, OrderItem, PaymentMethod, Product } from '@/lib/repo/types';
import { getGateway, type PaymentRequest } from './payment.service';

export interface CheckoutInput {
  items: { productId: string; quantity: number }[];
  fulfillment: 'recojo' | 'delivery';
  district?: string;
  address?: string;
  contactName: string;
  phone: string;
  payment: PaymentRequest;
}

export interface CheckoutResult {
  orders: Order[];
  payment: { method: PaymentMethod; status: 'pagado' | 'pendiente'; reference: string | null; total: number };
}

/** Vista que se envía al cliente: nunca incluye el id interno del comprador. */
export function toPublicOrder(o: Order) {
  const { userId, ...rest } = o;
  void userId;
  return rest;
}

export async function checkout(user: AuthUser, input: CheckoutInput): Promise<CheckoutResult> {
  if (user.role !== 'cliente') throw new HttpError(403, 'Solo los clientes pueden comprar');
  const repo = getRepo();

  // 1. Unir líneas repetidas y cargar productos.
  const qty = new Map<string, number>();
  for (const it of input.items) qty.set(it.productId, (qty.get(it.productId) ?? 0) + it.quantity);
  const lines: { product: Product; quantity: number }[] = [];
  for (const [productId, quantity] of qty) {
    const product = await repo.getProduct(productId);
    if (!product || !product.active) throw new HttpError(404, 'Un producto del carrito ya no está disponible');
    lines.push({ product, quantity });
  }

  // 2. Delivery: validar cobertura.
  let fee = 0;
  if (input.fulfillment === 'delivery') {
    const f = deliveryFeeFor(input.district ?? '');
    if (f === undefined) throw new HttpError(422, 'No tenemos cobertura de delivery en ese distrito');
    fee = f;
  }

  // 3. Reservar stock (atómico por producto) con compensación si algo falla.
  const reserved: { id: string; quantity: number }[] = [];
  const release = async () => {
    for (const r of reserved) await repo.adjustStock(r.id, r.quantity);
  };
  for (const { product, quantity } of lines) {
    const updated = await repo.adjustStock(product.id, -quantity);
    if (!updated) {
      await release();
      throw new HttpError(409, `Stock insuficiente de «${product.name}» (hay ${(await repo.getProduct(product.id))?.stock ?? 0})`);
    }
    reserved.push({ id: product.id, quantity });
  }

  // 4. Armar un pedido por puesto con precios calculados en el servidor.
  const byStall = new Map<string, { product: Product; quantity: number }[]>();
  for (const l of lines) byStall.set(l.product.stallId, [...(byStall.get(l.product.stallId) ?? []), l]);
  const drafts: { stallId: string; items: OrderItem[]; subtotal: number }[] = [];
  for (const [stallId, ls] of byStall) {
    const items: OrderItem[] = ls.map(({ product, quantity }) => ({
      productId: product.id,
      name: product.name,
      unit: product.unit,
      quantity,
      unitPrice: unitPriceFor(product, quantity),
      subtotal: lineTotal(product, quantity),
    }));
    drafts.push({ stallId, items, subtotal: round2(items.reduce((s, i) => s + i.subtotal, 0)) });
  }
  const total = round2(drafts.reduce((s, d) => s + d.subtotal + fee, 0));

  // 5. Cobrar (pasarela simulada). Si se rechaza, se devuelve el stock.
  const result = await getGateway().charge(input.payment, total);
  if (!result.approved) {
    await release();
    logEvent('warn', 'payment_declined', { method: input.payment.method });
    throw new HttpError(402, result.reason ?? 'Pago rechazado');
  }

  // 6. Crear pedidos.
  const now = new Date().toISOString();
  const orders: Order[] = [];
  for (const d of drafts) {
    const stall = await repo.getStall(d.stallId);
    orders.push(
      await repo.createOrder({
        userId: user.id,
        stallId: d.stallId,
        stallName: stall?.name ?? 'Puesto',
        items: d.items,
        subtotal: d.subtotal,
        deliveryFee: fee,
        total: round2(d.subtotal + fee),
        fulfillment: input.fulfillment,
        district: input.fulfillment === 'delivery' ? (input.district ?? null) : null,
        address: input.fulfillment === 'delivery' ? (input.address ?? null) : null,
        contactName: input.contactName,
        phone: input.phone,
        paymentMethod: input.payment.method,
        paymentStatus: result.status,
        paymentRef: result.reference,
        status: 'pendiente',
        history: [{ status: 'pendiente', at: now }],
      }),
    );
  }
  logEvent('info', 'order_created', { orders: orders.length, method: input.payment.method });
  return { orders, payment: { method: input.payment.method, status: result.status, reference: result.reference, total } };
}

export function listMyOrders(userId: string): Promise<Order[]> {
  return getRepo().listOrders({ userId });
}

export async function listStallOrders(ownerId: string): Promise<Order[]> {
  const stall = await getRepo().findStallByOwner(ownerId);
  if (!stall) return [];
  return getRepo().listOrders({ stallId: stall.id });
}

async function mustFind(id: string): Promise<Order> {
  const order = await getRepo().getOrder(id);
  if (!order) throw new HttpError(404, 'Pedido no encontrado');
  return order;
}

/** HU-10: el cliente cancela su pedido mientras esté pendiente; se repone el stock y se reembolsa. */
export async function cancelOrder(user: AuthUser, id: string): Promise<Order> {
  const repo = getRepo();
  const order = await mustFind(id);
  if (order.userId !== user.id) throw new HttpError(403, 'Solo puedes cancelar tus propios pedidos');
  if (!canCancel(order.status)) throw new HttpError(409, 'El pedido ya está en preparación y no se puede cancelar');
  for (const it of order.items) await repo.adjustStock(it.productId, it.quantity);
  const updated = await repo.updateOrder(id, {
    status: 'cancelado',
    paymentStatus: order.paymentStatus === 'pagado' ? 'reembolsado' : order.paymentStatus,
    history: [...order.history, { status: 'cancelado', at: new Date().toISOString() }],
  });
  return updated as Order;
}

/** HU-20: solo el dueño del puesto del pedido hace avanzar su estado. */
export async function advanceOrder(user: AuthUser, id: string): Promise<Order> {
  const repo = getRepo();
  const order = await mustFind(id);
  const stall = await repo.findStallByOwner(user.id);
  if (user.role !== 'comerciante' || !stall || stall.id !== order.stallId) {
    throw new HttpError(403, 'Este pedido no pertenece a tu puesto');
  }
  const next = nextStatus(order.status, order.fulfillment);
  if (!next) throw new HttpError(409, 'El pedido ya no puede avanzar de estado');
  const updated = await repo.updateOrder(id, {
    status: next,
    // Pago contra entrega: se cobra al entregar.
    paymentStatus: next === 'entregado' && order.paymentMethod === 'contraentrega' ? 'pagado' : order.paymentStatus,
    history: [...order.history, { status: next, at: new Date().toISOString() }],
  });
  return updated as Order;
}
