import { NextResponse } from "next/server";
import {
  getAllProducts,
  getCategories,
  getBusiness,
  getWorkshops,
} from "@/lib/data";

export type SearchItem = {
  kind: "product" | "artist" | "category";
  title: string;
  subtitle?: string;
  cover?: string;
  url: string;
  badge?: string;
  price?: number;
  /** Fuse search'ün de katacağı alternatif arama anahtarları */
  keywords?: string;
};

export async function GET() {
  const products = getAllProducts();
  const cats = getCategories();
  const biz = getBusiness();
  const workshops = getWorkshops();
  const catBySlug = Object.fromEntries(cats.map((c) => [c.slug, c]));

  const items: SearchItem[] = [];

  // Sanatçı / Atölye kurucusu
  if (biz.artist) {
    items.push({
      kind: "artist",
      title: biz.artist.name,
      subtitle: biz.artist.title ?? "Atölye kurucusu",
      url: biz.artist.instagramUrl ?? "/galeri",
      keywords: `${biz.artist.name} ${biz.artist.instagramHandle ?? ""} sanatci sanatçı artist linol baskı galeri kurucu eğitmen`,
    });
  }

  // Eğitmenler (sanatçı dışında kalan unique eğitmenler)
  const seenInstructors = new Set<string>();
  if (biz.artist) seenInstructors.add(biz.artist.name);
  for (const w of workshops) {
    if (seenInstructors.has(w.instructor)) continue;
    seenInstructors.add(w.instructor);
    items.push({
      kind: "artist",
      title: w.instructor,
      subtitle: "Eğitmen · Atölye",
      url: w.instructorInstagramUrl ?? "/atolyeler",
      keywords: `${w.instructor} ${w.instructorInstagramHandle ?? ""} eğitmen workshop atölye ${w.title}`,
    });
  }

  // Kategoriler
  for (const c of cats) {
    items.push({
      kind: "category",
      title: c.name,
      subtitle: c.nameEn,
      url: `/shop/${c.slug}`,
      keywords: `${c.name} ${c.nameEn} kategori`,
    });
  }

  // Ürünler
  for (const p of products) {
    const cat = catBySlug[p.categorySlug];
    const stock =
      p.status === "out_of_stock"
        ? "Tükendi"
        : p.status === "low_stock"
          ? "Son ürün"
          : p.status === "new"
            ? "Yeni"
            : null;
    items.push({
      kind: "product",
      title: p.title,
      subtitle: `${cat?.name ?? p.categorySlug}${stock ? " · " + stock : ""}`,
      cover: p.coverImage,
      price: p.priceTRY,
      badge: stock ?? undefined,
      url: `/urun/${p.slug}`,
      keywords: `${p.title} ${cat?.name ?? ""} ${cat?.nameEn ?? ""}`,
    });
  }

  return NextResponse.json({ items });
}
