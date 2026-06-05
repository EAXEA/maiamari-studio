"use client";
/**
 * Atölye ekleme/düzenleme formu. saveWorkshop server action'ına POST eder.
 * originalSlug boşsa yeni kayıt; doluysa o slug güncellenir.
 */
import { useActionState, useState } from "react";
import type { ActionState } from "@/app/admin/actions";
import { saveWorkshop } from "@/app/admin/actions";
import { Dropzone } from "./dropzone";

const labelCls =
  "block text-xs tracking-[0.15em] uppercase text-[color:var(--color-muted)] mb-2";
const inputCls =
  "w-full border border-[color:var(--color-border)] rounded-md px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-[color:var(--color-foreground)]";

export type WorkshopDefaults = {
  slug: string;
  title: string;
  instructor: string;
  instructorInstagramHandle: string;
  instructorInstagramUrl: string;
  schedule: string;
  description: string;
  image: string;
  imageAlt: string;
  priceTry: string;
  isPublished: boolean;
  sortOrder: number;
};

export function WorkshopForm({
  defaults,
  storageReady,
}: {
  defaults?: WorkshopDefaults;
  storageReady: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    saveWorkshop,
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
        <label className={labelCls} htmlFor="w-title">
          Başlık *
        </label>
        <input
          id="w-title"
          name="title"
          required
          defaultValue={defaults?.title}
          className={inputCls}
          placeholder="Örn. Linol Baskı Workshop"
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="w-instructor">
          Eğitmen
        </label>
        <input
          id="w-instructor"
          name="instructor"
          defaultValue={defaults?.instructor}
          className={inputCls}
          placeholder="Duygu Sinan"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className={labelCls} htmlFor="w-ig-handle">
            Eğitmen Instagram kullanıcı adı
          </label>
          <input
            id="w-ig-handle"
            name="instructorInstagramHandle"
            defaultValue={defaults?.instructorInstagramHandle}
            className={inputCls}
            placeholder="duygu.sinan.printmaker"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="w-ig-url">
            Eğitmen Instagram linki
          </label>
          <input
            id="w-ig-url"
            name="instructorInstagramUrl"
            defaultValue={defaults?.instructorInstagramUrl}
            className={inputCls}
            placeholder="https://www.instagram.com/..."
          />
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="w-schedule">
          Program / tarih
        </label>
        <input
          id="w-schedule"
          name="schedule"
          defaultValue={defaults?.schedule}
          className={inputCls}
          placeholder="Aylık · Küçük grup"
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="w-description">
          Açıklama
        </label>
        <textarea
          id="w-description"
          name="description"
          rows={4}
          defaultValue={defaults?.description}
          className={inputCls}
          placeholder="Atölyenin kısa tanımı (opsiyonel)."
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
          placeholder="/images/atolye/... veya https://..."
          onChange={(e) => setPreview(e.target.value || null)}
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="w-imagealt">
          Kapak alt metni (erişilebilirlik)
        </label>
        <input
          id="w-imagealt"
          name="imageAlt"
          defaultValue={defaults?.imageAlt}
          className={inputCls}
          placeholder="Görselin kısa açıklaması"
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
        <div className="max-w-[160px]">
          <label className={labelCls} htmlFor="w-price">
            Fiyat (TL, ops.)
          </label>
          <input
            id="w-price"
            name="priceTry"
            defaultValue={defaults?.priceTry}
            className={inputCls}
            placeholder="örn. 750"
          />
        </div>
        <div className="max-w-[120px]">
          <label className={labelCls} htmlFor="w-sort">
            Sıra
          </label>
          <input
            id="w-sort"
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
        {pending ? "Kaydediliyor..." : isEdit ? "Kaydet" : "Atölye ekle"}
      </button>
    </form>
  );
}
