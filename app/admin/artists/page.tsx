/**
 * MAIAMARI.STUDIO — Admin sanatçı yönetimi (çok sanatçılı galeri)
 */
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { isDbConfigured } from "@/lib/db/client";
import { isStorageConfigured } from "@/lib/admin/storage";
import { getArtists } from "@/lib/data";
import { ArtistForm } from "@/components/admin/artist-form";
import { TaxonomyDeleteButton } from "@/components/admin/taxonomy-delete-button";

export const dynamic = "force-dynamic";

export default async function AdminArtistsPage() {
  await requireAdmin();
  const artists = await getArtists();

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl mb-1">Sanatçılar</h1>
      <p className="text-sm text-[color:var(--color-muted)] mb-8">
        Galeri sanatçıları. Yeni sanatçı ekleyince eser ve seri eklerken
        seçilebilir; galeride sanatçıya göre gruplanır.
      </p>

      {!isDbConfigured() && (
        <p className="text-sm text-amber-700 border border-amber-300 bg-amber-50 rounded-md px-3 py-2 mb-6">
          Veritabanı bağlı değil.
        </p>
      )}

      <div className="border border-[color:var(--color-hairline)] rounded-lg divide-y divide-[color:var(--color-hairline)] mb-12">
        {artists.map((a) => (
          <div
            key={a.slug}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <div className="min-w-0">
              <div className="font-medium">{a.name}</div>
              {a.title && (
                <p className="text-xs text-[color:var(--color-muted)]">
                  {a.title}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <Link
                href={`/admin/series?artist=${a.slug}`}
                className="text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
              >
                Serileri →
              </Link>
              <Link
                href={`/admin/artists/${a.slug}`}
                className="text-xs underline underline-offset-2 hover:text-[color:var(--color-foreground)]"
              >
                Düzenle
              </Link>
              <TaxonomyDeleteButton
                kind="artist"
                slug={a.slug ?? ""}
                name={a.name}
              />
            </div>
          </div>
        ))}
        {artists.length === 0 && (
          <p className="px-4 py-3 text-sm text-[color:var(--color-muted)]">
            Henüz sanatçı yok.
          </p>
        )}
      </div>

      <div className="border-t border-[color:var(--color-hairline)] pt-8">
        <h2 className="font-display text-xl mb-5">Yeni sanatçı ekle</h2>
        <ArtistForm storageReady={isStorageConfigured()} />
      </div>
    </div>
  );
}
