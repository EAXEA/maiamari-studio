/**
 * MAIAMARI.STUDIO — Admin seri yönetimi
 * Sanatçı → Seriler → Eserler drill-down: ?artist=<slug> ile filtrelenir.
 */
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { isDbConfigured } from "@/lib/db/client";
import { isStorageConfigured } from "@/lib/admin/storage";
import { getSeries, getArtists } from "@/lib/data";
import { SeriesForm } from "@/components/admin/series-form";
import { TaxonomyDeleteButton } from "@/components/admin/taxonomy-delete-button";

export const dynamic = "force-dynamic";

export default async function AdminSeriesPage({
  searchParams,
}: {
  searchParams: Promise<{ artist?: string }>;
}) {
  await requireAdmin();
  const { artist: artistFilter } = await searchParams;
  const [allSeries, artists] = await Promise.all([getSeries(), getArtists()]);
  const artistName = Object.fromEntries(
    artists.map((a) => [a.slug ?? "", a.name]),
  );
  const artistsList = artists.map((a) => ({ slug: a.slug ?? "", name: a.name }));

  const series = artistFilter
    ? allSeries.filter((s) => (s.artistSlug ?? "duygu-sinan") === artistFilter)
    : allSeries;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 text-sm text-[color:var(--color-muted)] mb-2">
        <Link href="/admin/artists" className="hover:text-[color:var(--color-foreground)]">
          Sanatçılar
        </Link>
        <span className="opacity-50">/</span>
        <span className="text-[color:var(--color-foreground)]">Seriler</span>
        {artistFilter && (
          <>
            <span className="opacity-50">·</span>
            <span>{artistName[artistFilter] ?? artistFilter}</span>
            <Link
              href="/admin/series"
              className="underline underline-offset-2 hover:text-[color:var(--color-foreground)]"
            >
              tümü
            </Link>
          </>
        )}
      </div>
      <h1 className="font-display text-3xl mb-1">Seriler</h1>
      <p className="text-sm text-[color:var(--color-muted)] mb-8">
        Her seri bir sanatçıya aittir. Bir seriye girince eserlerini
        görebilirsiniz (Sanatçılar → Seriler → Eserler).
      </p>

      {!isDbConfigured() && (
        <p className="text-sm text-amber-700 border border-amber-300 bg-amber-50 rounded-md px-3 py-2 mb-6">
          Veritabanı bağlı değil.
        </p>
      )}

      <div className="border border-[color:var(--color-hairline)] rounded-lg divide-y divide-[color:var(--color-hairline)] mb-12">
        {series.map((s) => (
          <div
            key={s.slug}
            className="flex items-start justify-between gap-4 px-4 py-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{s.title}</span>
                <Link
                  href={`/galeri/${s.slug}`}
                  target="_blank"
                  className="text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
                >
                  /{s.slug} ↗
                </Link>
              </div>
              <p className="text-xs text-[color:var(--color-muted)] mt-1">
                Sanatçı: {artistName[s.artistSlug ?? "duygu-sinan"] ?? s.artistSlug}
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <Link
                href={`/admin/artworks?series=${s.slug}`}
                className="text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
              >
                Eserleri →
              </Link>
              <Link
                href={`/admin/series/${s.slug}`}
                className="text-xs underline underline-offset-2 hover:text-[color:var(--color-foreground)]"
              >
                Düzenle
              </Link>
              <TaxonomyDeleteButton kind="series" slug={s.slug} name={s.title} />
            </div>
          </div>
        ))}
        {series.length === 0 && (
          <p className="px-4 py-3 text-sm text-[color:var(--color-muted)]">
            Bu sanatçının henüz serisi yok.
          </p>
        )}
      </div>

      <div className="border-t border-[color:var(--color-hairline)] pt-8">
        <h2 className="font-display text-xl mb-5">Yeni seri ekle</h2>
        <SeriesForm
          artistsList={artistsList}
          storageReady={isStorageConfigured()}
          initialArtistSlug={artistFilter}
        />
      </div>
    </div>
  );
}
