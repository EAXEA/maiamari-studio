import type { PortfolioWork } from "@/lib/types";

/**
 * Bir eserin kendi serisi içindeki önceki/sonraki komşusu.
 * Sarmalama YOK: seri başında prev, seri sonunda next null döner. Eser sayfası
 * bu linkleri server HTML'de basar; arama motoru seriyi zincirleme tarar.
 */
export function adjacentWorks(
  works: PortfolioWork[],
  slug: string,
): { prev: PortfolioWork | null; next: PortfolioWork | null } {
  const idx = works.findIndex((w) => w.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? works[idx - 1] : null,
    next: idx < works.length - 1 ? works[idx + 1] : null,
  };
}
