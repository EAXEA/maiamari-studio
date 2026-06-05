/**
 * MAIAMARI.STUDIO — Seri düzenleme
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { isStorageConfigured } from "@/lib/admin/storage";
import { dbGetSeriesRow } from "@/lib/db/series";
import { getArtists } from "@/lib/data";
import { SeriesForm } from "@/components/admin/series-form";

export const dynamic = "force-dynamic";

export default async function EditSeriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  const [row, artists] = await Promise.all([
    dbGetSeriesRow(slug),
    getArtists(),
  ]);
  if (!row) notFound();

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/series"
        className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
      >
        ← Seriler
      </Link>
      <h1 className="font-display text-3xl mt-3 mb-1">Seriyi düzenle</h1>
      <p className="text-sm text-[color:var(--color-muted)] mb-8">/galeri/{row.slug}</p>
      <SeriesForm
        defaults={{
          slug: row.slug,
          title: row.title,
          subtitle: row.subtitle,
          description: row.description,
          year: row.year == null ? "" : String(row.year),
          yearRange: row.yearRange,
          coverImage: row.coverImage,
          paperNote: row.paperNote,
          artistSlug: row.artistSlug,
          sortOrder: row.sortOrder,
        }}
        artistsList={artists.map((a) => ({ slug: a.slug ?? "", name: a.name }))}
        storageReady={isStorageConfigured()}
      />
    </div>
  );
}
