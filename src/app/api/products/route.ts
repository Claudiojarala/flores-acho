import { handle, json } from '@/lib/http';
import { productQuerySchema } from '@/lib/validation';
import { searchProducts } from '@/services/catalog.service';

export const dynamic = 'force-dynamic';

/** Capa API (controlador): HU-01 / HU-02 / HU-05, catálogo público con búsqueda y filtros. */
export async function GET(req: Request) {
  return handle(req, async () => {
    const params = Object.fromEntries(new URL(req.url).searchParams);
    return json({ products: await searchProducts(productQuerySchema.parse(params)) });
  });
}
