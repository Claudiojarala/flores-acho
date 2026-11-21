import { ZodError, type ZodType } from 'zod';
import { verifyToken, type Role } from './auth';
import { HttpError } from './errors';
import { rateLimit } from './rateLimit';

const MAX_BODY_BYTES = 10_000;

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

/** Registro estructurado (JSON) para monitoreo: nunca incluye contraseñas ni tokens. */
export function logEvent(level: 'info' | 'warn' | 'error', event: string, data: Record<string, unknown> = {}): void {
  if (process.env.NODE_ENV === 'test') return;
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, event, ...data }));
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}

/** Rate limiting para peticiones POST (por IP y por bucket). */
export function enforceRateLimit(req: Request, bucket: string, limit = 20, windowMs = 60_000): void {
  const result = rateLimit(`${bucket}:${clientIp(req)}`, limit, windowMs);
  if (!result.ok) {
    throw new HttpError(429, 'Demasiadas solicitudes, intenta nuevamente en unos segundos', {
      'Retry-After': String(result.retryAfterSeconds),
    });
  }
}

export async function readJson<T>(req: Request, schema: ZodType<T>): Promise<T> {
  const length = Number(req.headers.get('content-length') ?? '0');
  if (length > MAX_BODY_BYTES) throw new HttpError(413, 'Cuerpo de la solicitud demasiado grande');
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) throw new HttpError(413, 'Cuerpo de la solicitud demasiado grande');
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new HttpError(400, 'JSON inválido');
  }
  return schema.parse(body);
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export function requireAuth(req: Request): AuthUser {
  const header = req.headers.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw new HttpError(401, 'Autenticación requerida');
  const payload = verifyToken(token);
  return { id: payload.sub, email: payload.email, role: payload.role };
}

/** Control de acceso por rol (HU-23): 403 si el usuario autenticado no tiene el rol requerido. */
export function requireRole(req: Request, role: Role): AuthUser {
  const user = requireAuth(req);
  if (user.role !== role) throw new HttpError(403, 'Tu rol no tiene permiso para esta acción');
  return user;
}

/** Envuelve un handler: traduce errores a respuestas HTTP sin filtrar trazas internas. */
export async function handle(req: Request, fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ZodError) {
      logEvent('warn', 'validation_error', { path: new URL(req.url).pathname, status: 400 });
      return json(
        {
          error: 'Datos inválidos',
          details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        },
        400,
      );
    }
    if (err instanceof HttpError) {
      if (err.status >= 400 && err.status < 500) {
        logEvent('warn', 'client_error', { path: new URL(req.url).pathname, status: err.status });
      }
      return json({ error: err.message }, err.status, err.headers);
    }
    logEvent('error', 'unhandled_error', {
      path: new URL(req.url).pathname,
      message: err instanceof Error ? err.message : 'desconocido',
    });
    return json({ error: 'Error interno del servidor' }, 500);
  }
}
