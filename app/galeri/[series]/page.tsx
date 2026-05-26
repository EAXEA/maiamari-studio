import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBusiness,
  getPortfolioBySeries,
  getSeries,
  getSeriesBySlug,
} from "@/lib/data";
import type { SeriesSlug } from "@/lib/types";
import { Reveal } from "@/components/motion/reveal";
import { InstagramInquiryButton } from "@/components/inquiry/instagram-inquiry-button";
import { WhatsappCTA } from "@/components/inquiry/whatsapp-cta";
import { WorksDetailList } from "@/components/portfolio/works-detail-list";

const BASE_URL = "https://www.maiamari.art";

export async function generateStaticParams() {
  return getSeries().map((s) => ({ series: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ series: string }>;
}): Promise<Metadata> {
  const { series: seriesSlug } = await params;
  const series = getSeriesBySlug(seriesSlug as SeriesSlug);
  if (!series) return {};
  return {
    title: `${series.title} · Galeri`,
    description: series.description,
    alternates: { canonical: `/galeri/${series.slug}` },
    openGraph: {
      title: `${series.title} · Galeri · MAIAMARI`,
      description: series.description,
      url: `${BASE_URL}/galeri/${series.slug}`,
      type: "website",
    },
  };
}

export default async function SeriPage({
  params,
}: {
  params: Promise<{ series: string }>;
}) {
  const { series: seriesSlug } = await params;
  const series = getSeriesBySlug(seriesSlug as SeriesSlug);
  if (!series) notFound();

  const works = getPortfolioBySeries(seriesSlug as SeriesSlug);
  const biz = getBusiness();
  const allSeries = getSeries();
  const currentIdx = allSeries.findIndex((s) => s.slug === series.slug);
  const nextSeries = currentIdx >= 0 ? allSeries[(currentIdx + 1) % allSeries.length] : null;

  return (
    <>
      {/* Breadcrumb */}
      <section className="container-x pt-10 lg:pt-14">
        <Reveal>
          <nav
            className="text-xs tracking-[0.22em] uppercase text-[color:var(--color-muted)]"
            aria-label="Breadcrumb"
          >
            <Link href="/galeri" className="hover:text-[color:var(--color-foreground)]">
              Galeri
            </Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="text-[color:var(--color-foreground)]">{series.title}</span>
          </nav>
        </Reveal>
      </section>

      {/* 1. Header */}
      <section className="container-x py-12 lg:py-20">
        <Reveal>
          <p className="eyebrow">Seri · {series.subtitle ?? "Linol baskı"}</p>
          <h1 className="font-display mt-5 leading-[0.98] max-w-4xl tracking-tight">
            <span className="block text-[clamp(2.5rem,5.5vw,5rem)]">
              Atölyede çoğaltılmış
            </span>
            <span className="block italic text-[clamp(3rem,7vw,6.5rem)]">
              {series.title}.
            </span>
          </h1>
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-20 mt-10 items-start">
            <div className="max-w-prose">
              <p className="text-base lg:text-lg leading-relaxed text-[color:var(--color-muted)]">
                Sanatçı{" "}
                {biz.artist?.instagramUrl ? (
                  <a
                    href={biz.artist.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4 text-[color:var(--color-foreground)] hover:text-[color:var(--color-walnut)]"
                  >
                    Duygu Sinan
                  </a>
                ) : (
                  <strong className="font-normal text-[color:var(--color-foreground)]">
                    Duygu Sinan
                  </strong>
                )}
                &apos;ın{" "}
                <em className="text-[color:var(--color-foreground)] not-italic">
                  &quot;{series.title}&quot;
                </em>{" "}
                serisi — {series.description}
              </p>
              {series.paperNote && (
                <p
                  className="mt-4 text-sm italic"
                  style={{ color: "var(--color-walnut)" }}
                >
                  {series.paperNote}.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <InstagramInquiryButton
                path={`/galeri/${series.slug}`}
                label="Instagram'dan bilgi al"
                className="inline-flex h-11 px-6 items-center text-[12px] tracking-[0.22em] uppercase border whitespace-nowrap"
                style={{ borderColor: "var(--color-foreground)" }}
              />
              <WhatsappCTA variant="button" context={`${series.title} serisindeki bir eser`} path={`/galeri/${series.slug}`} />
            </div>
          </div>
        </Reveal>
      </section>

      {/* 2. Tüm eserler — her birinin kendi detay kartı (foto + künye + lightbox) */}
      <section className="container-x py-16 lg:py-24">
        <WorksDetailList
          works={works}
          seriesName={series.title}
          inquiryPath={`/galeri/${series.slug}`}
          paperNote={series.paperNote}
        />
      </section>

      {/* 3. Cross-link → next series */}
      {nextSeries && nextSeries.slug !== series.slug && (
        <section className="container-x pb-24 border-t border-[color:var(--color-hairline)] pt-14">
          <Reveal>
            <p className="eyebrow">Devamı</p>
            <Link
              href={`/galeri/${nextSeries.slug}`}
              className="mt-4 inline-block font-display text-3xl lg:text-5xl leading-[1.02] italic hover:opacity-70 transition-opacity"
            >
              {nextSeries.title} serisine geç →
            </Link>
            <p className="mt-3 text-sm text-[color:var(--color-muted)] max-w-prose">
              {nextSeries.description}
            </p>
          </Reveal>
        </section>
      )}
    </>
  );
}
