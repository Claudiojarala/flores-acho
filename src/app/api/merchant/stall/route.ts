import { handle, json, requireRole } from '@/lib/http';
import { getMyStall } from '@/services/merchant.service';

export const dynamic = 'force-dynamic';

/** Capa API (controlador): HU-18 / HU-21, mi puesto, mis productos y resumen de ventas. */
export async function GET(req: Request) {
  return handle(req, async () => json(await getMyStall(requireRole(req, 'comerciante').id)));
}
