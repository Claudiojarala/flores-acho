import type { Category, Occasion } from './data/catalog';
import type { DeliveryZone } from './data/zones';
import type { Order, Product, Stall } from './repo/types';

export type Role = 'cliente' | 'comerciante';
export type TabId = 'catalogo' | 'puestos' | 'carrito' | 'pedidos' | 'panel';

export interface Session {
  token: string;
  user: { id: string; email: string; role: Role; name: string; stallId: string | null };
}

export type ProductView = Product & { stallName: string; stallCode: string };
export type StallView = Pick<Stall, 'id' | 'name' | 'code' | 'description'> & { productCount: number };
export type OrderView = Omit<Order, 'userId'>;
export type { DeliveryZone };

export interface SalesSummary {
  orders: number;
  pending: number;
  delivered: number;
  revenue: number;
}

export interface MerchantData {
  stall: Stall;
  products: Product[];
  summary: SalesSummary;
}

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface ProductFilters {
  q: string;
  category: Category | '';
  occasion: Occasion | '';
  stallId: string;
  maxPrice: string;
  inStock: boolean;
}

export const EMPTY_FILTERS: ProductFilters = { q: '', category: '', occasion: '', stallId: '', maxPrice: '', inStock: false };

export type PaymentForm =
  | { method: 'yape' | 'plin'; phone: string }
  | { method: 'tarjeta'; cardNumber: string; expiry: string; cvv: string }
  | { method: 'contraentrega' };

export interface CheckoutForm {
  fulfillment: 'recojo' | 'delivery';
  district: string;
  address: string;
  contactName: string;
  phone: string;
  payment: PaymentForm;
}
