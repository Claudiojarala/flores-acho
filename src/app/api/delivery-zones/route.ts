import { handle, json } from '@/lib/http';
import { listDeliveryZones } from '@/services/catalog.service';

export const dynamic = 'force-dynamic';

/** Capa API (controlador): HU-16, zonas de delivery con tarifa y tiempo estimado. */
export async function GET(req: Request) {
  return handle(req, async () => json({ zones: listDeliveryZones() }));
}
