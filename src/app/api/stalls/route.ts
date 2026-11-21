import { handle, json } from '@/lib/http';
import { listStalls } from '@/services/catalog.service';

export const dynamic = 'force-dynamic';

/** Capa API (controlador): HU-04, directorio de puestos del mercado. */
export async function GET(req: Request) {
  return handle(req, async () => json({ stalls: await listStalls() }));
}
