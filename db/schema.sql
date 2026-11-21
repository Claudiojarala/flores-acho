-- Mercado de Flores de Acho: esquema PostgreSQL (Supabase). Ejecutar en el SQL Editor de Supabase.
-- El catálogo de demostración (puestos y productos) se inserta automáticamente al primer arranque de la API.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role          text NOT NULL CHECK (role IN ('cliente','comerciante')),
  name          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stalls (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  code        text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  owner_id    uuid REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS products (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stall_id          uuid NOT NULL REFERENCES stalls(id) ON DELETE CASCADE,
  name              text NOT NULL,
  category          text NOT NULL CHECK (category IN ('rosas','girasoles','claveles','crisantemos','arreglos','coronas','plantas')),
  occasions         text[] NOT NULL DEFAULT '{}',
  description       text NOT NULL DEFAULT '',
  unit              text NOT NULL CHECK (unit IN ('docena','unidad','arreglo','corona','maceta')),
  price_retail      numeric(10,2) NOT NULL CHECK (price_retail > 0),
  price_wholesale   numeric(10,2) NOT NULL CHECK (price_wholesale > 0),
  wholesale_min_qty integer NOT NULL CHECK (wholesale_min_qty >= 2),
  stock             integer NOT NULL CHECK (stock >= 0),
  active            boolean NOT NULL DEFAULT true,
  image_url         text,
  CHECK (price_wholesale <= price_retail)
);
CREATE INDEX IF NOT EXISTS products_stall_idx ON products (stall_id);

CREATE TABLE IF NOT EXISTS orders (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stall_id       uuid NOT NULL REFERENCES stalls(id) ON DELETE CASCADE,
  stall_name     text NOT NULL,
  items          jsonb NOT NULL,
  subtotal       numeric(10,2) NOT NULL,
  delivery_fee   numeric(10,2) NOT NULL DEFAULT 0,
  total          numeric(10,2) NOT NULL,
  fulfillment    text NOT NULL CHECK (fulfillment IN ('recojo','delivery')),
  district       text,
  address        text,
  contact_name   text NOT NULL,
  phone          text NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('yape','plin','tarjeta','contraentrega')),
  payment_status text NOT NULL CHECK (payment_status IN ('pendiente','pagado','reembolsado')),
  payment_ref    text,
  status         text NOT NULL CHECK (status IN ('pendiente','preparando','en_camino','listo_recojo','entregado','cancelado')),
  history        jsonb NOT NULL DEFAULT '[]',
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_user_idx  ON orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_stall_idx ON orders (stall_id, created_at DESC);

-- Seguridad: con RLS activo y sin políticas, la API pública de Supabase (clave anon)
-- no puede leer ni escribir; solo accede el backend con la cadena de conexión privada.
-- Nunca se guardan datos de tarjeta: solo método, estado y referencia de la operación.
ALTER TABLE users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE stalls   ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders   ENABLE ROW LEVEL SECURITY;
