/**
 * MAIAMARI.STUDIO — Admin eser listesi (galeri, kind="artwork")
 */
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { dbGetAllProductsAdmin } from "@/lib/db/products";
import { isDbConfigured } from "@/lib/db/client";
import { getSeries } from "@/lib/data";
import { DeleteButton } from "@/components/admin/delete-button";

export const dynamic = "force-dynamic";

export default async function AdminArtworksPage({
  searchParams,
}: {
  searchParams: Promise<{ series?: string }>;
}) {
  await requireAdmin();
  const { series: seriesFilter } = await searchParams;

  const artworks = await dbGetAllProductsAdmin("artwork", seriesFilter);
  const seriesTitle = Object.fromEntries(
    (await getSeries()).map((s) => [s.slug, s.title]),
  );

  return (
    <div>
      <div className="flex items-center gap-3 text-sm text-[color:var(--color-muted)] mb-2">
        <Link href="/admin/series" className="hover:text-[color:var(--color-foreground)]">
          Seriler
        </Link>
        <span className="opacity-50">/</span>
        <span className="text-[color:var(--color-foreground)]">Eserler</span>
        {seriesFilter && (
          <>
            <span className="opacity-50">·</span>
            <span>{seriesTitle[seriesFilter] ?? seriesFilter}</span>
            <Link
              href="/admin/artworks"
              className="underline underline-offset-2 hover:text-[color:var(--color-foreground)]"
            >
              tümü
            </Link>
          </>
        )}
      </div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-display text-3xl">Eserler</h1>
          <p className="text-sm text-[color:var(--color-muted)] mt-1">
            {artworks.length} eser. Galeride gösterilir; iyzico sonrası satışa
            açılabilir.
          </p>
        </div>
        <Link
          href={
            seriesFilter
              ? `/admin/artworks/new?series=${seriesFilter}`
              : "/admin/artworks/new"
          }
          style={{ color: "var(--color-background)" }}
          className="bg-[color:var(--color-foreground)] px-5 py-2.5 rounded-md text-sm font-medium"
        >
          + Yeni eser
        </Link>
      </div>

      <p className="text-xs text-[color:var(--color-muted)] mb-8">
        Arşivdeki tüm eserler buraya taşındı; buradan düzenleyebilir, yeni eser
        ekleyebilirsiniz. Eserler galeride gösterilir, mağazada satışa
        çıkmaz (iyzico sonrası açılabilir).
      </p>

      {!isDbConfigured() && (
        <p className="text-sm text-amber-700 border border-amber-300 bg-amber-50 rounded-md px-3 py-2 mb-6">
          Veritabanı bağlı değil.
        </p>
      )}

      {artworks.length === 0 ? (
        <p className="text-sm text-[color:var(--color-muted)]">
          Henüz panelden eklenmiş eser yok. Sağ üstten yeni eser ekleyin.
        </p>
      ) : (
        <div className="overflow-x-auto border border-[color:var(--color-hairline)] rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--color-hairline)] text-left text-[color:var(--color-muted)]">
                <th className="font-normal text-xs uppercase tracking-wider px-4 py-3">
                  Eser
                </th>
                <th className="font-normal text-xs uppercase tracking-wider px-4 py-3">
                  Seri
                </th>
                <th className="font-normal text-xs uppercase tracking-wider px-4 py-3">
                  Edisyon
                </th>
                <th className="font-normal text-xs uppercase tracking-wider px-4 py-3">
                  Satış
                </th>
                <th className="font-normal text-xs uppercase tracking-wider px-4 py-3">
                  Yayın
                </th>
                <th className="font-normal text-xs uppercase tracking-wider px-4 py-3 text-right">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody>
              {artworks.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-[color:var(--color-hairline)] last:border-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={a.coverImage || "/images/placeholder.jpg"}
                        alt=""
                        className="h-10 w-10 object-cover rounded border border-[color:var(--color-border)] shrink-0"
                      />
                      <div className="min-w-0 truncate max-w-xs">{a.title}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[color:var(--color-muted)]">
                    {seriesTitle[a.seriesSlug ?? ""] ?? a.seriesSlug ?? "—"}
                  </td>
                  <td className="px-4 py-3">{a.editionSize ?? "—"}</td>
                  <td className="px-4 py-3">
                    {a.forSale ? (
                      Number(a.priceTry) > 0 ? (
                        `₺${Number(a.priceTry).toLocaleString("tr-TR")}`
                      ) : (
                        "Satılık"
                      )
                    ) : (
                      <span className="text-[color:var(--color-muted)]">
                        Sergilik
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[color:var(--color-muted)]">
                    {a.isPublished ? "Yayında" : "Taslak"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/admin/${a.id}`}
                        className="text-xs underline underline-offset-2 hover:text-[color:var(--color-foreground)]"
                      >
                        Düzenle
                      </Link>
                      <DeleteButton id={a.id} title={a.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
