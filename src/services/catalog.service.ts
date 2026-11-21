/** Capa de negocio – catálogo de flores y directorio de puestos (HU-01…HU-05). */
import type { Category, Occasion } from '@/lib/data/catalog';
import { DELIVERY_ZONES } from '@/lib/data/zones';
import { getRepo } from '@/lib/repo';
import type { Product, Stall } from '@/lib/repo/types';

export interface ProductFilter {
  q?: string;
  category?: Category;
  occasion?: Occasion;
  stallId?: string;
  maxPrice?: number;
  inStock?: boolean;
}

export type ProductView = Product & { stallName: string; stallCode: string };

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** HU-02: búsqueda por texto (sin tildes) y filtros por tipo, ocasión, puesto, precio y disponibilidad. */
export async function searchProducts(f: ProductFilter): Promise<ProductView[]> {
  const repo = getRepo();
  const [products, stalls] = await Promise.all([repo.listProducts({ activeOnly: true }), repo.listStalls()]);
  const byId = new Map(stalls.map((s) => [s.id, s]));
  const q = f.q ? norm(f.q) : '';
  return products
    .filter((p) => (f.category ? p.category === f.category : true))
    .filter((p) => (f.occasion ? p.occasions.includes(f.occasion) : true))
    .filter((p) => (f.stallId ? p.stallId === f.stallId : true))
    .filter((p) => (f.maxPrice !== undefined ? p.priceRetail <= f.maxPrice : true))
    .filter((p) => (f.inStock ? p.stock > 0 : true))
    .filter((p) => {
      if (!q) return true;
      const stall = byId.get(p.stallId);
      return norm(`${p.name} ${p.description} ${stall?.name ?? ''}`).includes(q);
    })
    .map((p) => ({ ...p, stallName: byId.get(p.stallId)?.name ?? '', stallCode: byId.get(p.stallId)?.code ?? '' }));
}

/** HU-03: detalle de un producto activo. */
export async function getProductDetail(id: string): Promise<ProductView | null> {
  const repo = getRepo();
  const p = await repo.getProduct(id);
  if (!p || !p.active) return null;
  const stall = await repo.getStall(p.stallId);
  return { ...p, stallName: stall?.name ?? '', stallCode: stall?.code ?? '' };
}

export type StallView = Pick<Stall, 'id' | 'name' | 'code' | 'description'> & { productCount: number };

/** HU-04: directorio de puestos (sin exponer al dueño). */
export async function listStalls(): Promise<StallView[]> {
  const repo = getRepo();
  const [stalls, products] = await Promise.all([repo.listStalls(), repo.listProducts({ activeOnly: true })]);
  return stalls.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    description: s.description,
    productCount: products.filter((p) => p.stallId === s.id).length,
  }));
}

export function listDeliveryZones() {
  return DELIVERY_ZONES;
}
