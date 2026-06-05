"use client";
/**
 * Ürünü silen onaylı buton. deleteProduct server action'ına POST eder.
 */
import { deleteProduct } from "@/app/admin/actions";

export function DeleteButton({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={deleteProduct}
      onSubmit={(e) => {
        if (!confirm(`"${title}" ürününü silmek istediğinize emin misiniz?`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-xs text-red-600 hover:underline"
        title="Sil"
      >
        Sil
      </button>
    </form>
  );
}
