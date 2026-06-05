/**
 * MAIAMARI.STUDIO — Günce (journal) seed script'i
 * -----------------------------------------------
 * data/journal.json içindeki mevcut kayıtları journal tablosuna aktarır.
 * Tekrar çalıştırılabilir (ON CONFLICT (slug) DO UPDATE).
 *
 * Çalıştırma:  node scripts/seed-journal.mjs
 * Önce `.env.local` içinde DATABASE_URL dolu olmalı ve tablo oluşturulmuş
 * olmalı (`npm run db:push`).
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

const raw = JSON.parse(
  readFileSync(join(process.cwd(), "data", "journal.json"), "utf-8"),
);

// sortOrder'ı dosya sırasına göre ver (ilk seed). Tekrar çalıştırmada
// ON CONFLICT bunu ve is_published'ı GÜNCELLEMEZ: panelden yönetilen sıralama
// ve yayın durumu korunur (seed-products.mjs ile aynı bilinçli konvansiyon).
const rows = raw.map((p, idx) => ({
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt || "",
  body: p.body || "",
  date: p.date,
  date_label: p.dateLabel || "",
  category: p.category || "",
  location: p.location || "",
  location_url: p.locationUrl || "",
  image: p.image || "",
  image_alt: p.imageAlt || "",
  gallery: JSON.stringify(p.gallery || []),
  instagram_url: p.instagramUrl || "",
  is_published: true,
  sort_order: idx,
}));

const sql = postgres(url, { prepare: false });

let ok = 0;
for (const p of rows) {
  await sql`
    insert into journal (
      slug, title, excerpt, body, date, date_label, category, location,
      location_url, image, image_alt, gallery, instagram_url, is_published, sort_order
    ) values (
      ${p.slug}, ${p.title}, ${p.excerpt}, ${p.body}, ${p.date}, ${p.date_label},
      ${p.category}, ${p.location}, ${p.location_url}, ${p.image}, ${p.image_alt},
      ${p.gallery}::jsonb, ${p.instagram_url}, ${p.is_published}, ${p.sort_order}
    )
    on conflict (slug) do update set
      title = excluded.title,
      excerpt = excluded.excerpt,
      body = excluded.body,
      date = excluded.date,
      date_label = excluded.date_label,
      category = excluded.category,
      location = excluded.location,
      location_url = excluded.location_url,
      image = excluded.image,
      image_alt = excluded.image_alt,
      gallery = excluded.gallery,
      instagram_url = excluded.instagram_url,
      updated_at = now()
  `;
  ok++;
}

console.log(`✓ ${ok} günce kaydı seed edildi.`);
await sql.end();
