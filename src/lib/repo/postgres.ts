import { Pool } from 'pg';
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

type Row = Record<string, unknown>;
const UUID = /^[0-9a-f-]{36}$/i;
const iso = (v: unknown) => new Date(String(v)).toISOString();

/**
 * Repositorio PostgreSQL (Supabase). Todas las consultas están parametrizadas ($1, $2, ...)
 * para evitar inyección SQL. Conexión cifrada por TLS. Al primer uso inserta el catálogo de demostración.
 */
export class PostgresRepository implements Repository {
  private pool: Pool;
  private ready: Promise<void> | null = null;

  constructor(connectionString: string, caPem?: string) {
    this.pool = new Pool({ connectionString, max: 3, ssl: caPem ? { ca: caPem } : true });
  }

  private init(): Promise<void> {
    this.ready ??= this.seed();
    return this.ready;
  }

  private async seed(): Promise<void> {
    const { rows } = await this.pool.query('SELECT count(*)::int AS n FROM stalls');
    if (rows[0].n > 0) return;
    for (const s of SEED_STALLS) {
      await this.pool.query('INSERT INTO stalls (id, name, code, description) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING', [s.id, s.name, s.code, s.description]);
    }
    for (const p of SEED_PRODUCTS) {
      await this.pool.query(
        `INSERT INTO products (id, stall_id, name, category, occasions, description, unit, price_retail, price_wholesale, wholesale_min_qty, stock)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT DO NOTHING`,
        [p.id, p.stallId, p.name, p.category, p.occasions, p.description, p.unit, p.priceRetail, p.priceWholesale, p.wholesaleMinQty, p.stock],
      );
    }
  }

  private async q(text: string, params: unknown[] = []): Promise<Row[]> {
    await this.init();
    return (await this.pool.query(text, params)).rows;
  }

  private toUser(r: Row): User {
    return { id: String(r.id), email: String(r.email), passwordHash: String(r.password_hash), role: r.role as User['role'], name: String(r.name), createdAt: iso(r.created_at) };
  }

  private toStall(r: Row): Stall {
    return { id: String(r.id), name: String(r.name), code: String(r.code), description: String(r.description), ownerId: r.owner_id ? String(r.owner_id) : null };
  }

  private toProduct(r: Row): Product {
    return {
      id: String(r.id),
      stallId: String(r.stall_id),
      name: String(r.name),
      category: r.category as Product['category'],
      occasions: (r.occasions as Product['occasions']) ?? [],
      description: String(r.description),
      unit: r.unit as Product['unit'],
      priceRetail: Number(r.price_retail),
      priceWholesale: Number(r.price_wholesale),
      wholesaleMinQty: Number(r.wholesale_min_qty),
      stock: Number(r.stock),
      active: Boolean(r.active),
    };
  }

  private toOrder(r: Row): Order {
    return {
      id: String(r.id),
      userId: String(r.user_id),
      stallId: String(r.stall_id),
      stallName: String(r.stall_name),
      items: r.items as Order['items'],
      subtotal: Number(r.subtotal),
      deliveryFee: Number(r.delivery_fee),
      total: Number(r.total),
      fulfillment: r.fulfillment as Order['fulfillment'],
      district: r.district ? String(r.district) : null,
      address: r.address ? String(r.address) : null,
      contactName: String(r.contact_name),
      phone: String(r.phone),
      paymentMethod: r.payment_method as Order['paymentMethod'],
      paymentStatus: r.payment_status as Order['paymentStatus'],
      paymentRef: r.payment_ref ? String(r.payment_ref) : null,
      status: r.status as Order['status'],
      history: r.history as Order['history'],
      createdAt: iso(r.created_at),
    };
  }

