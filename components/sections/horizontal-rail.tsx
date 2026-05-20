"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef, type ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: ReactNode;
  /** Sağ üstte "Hepsini gör →" linki */
  ctaHref?: string;
  ctaLabel?: string;
  children: ReactNode;
  /** Rail arka planı için yardımcı sınıf (örn. "bg-[color:var(--color-surface)]") */
  bg?: string;
  /** Section yatay padding'i kaldırılsın mı (full-bleed rail) */
  bleed?: boolean;
};

/**
 * Google Arts & Culture stili yatay rail.
 * Üstte başlık + CTA, altta snap-x scroller, masaüstünde küçük ok butonları.
 */
export function HorizontalRail({
  eyebrow,
  title,
  ctaHref,
  ctaLabel = "Hepsini gör",
  children,
  bg,
  bleed = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const amount = el.clientWidth * 0.72 * dir;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <section className={`py-16 lg:py-24 ${bg ?? ""}`}>
      <div className={bleed ? "container-wide" : "container-x"}>
        {/* Header row */}
        <div className="flex items-end justify-between gap-6 mb-8 lg:mb-12">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2 className="font-display mt-3 text-3xl md:text-4xl lg:text-5xl leading-[1.05]">
              {title}
            </h2>
          </div>

          <div className="hidden md:flex items-center gap-3 shrink-0">
            {ctaHref && (
              <Link
                href={ctaHref}
                className="text-sm editorial-link"
              >
                {ctaLabel} →
              </Link>
            )}
            <div className="flex items-center gap-2 ml-4">
              <button
                type="button"
                aria-label="Önceki"
                onClick={() => scrollBy(-1)}
                className="w-9 h-9 inline-flex items-center justify-center rounded-full border border-[color:var(--color-border)] hover:border-[color:var(--color-foreground)] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                  <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Sonraki"
                onClick={() => scrollBy(1)}
                className="w-9 h-9 inline-flex items-center justify-center rounded-full border border-[color:var(--color-border)] hover:border-[color:var(--color-foreground)] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                  <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rail */}
      <div
        ref={ref}
        className="rail no-scrollbar"
      >
        {children}
      </div>

      {/* Mobile CTA */}
      {ctaHref && (
        <div className="md:hidden container-x mt-8">
          <Link href={ctaHref} className="text-sm editorial-link">
            {ctaLabel} →
          </Link>
        </div>
      )}
    </section>
  );
}

/**
 * A&C-style image tile for rails — büyük portre görsel + altta caption.
 */
export function RailTile({
  href,
  image,
  imageAlt,
  caption,
  title,
  meta,
  width = 280,
  aspect = "portrait",
}: {
  href: string;
  image: string;
  imageAlt?: string;
  /** Üstte küçük all-caps eyebrow (museum/source benzeri) */
  caption?: string;
  title: string;
  meta?: string;
  /** Tile genişliği (px) */
  width?: number;
  aspect?: "portrait" | "landscape" | "square";
}) {
  const aspectClass =
    aspect === "portrait"
      ? "ratio-portrait"
      : aspect === "landscape"
        ? "ratio-landscape"
        : "ratio-square";

  return (
    <Link
      href={href}
      className="group block"
      style={{ width: `${width}px` }}
    >
      <div className={`relative w-full ${aspectClass} overflow-hidden bg-[color:var(--color-surface-2)]`}>
        <Image
          src={image}
          alt={imageAlt ?? title}
          fill
          sizes={`${width}px`}
          className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
        />
      </div>
      {caption && (
        <p className="eyebrow mt-4">
          {caption}
        </p>
      )}
      <h3 className="font-display text-lg lg:text-xl mt-2 leading-snug group-hover:italic transition-all duration-500">
        {title}
      </h3>
      {meta && (
        <p
          className="mt-1 text-[12px]"
          style={{ color: "var(--color-muted)" }}
        >
          {meta}
        </p>
      )}
    </Link>
  );
}
