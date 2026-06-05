// Galeri çok-sanatçı modeli: artists + series tablolarını kurar (idempotent),
// Duygu Sinan'ı seed eder, series.json'u taşır, mevcut eserlere artist_slug atar.
// db:push interaktif takıldığı için DDL doğrudan SQL ile yapılır.
import postgres from "postgres";
import { readFileSync } from "node:fs";
import { config } from "dotenv";
config({ path: ".env.local" });

const seriesData = JSON.parse(readFileSync("data/series.json", "utf-8"));
const business = JSON.parse(readFileSync("data/business.json", "utf-8"));
const artist = business.artist ?? {};
const ARTIST_SLUG = "duygu-sinan";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

try {
  // --- DDL ---
  await sql`
    create table if not exists artists (
      slug text primary key,
      name text not null,
      title text not null default '',
      bio text not null default '',
      cover_image text not null default '',
      instagram_handle text not null default '',
      instagram_url text not null default '',
      sort_order integer not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;
  await sql`
    create table if not exists series (
      slug text primary key,
      title text not null,
      subtitle text not null default '',
      description text not null default '',
      year integer,
      year_range text not null default '',
      cover_image text not null default '',
      paper_note text not null default '',
      artist_slug text not null default 'duygu-sinan',
      sort_order integer not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;
  await sql`alter table products add column if not exists artist_slug text`;

  // --- Sanatçı: Duygu Sinan ---
  await sql`
    insert into artists (slug, name, title, bio, instagram_handle, instagram_url, sort_order)
    values (
      ${ARTIST_SLUG}, ${artist.name ?? "Duygu Sinan"}, ${artist.title ?? ""},
      ${artist.note ?? ""}, ${artist.instagramHandle ?? ""}, ${artist.instagramUrl ?? ""}, 0
    )
    on conflict (slug) do update set
      name = excluded.name, title = excluded.title,
      instagram_handle = excluded.instagram_handle, instagram_url = excluded.instagram_url,
      updated_at = now()
  `;

  // --- Seriler ---
  let i = 0;
  for (const s of seriesData) {
    await sql`
      insert into series (slug, title, subtitle, description, year, year_range, cover_image, paper_note, artist_slug, sort_order)
      values (
        ${s.slug}, ${s.title}, ${s.subtitle ?? ""}, ${s.description ?? ""},
        ${s.year ?? null}, ${s.yearRange ?? ""}, ${s.coverImage ?? ""}, ${s.paperNote ?? ""},
        ${ARTIST_SLUG}, ${i}
      )
      on conflict (slug) do update set
        title = excluded.title, subtitle = excluded.subtitle, description = excluded.description,
        year = excluded.year, year_range = excluded.year_range, cover_image = excluded.cover_image,
        paper_note = excluded.paper_note, artist_slug = excluded.artist_slug,
        sort_order = excluded.sort_order, updated_at = now()
    `;
    i++;
  }

  // --- Eserlere sanatçı ata ---
  await sql`update products set artist_slug = ${ARTIST_SLUG} where kind = 'artwork' and (artist_slug is null or artist_slug = '')`;

  const [{ ac }] = await sql`select count(*)::int as ac from artists`;
  const [{ sc }] = await sql`select count(*)::int as sc from series`;
  const [{ wc }] = await sql`select count(*)::int as wc from products where kind='artwork' and artist_slug = ${ARTIST_SLUG}`;
  console.log(`Sanatçı: ${ac}, Seri: ${sc}, Sanatçısı atanan eser: ${wc}`);
} catch (e) {
  console.error("HATA:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
