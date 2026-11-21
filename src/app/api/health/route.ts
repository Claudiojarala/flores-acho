import { json } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** Endpoint de monitoreo (etapa Monitor del ciclo DevSecOps). */
export async function GET() {
  return json({ status: 'ok', service: 'flores-acho', time: new Date().toISOString() });
}
