/**
 * MAIAMARI.STUDIO — Atölye (workshop) seed script'i
 * -------------------------------------------------
 * data/business.json içindeki workshops[] kayıtlarını + lib/workshop-images.ts
 * görsellerini workshops tablosuna aktarır. Slug, site ile birebir aynı
 * üretilir (lib/data.ts slugify). Tekrar çalıştırılabilir (ON CONFLICT DO UPDATE);
 * sort_order ve is_published panelden yönetilir, seed bunları KORUR.
 *
 * Çalıştırma:  node scripts/seed-workshops.mjs
 * Önce `.env.local` içinde DATABASE_URL dolu + tablo oluşturulmuş olmalı.
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

// lib/data.ts slugify ile birebir (Türkçe duyarlı).
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

// lib/workshop-images.ts ile birebir kopya (seed bağımsız çalışsın diye).
const IMAGES = {
  "suluboya-aylik-program": {
    src: "/images/atolye/watercolor-framed.jpg",
    alt: "Suluboya · zeytin dalı, Duygu Sinan tarafından çerçeveli bir çalışma",
  },
  "linol-baski-workshop": {
    src: "/images/atolye/linol-workshop.jpg",
    alt: "Linol baskı · oyulmuş kalıp ve taze basılmış kare yan yana",
  },
  "linol-aylik-ders": {
    src: "/images/atolye/print-drying.jpg",
    alt: "Linol aylık ders · taze baskıların atölyede kurutulması",
  },
  "canta-baski-workshop": {
    src: "/images/atolye/tools-grid.jpg",
    alt: "Çanta baskı · atölyedeki alet ve malzeme düzeni",
  },
  "el-yapimi-kagit-workshop": {
    src: "/images/atolye/window-and-press.jpg",
    alt: "El yapımı kâğıt · atölye penceresinden pres ve çalışma alanı",
  },
};

const biz = JSON.parse(
  readFileSync(join(process.cwd(), "data", "business.json"), "utf-8"),
);

const rows = (biz.workshops || []).map((w, idx) => {
  const slug = slugify(w.title) || `workshop-${idx}`;
  const img = IMAGES[slug] || {};
  return {
    slug,
    title: w.title,
    instructor: w.instructor || "",
    instructor_instagram_handle: w.instructorInstagramHandle || "",
    instructor_instagram_url: w.instructorInstagramUrl || "",
    schedule: w.schedule || "",
    description: w.description || "",
    image: w.image || img.src || "",
    image_alt: img.alt || "",
    price_try: w.priceTRY != null ? String(w.priceTRY) : null,
    sort_order: idx,
  };
});

const sql = postgres(url, { prepare: false });

let ok = 0;
for (const w of rows) {
  await sql`
    insert into workshops (
      slug, title, instructor, instructor_instagram_handle, instructor_instagram_url,
      schedule, description, image, image_alt, price_try, is_published, sort_order
    ) values (
      ${w.slug}, ${w.title}, ${w.instructor}, ${w.instructor_instagram_handle},
      ${w.instructor_instagram_url}, ${w.schedule}, ${w.description}, ${w.image},
      ${w.image_alt}, ${w.price_try}, true, ${w.sort_order}
    )
    on conflict (slug) do update set
      title = excluded.title,
      instructor = excluded.instructor,
      instructor_instagram_handle = excluded.instructor_instagram_handle,
      instructor_instagram_url = excluded.instructor_instagram_url,
      schedule = excluded.schedule,
      description = excluded.description,
      image = excluded.image,
      image_alt = excluded.image_alt,
      price_try = excluded.price_try,
      updated_at = now()
  `;
  ok++;
}

console.log(`✓ ${ok} atölye seed edildi.`);
await sql.end();
