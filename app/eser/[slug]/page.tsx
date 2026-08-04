import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getArtworkBySlug,
  getAllArtworks,
  getSeriesBySlug,
  getPortfolioBySeries,
} from "@/lib/data";
import type { SeriesSlug, Product } from "@/lib/types";
import { formatTRY } from "@/lib/format";
import { adjacentWorks } from "@/lib/gallery/adjacent-works";
import { cleanDescription } from "@/lib/gallery/clean-description";
import { AddToCart } from "@/components/cart/add-to-cart";
import {
  visualArtworkSchema,
  productSchema,
  breadcrumbSchema,
  jsonLdScript,
} from "@/lib/structured-data";

const BASE_URL = "https://www.maiamari.art";

// ISR: künye/fiyat değişiklikleri canlıda ~60sn'de yansısın.
export const revalidate = 60;

export async function generateStaticParams() {
  return (await getAllArtworks()).map((w) => ({ slug: w.slug }));
}

/** Açıklaması boş eserde metadata için künyeden kısa metin üretir. */
function fallbackDescription(work: {
  title: string;
  technique?: string;
  dimensions?: string;
  year?: number;
}): string {
  return [
    work.title,
    work.technique ?? "Linol baskı",
    work.dimensions,
    work.year ? String(work.year) : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const work = await getArtworkBySlug(slug);
  if (!work) return {};
  const desc = cleanDescription(work.description || "") || fallbackDescription(work);
  return {
    title: work.title,
    description: desc,
    alternates: { canonical: `/eser/${work.slug}` },
    openGraph: {
      title: work.title,
      description: desc,
      // OG image: app/eser/[slug]/opengraph-image.tsx file convention.
    },
  };
}

export default async function ArtworkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const work = await getArtworkBySlug(slug);
  if (!work) notFound();

  const series = work.series ? await getSeriesBySlug(work.series) : null;
  const siblings = work.series
    ? await getPortfolioBySeries(work.series as SeriesSlug)
    : [];
  const { prev, next } = adjacentWorks(siblings, work.slug);

  // Satış bloğu ve Product markup yalnız fiyatlı-satılık eserde. Satılık
  // olmayan eserde hiçbir CTA basılmaz (tasarım kararı #4).
  const isPriced =
    !!work.forSale && typeof work.priceTRY === "number" && work.priceTRY > 0;

  const description = cleanDescription(work.description || "");

  const breadcrumb = breadcrumbSchema([
    { name: "Ana sayfa", url: `${BASE_URL}/` },
    { name: "Galeri", url: `${BASE_URL}/galeri` },
    ...(series
      ? [{ name: series.title, url: `${BASE_URL}/galeri/${series.slug}` }]
      : []),
    { name: work.title, url: `${BASE_URL}/eser/${work.slug}` },
  ]);

  return (
    <div className="container-x py-12 lg:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(visualArtworkSchema(work, series))}
      />
      {isPriced && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(
            productSchema(
              {
                id: work.id,
                slug: work.slug,
                title: work.title,
                description,
                priceTRY: work.priceTRY!,
                compareAtTRY: work.compareAtTRY ?? null,
                status: work.soldOut ? "out_of_stock" : "in_stock",
                statuses: [],
                // Eserin mağaza kategorisi yok; alan yalnız Product tipini
                // karşılamak için var, markup'ta kullanılmıyor.
                categorySlug: "" as Product["categorySlug"],
                coverImage: work.image,
                gallery: [work.image],
                sourceUrl: "",
              },
              `${BASE_URL}/eser/${work.slug}`,
            ),
          )}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(breadcrumb)}
      />

      {/* Breadcrumb */}
      <nav className="mb-10 text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
        <Link href="/galeri" className="hover:text-[color:var(--color-foreground)]">
          Galeri
        </Link>
        {series && (
          <>
            <span className="mx-2">·</span>
            <Link
              href={`/galeri/${series.slug}`}
              className="hover:text-[color:var(--color-foreground)]"
            >
              {series.title}
            </Link>
          </>
        )}
      </nav>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-20 items-start">
        {/* Görsel — seri kartlarıyla aynı pasapartu çerçeve dili */}
        <figure className="bg-[color:var(--color-surface)] p-5 sm:p-7 lg:p-9 ring-1 ring-[color:var(--color-hairline)] shadow-[0_1px_2px_rgba(60,40,28,0.05),0_18px_40px_-22px_rgba(60,40,28,0.20)]">
          <div className="relative ring-[0.5px] ring-[color:var(--color-hairline)] overflow-hidden bg-[color:var(--color-surface-2)]">
            <Image
              src={work.image}
              alt={work.title}
              width={work.width ?? 1200}
              height={work.height ?? 1200}
              priority
              sizes="(max-width: 1024px) 100vw, 56vw"
              className="block w-full h-auto select-none"
              draggable={false}
            />
          </div>
        </figure>

        {/* Künye */}
        <div className="lg:pt-6">
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl leading-[1.05] tracking-tight">
            <span className="italic">{work.title}</span>
          </h1>

          <dl className="mt-8 grid grid-cols-[max-content_1fr] gap-x-8 gap-y-2 text-sm">
            <dt className="text-[color:var(--color-muted)]">Sanatçı</dt>
            <dd>{work.artist ?? "Duygu Sinan"}</dd>
            {series && (
              <>
                <dt className="text-[color:var(--color-muted)]">Seri</dt>
                <dd>
                  <Link href={`/galeri/${series.slug}`} className="editorial-link">
                    {series.title}
                  </Link>
                </dd>
              </>
            )}
            <dt className="text-[color:var(--color-muted)]">Teknik</dt>
            <dd>{work.technique ?? "Linol baskı, elle çoğaltılmış"}</dd>
            {work.paper && (
              <>
                <dt className="text-[color:var(--color-muted)]">Kâğıt</dt>
                <dd>{work.paper}</dd>
              </>
            )}
            {work.dimensions && (
              <>
                <dt className="text-[color:var(--color-muted)]">Boyut</dt>
                <dd className="leading-relaxed">{work.dimensions}</dd>
              </>
            )}
            {work.year && (
              <>
                <dt className="text-[color:var(--color-muted)]">Yıl</dt>
                <dd>{work.year}</dd>
              </>
            )}
            <dt className="text-[color:var(--color-muted)]">Edisyon</dt>
            <dd>
              {work.editionSize
                ? `${work.editionSize} adetlik sayılı edisyon`
                : "Sayılı edisyon"}
            </dd>
            {work.firstSerial && (
              <>
                <dt className="text-[color:var(--color-muted)]">Serial</dt>
                <dd className="font-mono text-xs tabular-nums tracking-tight">
                  {work.firstSerial}
                </dd>
              </>
            )}
            <dt className="text-[color:var(--color-muted)]">Filigran</dt>
            <dd className="text-[color:var(--color-muted)] text-xs leading-relaxed">
              MAIAMARI © · yalnızca dijital gösterimde.
              Teslim edilen fiziksel baskı filigransızdır.
            </dd>
          </dl>

          {description && (
            <p className="mt-8 text-base leading-relaxed text-[color:var(--color-muted)] max-w-prose">
              {description}
            </p>
          )}

          {isPriced && (
            <div className="mt-8">
              <p className="font-display tabular-nums text-2xl">
                {formatTRY(work.priceTRY!)}
                {work.compareAtTRY != null &&
                  work.compareAtTRY > work.priceTRY! && (
                    <span className="ml-3 line-through text-base text-[color:var(--color-muted)]">
                      {formatTRY(work.compareAtTRY)}
                    </span>
                  )}
              </p>
              <AddToCart
                id={work.id}
                slug={work.slug}
                title={work.title}
                priceTry={work.priceTRY!}
                image={work.image}
                outOfStock={work.soldOut}
                href={`/eser/${work.slug}`}
              />
            </div>
          )}
        </div>
      </div>

      {/* Seri içi gezinme — server HTML'de, arama motoru zincirleme tarar */}
      {(prev || next) && (
        <nav className="mt-20 pt-10 border-t border-[color:var(--color-hairline)] flex justify-between gap-6 text-sm">
          {prev ? (
            <Link href={`/eser/${prev.slug}`} className="editorial-link">
              ← {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/eser/${next.slug}`} className="editorial-link text-right">
              {next.title} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
