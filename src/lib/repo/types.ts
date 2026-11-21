import type { Role } from '../auth';
import type { Category, Occasion, Unit } from '../data/catalog';
import type { Fulfillment, OrderStatus } from '../domain/orderFlow';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  name: string;
  createdAt: string;
}

export interface Stall {
  id: string;
  name: string;
  code: string;
  description: string;
  ownerId: string | null;
}

export interface Product {
  id: string;
  stallId: string;
  name: string;
  category: Category;
  occasions: Occasion[];
  description: string;
  unit: Unit;
  priceRetail: number;
  priceWholesale: number;
  wholesaleMinQty: number;
  stock: number;
  active: boolean;
  /** Foto del producto como data URL (JPEG/PNG/WebP reducida en el navegador); null = sin foto. */
  imageUrl: string | null;
}

export type PaymentMethod = 'yape' | 'plin' | 'tarjeta' | 'contraentrega';
export type PaymentStatus = 'pendiente' | 'pagado' | 'reembolsado';

export interface OrderItem {
  productId: string;
  name: string;
  unit: Unit;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  userId: string;
  stallId: string;
  stallName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  fulfillment: Fulfillment;
  district: string | null;
  address: string | null;
  contactName: string;
  phone: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentRef: string | null;
  status: OrderStatus;
  history: { status: OrderStatus; at: string }[];
  createdAt: string;
}

export type NewUser = Pick<User, 'email' | 'passwordHash' | 'role' | 'name'>;
export type NewStall = Omit<Stall, 'id'>;
export type NewProduct = Omit<Product, 'id' | 'active'>;
export type ProductPatch = Partial<
  Pick<Product, 'name' | 'description' | 'priceRetail' | 'priceWholesale' | 'wholesaleMinQty' | 'stock' | 'active'>
>;
export type NewOrder = Omit<Order, 'id' | 'createdAt'>;
export type OrderPatch = Partial<Pick<Order, 'status' | 'paymentStatus' | 'history'>>;

/** Patrón Repository: la lógica de negocio no depende de dónde se persisten los datos. */
export interface Repository {
  createUser(data: NewUser): Promise<User>;
  findUserByEmail(email: string): Promise<User | null>;

  listStalls(): Promise<Stall[]>;
  getStall(id: string): Promise<Stall | null>;
  findStallByOwner(ownerId: string): Promise<Stall | null>;
  createStall(data: NewStall): Promise<Stall>;

  listProducts(filter?: { stallId?: string; activeOnly?: boolean }): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  createProduct(data: NewProduct): Promise<Product>;
  updateProduct(id: string, patch: ProductPatch): Promise<Product | null>;
  /** Ajusta el stock de forma atómica; devuelve null si no existe o si quedaría negativo. */
  adjustStock(id: string, delta: number): Promise<Product | null>;

  createOrder(data: NewOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | null>;
  listOrders(filter: { userId?: string; stallId?: string }): Promise<Order[]>;
  updateOrder(id: string, patch: OrderPatch): Promise<Order | null>;
}
