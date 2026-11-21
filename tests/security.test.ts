import { beforeEach, describe, expect, it } from 'vitest';
import { hashPassword, signToken, verifyPassword, verifyToken } from '@/lib/auth';
import { rateLimit, resetRateLimits } from '@/lib/rateLimit';
import { sanitizeText } from '@/lib/sanitize';
import { checkoutSchema, productCreateSchema, productQuerySchema, registerSchema } from '@/lib/validation';

const validCheckout = {
  items: [{ productId: 'b0000000-0000-4000-8000-000000000001', quantity: 2 }],
  fulfillment: 'recojo' as const,
  contactName: 'Ana Torres',
  phone: '987654321',
  payment: { method: 'yape' as const, phone: '987654321' },
};

describe('validación Zod', () => {
  it('aplica la política mínima de contraseña (HU-22)', () => {
    const base = { mode: 'register' as const, email: 'ana@correo.com', name: 'Ana' };
    expect(registerSchema.safeParse({ ...base, password: 'corta1A' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: 'sinnumeroAAAA' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: 'Segura12345' }).success).toBe(true);
  });

  it('el comerciante debe indicar nombre y número de puesto al registrarse', () => {
    const base = { mode: 'register' as const, email: 'don@julio.com', password: 'Segura12345', name: 'Julio', role: 'comerciante' as const };
    expect(registerSchema.safeParse(base).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, stallName: 'Claveles Julio', stallCode: 'A-31' }).success).toBe(true);
    expect(registerSchema.safeParse({ ...base, stallName: 'Claveles Julio', stallCode: 'XX99999' }).success).toBe(false);
  });

  it('rechaza roles inventados', () => {
    expect(registerSchema.safeParse({ mode: 'login', email: 'a@b.com', password: 'Segura12345', role: 'admin' }).success).toBe(false);
  });

  it('valida filtros del catálogo (HU-02)', () => {
    const r = productQuerySchema.parse({ category: 'rosas', maxPrice: '50', inStock: 'true' });
    expect(r.maxPrice).toBe(50);
    expect(r.inStock).toBe(true);
    expect(productQuerySchema.safeParse({ category: 'cactus' }).success).toBe(false);
  });

  it('el precio mayorista no puede superar al minorista (HU-18)', () => {
    const base = { name: 'Rosas blancas', category: 'rosas', unit: 'docena', priceRetail: 40, priceWholesale: 50, wholesaleMinQty: 10, stock: 5 };
    expect(productCreateSchema.safeParse(base).success).toBe(false);
    expect(productCreateSchema.safeParse({ ...base, priceWholesale: 32 }).success).toBe(true);
  });

  it('el checkout exige dirección y distrito para delivery (HU-15)', () => {
    expect(checkoutSchema.safeParse({ ...validCheckout, fulfillment: 'delivery' }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...validCheckout, fulfillment: 'delivery', district: 'Miraflores', address: 'Av. Larco 123' }).success).toBe(true);
  });

  it('el checkout rechaza distritos sin cobertura, cantidades inválidas y celulares mal formados', () => {
    expect(checkoutSchema.safeParse({ ...validCheckout, fulfillment: 'delivery', district: 'Narnia', address: 'Calle 1 234' }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...validCheckout, items: [{ productId: 'x', quantity: 0 }] }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...validCheckout, phone: '12345' }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...validCheckout, items: [] }).success).toBe(false);
  });

  it('valida tarjetas con Luhn y vigencia (HU-12)', () => {
    const card = { method: 'tarjeta' as const, cardNumber: '4111111111111111', expiry: '12/39', cvv: '123' };
    expect(checkoutSchema.safeParse({ ...validCheckout, payment: card }).success).toBe(true);
    expect(checkoutSchema.safeParse({ ...validCheckout, payment: { ...card, cardNumber: '4111111111111112' } }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...validCheckout, payment: { ...card, expiry: '01/20' } }).success).toBe(false);
  });
});

describe('sanitización XSS', () => {
  it('neutraliza etiquetas HTML', () => {
    const out = sanitizeText('<script>alert(1)</script> Rosas');
    expect(out).not.toContain('<');
    expect(out).not.toContain('>');
    expect(out).toContain('Rosas');
  });

  it('elimina caracteres de control y colapsa espacios', () => {
    expect(sanitizeText('a\u0000b   \n  c')).toBe('ab c');
  });

  it('la validación de productos aplica la sanitización', () => {
    const r = productCreateSchema.parse({
      name: '<img src=x onerror=alert(1)> Rosas',
      category: 'rosas',
      unit: 'docena',
      priceRetail: 40,
      priceWholesale: 30,
      wholesaleMinQty: 10,
      stock: 5,
    });
    expect(r.name).not.toMatch(/[<>]/);
  });
});

describe('JWT HS256 y contraseñas', () => {
  const user = { id: 'u-1', email: 'a@b.com', role: 'cliente' as const };

  it('firma y verifica un token válido', () => {
    const payload = verifyToken(signToken(user));
    expect(payload.sub).toBe('u-1');
    expect(payload.email).toBe('a@b.com');
    expect(payload.role).toBe('cliente');
  });

  it('rechaza un token manipulado', () => {
    const token = signToken(user);
    const [h, , s] = token.split('.');
    const forgedPayload = Buffer.from(JSON.stringify({ sub: 'admin', exp: 9999999999 })).toString('base64url');
    expect(() => verifyToken(`${h}.${forgedPayload}.${s}`)).toThrow();
  });

  it('rechaza tokens con alg "none"', () => {
    const h = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const p = Buffer.from(JSON.stringify({ sub: 'x', exp: 9999999999 })).toString('base64url');
    expect(() => verifyToken(`${h}.${p}.`)).toThrow();
  });

  it('rechaza tokens expirados', () => {
    const token = signToken(user, Date.now() - 3 * 60 * 60 * 1000);
    expect(() => verifyToken(token)).toThrow(/expirada/);
  });

  it('hashea contraseñas con sal y las verifica', async () => {
    const h1 = await hashPassword('Segura12345');
    const h2 = await hashPassword('Segura12345');
    expect(h1).not.toBe(h2);
    expect(h1).not.toContain('Segura12345');
    expect(await verifyPassword('Segura12345', h1)).toBe(true);
    expect(await verifyPassword('otraClave1A', h1)).toBe(false);
  });
});

describe('rate limiting', () => {
  beforeEach(() => resetRateLimits());

  it('bloquea al superar el límite dentro de la ventana', () => {
    const now = 1_000_000;
    for (let i = 0; i < 3; i++) expect(rateLimit('k', 3, 60_000, now).ok).toBe(true);
    const blocked = rateLimit('k', 3, 60_000, now + 1000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('reinicia el contador al terminar la ventana', () => {
    const now = 1_000_000;
    for (let i = 0; i < 4; i++) rateLimit('k2', 3, 1000, now);
    expect(rateLimit('k2', 3, 1000, now + 1500).ok).toBe(true);
  });
});
