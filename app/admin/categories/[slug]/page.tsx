/**
 * MAIAMARI.STUDIO — Kategori düzenleme
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { dbGetCategoryRow } from "@/lib/db/categories";
import { CategoryForm } from "@/components/admin/category-form";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  const row = await dbGetCategoryRow(slug);
  if (!row) notFound();

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/categories"
        className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
      >
        ← Kategoriler
      </Link>
      <h1 className="font-display text-3xl mt-3 mb-8">Kategoriyi düzenle</h1>
      <CategoryForm
        defaults={{
          slug: row.slug,
          name: row.name,
          nameEn: row.nameEn,
          description: row.description,
          sortOrder: row.sortOrder,
        }}
      />
    </div>
  );
}
