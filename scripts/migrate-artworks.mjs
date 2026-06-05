// data/portfolio.json'daki 56 arşiv eserini products tablosuna kind="artwork"
// olarak taşır (idempotent: id çakışırsa günceller). Eserler forSale=false
// (iyzico'ya kadar satışta değil), galeride gösterilir.
import postgres from "postgres";
import { readFileSync } from "node:fs";
import { config } from "dotenv";
config({ path: ".env.local" });

const works = JSON.parse(readFileSync("data/portfolio.json", "utf-8"));
const sql = postgres(process.env.DATABASE_URL, { prepare: false });

try {
  let i = 0;
  for (const w of works) {
    await sql`
      insert into products (
        id, slug, title, description, kind, for_sale,
        price_try, category_slug, stock, status,
        cover_image, gallery, source_url, is_published, sort_order,
        series_slug, technique, paper, dimensions,
        edition_size, print_count, first_serial, year, artist,
        image_width, image_height
      ) values (
        ${w.id}, ${w.slug}, ${w.title}, ${w.description ?? ""}, 'artwork', false,
        '0', '', 0, 'in_stock',
        ${w.image ?? ""}, ${sql.json([])}, '', true, ${i},
        ${w.series ?? "kapilar"}, ${w.technique ?? null}, ${w.paper ?? null}, ${w.dimensions ?? null},
        ${w.editionSize ?? null}, ${w.printCount ?? null}, ${w.firstSerial ?? null}, ${w.year ?? null}, ${w.artist ?? "Duygu Sinan"},
        ${w.width ?? null}, ${w.height ?? null}
      )
      on conflict (id) do update set
        slug = excluded.slug,
        title = excluded.title,
        description = excluded.description,
        kind = 'artwork',
        for_sale = false,
        cover_image = excluded.cover_image,
        is_published = true,
        sort_order = excluded.sort_order,
        series_slug = excluded.series_slug,
        technique = excluded.technique,
        paper = excluded.paper,
        dimensions = excluded.dimensions,
        edition_size = excluded.edition_size,
        print_count = excluded.print_count,
        first_serial = excluded.first_serial,
        year = excluded.year,
        artist = excluded.artist,
        image_width = excluded.image_width,
        image_height = excluded.image_height,
        updated_at = now()
    `;
    i++;
  }

  const [{ ac }] = await sql`select count(*)::int as ac from products where kind = 'artwork'`;
  const bySeries = await sql`select series_slug, count(*)::int as c from products where kind='artwork' group by series_slug order by series_slug`;
  console.log(`Taşınan eser: ${i}. DB'deki toplam eser: ${ac}`);
  console.log("Seri bazında:", bySeries.map((r) => `${r.series_slug}:${r.c}`).join("  "));
} catch (e) {
  console.error("HATA:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
