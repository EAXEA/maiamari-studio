/**
 * scripts/create-orders-tables.mjs — `orders` + `order_items` tablolarını
 * canlı Supabase'de CERRAHİ oluşturur (CREATE TABLE IF NOT EXISTS; mevcut
 * tablolara DOKUNMAZ). Drizzle schema.ts ile birebir. drizzle-kit push
 * bilinçli KULLANILMAZ (canlı şema drift riski; konvansiyon).
 *
 * Kullanım: node scripts/create-orders-tables.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined)
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL bulunamadı (.env.local).");
  process.exit(1);
}

const ORDERS = `
CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY,
  order_no text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  buyer_name text NOT NULL DEFAULT '',
  buyer_email text NOT NULL DEFAULT '',
  buyer_phone text NOT NULL DEFAULT '',
  address_line text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  total_try numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'TRY',
  payment_provider text NOT NULL DEFAULT '',
  payment_id text,
  payment_token text,
  conversation_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`;

const ORDER_ITEMS = `
CREATE TABLE IF NOT EXISTS order_items (
  id text PRIMARY KEY,
  order_id text NOT NULL,
  product_id text NOT NULL,
  slug text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  unit_price_try numeric(10,2) NOT NULL DEFAULT 0,
  qty integer NOT NULL DEFAULT 1,
  line_total_try numeric(10,2) NOT NULL DEFAULT 0
);`;

const INDEX = `CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);`;

const client = postgres(url, { prepare: false, max: 1, idle_timeout: 5 });
try {
  await client.unsafe(ORDERS);
  await client.unsafe(ORDER_ITEMS);
  await client.unsafe(INDEX);
  const cols = await client.unsafe(
    `SELECT table_name, count(*) AS n FROM information_schema.columns
     WHERE table_name IN ('orders','order_items') GROUP BY table_name ORDER BY table_name`,
  );
  console.log("OK — tablolar hazır:");
  console.table(cols);
} catch (e) {
  console.error("Hata:", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
