import { beforeEach, describe, expect, it } from 'vitest';
import { resetRateLimits } from '@/lib/rateLimit';
import { getRepo, setRepo } from '@/lib/repo';
import { MemoryRepository } from '@/lib/repo/memory';
import { GET as healthGET } from '@/app/api/health/route';
import { POST as authPOST } from '@/app/api/auth/route';
import { GET as productsGET } from '@/app/api/products/route';
import { GET as productGET } from '@/app/api/products/[id]/route';
import { GET as stallsGET } from '@/app/api/stalls/route';
import { GET as zonesGET } from '@/app/api/delivery-zones/route';
import { GET as ordersGET, POST as ordersPOST } from '@/app/api/orders/route';
import { PATCH as orderPATCH } from '@/app/api/orders/[id]/route';
import { GET as merchantStallGET } from '@/app/api/merchant/stall/route';
import { POST as merchantProductPOST } from '@/app/api/merchant/products/route';
import { PATCH as merchantProductPATCH } from '@/app/api/merchant/products/[id]/route';

const BASE = 'http://localhost';
const ROSAS = 'b0000000-0000-4000-8000-000000000001'; // Puesto A-12, S/ 45 (mayorista S/ 36 desde 10)
const GIRASOLES = 'b0000000-0000-4000-8000-000000000004'; // Puesto B-05, S/ 30
const PASSWORD = 'Segura12345';

