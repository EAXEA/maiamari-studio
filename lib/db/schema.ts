/**
 * MAIAMARI.STUDIO — Veritabanı şeması (Drizzle ORM / Postgres)
 * -----------------------------------------------------------
 * Ürünlerin kanonik kaynağı. Admin paneli buraya yazar,
 * vitrin (shop / ürün sayfaları) buradan okur.
 */
import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  // Shopier'den gelen mevcut id'ler korunur; yeni ürünlerde app üretir.
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  /**
   * Kayıt türü:
   *  - "material" → mağaza ürünü (boya, kâğıt, çanta…), şu an satışta.
   *  - "artwork"  → galeri eseri (Duygu Sinan baskısı), künye alanlarıyla.
   * Eserler iyzico sonrası `forSale=true` yapılınca mağazada da satılır.
   */
  kind: text("kind").notNull().default("material"),
  /** Satışa açık mı — eserler için iyzico'ya kadar false kalır. */
  forSale: boolean("for_sale").notNull().default(true),
  /** Fiyat TL cinsinden, kuruş destekli (örn. 294 veya 299.90). */
  priceTry: numeric("price_try", { precision: 10, scale: 2 }).notNull().default("0"),
  /** Üstü çizili / karşılaştırma fiyatı (indirim göstermek için). */
  compareAtTry: numeric("compare_at_try", { precision: 10, scale: 2 }),
  /** Mağaza kategorisi (categories tablosu slug'ı). Eserlerde boş olabilir. */
  categorySlug: text("category_slug").notNull().default(""),
  /** Stok adedi (sayılı edisyon / fiziksel ürün için). */
  stock: integer("stock").notNull().default(0),
  /** in_stock | low_stock | out_of_stock | new | sale — panelden seçilir. */
  status: text("status").notNull().default("in_stock"),
  coverImage: text("cover_image").notNull().default(""),
  gallery: jsonb("gallery").$type<string[]>().notNull().default([]),
  /** Eski Shopier ürün linki (varsa). */
  sourceUrl: text("source_url").notNull().default(""),
  /** Yayında mı — taslak ürünleri vitrinden gizlemek için. */
  isPublished: boolean("is_published").notNull().default(true),
  /** Vitrinde sıralama (küçük önce). */
  sortOrder: integer("sort_order").notNull().default(0),

  // --- Eser künyesi (yalnızca kind="artwork"; arşiv başlık formatı) ---
  /** Galeri serisi slug'ı (kapilar, lord-of, unesco…). */
  seriesSlug: text("series_slug"),
  /** Eserin sanatçısı (artists tablosu slug'ı; çok sanatçılı galeri). */
  artistSlug: text("artist_slug"),
  /** Teknik: "X3- Linolyum Baskı". */
  technique: text("technique"),
  /** Kâğıt: "250 gr Amerikan Bristol". */
  paper: text("paper"),
  /** Ölçü: "50 cm X 70 cm (Kâğıt), 30 cm X 41 cm (Baskı Alanı)". */
  dimensions: text("dimensions"),
  /** Edisyon adedi (1/10..10/10 → 10). */
  editionSize: integer("edition_size"),
  /** Arşivde kayıtlı baskı sayısı (genelde editionSize ile aynı). */
  printCount: integer("print_count"),
  /** İlk seri numarası: "#BASKI-2013-0577". */
  firstSerial: text("first_serial"),
  /** Üretim yılı. */
  year: integer("year"),
  /** Sanatçı adı (varsayılan Duygu Sinan). */
  artist: text("artist").notNull().default("Duygu Sinan"),
  /** Görselin orijinal piksel boyutları — galeri grid'inde aspect korur. */
  imageWidth: integer("image_width"),
  imageHeight: integer("image_height"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Mağaza kategorileri — panelden eklenip düzenlenebilir. */
export const categories = pgTable("categories", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull().default(""),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Galeri sanatçıları — panelden eklenip düzenlenebilir (çok sanatçılı). */
export const artists = pgTable("artists", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull().default(""),
  bio: text("bio").notNull().default(""),
  coverImage: text("cover_image").notNull().default(""),
  instagramHandle: text("instagram_handle").notNull().default(""),
  instagramUrl: text("instagram_url").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Galeri serileri — bir sanatçıya ait; panelden yönetilir. */
export const series = pgTable("series", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  description: text("description").notNull().default(""),
  year: integer("year"),
  yearRange: text("year_range").notNull().default(""),
  coverImage: text("cover_image").notNull().default(""),
  paperNote: text("paper_note").notNull().default(""),
  artistSlug: text("artist_slug").notNull().default("duygu-sinan"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
export type CategoryRow = typeof categories.$inferSelect;
export type NewCategoryRow = typeof categories.$inferInsert;
export type ArtistRow = typeof artists.$inferSelect;
export type NewArtistRow = typeof artists.$inferInsert;
export type SeriesRow = typeof series.$inferSelect;
export type NewSeriesRow = typeof series.$inferInsert;
