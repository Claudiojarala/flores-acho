/** Capa de negocio – panel del comerciante (HU-18, HU-19, HU-21). */
import { HttpError } from '@/lib/errors';
import { round2 } from '@/lib/domain/pricing';
import { getRepo } from '@/lib/repo';
import type { NewProduct, Product, ProductPatch, Stall } from '@/lib/repo/types';

async function myStall(ownerId: string): Promise<Stall> {
  const stall = await getRepo().findStallByOwner(ownerId);
  if (!stall) throw new HttpError(404, 'Aún no tienes un puesto registrado');
  return stall;
}

export interface SalesSummary {
  orders: number;
  pending: number;
  delivered: number;
  revenue: number;
}

/** HU-21: resumen de ventas (los pedidos cancelados no suman). */
export async function getMyStall(ownerId: string): Promise<{ stall: Stall; products: Product[]; summary: SalesSummary }> {
  const repo = getRepo();
  const stall = await myStall(ownerId);
  const [products, orders] = await Promise.all([repo.listProducts({ stallId: stall.id }), repo.listOrders({ stallId: stall.id })]);
  const valid = orders.filter((o) => o.status !== 'cancelado');
  return {
    stall,
    products,
    summary: {
      orders: valid.length,
      pending: orders.filter((o) => o.status === 'pendiente').length,
      delivered: orders.filter((o) => o.status === 'entregado').length,
      revenue: round2(orders.filter((o) => o.status === 'entregado' || (o.paymentStatus === 'pagado' && o.status !== 'cancelado')).reduce((s, o) => s + o.total, 0)),
    },
  };
}

export async function addProduct(ownerId: string, input: Omit<NewProduct, 'stallId'>): Promise<Product> {
  const stall = await myStall(ownerId);
  return getRepo().createProduct({ ...input, stallId: stall.id });
}

/** Autorización por recurso: solo se edita un producto del propio puesto. */
export async function updateProduct(ownerId: string, productId: string, patch: ProductPatch): Promise<Product> {
  const repo = getRepo();
  const stall = await myStall(ownerId);
  const product = await repo.getProduct(productId);
  if (!product) throw new HttpError(404, 'Producto no encontrado');
  if (product.stallId !== stall.id) throw new HttpError(403, 'Este producto no pertenece a tu puesto');
  const next = { ...product, ...patch };
  if (next.priceWholesale > next.priceRetail) throw new HttpError(422, 'El precio mayorista no puede superar al minorista');
  return (await repo.updateProduct(productId, patch)) as Product;
}