function req(path: string, method = 'GET', body?: unknown, token?: string): Request {
  return new Request(`${BASE}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '10.0.0.1',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const idCtx = (id: string) => ({ params: Promise.resolve({ id }) });

async function registerCliente(email: string): Promise<string> {
  const res = await authPOST(req('/api/auth', 'POST', { mode: 'register', email, password: PASSWORD, name: 'Ana Torres' }));
  expect(res.status).toBe(201);
  return (await res.json()).token;
}

async function registerComerciante(email: string, code: string): Promise<string> {
  const res = await authPOST(
    req('/api/auth', 'POST', { mode: 'register', email, password: PASSWORD, role: 'comerciante', name: 'Julio Pérez', stallName: `Puesto ${code}`, stallCode: code }),
  );
  expect(res.status).toBe(201);
  return (await res.json()).token;
}

const checkoutBody = (items: { productId: string; quantity: number }[], extra: Record<string, unknown> = {}) => ({
  items,
  fulfillment: 'recojo',
  contactName: 'Ana Torres',
  phone: '987654321',
  payment: { method: 'yape', phone: '987654321' },
  ...extra,
});

async function stockOf(id: string): Promise<number> {
  return (await getRepo().getProduct(id))!.stock;
}

beforeEach(() => {
  setRepo(new MemoryRepository({ seed: true }));
  resetRateLimits();
});

describe('salud y datos públicos', () => {
  it('GET /api/health responde ok', async () => {
    expect((await healthGET()).status).toBe(200);
  });

  it('HU-01: el catálogo es público e incluye el nombre del puesto', async () => {
    const res = await productsGET(req('/api/products'));
    const { products } = await res.json();
    expect(res.status).toBe(200);
    expect(products.length).toBeGreaterThanOrEqual(15);
    expect(products[0]).toHaveProperty('stallName');
  });

  it('HU-02: filtra por categoría, ocasión, precio y busca sin tildes', async () => {
    const rosas = (await (await productsGET(req('/api/products?category=rosas'))).json()).products;
    expect(rosas.length).toBeGreaterThan(0);
    expect(rosas.every((p: { category: string }) => p.category === 'rosas')).toBe(true);

    const madre = (await (await productsGET(req('/api/products?occasion=dia_madre'))).json()).products;
    expect(madre.every((p: { occasions: string[] }) => p.occasions.includes('dia_madre'))).toBe(true);

    const baratos = (await (await productsGET(req('/api/products?maxPrice=25'))).json()).products;
    expect(baratos.every((p: { priceRetail: number }) => p.priceRetail <= 25)).toBe(true);

    const busq = (await (await productsGET(req('/api/products?q=orquidea'))).json()).products;
    expect(busq.some((p: { name: string }) => p.name.includes('Orquídea'))).toBe(true);
  });

  it('HU-02: rechaza filtros inválidos con 400', async () => {
    expect((await productsGET(req('/api/products?category=cactus'))).status).toBe(400);
  });

  it('HU-03: detalle de producto y 404 si no existe', async () => {
    const ok = await productGET(req(`/api/products/${ROSAS}`), idCtx(ROSAS));
    expect(ok.status).toBe(200);
    expect((await ok.json()).product.priceWholesale).toBe(36);
    expect((await productGET(req('/api/products/nope'), idCtx('nope'))).status).toBe(404);
  });

  it('HU-04: el directorio de puestos no expone al dueño', async () => {
    const { stalls } = await (await stallsGET(req('/api/stalls'))).json();
    expect(stalls).toHaveLength(6);
    expect(stalls[0]).not.toHaveProperty('ownerId');
    expect(stalls[0]).toHaveProperty('productCount');
  });

  it('HU-16: lista las zonas de delivery con tarifa', async () => {
    const { zones } = await (await zonesGET(req('/api/delivery-zones'))).json();
    expect(zones.find((z: { district: string }) => z.district === 'Rímac').fee).toBe(5);
  });
});

describe('HU-22 / HU-23: cuentas y roles', () => {
  it('registra un cliente y un comerciante (con su puesto)', async () => {
    await registerCliente('ana@correo.com');
    const res = await authPOST(
      req('/api/auth', 'POST', { mode: 'register', email: 'julio@correo.com', password: PASSWORD, role: 'comerciante', name: 'Julio', stallName: 'Claveles Julio', stallCode: 'a-31' }),
    );
    const data = await res.json();
    expect(data.user.role).toBe('comerciante');
    expect(data.user.stallId).toBeTruthy();
    expect(data).not.toHaveProperty('passwordHash');
  });

  it('rechaza correo duplicado y puesto duplicado con 409', async () => {
    await registerCliente('ana@correo.com');
    const dup = await authPOST(req('/api/auth', 'POST', { mode: 'register', email: 'ana@correo.com', password: PASSWORD, name: 'Ana' }));
    expect(dup.status).toBe(409);
    await registerComerciante('j1@correo.com', 'C-40');
    const dupStall = await authPOST(
      req('/api/auth', 'POST', { mode: 'register', email: 'j2@correo.com', password: PASSWORD, role: 'comerciante', name: 'J2', stallName: 'Otro puesto', stallCode: 'C-40' }),
    );
    expect(dupStall.status).toBe(409);
  });

  it('login con credenciales incorrectas responde 401 genérico', async () => {
    await registerCliente('ana@correo.com');
    const bad = await authPOST(req('/api/auth', 'POST', { mode: 'login', email: 'ana@correo.com', password: 'Incorrecta123' }));
    const unknown = await authPOST(req('/api/auth', 'POST', { mode: 'login', email: 'nadie@correo.com', password: PASSWORD }));
    expect(bad.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect((await bad.json()).error).toBe((await unknown.json()).error);
  });

  it('login correcto devuelve token y rol', async () => {
    await registerCliente('ana@correo.com');
    const res = await authPOST(req('/api/auth', 'POST', { mode: 'login', email: 'ana@correo.com', password: PASSWORD }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.user.role).toBe('cliente');
  });

  it('limita los intentos de autenticación con 429', async () => {
    let last = 0;
    for (let i = 0; i < 12; i++) {
      last = (await authPOST(req('/api/auth', 'POST', { mode: 'login', email: 'x@y.com', password: PASSWORD }))).status;
    }
    expect(last).toBe(429);
  });

  it('los endpoints protegidos exigen sesión (401) y el rol correcto (403)', async () => {
    const cliente = await registerCliente('ana@correo.com');
    expect((await ordersGET(req('/api/orders'))).status).toBe(401);
    expect((await ordersPOST(req('/api/orders', 'POST', checkoutBody([{ productId: ROSAS, quantity: 1 }])))).status).toBe(401);
    expect((await merchantStallGET(req('/api/merchant/stall', 'GET', undefined, cliente))).status).toBe(403);
    expect((await ordersGET(req('/api/orders?scope=stall', 'GET', undefined, cliente))).status).toBe(403);
  });
});

describe('HU-06…HU-16: pedidos y pagos', () => {
  it('crea un pedido por puesto, aplica mayorista y descuenta stock', async () => {
    const token = await registerCliente('ana@correo.com');
    const before = await stockOf(ROSAS);
    const res = await ordersPOST(req('/api/orders', 'POST', checkoutBody([{ productId: ROSAS, quantity: 10 }, { productId: GIRASOLES, quantity: 2 }]), token));
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.orders).toHaveLength(2); // un pedido por puesto
    const rosas = data.orders.find((o: { stallName: string }) => o.stallName === 'Flores Doña Rosa');
    expect(rosas.items[0].unitPrice).toBe(36); // mayorista
    expect(rosas.subtotal).toBe(360);
    expect(data.payment.status).toBe('pagado');
    expect(data.payment.reference).toMatch(/^SIM-/);
    expect(data.payment.total).toBe(420); // 360 + 60
    expect(data.orders[0]).not.toHaveProperty('userId');
    expect(await stockOf(ROSAS)).toBe(before - 10);
  });

  it('cobra el delivery según el distrito (HU-15, HU-16)', async () => {
    const token = await registerCliente('ana@correo.com');
    const res = await ordersPOST(
      req('/api/orders', 'POST', checkoutBody([{ productId: GIRASOLES, quantity: 1 }], { fulfillment: 'delivery', district: 'Miraflores', address: 'Av. Larco 123' }), token),
    );
    const order = (await res.json()).orders[0];
    expect(order.deliveryFee).toBe(15);
    expect(order.total).toBe(45);
    expect(order.address).toBe('Av. Larco 123');
  });

  it('rechaza con 409 si no hay stock y deja el inventario intacto', async () => {
    const token = await registerCliente('ana@correo.com');
    const before = await stockOf(ROSAS);
    const res = await ordersPOST(req('/api/orders', 'POST', checkoutBody([{ productId: GIRASOLES, quantity: 1 }, { productId: ROSAS, quantity: 500 }]), token));
    expect(res.status).toBe(409);
    expect(await stockOf(ROSAS)).toBe(before);
    expect(await stockOf(GIRASOLES)).toBe(70);
  });

  it('una tarjeta rechazada responde 402 y repone el stock (HU-12)', async () => {
    const token = await registerCliente('ana@correo.com');
    const card = { method: 'tarjeta', cardNumber: '4000000000000002', expiry: '12/39', cvv: '123' };
    // 4000 0000 0000 0002 pasa Luhn y termina en 0002 → la pasarela simulada la rechaza.
    const res = await ordersPOST(req('/api/orders', 'POST', checkoutBody([{ productId: ROSAS, quantity: 3 }], { payment: card }), token));
    expect(res.status).toBe(402);
    expect(await stockOf(ROSAS)).toBe(120);
    expect((await (await ordersGET(req('/api/orders', 'GET', undefined, token))).json()).orders).toHaveLength(0);
  });

  it('pago contra entrega queda pendiente hasta la entrega (HU-13)', async () => {
    const token = await registerCliente('ana@correo.com');
    const res = await ordersPOST(req('/api/orders', 'POST', checkoutBody([{ productId: GIRASOLES, quantity: 1 }], { payment: { method: 'contraentrega' } }), token));
    expect((await res.json()).orders[0].paymentStatus).toBe('pendiente');
  });

  it('un comerciante no puede comprar (403) y los datos inválidos devuelven 400', async () => {
    const merchant = await registerComerciante('j@correo.com', 'C-41');
    expect((await ordersPOST(req('/api/orders', 'POST', checkoutBody([{ productId: ROSAS, quantity: 1 }]), merchant))).status).toBe(403);
    const cliente = await registerCliente('ana@correo.com');
    expect((await ordersPOST(req('/api/orders', 'POST', checkoutBody([]), cliente))).status).toBe(400);
  });

  it('HU-09: cada cliente solo ve sus propios pedidos', async () => {
    const ana = await registerCliente('ana@correo.com');
    const luis = await registerCliente('luis@correo.com');
    await ordersPOST(req('/api/orders', 'POST', checkoutBody([{ productId: ROSAS, quantity: 1 }]), ana));
    expect((await (await ordersGET(req('/api/orders', 'GET', undefined, ana))).json()).orders).toHaveLength(1);
    expect((await (await ordersGET(req('/api/orders', 'GET', undefined, luis))).json()).orders).toHaveLength(0);
  });
});

describe('HU-10 / HU-17 / HU-20: ciclo de vida del pedido', () => {
  async function pedidoEnPuestoDe(merchant: string, cliente: string): Promise<string> {
    const created = await merchantProductPOST(
      req('/api/merchant/products', 'POST', { name: 'Rosas blancas', category: 'rosas', unit: 'docena', priceRetail: 40, priceWholesale: 32, wholesaleMinQty: 10, stock: 20 }, merchant),
    );
    const productId = (await created.json()).product.id;
    const res = await ordersPOST(req('/api/orders', 'POST', checkoutBody([{ productId, quantity: 2 }], { fulfillment: 'delivery', district: 'Rímac', address: 'Jr. Hualgayoc 100' }), cliente));
    return (await res.json()).orders[0].id;
  }

  it('el cliente cancela un pedido pendiente: se repone el stock y se reembolsa', async () => {
    const merchant = await registerComerciante('j@correo.com', 'C-42');
    const cliente = await registerCliente('ana@correo.com');
    const orderId = await pedidoEnPuestoDe(merchant, cliente);
    const res = await orderPATCH(req(`/api/orders/${orderId}`, 'PATCH', { action: 'cancel' }, cliente), idCtx(orderId));
    const { order } = await res.json();
    expect(order.status).toBe('cancelado');
    expect(order.paymentStatus).toBe('reembolsado');
    const stall = await (await merchantStallGET(req('/api/merchant/stall', 'GET', undefined, merchant))).json();
    expect(stall.products[0].stock).toBe(20);
  });

  it('otro cliente no puede cancelar un pedido ajeno (403)', async () => {
    const merchant = await registerComerciante('j@correo.com', 'C-43');
    const ana = await registerCliente('ana@correo.com');
    const luis = await registerCliente('luis@correo.com');
    const orderId = await pedidoEnPuestoDe(merchant, ana);
    expect((await orderPATCH(req(`/api/orders/${orderId}`, 'PATCH', { action: 'cancel' }, luis), idCtx(orderId))).status).toBe(403);
  });

  it('el comerciante dueño avanza el estado hasta entregado; otros no pueden', async () => {
    const merchant = await registerComerciante('j@correo.com', 'C-44');
    const otro = await registerComerciante('k@correo.com', 'C-45');
    const cliente = await registerCliente('ana@correo.com');
    const orderId = await pedidoEnPuestoDe(merchant, cliente);

    expect((await orderPATCH(req(`/api/orders/${orderId}`, 'PATCH', { action: 'advance' }, otro), idCtx(orderId))).status).toBe(403);
    expect((await orderPATCH(req(`/api/orders/${orderId}`, 'PATCH', { action: 'advance' }, cliente), idCtx(orderId))).status).toBe(403);

    const seen: string[] = [];
    for (let i = 0; i < 3; i++) {
      const res = await orderPATCH(req(`/api/orders/${orderId}`, 'PATCH', { action: 'advance' }, merchant), idCtx(orderId));
      seen.push((await res.json()).order.status);
    }
    expect(seen).toEqual(['preparando', 'en_camino', 'entregado']);
    expect((await orderPATCH(req(`/api/orders/${orderId}`, 'PATCH', { action: 'advance' }, merchant), idCtx(orderId))).status).toBe(409);

    const mine = (await (await ordersGET(req('/api/orders?scope=stall', 'GET', undefined, merchant))).json()).orders;
    expect(mine).toHaveLength(1);
    expect(mine[0].history.map((h: { status: string }) => h.status)).toEqual(['pendiente', 'preparando', 'en_camino', 'entregado']);
  });

  it('no se puede cancelar un pedido que ya está en preparación (409)', async () => {
    const merchant = await registerComerciante('j@correo.com', 'C-46');
    const cliente = await registerCliente('ana@correo.com');
    const orderId = await pedidoEnPuestoDe(merchant, cliente);
    await orderPATCH(req(`/api/orders/${orderId}`, 'PATCH', { action: 'advance' }, merchant), idCtx(orderId));
    expect((await orderPATCH(req(`/api/orders/${orderId}`, 'PATCH', { action: 'cancel' }, cliente), idCtx(orderId))).status).toBe(409);
  });

  it('un pedido inexistente responde 404', async () => {
    const cliente = await registerCliente('ana@correo.com');
    expect((await orderPATCH(req('/api/orders/zzz', 'PATCH', { action: 'cancel' }, cliente), idCtx('zzz'))).status).toBe(404);
  });
});

describe('HU-18 / HU-19 / HU-21: panel del comerciante', () => {
  const nuevo = { name: 'Rosas blancas', category: 'rosas', unit: 'docena', priceRetail: 40, priceWholesale: 32, wholesaleMinQty: 10, stock: 20 };

  it('publica un producto y aparece en el catálogo público', async () => {
    const merchant = await registerComerciante('j@correo.com', 'C-47');
    const res = await merchantProductPOST(req('/api/merchant/products', 'POST', { ...nuevo, name: 'Tulipanes holandeses' }, merchant));
    expect(res.status).toBe(201);
    const { products } = await (await productsGET(req('/api/products?q=tulipanes'))).json();
    expect(products).toHaveLength(1);
  });

  it('un cliente no puede publicar productos (403)', async () => {
    const cliente = await registerCliente('ana@correo.com');
    expect((await merchantProductPOST(req('/api/merchant/products', 'POST', nuevo, cliente))).status).toBe(403);
  });

  it('actualiza precio y stock propios; no productos de otro puesto (403)', async () => {
    const merchant = await registerComerciante('j@correo.com', 'C-48');
    const otro = await registerComerciante('k@correo.com', 'C-49');
    const productId = (await (await merchantProductPOST(req('/api/merchant/products', 'POST', nuevo, merchant))).json()).product.id;

    const ok = await merchantProductPATCH(req(`/api/merchant/products/${productId}`, 'PATCH', { priceRetail: 42, stock: 50 }, merchant), idCtx(productId));
    expect((await ok.json()).product.stock).toBe(50);

    expect((await merchantProductPATCH(req(`/api/merchant/products/${productId}`, 'PATCH', { stock: 1 }, otro), idCtx(productId))).status).toBe(403);
    // No puede tocar productos de los puestos de demostración.
    expect((await merchantProductPATCH(req(`/api/merchant/products/${ROSAS}`, 'PATCH', { priceRetail: 1 }, merchant), idCtx(ROSAS))).status).toBe(403);
    // Precio mayorista mayor al minorista.
    expect((await merchantProductPATCH(req(`/api/merchant/products/${productId}`, 'PATCH', { priceWholesale: 99 }, merchant), idCtx(productId))).status).toBe(422);
    // Cuerpo vacío o con campos no permitidos.
    expect((await merchantProductPATCH(req(`/api/merchant/products/${productId}`, 'PATCH', {}, merchant), idCtx(productId))).status).toBe(400);
    expect((await merchantProductPATCH(req(`/api/merchant/products/${productId}`, 'PATCH', { stallId: 'x' }, merchant), idCtx(productId))).status).toBe(400);
  });

  it('un producto desactivado deja de verse en el catálogo', async () => {
    const merchant = await registerComerciante('j@correo.com', 'C-50');
    const productId = (await (await merchantProductPOST(req('/api/merchant/products', 'POST', nuevo, merchant))).json()).product.id;
    await merchantProductPATCH(req(`/api/merchant/products/${productId}`, 'PATCH', { active: false }, merchant), idCtx(productId));
    expect((await productGET(req(`/api/products/${productId}`), idCtx(productId))).status).toBe(404);
  });

  it('HU-21: el resumen de ventas cuenta pedidos e ingresos', async () => {
    const merchant = await registerComerciante('j@correo.com', 'C-51');
    const cliente = await registerCliente('ana@correo.com');
    const productId = (await (await merchantProductPOST(req('/api/merchant/products', 'POST', nuevo, merchant))).json()).product.id;
    await ordersPOST(req('/api/orders', 'POST', checkoutBody([{ productId, quantity: 2 }]), cliente));
    const { summary } = await (await merchantStallGET(req('/api/merchant/stall', 'GET', undefined, merchant))).json();
    expect(summary).toEqual({ orders: 1, pending: 1, delivered: 0, revenue: 80 });
  });
});
