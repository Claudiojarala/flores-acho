import { enforceRateLimit, handle, json, readJson } from '@/lib/http';
import { registerSchema } from '@/lib/validation';
import { loginUser, registerUser } from '@/services/auth.service';

export const dynamic = 'force-dynamic';

/** Capa API (controlador): HU-22, registro (cliente o comerciante) e inicio de sesión. JWT HS256 de 2 horas con rol. */
export async function POST(req: Request) {
  return handle(req, async () => {
    enforceRateLimit(req, 'auth', 10);
    const body = await readJson(req, registerSchema);
    if (body.mode === 'register') {
      return json(await registerUser({ ...body, name: body.name ?? '' }), 201);
    }
    return json(await loginUser(body.email, body.password));
  });
}
