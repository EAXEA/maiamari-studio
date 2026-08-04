import Image from "next/image";
import Link from "next/link";
import type { PortfolioWork, Series } from "@/lib/types";
import { formatTRY } from "@/lib/format";
import { Reveal } from "@/components/motion/reveal";
import { artworkNaming } from "@/lib/gallery/artwork-naming";

/** Eser fiyatlı satışa açık mı (vitrinde fiyat gösterimi). */
function isPriced(w: PortfolioWork): boolean {
  return !!w.forSale && typeof w.priceTRY === "number" && w.priceTRY > 0;
}

/** "Linol baskı · 2015 · 10 adetlik edisyon" */
function summaryLine(w: PortfolioWork, paperNote?: string): string {
  return [
    w.technique ?? "Linol baskı",
    w.paper ?? paperNote,
    w.year ? String(w.year) : null,
    w.editionSize ? `${w.editionSize} adetlik edisyon` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Seri sayfası vitrini: her eser bir karttır ve kendi sayfasına link verir.
 * Tam künye, açıklama ve satın alma /eser/<slug> sayfasındadır. Bu ayrım seri
 * ve eser sayfalarının kopya içerik üretmesini önler.
 * Server component: linkler ilk HTML'de yer alır, arama motoru tarar.
 */
export function WorksGrid({
  works,
  series,
  paperNote,
}: {
  works: PortfolioWork[];
  /** Kart adında isimsiz eserleri ayrıştırmak için (Kapılar 03). */
  series: Series | null;
  paperNote?: string;
}) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
      {works.map((work, idx) => (
        <Reveal key={work.id}>
          <Link href={`/eser/${work.slug}`} className="group block">
            <figure className="bg-[color:var(--color-surface)] p-4 sm:p-5 ring-1 ring-[color:var(--color-hairline)] shadow-[0_1px_2px_rgba(60,40,28,0.05),0_18px_40px_-22px_rgba(60,40,28,0.20)]">
              <div className="relative ring-[0.5px] ring-[color:var(--color-hairline)] overflow-hidden bg-[color:var(--color-surface-2)]">
                <Image
                  src={work.image}
                  alt={work.title}
                  width={work.width ?? 1200}
                  height={work.height ?? 1200}
                  priority={idx < 3}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="block w-full h-auto select-none"
                  draggable={false}
                />
              </div>
            </figure>
            <h2 className="font-display italic mt-5 text-xl lg:text-2xl leading-tight">
              {artworkNaming(work, series).cardTitle}
            </h2>
            <p className="mt-2 text-sm text-[color:var(--color-muted)]">
              {summaryLine(work, paperNote)}
            </p>
            {isPriced(work) && !work.soldOut && (
              <p className="mt-2 text-sm tabular-nums">
                {formatTRY(work.priceTRY!)}
              </p>
            )}
            {work.soldOut && (
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[color:var(--color-press)]">
                Tükendi
              </p>
            )}
            <span className="mt-3 inline-block text-sm editorial-link">
              Eseri gör →
            </span>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
