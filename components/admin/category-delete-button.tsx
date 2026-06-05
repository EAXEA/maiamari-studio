"use client";
/**
 * Kategori silen onaylı buton. deleteCategory server action'ına POST eder.
 */
import { deleteCategory } from "@/app/admin/actions";

export function CategoryDeleteButton({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  return (
    <form
      action={deleteCategory}
      onSubmit={(e) => {
        if (
          !confirm(
            `"${name}" kategorisini silmek istediğinize emin misiniz? Ürünler silinmez ama bu kategoriye bağlı kalır.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="slug" value={slug} />
      <button type="submit" className="text-xs text-red-600 hover:underline">
        Sil
      </button>
    </form>
  );
}
