import type { MetadataRoute } from "next";
import {
  getAllProducts,
  getCategories,
  getSeries,
  getArtists,
  getAllArtworks,
} from "@/lib/data";

const BASE_URL = "https://www.maiamari.art";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/galeri`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/shop`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/atolyeler`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: `${BASE_URL}/journal`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const seriesRoutes: MetadataRoute.Sitemap = (await getSeries()).map((s) => ({
    url: `${BASE_URL}/galeri/${s.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = (await getCategories()).map((c) => ({
    url: `${BASE_URL}/shop/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const artistRoutes: MetadataRoute.Sitemap = (await getArtists())
    .filter((a) => a.slug)
    .map((a) => ({
      url: `${BASE_URL}/galeri/sanatci/${a.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    }));

  const productRoutes: MetadataRoute.Sitemap = (await getAllProducts()).map((p) => ({
    url: `${BASE_URL}/urun/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Eserler: her birinin kanonik adresi /eser/<slug>.
  const artworkRoutes: MetadataRoute.Sitemap = (await getAllArtworks()).map((w) => ({
    url: `${BASE_URL}/eser/${w.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    ...staticRoutes,
    ...seriesRoutes,
    ...artistRoutes,
    ...categoryRoutes,
    ...productRoutes,
    ...artworkRoutes,
  ];
}
