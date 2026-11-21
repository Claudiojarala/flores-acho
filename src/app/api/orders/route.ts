import { enforceRateLimit, handle, json, readJson, requireAuth, requireRole } from '@/lib/http';
import { checkoutSchema, orderListQuerySchema } from '@/lib/validation';
import { checkout, listMyOrders, listStallOrders, toPublicOrder } from '@/services/order.service';

export const dynamic = 'force-dynamic';

/** Capa API (controlador): HU-09 (?scope=mine) y HU-20 (?scope=stall, pedidos recibidos por el comerciante). */
export async function GET(req: Request) {
  return handle(req, async () => {
    const { scope } = orderListQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
    const orders =
      scope === 'stall' ? await listStallOrders(requireRole(req, 'comerciante').id) : await listMyOrders(requireAuth(req).id);
    return json({ orders: orders.map(toPublicOrder) });
  });
}

/** HU-08 / HU-11…HU-16: confirmar el carrito (un pedido por puesto) y cobrar con la pasarela simulada. */
export async function POST(req: Request) {
  return handle(req, async () => {
    enforceRateLimit(req, 'orders', 10);
    const user = requireAuth(req);
    const body = await readJson(req, checkoutSchema);
    const result = await checkout(user, body);
    return json({ orders: result.orders.map(toPublicOrder), payment: result.payment }, 201);
  });
}
