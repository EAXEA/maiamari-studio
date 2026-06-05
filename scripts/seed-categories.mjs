// Mevcut 6 statik kategoriyi categories tablosuna yazar (idempotent).
import postgres from "postgres";
import { config } from "dotenv";
config({ path: ".env.local" });

const CATEGORIES = [
  { slug: "linol-boyalari", name: "Linol Boyaları", nameEn: "Block Printing Inks", description: "Amber cam kavanozda, su bazlı linol baskı boyaları." },
  { slug: "linolyum", name: "Linolyum Plaka", nameEn: "Linoleum Blocks", description: "A4 ve A5 ebatında, oyma için hazır linolyum plakalar." },
  { slug: "merdaneler", name: "Merdaneler", nameEn: "Brayers", description: "1, 2 ve 3 cm kauçuk merdane seçenekleri." },
  { slug: "el-yapimi-kagitlar", name: "El Yapımı Kâğıtlar", nameEn: "Handmade Papers", description: "Doğal liflerden el yapımı kâğıtlar. Bir kısmı atölyenin kendi üretimi, bir kısmı özenle seçilen tedariktir." },
  { slug: "aletler", name: "Aletler", nameEn: "Tools", description: "Oyma bıçakları, kayıt pinleri ve yardımcı el aletleri." },
  { slug: "cantalar", name: "Çantalar", nameEn: "Bags", description: "Duygu Sinan'ın elden tasarlayıp diktiği kanvas ve puffer kitap çantaları. Kumaş ve baskılar dışarıdan tedarik edilir; tasarım ve dikim sanatçıya aittir. Hediyelik olarak önerilir." },
];

const sql = postgres(process.env.DATABASE_URL, { prepare: false });
try {
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i];
    await sql`
      insert into categories (slug, name, name_en, description, sort_order)
      values (${c.slug}, ${c.name}, ${c.nameEn}, ${c.description}, ${i})
      on conflict (slug) do update set
        name = excluded.name,
        name_en = excluded.name_en,
        description = excluded.description,
        sort_order = excluded.sort_order,
        updated_at = now()
    `;
  }
  const [{ count }] = await sql`select count(*)::int as count from categories`;
  console.log(`Kategoriler seed edildi. Toplam: ${count}`);
} catch (e) {
  console.error("HATA:", e.message);
} finally {
  await sql.end();
}
