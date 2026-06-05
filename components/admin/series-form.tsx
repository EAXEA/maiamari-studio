"use client";
/**
 * Seri ekleme/düzenleme formu. saveSeries server action'ına POST eder.
 * Her seri bir sanatçıya aittir (artistSlug).
 */
import { useActionState, useState } from "react";
import type { ActionState } from "@/app/admin/actions";
import { saveSeries } from "@/app/admin/actions";
import { Dropzone } from "./dropzone";

const labelCls =
  "block text-xs tracking-[0.15em] uppercase text-[color:var(--color-muted)] mb-2";
const inputCls =
  "w-full border border-[color:var(--color-border)] rounded-md px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-[color:var(--color-foreground)]";

export type SeriesDefaults = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  year: string;
  yearRange: string;
  coverImage: string;
  paperNote: string;
  artistSlug: string;
  sortOrder: number;
};

export function SeriesForm({
  defaults,
  artistsList,
  storageReady,
  initialArtistSlug,
}: {
  defaults?: SeriesDefaults;
  artistsList: { slug: string; name: string }[];
  storageReady: boolean;
  /** Yeni seri formunda ön-seçili sanatçı (drill-down'dan). */
  initialArtistSlug?: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    saveSeries,
    undefined,
  );
  const [preview, setPreview] = useState<string | null>(
    defaults?.coverImage || null,
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
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className={labelCls} htmlFor="s-title">
            Seri adı *
          </label>
          <input
            id="s-title"
            name="title"
            required
            defaultValue={defaults?.title}
            className={inputCls}
            placeholder="Örn. Kapılar"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="s-artist">
            Sanatçı *
          </label>
          <select
            id="s-artist"
            name="artistSlug"
            defaultValue={
              defaults?.artistSlug || initialArtistSlug || artistsList[0]?.slug
            }
            className={inputCls}
          >
            {artistsList.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls} htmlFor="s-subtitle">
          Alt başlık
        </label>
        <input
          id="s-subtitle"
          name="subtitle"
          defaultValue={defaults?.subtitle}
          className={inputCls}
          placeholder="Linol baskı · 2013–2018"
        />
      </div>
      <div>
        <label className={labelCls} htmlFor="s-desc">
          Açıklama
        </label>
        <textarea
          id="s-desc"
          name="description"
          rows={3}
          defaultValue={defaults?.description}
          className={inputCls}
        />
      </div>
      <div className="grid sm:grid-cols-3 gap-5">
        <div>
          <label className={labelCls} htmlFor="s-year">
            Yıl
          </label>
          <input
            id="s-year"
            name="year"
            inputMode="numeric"
            defaultValue={defaults?.year}
            className={inputCls}
            placeholder="2018"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="s-yearrange">
            Yıl aralığı
          </label>
          <input
            id="s-yearrange"
            name="yearRange"
            defaultValue={defaults?.yearRange}
            className={inputCls}
            placeholder="2013–2018"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="s-sort">
            Sıra
          </label>
          <input
            id="s-sort"
            name="sortOrder"
            type="number"
            defaultValue={defaults?.sortOrder ?? 0}
            className={inputCls}
          />
        </div>
      </div>
      <div>
        <label className={labelCls} htmlFor="s-paper">
          Kâğıt notu
        </label>
        <input
          id="s-paper"
          name="paperNote"
          defaultValue={defaults?.paperNote}
          className={inputCls}
          placeholder="Japon el yapımı kâğıt"
        />
      </div>

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
          defaultValue={defaults?.coverImage}
          className={inputCls}
          placeholder="/images/... veya https://..."
          onChange={(e) => setPreview(e.target.value || null)}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        style={{ color: "var(--color-background)" }}
        className="bg-[color:var(--color-foreground)] px-6 py-2.5 rounded-md text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Kaydediliyor..." : isEdit ? "Kaydet" : "Seri ekle"}
      </button>
    </form>
  );
}
