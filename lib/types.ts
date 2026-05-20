/**
 * MAIMARI.STUDIO — Data model types
 */

export type CategorySlug =
  | "linol-baskilari"      // Linol Baskıları (originals — gallery)
  | "linol-boyalari"        // İnks
  | "linolyum"              // Linol blocks
  | "merdaneler"            // Brayers
  | "el-yapimi-kagitlar"    // Handmade paper
  | "aletler"               // Tools (carving knife, registration pin, pen)
  | "cantalar"              // Bags
  | "atolyeler";            // Workshops

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

export interface PortfolioWork {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  year?: number;
}

export interface Workshop {
  slug: string;
  title: string;
  instructor: string;
  schedule?: string;
  date?: string;
  description?: string;
  priceTRY?: number | null;
  image?: string;
}

export interface Business {
  name: string;
  tagline: string;
  address: {
    neighborhood: string;
    street: string;
    postalCode: string;
    district: string;
    city: string;
    country: string;
    full: string;
  };
  transit: { nearestMetro: string };
  contact: {
    phonePrimary: string;
    phoneSecondary?: string;
    whatsapp: string;
    instagram: string;
    shopier: string;
  };
  hours: { closingTime: string; note: string };
  googleMapsEmbed: string;
  workshops: Workshop[];
}
