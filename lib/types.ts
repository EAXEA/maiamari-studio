/**
 * MAIAMARI.STUDIO — Data model types
 */

export type CategorySlug =
  | "linol-boyalari"        // İnks
  | "linolyum"              // Linol blocks
  | "merdaneler"            // Brayers
  | "el-yapimi-kagitlar"    // Handmade paper
  | "aletler"               // Tools (carving knife, registration pin, pen)
  | "cantalar";             // Bags

export interface Category {
  slug: CategorySlug;
  name: string;
  nameEn: string;
  description: string;
}

export type ProductStatus = "in_stock" | "low_stock" | "out_of_stock" | "new" | "sale";

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceTRY: number;
  compareAtTRY: number | null;
  status: ProductStatus;
  statuses: string[];
  categorySlug: CategorySlug;
  coverImage: string;        // local path under /public
  gallery: string[];         // local paths under /public
  sourceUrl: string;         // shopier URL
}

export type SeriesSlug = "kapilar" | "maskeler";

export interface Series {
  slug: SeriesSlug;
  title: string;             // "Kapılar", "Lord of… Maskeler"
  subtitle?: string;          // küçük üst eyebrow ("Linol Baskı · 2018")
  year?: number;              // baskın üretim yılı
  description: string;        // 1-2 paragraflık seri tanıtım
  coverImage?: string;        // landing kartı için kapak
  paperNote?: string;         // "Japon el yapımı kâğıt" vb.
}

export interface PortfolioWork {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  /** Görselin orijinal piksel boyutları — galeri grid'inde aspect korumak için */
  width?: number;
  height?: number;
  year?: number;
  series?: SeriesSlug;        // hangi seriye ait — boşsa eski kayıtlar "kapilar" varsayılır
}

export interface JournalPost {
  slug: string;
  title: string;
  excerpt: string;
  body?: string;
  date: string;            // ISO YYYY-MM-DD (gün belirsizse YYYY-MM-01)
  dateLabel?: string;      // İnsan okur: "Nisan 2025", "Ocak 2026" vb.
  category?: string;
  location?: string;
  locationUrl?: string;
  image?: string;          // mini cover
  imageAlt?: string;
  gallery?: string[];      // hover-expand'de gösterilecek ek görseller
  instagramUrl?: string;
}

export interface Workshop {
  slug: string;
  title: string;
  instructor: string;
  instructorInstagramHandle?: string;
  instructorInstagramUrl?: string;
  schedule?: string;
  date?: string;
  description?: string;
  priceTRY?: number | null;
  image?: string;
}

export interface Artist {
  name: string;
  title?: string;
  instagramHandle?: string;
  instagramUrl?: string;
  note?: string;
}

export interface Business {
  name: string;
  tagline: string;
  artist?: Artist;
  address: {
    neighborhood: string;
    street: string;
    postalCode: string;
    district: string;
    city: string;
    country: string;
    full: string;
  };
  transit: {
    nearestMetro: string;
    metroDistance?: string;
    metroWalkMinutes?: number;
    nearestBusStop?: string;
    busStopWalkMinutes?: number;
    busLines?: string[];
  };
  contact: {
    phonePrimary: string;
    instagram: string;
    shopier: string;
  };
  hours: { closingTime: string; note: string };
  googleMapsEmbed: string;
  googleMapsUrl?: string;
  latitude?: number;
  longitude?: number;
  workshops: Workshop[];
}
