import Image from "next/image";
import Link from "next/link";
import type { Series, PortfolioWork } from "@/lib/types";

type Props = {
  series: Series;
  works: PortfolioWork[];
};

/**
 * Anasayfa single-card hero — galeri serisini pasapartu vitrin içinde sunar.
 * Sol pasapartu kart (foto contain + ring + shadow), sağ italic Cormorant
 * başlık + müze etiketi + CTA. Mobil: foto üst, metin alt (col-reverse yok,
 * doğal akış). h-[calc(100svh-64px)] — header sonrası ilk ekran tam dolar.
 */
export function FeaturedSeriesHero({ series, works }: Props) {
  const yearLabel = series.yearRange ?? (series.year ? String(series.year) : "");
  const cover = series.coverImage ?? works[0]?.image;

  return (
    <section
      className="lg:h-[calc(100svh-64px)] lg:min-h-[640px] flex items-center bg-[color:var(--color-background)]"
      aria-label="Galeri öne çıkan seri"
    >
      <div className="container-x w-full py-12 lg:py-0">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-20 items-center">
          {/* Pasapartu kart — galeri eseri */}
          <div className="relative bg-[color:var(--color-surface)] ring-1 ring-[color:var(--color-hairline)] shadow-[0_1px_2px_rgba(60,40,28,0.05),0_24px_56px_-24px_rgba(60,40,28,0.22)] p-5 sm:p-8 lg:p-12">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[color:var(--color-surface-2)] ring-[0.5px] ring-[color:var(--color-hairline)]">
              {cover && (
                <Image
                  src={cover}
                  alt={`${series.title} serisinden bir eser`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 92vw, 50vw"
                  className="object-contain p-4 lg:p-6"
                />
              )}
            </div>
            <span className="absolute top-8 left-8 lg:top-14 lg:left-14 text-[10px] tracking-[0.32em] uppercase bg-[color:var(--color-walnut-dark)] text-[color:var(--color-background)] px-3 py-1.5 z-10">
              Seri
            </span>
          </div>

          {/* Meta — başlık + müze etiketi + CTA */}
          <div className="lg:pl-4">
            <p className="eyebrow">Galeri · Duygu Sinan</p>
            <h1 className="font-display italic mt-5 lg:mt-7 leading-[0.95] tracking-tight text-[color:var(--color-walnut-dark)] text-[clamp(2.8rem,6vw,5.5rem)]">
              {series.title}
              <span className="not-italic font-normal">.</span>
            </h1>
            <p className="mt-5 lg:mt-7 text-base lg:text-lg leading-relaxed text-[color:var(--color-muted)] max-w-md">
              {series.description}
            </p>

            <dl className="mt-8 lg:mt-10 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-xs uppercase tracking-[0.18em] max-w-sm">
              <dt className="text-[color:var(--color-muted)]">Eser</dt>
              <dd>{works.length}</dd>
              {yearLabel && (
                <>
                  <dt className="text-[color:var(--color-muted)]">Yıl</dt>
                  <dd>{yearLabel}</dd>
                </>
              )}
              {series.paperNote && (
                <>
                  <dt className="text-[color:var(--color-muted)]">Kâğıt</dt>
                  <dd>{series.paperNote}</dd>
                </>
              )}
            </dl>

            <div className="mt-9 lg:mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link
                href={`/galeri/${series.slug}`}
                className="inline-flex h-12 px-7 items-center text-[12px] tracking-[0.22em] uppercase border transition-colors hover:opacity-90"
                style={{
                  background: "var(--color-foreground)",
                  color: "var(--color-background)",
                  borderColor: "var(--color-foreground)",
                }}
              >
                Galeriye gir →
              </Link>
              <Link
                href="/galeri"
                className="editorial-link text-sm text-[color:var(--color-foreground)]"
              >
                Tüm seriler →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
