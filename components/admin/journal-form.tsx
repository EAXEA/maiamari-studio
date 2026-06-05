"use client";
/**
 * Günce ekleme/düzenleme formu. saveJournal server action'ına POST eder.
 * originalSlug boşsa yeni kayıt; doluysa o slug güncellenir.
 */
import { useActionState, useState } from "react";
import type { ActionState } from "@/app/admin/actions";
import { saveJournal } from "@/app/admin/actions";
import { Dropzone } from "./dropzone";

const labelCls =
  "block text-xs tracking-[0.15em] uppercase text-[color:var(--color-muted)] mb-2";
const inputCls =
  "w-full border border-[color:var(--color-border)] rounded-md px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-[color:var(--color-foreground)]";

export type JournalDefaults = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  date: string;
  dateLabel: string;
  category: string;
  location: string;
  locationUrl: string;
  image: string;
  imageAlt: string;
  gallery: string[];
  instagramUrl: string;
  isPublished: boolean;
  sortOrder: number;
};

export function JournalForm({
  defaults,
  storageReady,
}: {
  defaults?: JournalDefaults;
  storageReady: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    saveJournal,
    undefined,
  );
  const [preview, setPreview] = useState<string | null>(
    defaults?.image || null,
  );
  const isEdit = !!defaults?.slug;

  return (
    <form action={action} className="space-y-5 max-w-xl">
      {defaults?.slug && (
        <input type="hidden" name="originalSlug" value={defaults.slug} />
      )}
      {state?.error && (
        <p className="text-sm text-red-600 border border-red-300 bg-red-50 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}

      <div>
        <label className={labelCls} htmlFor="j-title">
          Başlık *
        </label>
        <input
          id="j-title"
          name="title"
          required
          defaultValue={defaults?.title}
          className={inputCls}
          placeholder="Örn. UNITE'da Bağımsız Sanatçı Sergisi"
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        <div>
          <label className={labelCls} htmlFor="j-date">
            Tarih *
          </label>
          <input
            id="j-date"
            name="date"
            type="date"
            required
            defaultValue={defaults?.date}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="j-datelabel">
            Tarih etiketi
          </label>
          <input
            id="j-datelabel"
            name="dateLabel"
            defaultValue={defaults?.dateLabel}
            className={inputCls}
            placeholder="Ocak 2026"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="j-category">
            Kategori
          </label>
          <input
            id="j-category"
            name="category"
            defaultValue={defaults?.category}
            className={inputCls}
            placeholder="Etkinlik"
          />
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="j-excerpt">
          Özet
        </label>
        <textarea
          id="j-excerpt"
          name="excerpt"
          rows={2}
          defaultValue={defaults?.excerpt}
          className={inputCls}
          placeholder="Kart üzerinde görünen kısa giriş."
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="j-body">
          Gövde metni
        </label>
        <textarea
          id="j-body"
          name="body"
          rows={6}
          defaultValue={defaults?.body}
          className={inputCls}
          placeholder="Karta gelince açılan uzun metin. Paragraflar boş satırla ayrılır."
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className={labelCls} htmlFor="j-location">
            Konum
          </label>
          <input
            id="j-location"
            name="location"
            defaultValue={defaults?.location}
            className={inputCls}
            placeholder="UNITE Ortak Mekan · Ankara"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="j-locationurl">
            Konum linki
          </label>
          <input
            id="j-locationurl"
            name="locationUrl"
            defaultValue={defaults?.locationUrl}
            className={inputCls}
            placeholder="https://..."
          />
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="j-instagram">
          Instagram linki
        </label>
        <input
          id="j-instagram"
          name="instagramUrl"
          defaultValue={defaults?.instagramUrl}
          className={inputCls}
          placeholder="https://www.instagram.com/p/..."
        />
      </div>

      {/* Kapak görseli */}
      <div>
        <label className={labelCls}>Kapak görseli</label>
        {preview && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={preview}
            alt="Önizleme"
            className="h-24 w-24 object-cover rounded-md border border-[color:var(--color-border)] mb-3"
          />
        )}
        {storageReady && (
          <div className="mb-3">
            <Dropzone name="coverFile" hint="tek görsel" />
          </div>
        )}
        <input
          name="coverImagePath"
          defaultValue={defaults?.image}
          className={inputCls}
          placeholder="/images/journal/... veya https://..."
          onChange={(e) => setPreview(e.target.value || null)}
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="j-imagealt">
          Kapak alt metni (erişilebilirlik)
        </label>
        <input
          id="j-imagealt"
          name="imageAlt"
          defaultValue={defaults?.imageAlt}
          className={inputCls}
          placeholder="Görselin kısa açıklaması"
        />
      </div>

      {/* Galeri (ek görseller) */}
      <div>
        <label className={labelCls} htmlFor="j-gallery">
          Ek görseller
        </label>
        {storageReady && (
          <div className="mb-3">
            <Dropzone name="galleryFiles" multiple hint="çoklu görsel" />
          </div>
        )}
        <textarea
          id="j-gallery"
          name="galleryText"
          rows={3}
          defaultValue={defaults?.gallery?.join("\n")}
          className={inputCls}
          placeholder="Her satıra bir görsel yolu/URL. Kapak otomatik ilk sırada sayılır."
        />
      </div>

      <div className="flex items-center gap-8">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={defaults?.isPublished ?? true}
            className="h-4 w-4"
          />
          Yayında
        </label>
        <div className="max-w-[120px]">
          <label className={labelCls} htmlFor="j-sort">
            Sıra
          </label>
          <input
            id="j-sort"
            name="sortOrder"
            type="number"
            defaultValue={defaults?.sortOrder ?? 0}
            className={inputCls}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        style={{ color: "var(--color-background)" }}
        className="bg-[color:var(--color-foreground)] px-6 py-2.5 rounded-md text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Kaydediliyor..." : isEdit ? "Kaydet" : "Günce ekle"}
      </button>
    </form>
  );
}
