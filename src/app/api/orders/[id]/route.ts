import { enforceRateLimit, handle, json, readJson, requireAuth } from '@/lib/http';
import { orderActionSchema } from '@/lib/validation';
import { advanceOrder, cancelOrder, toPublicOrder } from '@/services/order.service';

export const dynamic = 'force-dynamic';

/** Capa API (controlador): HU-10 (cliente cancela) y HU-20 (comerciante avanza el estado). */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(req, async () => {
    enforceRateLimit(req, 'orders-patch', 30);
    const user = requireAuth(req);
    const { id } = await ctx.params;
    const { action } = await readJson(req, orderActionSchema);
    const order = action === 'cancel' ? await cancelOrder(user, id) : await advanceOrder(user, id);
    return json({ order: toPublicOrder(order) });
  });
}
