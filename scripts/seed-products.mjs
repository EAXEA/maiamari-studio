/**
 * MAIAMARI.STUDIO — Ürün seed script'i
 * -------------------------------------
 * data/products_full.json içindeki mevcut 57 ürünü Postgres'e aktarır.
 * Tekrar çalıştırılabilir (ON CONFLICT (id) DO UPDATE).
 *
 * Çalıştırma:  node scripts/seed-products.mjs
 * Önce `.env.local` içinde DATABASE_URL dolu olmalı ve tablo oluşturulmuş olmalı
 * (`npm run db:push`).
 */
import { config } from "dotenv";
import postgres from "postgres";
import { readFileSync } from "node:fs";
import { join } from "node:path";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("HATA: .env.local içinde DATABASE_URL tanımlı değil.");
  process.exit(1);
}

// --- data.ts ile aynı yardımcılar ---
function slugify(s) {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/â|ä/g, "a")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ğ/g, "g")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function classify(title) {
  const t = title.toLocaleLowerCase("tr-TR");
  if (t.includes("boyas") || t.includes("boyası") || t.includes("baskı boyas")) return "linol-boyalari";
  if (t.includes("linolyum")) return "linolyum";
  if (t.includes("merdane")) return "merdaneler";
  if (t.includes("kâğıt") || t.includes("kagit") || t.includes("kâğit")) return "el-yapimi-kagitlar";
  if (t.includes("bıça") || t.includes("bica") || t.includes("oyma") || t.includes("essdee") ||
      t.includes("esdee") || t.includes("pin") || t.includes("kalem") || t.includes("şerit") || t.includes("strip"))
    return "aletler";
  if (t.includes("çanta") || t.includes("canta")) return "cantalar";
  return "aletler";
}

function deriveStatus(statuses) {
  if (statuses.some((s) => /tükendi/i.test(s))) return "out_of_stock";
  if (statuses.some((s) => /son ürün/i.test(s))) return "low_stock";
  if (statuses.some((s) => /yeni/i.test(s))) return "new";
  if (statuses.some((s) => /indirim/i.test(s))) return "sale";
  return "in_stock";
}

const raw = JSON.parse(
  readFileSync(join(process.cwd(), "data", "products_full.json"), "utf-8"),
);

const used = new Set();
const rows = raw.map((r, idx) => {
  const fullTitle = (r.title_full || r.title).trim();
  const base = slugify(fullTitle);
  let slug = base;
  let i = 2;
  while (used.has(slug)) slug = `${base}-${i++}`;
  used.add(slug);

  const localImgs = (r.localImages || []).map((p) => "/" + p.replace(/^data\//, ""));
  const cover = localImgs[0] || "/images/placeholder.jpg";
  const statuses = r.statuses || [];
  const status = deriveStatus(statuses);

  return {
    id: String(r.id),
    slug,
    title: fullTitle,
    description: (r.description || "").trim(),
    price_try: r.priceTRY ?? 0,
    compare_at_try: r.compareAtTRY ?? null,
    category_slug: classify(fullTitle),
    stock: status === "out_of_stock" ? 0 : status === "low_stock" ? 1 : 10,
    status,
    cover_image: cover,
    gallery: JSON.stringify(localImgs),
    source_url: r.url || "",
    is_published: true,
    sort_order: idx,
  };
});

const sql = postgres(url, { prepare: false });

let ok = 0;
for (const p of rows) {
  await sql`
    insert into products (
      id, slug, title, description, price_try, compare_at_try, category_slug,
      stock, status, cover_image, gallery, source_url, is_published, sort_order
    ) values (
      ${p.id}, ${p.slug}, ${p.title}, ${p.description}, ${p.price_try}, ${p.compare_at_try},
      ${p.category_slug}, ${p.stock}, ${p.status}, ${p.cover_image}, ${p.gallery}::jsonb,
      ${p.source_url}, ${p.is_published}, ${p.sort_order}
    )
    on conflict (id) do update set
      slug = excluded.slug,
      title = excluded.title,
      description = excluded.description,
      price_try = excluded.price_try,
      compare_at_try = excluded.compare_at_try,
      category_slug = excluded.category_slug,
      cover_image = excluded.cover_image,
      gallery = excluded.gallery,
      source_url = excluded.source_url,
      updated_at = now()
  `;
  ok++;
}

console.log(`✓ ${ok} ürün seed edildi.`);
await sql.end();
