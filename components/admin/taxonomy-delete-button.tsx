"use client";
/**
 * Sanatçı veya seri silen onaylı buton.
 */
import { deleteArtist, deleteSeries } from "@/app/admin/actions";

export function TaxonomyDeleteButton({
  kind,
  slug,
  name,
}: {
  kind: "artist" | "series";
  slug: string;
  name: string;
}) {
  const action = kind === "artist" ? deleteArtist : deleteSeries;
  const word = kind === "artist" ? "sanatçısını" : "serisini";
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            `"${name}" ${word} silmek istediğinize emin misiniz? Bağlı eserler silinmez ama bu ${kind === "artist" ? "sanatçıya" : "seriye"} bağlı kalır.`,
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