  async createUser(d: NewUser): Promise<User> {
    try {
      const rows = await this.q('INSERT INTO users (email, password_hash, role, name) VALUES ($1,$2,$3,$4) RETURNING *', [d.email, d.passwordHash, d.role, d.name]);
      return this.toUser(rows[0]);
    } catch (err) {
      if ((err as { code?: string }).code === '23505') throw new HttpError(409, 'El correo ya está registrado');
      throw err;
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const rows = await this.q('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] ? this.toUser(rows[0]) : null;
  }

  async listStalls(): Promise<Stall[]> {
    return (await this.q('SELECT * FROM stalls ORDER BY code')).map((r) => this.toStall(r));
  }

  async getStall(id: string): Promise<Stall | null> {
    if (!UUID.test(id)) return null;
    const rows = await this.q('SELECT * FROM stalls WHERE id = $1', [id]);
    return rows[0] ? this.toStall(rows[0]) : null;
  }

  async findStallByOwner(ownerId: string): Promise<Stall | null> {
    const rows = await this.q('SELECT * FROM stalls WHERE owner_id = $1 LIMIT 1', [ownerId]);
    return rows[0] ? this.toStall(rows[0]) : null;
  }

  async createStall(d: NewStall): Promise<Stall> {
    try {
      const rows = await this.q('INSERT INTO stalls (name, code, description, owner_id) VALUES ($1,$2,$3,$4) RETURNING *', [d.name, d.code, d.description, d.ownerId]);
      return this.toStall(rows[0]);
    } catch (err) {
      if ((err as { code?: string }).code === '23505') throw new HttpError(409, 'Ese número de puesto ya está registrado');
      throw err;
    }
  }

  async listProducts(filter: { stallId?: string; activeOnly?: boolean } = {}): Promise<Product[]> {
    if (filter.stallId && !UUID.test(filter.stallId)) return [];
    const rows = await this.q(
      `SELECT * FROM products
        WHERE ($1::uuid IS NULL OR stall_id = $1)
          AND ($2::boolean IS NOT TRUE OR active)
        ORDER BY name LIMIT 1000`,
      [filter.stallId ?? null, filter.activeOnly ?? false],
    );
    return rows.map((r) => this.toProduct(r));
  }

  async getProduct(id: string): Promise<Product | null> {
    if (!UUID.test(id)) return null;
    const rows = await this.q('SELECT * FROM products WHERE id = $1', [id]);
    return rows[0] ? this.toProduct(rows[0]) : null;
  }

  async createProduct(d: NewProduct): Promise<Product> {
    const rows = await this.q(
      `INSERT INTO products (stall_id, name, category, occasions, description, unit, price_retail, price_wholesale, wholesale_min_qty, stock)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [d.stallId, d.name, d.category, d.occasions, d.description, d.unit, d.priceRetail, d.priceWholesale, d.wholesaleMinQty, d.stock],
    );
    return this.toProduct(rows[0]);
  }

  async updateProduct(id: string, patch: ProductPatch): Promise<Product | null> {
    const current = await this.getProduct(id);
    if (!current) return null;
    const n = { ...current, ...patch };
    const rows = await this.q(
      `UPDATE products SET name=$2, description=$3, price_retail=$4, price_wholesale=$5, wholesale_min_qty=$6, stock=$7, active=$8
        WHERE id=$1 RETURNING *`,
      [id, n.name, n.description, n.priceRetail, n.priceWholesale, n.wholesaleMinQty, n.stock, n.active],
    );
    return rows[0] ? this.toProduct(rows[0]) : null;
  }

  async adjustStock(id: string, delta: number): Promise<Product | null> {
    if (!UUID.test(id)) return null;
    const rows = await this.q('UPDATE products SET stock = stock + $2 WHERE id = $1 AND stock + $2 >= 0 RETURNING *', [id, delta]);
    return rows[0] ? this.toProduct(rows[0]) : null;
  }

  async createOrder(d: NewOrder): Promise<Order> {
    const rows = await this.q(
      `INSERT INTO orders (user_id, stall_id, stall_name, items, subtotal, delivery_fee, total, fulfillment, district, address,
                           contact_name, phone, payment_method, payment_status, payment_ref, status, history)
       VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb) RETURNING *`,
      [d.userId, d.stallId, d.stallName, JSON.stringify(d.items), d.subtotal, d.deliveryFee, d.total, d.fulfillment, d.district, d.address,
       d.contactName, d.phone, d.paymentMethod, d.paymentStatus, d.paymentRef, d.status, JSON.stringify(d.history)],
    );
    return this.toOrder(rows[0]);
  }

  async getOrder(id: string): Promise<Order | null> {
    if (!UUID.test(id)) return null;
    const rows = await this.q('SELECT * FROM orders WHERE id = $1', [id]);
    return rows[0] ? this.toOrder(rows[0]) : null;
  }

  async listOrders(filter: { userId?: string; stallId?: string }): Promise<Order[]> {
    const rows = await this.q(
      `SELECT * FROM orders
        WHERE ($1::uuid IS NULL OR user_id = $1) AND ($2::uuid IS NULL OR stall_id = $2)
        ORDER BY created_at DESC LIMIT 300`,
      [filter.userId ?? null, filter.stallId ?? null],
    );
    return rows.map((r) => this.toOrder(r));
  }

  async updateOrder(id: string, patch: OrderPatch): Promise<Order | null> {
    const current = await this.getOrder(id);
    if (!current) return null;
    const n = { ...current, ...patch };
    const rows = await this.q('UPDATE orders SET status=$2, payment_status=$3, history=$4::jsonb WHERE id=$1 RETURNING *', [id, n.status, n.paymentStatus, JSON.stringify(n.history)]);
    return rows[0] ? this.toOrder(rows[0]) : null;
  }
}
