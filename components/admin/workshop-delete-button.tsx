"use client";
/**
 * Atölye kaydını silen onaylı buton.
 */
import { deleteWorkshop } from "@/app/admin/actions";

export function WorkshopDeleteButton({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  return (
    <form
      action={deleteWorkshop}
      onSubmit={(e) => {
        if (
          !confirm(`"${title}" atölyesini silmek istediğinize emin misiniz?`)
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
