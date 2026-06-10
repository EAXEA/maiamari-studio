/**
 * MAIAMARI.STUDIO — DB → JSON snapshot (build fallback tazeleme)
 * --------------------------------------------------------------
 * NEDEN: Build sırasında DB bilinçli kapalıdır (lib/db/client.ts NEXT_PHASE
 * skip; pooler tıkanmasın) ve tüm sayfalar JSON fallback'ten prerender edilir.
 * Yalnız-DB alanları (fiyat, soldOut, panelden eklenen kayıtlar...) fallback
 * dosyalarında yoksa her deploy sonrası ISR penceresi kadar eski içerik
 * görünür. Bu script DB'nin güncel halini data/snapshot/*.json'a yazar;
 * lib/data.ts fallback zinciri DB → snapshot → legacy sırasıyla okur.
 *
 * Çalıştırma: npm run db:snapshot  (release öncesi; çıktı COMMIT EDİLİR)
 * Yalnız SELECT yapar; DB'ye yazmaz. Shape'ler lib/db/* mapper'larıyla
 * birebir aynı tutulmalıdır (toProduct/toPortfolioWork/toSeries/...).
 */
import { config } from "dotenv";
import postgres from "postgres";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("HATA: .env.local içinde DATABASE_URL tanımlı değil.");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1 });
const OUT = join(process.cwd(), "data", "snapshot");

/** Boş/null string → undefined (JSON.stringify alanı düşürür). */
const orUndef = (s) => {
  const v = s == null ? "" : String(s);
  return v.trim() ? v : undefined;
};

/**
 * jsonb dizi normalizasyonu. İlk seed bazı satırlara diziyi ÇİFT-ENCODE yazdı
 * (jsonb string scalar); Drizzle okurken string'i parse ederek düzeltiyor,
 * ham postgres-js etmiyor — burada aynı düzeltmeyi yapıyoruz.
 */
const asArray = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
};

/** lib/db/products.ts deriveBadges ile birebir. */
function deriveBadges(row) {
  const price = Number(row.price_try);
  const compareAt = row.compare_at_try == null ? null : Number(row.compare_at_try);
  const badges = [];
  if (row.status === "out_of_stock") badges.push("Tükendi");
  else if (row.status === "low_stock") badges.push("Son ürün");
  if (row.status === "new") badges.push("Yeni");
  if (row.status === "sale" || (compareAt !== null && compareAt > price))
    badges.push("İndirim");
  return badges;
}

function writeJson(name, data) {
  writeFileSync(join(OUT, name), JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`  ${name}: ${data.length} kayıt`);
}

try {
  mkdirSync(OUT, { recursive: true });
  console.log("DB → data/snapshot/ yazılıyor:");

  // Ürünler (vitrin kümesi: yayında + satışta + materyal) — toProduct shape.
  const productRows = await sql`
    select * from products
    where is_published = true and for_sale = true and kind = 'material'
    order by sort_order asc, title asc`;
  writeJson(
    "products.json",
    productRows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      priceTRY: Number(r.price_try),
      compareAtTRY: r.compare_at_try == null ? null : Number(r.compare_at_try),
      status: r.status,
      statuses: deriveBadges(r),
      categorySlug: r.category_slug,
      coverImage: r.cover_image || "/images/placeholder.jpg",
      gallery: asArray(r.gallery),
      sourceUrl: r.source_url,
    })),
  );

  // Galeri eserleri (yayında olan tüm seriler) — toPortfolioWork shape.
  const artworkRows = await sql`
    select * from products
    where is_published = true and kind = 'artwork'
    order by sort_order asc, title asc`;
  writeJson(
    "portfolio.json",
    artworkRows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      image: r.cover_image || "/images/placeholder.jpg",
      width: r.image_width ?? undefined,
      height: r.image_height ?? undefined,
      year: r.year ?? undefined,
      series: r.series_slug ?? undefined,
      technique: orUndef(r.technique),
      paper: orUndef(r.paper),
      dimensions: orUndef(r.dimensions),
      editionSize: r.edition_size ?? undefined,
      printCount: r.print_count ?? r.edition_size ?? undefined,
      firstSerial: orUndef(r.first_serial),
      artist: orUndef(r.artist),
      forSale: r.for_sale,
      priceTRY: r.price_try != null ? Number(r.price_try) : undefined,
      compareAtTRY: r.compare_at_try != null ? Number(r.compare_at_try) : null,
      soldOut: r.status === "out_of_stock",
    })),
  );

  // Seriler — toSeries shape.
  const seriesRows = await sql`
    select * from series order by sort_order asc, title asc`;
  writeJson(
    "series.json",
    seriesRows.map((r) => ({
      slug: r.slug,
      title: r.title,
      subtitle: orUndef(r.subtitle),
      year: r.year ?? undefined,
      yearRange: orUndef(r.year_range),
      description: r.description,
      coverImage: orUndef(r.cover_image),
      paperNote: orUndef(r.paper_note),
      artistSlug: r.artist_slug,
    })),
  );

  // Sanatçılar — toArtist shape.
  const artistRows = await sql`
    select * from artists order by sort_order asc, name asc`;
  writeJson(
    "artists.json",
    artistRows.map((r) => ({
      slug: r.slug,
      name: r.name,
      title: orUndef(r.title),
      bio: orUndef(r.bio),
      coverImage: orUndef(r.cover_image),
      instagramHandle: orUndef(r.instagram_handle),
      instagramUrl: orUndef(r.instagram_url),
    })),
  );

  // Kategoriler — toCategory shape.
  const categoryRows = await sql`
    select * from categories order by sort_order asc, name asc`;
  writeJson(
    "categories.json",
    categoryRows.map((r) => ({
      slug: r.slug,
      name: r.name,
      nameEn: r.name_en,
      description: r.description,
    })),
  );

  // Atölyeler (yayında) — toWorkshop shape.
  const workshopRows = await sql`
    select * from workshops where is_published = true order by sort_order asc`;
  writeJson(
    "workshops.json",
    workshopRows.map((r) => ({
      slug: r.slug,
      title: r.title,
      instructor: r.instructor,
      instructorInstagramHandle: orUndef(r.instructor_instagram_handle),
      instructorInstagramUrl: orUndef(r.instructor_instagram_url),
      schedule: orUndef(r.schedule),
      description: orUndef(r.description),
      priceTRY: r.price_try != null ? Number(r.price_try) : null,
      image: orUndef(r.image),
      imageAlt: orUndef(r.image_alt),
    })),
  );

  // Günce (yayında, tarih azalan) — toJournalPost shape.
  const journalRows = await sql`
    select * from journal where is_published = true
    order by date desc, sort_order asc`;
  writeJson(
    "journal.json",
    journalRows.map((r) => ({
      slug: r.slug,
      title: r.title,
      excerpt: r.excerpt,
      body: orUndef(r.body),
      date: r.date,
      dateLabel: orUndef(r.date_label),
      category: orUndef(r.category),
      location: orUndef(r.location),
      locationUrl: orUndef(r.location_url),
      image: orUndef(r.image),
      imageAlt: orUndef(r.image_alt),
      gallery: asArray(r.gallery).length ? asArray(r.gallery) : undefined,
      instagramUrl: orUndef(r.instagram_url),
    })),
  );

  console.log("Tamam. Çıktıyı commit etmeyi unutma (build fallback'i bu dosyalar).");
} finally {
  await sql.end();
}
