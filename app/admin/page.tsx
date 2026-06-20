/**
 * MAIAMARI.STUDIO — Admin ürün listesi
 * Tüm ürünler (taslaklar dahil); ekle / düzenle / sil.
 */
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { dbGetAllProductsAdmin } from "@/lib/db/products";
import { isDbConfigured } from "@/lib/db/client";
import { getCategories } from "@/lib/data";
import { DeleteButton } from "@/components/admin/delete-button";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  in_stock: "Stokta",
  low_stock: "Son ürün",
  out_of_stock: "Tükendi",
  new: "Yeni",
  sale: "İndirim",
};

export default async function AdminProductsPage() {
  await requireAdmin();

  const products = await dbGetAllProductsAdmin("material");
  const cats = await getCategories();
  const catName = (slug: string) =>
    cats.find((c) => c.slug === slug)?.name ?? slug;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl">Ürünler</h1>
          <p className="text-sm text-[color:var(--color-muted)] mt-1">
            {products.length} ürün
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/health"
            className="text-sm underline underline-offset-2 text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
          >
            Sistem durumu
          </Link>
          <Link
            href="/admin/new"
            style={{ color: "var(--color-background)" }}
            className="bg-[color:var(--color-foreground)] px-5 py-2.5 rounded-md text-sm font-medium"
          >
            + Yeni ürün
          </Link>
        </div>
      </div>

      {!isDbConfigured() && (
        <p className="text-sm text-amber-700 border border-amber-300 bg-amber-50 rounded-md px-3 py-2 mb-6">
          Veritabanı bağlı değil. <code>DATABASE_URL</code> tanımlı olmadan
          ürün yönetimi çalışmaz.
        </p>
      )}

      {products.length === 0 ? (
        <p className="text-sm text-[color:var(--color-muted)]">
          Henüz ürün yok. Sağ üstten yeni ürün ekleyin.
        </p>
      ) : (
        <div className="overflow-x-auto border border-[color:var(--color-hairline)] rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--color-hairline)] text-left text-[color:var(--color-muted)]">
                <th className="font-normal text-xs uppercase tracking-wider px-4 py-3">
                  Ürün
                </th>
                <th className="font-normal text-xs uppercase tracking-wider px-4 py-3">
                  Kategori
                </th>
                <th className="font-normal text-xs uppercase tracking-wider px-4 py-3">
                  Fiyat
                </th>
                <th className="font-normal text-xs uppercase tracking-wider px-4 py-3">
                  Stok
                </th>
                <th className="font-normal text-xs uppercase tracking-wider px-4 py-3">
                  Durum
                </th>
                <th className="font-normal text-xs uppercase tracking-wider px-4 py-3 text-right">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[color:var(--color-hairline)] last:border-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.coverImage || "/images/placeholder.jpg"}
                        alt=""
                        className="h-10 w-10 object-cover rounded border border-[color:var(--color-border)] shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="truncate max-w-xs">{p.title}</div>
                        {!p.isPublished && (
                          <span className="text-[11px] text-amber-700">
                            Taslak (yayında değil)
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[color:var(--color-muted)]">
                    {catName(p.categorySlug)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {Number(p.priceTry).toLocaleString("tr-TR")} TL
                  </td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3 text-[color:var(--color-muted)]">
                    {STATUS_LABEL[p.status] ?? p.status}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/admin/${p.id}`}
                        className="text-xs underline underline-offset-2 hover:text-[color:var(--color-foreground)]"
                      >
                        Düzenle
                      </Link>
                      <DeleteButton id={p.id} title={p.title} />
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
