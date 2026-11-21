import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { HttpError } from './errors';

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

const DEV_FALLBACK_SECRET = 'dev-only-secret-change-me-dev-only-secret-change-me';
export const TOKEN_TTL_SECONDS = 60 * 60 * 2; // 2 horas

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === 'production') {
    // Falla cerrada: jamás se firman tokens con un secreto débil en producción.
    throw new Error('JWT_SECRET no configurado (mínimo 32 caracteres)');
  }
  return DEV_FALLBACK_SECRET;
}

const b64url = (buf: Buffer | string) => Buffer.from(buf).toString('base64url');

export type Role = 'cliente' | 'comerciante';
export const ROLES: readonly Role[] = ['cliente', 'comerciante'];

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  iat: number;
  exp: number;
}

function sign(data: string): string {
  return createHmac('sha256', getSecret()).update(data).digest('base64url');
}

export function signToken(user: { id: string; email: string; role: Role }, now = Date.now()): string {
  const iat = Math.floor(now / 1000);
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(
    JSON.stringify({ sub: user.id, email: user.email, role: user.role, iat, exp: iat + TOKEN_TTL_SECONDS }),
  );
  return `${header}.${payload}.${sign(`${header}.${payload}`)}`;
}

export function verifyToken(token: string, now = Date.now()): JwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3) throw new HttpError(401, 'Token inválido');
  const [header, payload, signature] = parts;

  let parsedHeader: { alg?: string };
  try {
    parsedHeader = JSON.parse(Buffer.from(header, 'base64url').toString('utf8'));
  } catch {
    throw new HttpError(401, 'Token inválido');
  }
  // Rechaza "alg: none" u otros algoritmos: solo HS256.
  if (parsedHeader.alg !== 'HS256') throw new HttpError(401, 'Token inválido');

  const expected = Buffer.from(sign(`${header}.${payload}`));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    throw new HttpError(401, 'Token inválido');
  }

  let data: JwtPayload;
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    throw new HttpError(401, 'Token inválido');
  }
  if (typeof data.sub !== 'string' || typeof data.exp !== 'number' || !ROLES.includes(data.role)) {
    throw new HttpError(401, 'Token inválido');
  }
  if (data.exp * 1000 <= now) throw new HttpError(401, 'Sesión expirada');
  return data;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
