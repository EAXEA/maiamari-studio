"use client";
/**
 * Kategori ekleme/düzenleme formu. saveCategory server action'ına POST eder.
 * originalSlug boşsa yeni kategori; doluysa o slug güncellenir.
 */
import { useActionState } from "react";
import type { ActionState } from "@/app/admin/actions";
import { saveCategory } from "@/app/admin/actions";

const labelCls =
  "block text-xs tracking-[0.15em] uppercase text-[color:var(--color-muted)] mb-2";
const inputCls =
  "w-full border border-[color:var(--color-border)] rounded-md px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-[color:var(--color-foreground)]";

export function CategoryForm({
  defaults,
}: {
  defaults?: {
    slug: string;
    name: string;
    nameEn: string;
    description: string;
    sortOrder: number;
  };
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    saveCategory,
    undefined,
  );
  const isEdit = !!defaults?.slug;

  return (
    <form action={action} className="space-y-5">
      {defaults?.slug && (
        <input type="hidden" name="originalSlug" value={defaults.slug} />
      )}
      {state?.error && (
        <p className="text-sm text-red-600 border border-red-300 bg-red-50 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className={labelCls} htmlFor="name">
            Kategori adı *
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={defaults?.name}
            className={inputCls}
            placeholder="Örn. Defterler"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="nameEn">
            İngilizce ad
          </label>
          <input
            id="nameEn"
            name="nameEn"
            defaultValue={defaults?.nameEn}
            className={inputCls}
            placeholder="Notebooks"
          />
        </div>
      </div>
      <div>
        <label className={labelCls} htmlFor="description">
          Açıklama
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={defaults?.description}
          className={inputCls}
          placeholder="Kategori sayfasında görünen kısa metin"
        />
      </div>
      <div className="max-w-[140px]">
        <label className={labelCls} htmlFor="sortOrder">
          Sıra
        </label>
        <input
          id="sortOrder"
          name="sortOrder"
          type="number"
          defaultValue={defaults?.sortOrder ?? 0}
          className={inputCls}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        style={{ color: "var(--color-background)" }}
        className="bg-[color:var(--color-foreground)] px-6 py-2.5 rounded-md text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Kaydediliyor..." : isEdit ? "Kaydet" : "Kategori ekle"}
      </button>
    </form>
  );
}
