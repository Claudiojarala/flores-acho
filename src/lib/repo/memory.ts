import { randomUUID } from 'node:crypto';
import { HttpError } from '../errors';
import { SEED_PRODUCTS, SEED_STALLS } from '../data/catalog';
import type {
  NewOrder,
  NewProduct,
  NewStall,
  NewUser,
  Order,
  OrderPatch,
  Product,
  ProductPatch,
  Repository,
  Stall,
  User,
} from './types';

/** Repositorio en memoria: modo demo y pruebas (los datos se pierden al reiniciar). */
export class MemoryRepository implements Repository {
  private users = new Map<string, User>();
  private stalls = new Map<string, Stall>();
  private products = new Map<string, Product>();
  private orders = new Map<string, Order>();

  constructor(options: { seed?: boolean } = {}) {
    if (options.seed) {
      for (const s of SEED_STALLS) this.stalls.set(s.id, { ...s, ownerId: null });
      for (const p of SEED_PRODUCTS) this.products.set(p.id, { ...p, active: true, imageUrl: null });
    }
  }

  async createUser(data: NewUser): Promise<User> {
    for (const u of this.users.values()) {
      if (u.email === data.email) throw new HttpError(409, 'El correo ya está registrado');
    }
    const user: User = { id: randomUUID(), ...data, createdAt: new Date().toISOString() };
    this.users.set(user.id, user);
    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    for (const u of this.users.values()) if (u.email === email) return u;
    return null;
  }

  async listStalls(): Promise<Stall[]> {
    return [...this.stalls.values()].sort((a, b) => a.code.localeCompare(b.code));
  }

  async getStall(id: string): Promise<Stall | null> {
    return this.stalls.get(id) ?? null;
  }

  async findStallByOwner(ownerId: string): Promise<Stall | null> {
    for (const s of this.stalls.values()) if (s.ownerId === ownerId) return s;
    return null;
  }

  async createStall(data: NewStall): Promise<Stall> {
    for (const s of this.stalls.values()) {
      if (s.code.toLowerCase() === data.code.toLowerCase()) throw new HttpError(409, 'Ese número de puesto ya está registrado');
    }
    const stall: Stall = { id: randomUUID(), ...data };
    this.stalls.set(stall.id, stall);
    return stall;
  }

  async listProducts(filter: { stallId?: string; activeOnly?: boolean } = {}): Promise<Product[]> {
    return [...this.products.values()]
      .filter((p) => (filter.stallId ? p.stallId === filter.stallId : true))
      .filter((p) => (filter.activeOnly ? p.active : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getProduct(id: string): Promise<Product | null> {
    return this.products.get(id) ?? null;
  }

  async createProduct(data: NewProduct): Promise<Product> {
    const product: Product = { ...data, imageUrl: data.imageUrl ?? null, id: randomUUID(), active: true };
    this.products.set(product.id, product);
    return product;
  }

  async updateProduct(id: string, patch: ProductPatch): Promise<Product | null> {
    const current = this.products.get(id);
    if (!current) return null;
    const updated = { ...current, ...patch };
    this.products.set(id, updated);
    return updated;
  }

  async adjustStock(id: string, delta: number): Promise<Product | null> {
    const current = this.products.get(id);
    if (!current || current.stock + delta < 0) return null;
    const updated = { ...current, stock: current.stock + delta };
    this.products.set(id, updated);
    return updated;
  }

  async createOrder(data: NewOrder): Promise<Order> {
    const order: Order = { ...data, id: randomUUID(), createdAt: new Date().toISOString() };
    this.orders.set(order.id, order);
    return order;
  }

  async getOrder(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }

  async listOrders(filter: { userId?: string; stallId?: string }): Promise<Order[]> {
    return [...this.orders.values()]
      .filter((o) => (filter.userId ? o.userId === filter.userId : true))
      .filter((o) => (filter.stallId ? o.stallId === filter.stallId : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async updateOrder(id: string, patch: OrderPatch): Promise<Order | null> {
    const current = this.orders.get(id);
    if (!current) return null;
    const updated = { ...current, ...patch };
    this.orders.set(id, updated);
    return updated;
  }
}
