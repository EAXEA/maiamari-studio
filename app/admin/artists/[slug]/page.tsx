/**
 * MAIAMARI.STUDIO — Sanatçı düzenleme
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { isStorageConfigured } from "@/lib/admin/storage";
import { dbGetArtistRow } from "@/lib/db/artists";
import { ArtistForm } from "@/components/admin/artist-form";

export const dynamic = "force-dynamic";

export default async function EditArtistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  const row = await dbGetArtistRow(slug);
  if (!row) notFound();

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/artists"
        className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
      >
        ← Sanatçılar
      </Link>
      <h1 className="font-display text-3xl mt-3 mb-8">Sanatçıyı düzenle</h1>
      <ArtistForm
        defaults={{
          slug: row.slug,
          name: row.name,
          title: row.title,
          bio: row.bio,
          coverImage: row.coverImage,
          instagramHandle: row.instagramHandle,
          instagramUrl: row.instagramUrl,
          sortOrder: row.sortOrder,
        }}
        storageReady={isStorageConfigured()}
      />
    </div>
  );
}
