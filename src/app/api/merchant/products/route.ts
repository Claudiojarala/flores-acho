import { enforceRateLimit, handle, json, readJson, requireRole } from '@/lib/http';
import { productCreateSchema } from '@/lib/validation';
import { addProduct } from '@/services/merchant.service';

export const dynamic = 'force-dynamic';

/** Capa API (controlador): HU-18, el comerciante publica un producto en su puesto. */
export async function POST(req: Request) {
  return handle(req, async () => {
    enforceRateLimit(req, 'products', 20);
    const user = requireRole(req, 'comerciante');
    const body = await readJson(req, productCreateSchema);
    return json({ product: await addProduct(user.id, body) }, 201);
  });
}
