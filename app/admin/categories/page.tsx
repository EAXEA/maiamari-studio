/**
 * MAIAMARI.STUDIO — Admin kategori yönetimi
 * Kategorileri listeler, yeni kategori ekleme formu sunar.
 */
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { isDbConfigured } from "@/lib/db/client";
import { getCategories } from "@/lib/data";
import { CategoryForm } from "@/components/admin/category-form";
import { CategoryDeleteButton } from "@/components/admin/category-delete-button";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const cats = await getCategories();

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl mb-1">Kategoriler</h1>
      <p className="text-sm text-[color:var(--color-muted)] mb-8">
        Mağaza kategorileri. Yeni kategori ekleyince ürün formundaki listede ve
        mağaza menüsünde görünür.
      </p>

      {!isDbConfigured() && (
        <p className="text-sm text-amber-700 border border-amber-300 bg-amber-50 rounded-md px-3 py-2 mb-6">
          Veritabanı bağlı değil. Kategori yönetimi <code>DATABASE_URL</code>{" "}
          olmadan çalışmaz.
        </p>
      )}

      {/* Mevcut kategoriler */}
      <div className="border border-[color:var(--color-hairline)] rounded-lg divide-y divide-[color:var(--color-hairline)] mb-12">
        {cats.map((c) => (
          <div
            key={c.slug}
            className="flex items-start justify-between gap-4 px-4 py-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{c.name}</span>
                <Link
                  href={`/shop/${c.slug}`}
                  target="_blank"
                  className="text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
                >
                  /{c.slug} ↗
                </Link>
              </div>
              {c.description && (
                <p className="text-xs text-[color:var(--color-muted)] mt-1 line-clamp-2">
                  {c.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <Link
                href={`/admin/categories/${c.slug}`}
                className="text-xs underline underline-offset-2 hover:text-[color:var(--color-foreground)]"
              >
                Düzenle
              </Link>
              <CategoryDeleteButton slug={c.slug} name={c.name} />
            </div>
          </div>
        ))}
      </div>

      {/* Yeni kategori */}
      <div className="border-t border-[color:var(--color-hairline)] pt-8">
        <h2 className="font-display text-xl mb-5">Yeni kategori ekle</h2>
        <CategoryForm />
      </div>
    </div>
  );
}
