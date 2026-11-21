import { enforceRateLimit, handle, json, readJson, requireRole } from '@/lib/http';
import { productUpdateSchema } from '@/lib/validation';
import { updateProduct } from '@/services/merchant.service';

export const dynamic = 'force-dynamic';

/** Capa API (controlador): HU-19, actualizar precio, stock o disponibilidad de un producto propio. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(req, async () => {
    enforceRateLimit(req, 'products-patch', 30);
    const user = requireRole(req, 'comerciante');
    const { id } = await ctx.params;
    const body = await readJson(req, productUpdateSchema);
    return json({ product: await updateProduct(user.id, id, body) });
  });
}
