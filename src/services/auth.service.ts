/**
 * Capa de negocio – cuentas (HU-22).
 * Registra clientes y comerciantes (el comerciante crea su puesto) y emite el JWT con su rol.
 */
import { hashPassword, signToken, TOKEN_TTL_SECONDS, verifyPassword, type Role } from '@/lib/auth';
import { HttpError } from '@/lib/errors';
import { logEvent } from '@/lib/http';
import { getRepo } from '@/lib/repo';
import type { User } from '@/lib/repo/types';

export interface AuthResult {
  token: string;
  expiresIn: number;
  user: { id: string; email: string; role: Role; name: string; stallId: string | null };
}

async function toResult(user: User): Promise<AuthResult> {
  const stall = user.role === 'comerciante' ? await getRepo().findStallByOwner(user.id) : null;
  return {
    token: signToken(user),
    expiresIn: TOKEN_TTL_SECONDS,
    user: { id: user.id, email: user.email, role: user.role, name: user.name, stallId: stall?.id ?? null },
  };
}

export interface RegisterInput {
  email: string;
  password: string;
  role: Role;
  name: string;
  stallName?: string;
  stallCode?: string;
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const repo = getRepo();
  const user = await repo.createUser({
    email: input.email,
    passwordHash: await hashPassword(input.password),
    role: input.role,
    name: input.name,
  });
  if (input.role === 'comerciante') {
    await repo.createStall({
      name: input.stallName ?? 'Mi puesto',
      code: (input.stallCode ?? '').toUpperCase(),
      description: '',
      ownerId: user.id,
    });
  }
  logEvent('info', 'user_registered', { role: input.role });
  return toResult(user);
}

export async function loginUser(email: string, password: string): Promise<AuthResult> {
  const user = await getRepo().findUserByEmail(email);
  // Mensaje genérico: no revela si el correo existe.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    logEvent('warn', 'login_failed');
    throw new HttpError(401, 'Credenciales inválidas');
  }
  return toResult(user);
}
