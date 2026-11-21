import { HttpError } from '@/lib/errors';
import { handle, json } from '@/lib/http';
import { getProductDetail } from '@/services/catalog.service';

export const dynamic = 'force-dynamic';

/** Capa API (controlador): HU-03, detalle de producto con precio minorista y mayorista. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(req, async () => {
    const { id } = await ctx.params;
    const product = await getProductDetail(id);
    if (!product) throw new HttpError(404, 'Producto no encontrado');
    return json({ product });
  });
}
