"use client";
/**
 * Sanatçı ekleme/düzenleme formu. saveArtist server action'ına POST eder.
 */
import { useActionState, useState } from "react";
import type { ActionState } from "@/app/admin/actions";
import { saveArtist } from "@/app/admin/actions";
import { Dropzone } from "./dropzone";

const labelCls =
  "block text-xs tracking-[0.15em] uppercase text-[color:var(--color-muted)] mb-2";
const inputCls =
  "w-full border border-[color:var(--color-border)] rounded-md px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-[color:var(--color-foreground)]";

export type ArtistDefaults = {
  slug: string;
  name: string;
  title: string;
  bio: string;
  coverImage: string;
  instagramHandle: string;
  instagramUrl: string;
  sortOrder: number;
};

export function ArtistForm({
  defaults,
  storageReady,
}: {
  defaults?: ArtistDefaults;
  storageReady: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    saveArtist,
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
          <label className={labelCls} htmlFor="a-name">
            Sanatçı adı *
          </label>
          <input
            id="a-name"
            name="name"
            required
            defaultValue={defaults?.name}
            className={inputCls}
            placeholder="Örn. Duygu Sinan"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="a-title">
            Unvan / rol
          </label>
          <input
            id="a-title"
            name="title"
            defaultValue={defaults?.title}
            className={inputCls}
            placeholder="Sanatçı · Atölye kurucusu"
          />
        </div>
      </div>
      <div>
        <label className={labelCls} htmlFor="a-bio">
          Biyografi
        </label>
        <textarea
          id="a-bio"
          name="bio"
          rows={3}
          defaultValue={defaults?.bio}
          className={inputCls}
          placeholder="Sanatçı sayfasında görünen tanıtım"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className={labelCls} htmlFor="a-ig-handle">
            Instagram kullanıcı adı
          </label>
          <input
            id="a-ig-handle"
            name="instagramHandle"
            defaultValue={defaults?.instagramHandle}
            className={inputCls}
            placeholder="duygu.sinan.printmaker"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="a-ig-url">
            Instagram linki
          </label>
          <input
            id="a-ig-url"
            name="instagramUrl"
            defaultValue={defaults?.instagramUrl}
            className={inputCls}
            placeholder="https://instagram.com/..."
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Portre / kapak görseli</label>
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

      <div className="max-w-[140px]">
        <label className={labelCls} htmlFor="a-sort">
          Sıra
        </label>
        <input
          id="a-sort"
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
        {pending ? "Kaydediliyor..." : isEdit ? "Kaydet" : "Sanatçı ekle"}
      </button>
    </form>
  );
}
