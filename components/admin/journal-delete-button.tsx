"use client";
/**
 * Günce kaydını silen onaylı buton.
 */
import { deleteJournal } from "@/app/admin/actions";

export function JournalDeleteButton({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  return (
    <form
      action={deleteJournal}
      onSubmit={(e) => {
        if (
          !confirm(`"${title}" günce kaydını silmek istediğinize emin misiniz?`)
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
