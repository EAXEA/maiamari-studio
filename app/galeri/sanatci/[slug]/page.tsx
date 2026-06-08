import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getArtists,
  getArtistBySlug,
  getSeries,
  getPortfolioBySeries,
} from "@/lib/data";
import type { SeriesSlug } from "@/lib/types";
import { Reveal } from "@/components/motion/reveal";

// ISR: sanatçı sayfasındaki eserlerin DB fiyatları 60 sn'de bir kendiliğinden
// tazelensin (build JSON fallback'ten üretildiği için; bkz. [series] sayfası).
export const revalidate = 60;

export async function generateStaticParams() {
  const artists = await getArtists();
  return artists.filter((a) => a.slug).map((a) => ({ slug: a.slug as string }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) return {};
  return {
    title: `${artist.name} · Galeri`,
    description: artist.bio || `${artist.name} eserleri`,
    alternates: { canonical: `/galeri/sanatci/${slug}` },
  };
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) notFound();

  const allSeries = await getSeries();
  const mySeries = allSeries.filter(
    (s) => (s.artistSlug ?? "duygu-sinan") === slug,
  );
  const counts = await Promise.all(
    mySeries.map((s) => getPortfolioBySeries(s.slug as SeriesSlug)),
  );
  const countBySlug: Record<string, number> = Object.fromEntries(
    mySeries.map((s, i) => [s.slug, counts[i].length]),
  );

  return (
    <>
      <section className="container-x pt-14 lg:pt-20 pb-10">
        <Reveal>
          <nav
            className="text-xs tracking-[0.22em] uppercase text-[color:var(--color-muted)] mb-6"
            aria-label="Breadcrumb"
          >
            <Link href="/galeri" className="hover:text-[color:var(--color-foreground)]">
              Galeri
            </Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="text-[color:var(--color-foreground)]">
              {artist.name}
            </span>
          </nav>

          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-16 items-start">
            {artist.coverImage && (
              <div className="relative aspect-[4/5] w-full max-w-[360px] overflow-hidden bg-[color:var(--color-surface-2)] ring-1 ring-[color:var(--color-hairline)]">
                <Image
                  src={artist.coverImage}
                  alt={artist.name}
                  fill
                  sizes="(max-width: 1024px) 80vw, 360px"
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <p className="eyebrow">Sanatçı</p>
              <h1 className="font-display mt-4 leading-[0.98] text-[clamp(2.5rem,6vw,5rem)] tracking-tight italic">
                {artist.name}
              </h1>
              {artist.title && (
                <p className="mt-3 text-sm tracking-[0.18em] uppercase text-[color:var(--color-muted)]">
                  {artist.title}
                </p>
              )}
              {artist.bio && (
                <p className="mt-6 text-base lg:text-lg leading-relaxed text-[color:var(--color-muted)] max-w-prose">
                  {artist.bio}
                </p>
              )}
              {artist.instagramUrl && (
                <p className="mt-5">
                  <a
                    href={artist.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="editorial-link text-sm"
                  >
                    @{artist.instagramHandle || "instagram"} →
                  </a>
                </p>
              )}
            </div>
          </div>
        </Reveal>
      </section>

      <section className="container-x pb-16 lg:pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {mySeries.map((s) => (
            <Reveal key={s.slug} className="h-full">
              <Link
                href={`/galeri/${s.slug}`}
                className="group flex flex-col h-full bg-[color:var(--color-surface)] ring-1 ring-[color:var(--color-hairline)] hover:-translate-y-1 transition-all duration-500"
              >
                <div className="relative p-5 lg:p-7">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[color:var(--color-surface-2)] ring-[0.5px] ring-[color:var(--color-hairline)]">
                    {s.coverImage && (
                      <Image
                        src={s.coverImage}
                        alt={`${s.title} serisinden bir eser`}
                        fill
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        className="object-contain p-3"
                      />
                    )}
                  </div>
                </div>
                <div className="px-5 lg:px-7 pb-7 flex-1 flex flex-col border-t border-dashed border-[color:var(--color-hairline)] pt-5">
                  <h2 className="font-display text-2xl lg:text-3xl leading-[1.05] tracking-tight italic">
                    {s.title}
                  </h2>
                  <div className="mt-auto pt-5 flex items-center justify-between text-xs tracking-[0.18em] uppercase text-[color:var(--color-muted)]">
                    <span>{countBySlug[s.slug] ?? 0} eser</span>
                    <span className="text-[color:var(--color-foreground)] group-hover:translate-x-1 transition-transform">
                      Seriye gir →
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
