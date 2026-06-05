"use client";
/**
 * MAIAMARI.STUDIO — Ürün / Eser ekleme-düzenleme formu (client)
 * -------------------------------------------------------------
 * Tek form, iki tür:
 *  - kind="material" → mağaza ürünü (fiyat, kategori, stok…)
 *  - kind="artwork"  → galeri eseri (seri + künye: teknik, kâğıt, ölçü…)
 * Server action'a (saveProduct) gönderir.
 */
import { useActionState, useState } from "react";
import Link from "next/link";
import type { ActionState } from "@/app/admin/actions";
import type { Category } from "@/lib/types";
import { Dropzone } from "./dropzone";

export type ProductFormDefaults = {
  id: string;
  kind: "material" | "artwork";
  title: string;
  description: string;
  // mağaza alanları
  priceTry: string;
  compareAtTry: string;
  categorySlug: string;
  stock: number;
  status: string;
  sourceUrl: string;
  // eser künyesi
  artistSlug: string;
  seriesSlug: string;
  technique: string;
  paper: string;
  dimensions: string;
  editionSize: string;
  firstSerial: string;
  year: string;
  artist: string;
  /** Eser satılık mı (kind="artwork"). Materyal için her zaman true. */
  forSale: boolean;
  // ortak
  coverImage: string;
  gallery: string[];
  isPublished: boolean;
  sortOrder: number;
};

const STATUS_OPTIONS = [
  { value: "in_stock", label: "Stokta" },
  { value: "low_stock", label: "Son ürün (az stok)" },
  { value: "out_of_stock", label: "Tükendi" },
  { value: "new", label: "Yeni" },
  { value: "sale", label: "İndirimde" },
];

const labelCls =
  "block text-xs tracking-[0.15em] uppercase text-[color:var(--color-muted)] mb-2";
const inputCls =
  "w-full border border-[color:var(--color-border)] rounded-md px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-[color:var(--color-foreground)]";

export function ProductForm({
  action,
  defaults,
  categories,
  seriesList,
  artistsList,
  storageReady,
  isNew,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  defaults: ProductFormDefaults;
  categories: Category[];
  seriesList: { slug: string; title: string; artistSlug: string }[];
  artistsList: { slug: string; name: string }[];
  storageReady: boolean;
  isNew: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    defaults.coverImage || null,
  );
  const isArtwork = defaults.kind === "artwork";
  const noun = isArtwork ? "Eser" : "Ürün";

  // Eser satılık mı — işaretliyse fiyat alanları görünür.
  const [forSale, setForSale] = useState<boolean>(defaults.forSale);

  // Seri listesi seçili sanatçıya göre filtrelenir (çok sanatçılı galeri).
  const [selectedArtist, setSelectedArtist] = useState<string>(
    defaults.artistSlug || artistsList[0]?.slug || "",
  );
  const seriesForArtist = seriesList.filter(
    (s) => s.artistSlug === selectedArtist,
  );

  return (
    <form action={formAction} className="max-w-2xl space-y-7">
      <input type="hidden" name="id" value={defaults.id} />
      <input type="hidden" name="kind" value={defaults.kind} />

      {state?.error && (
        <p className="text-sm text-red-600 border border-red-300 bg-red-50 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}

      {/* Başlık */}
      <div>
        <label className={labelCls} htmlFor="title">
          {noun} adı *
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={defaults.title}
          className={inputCls}
          placeholder={
            isArtwork
              ? "Örn. 12- Galata Kulesi"
              : "Örn. Linol Baskı Boyası - Siyah"
          }
        />
      </div>

      {/* Açıklama */}
      <div>
        <label className={labelCls} htmlFor="description">
          Açıklama
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={defaults.description}
          className={inputCls}
          placeholder={isArtwork ? "Eser hakkında kısa not" : "Ürün hakkında kısa bilgi"}
        />
      </div>

      {isArtwork ? (
        /* ---------------- ESER KÜNYESİ ---------------- */
        <div className="space-y-7 border-t border-[color:var(--color-hairline)] pt-6">
          <p className="text-xs tracking-[0.15em] uppercase text-[color:var(--color-muted)]">
            Künye (sanatçı arşiv formatı)
          </p>
          <div>
            <label className={labelCls} htmlFor="artistSlug">
              Sanatçı *
            </label>
            <select
              id="artistSlug"
              name="artistSlug"
              value={selectedArtist}
              onChange={(e) => setSelectedArtist(e.target.value)}
              className={inputCls}
            >
              {artistsList.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={labelCls} htmlFor="seriesSlug">
                Seri *
              </label>
              <select
                id="seriesSlug"
                name="seriesSlug"
                defaultValue={defaults.seriesSlug || seriesForArtist[0]?.slug}
                key={selectedArtist /* sanatçı değişince seri sıfırlanır */}
                className={inputCls}
              >
                {seriesForArtist.length === 0 ? (
                  <option value="">Bu sanatçının serisi yok</option>
                ) : (
                  seriesForArtist.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.title}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="year">
                Yıl
              </label>
              <input
                id="year"
                name="year"
                inputMode="numeric"
                defaultValue={defaults.year}
                className={inputCls}
                placeholder="2016"
              />
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="technique">
              Teknik
            </label>
            <input
              id="technique"
              name="technique"
              defaultValue={defaults.technique}
              className={inputCls}
              placeholder="X3- Linolyum Baskı"
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="paper">
              Kâğıt
            </label>
            <input
              id="paper"
              name="paper"
              defaultValue={defaults.paper}
              className={inputCls}
              placeholder="250 gr Amerikan Bristol"
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="dimensions">
              Ölçü
            </label>
            <input
              id="dimensions"
              name="dimensions"
              defaultValue={defaults.dimensions}
              className={inputCls}
              placeholder="50 cm X 70 cm (Kâğıt), 30 cm X 41 cm (Baskı Alanı)"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={labelCls} htmlFor="editionSize">
                Edisyon adedi
              </label>
              <input
                id="editionSize"
                name="editionSize"
                type="number"
                min={0}
                defaultValue={defaults.editionSize}
                className={inputCls}
                placeholder="10"
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="firstSerial">
                İlk seri no
              </label>
              <input
                id="firstSerial"
                name="firstSerial"
                defaultValue={defaults.firstSerial}
                className={inputCls}
                placeholder="#BASKI-2016-0577"
              />
            </div>
          </div>

          {/* Satılık anahtarı — sergi/koleksiyon eserleri satışa kapatılır. */}
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="forSale"
              checked={forSale}
              onChange={(e) => setForSale(e.target.checked)}
              className="h-4 w-4 mt-0.5"
            />
            <span>
              Bu eser satılık
              <span className="block text-xs text-[color:var(--color-muted)] mt-0.5">
                İşaretliyse fiyat girilir. Sergi/koleksiyon eseriyse boş bırakın.
              </span>
            </span>
          </label>

          {forSale && (
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className={labelCls} htmlFor="priceTry">
                  Fiyat (TL)
                </label>
                <input
                  id="priceTry"
                  name="priceTry"
                  inputMode="decimal"
                  defaultValue={defaults.priceTry}
                  className={inputCls}
                  placeholder="Örn. 2500"
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="compareAtTry">
                  Eski / üstü çizili fiyat
                </label>
                <input
                  id="compareAtTry"
                  name="compareAtTry"
                  inputMode="decimal"
                  defaultValue={defaults.compareAtTry}
                  className={inputCls}
                  placeholder="boş bırakılabilir"
                />
              </div>
            </div>
          )}

          <p className="text-xs text-[color:var(--color-muted)] bg-[color:var(--color-surface)] border border-[color:var(--color-hairline)] rounded-md px-3 py-2">
            {forSale
              ? "Fiyatı şimdiden girebilirsiniz, kayıtlı kalır. Eserler iyzico altyapısı kurulana kadar mağazada satışa açılmaz, yalnızca galeride görünür."
              : "Bu eser satılık değil; yalnızca galeride sergilenir. Fiyat istenmez."}
          </p>
        </div>
      ) : (
        /* ---------------- MAĞAZA ÜRÜNÜ ---------------- */
        <div className="space-y-7">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={labelCls} htmlFor="priceTry">
                Fiyat (TL) *
              </label>
              <input
                id="priceTry"
                name="priceTry"
                required
                inputMode="decimal"
                defaultValue={defaults.priceTry}
                className={inputCls}
                placeholder="294"
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="compareAtTry">
                Eski / üstü çizili fiyat
              </label>
              <input
                id="compareAtTry"
                name="compareAtTry"
                inputMode="decimal"
                defaultValue={defaults.compareAtTry}
                className={inputCls}
                placeholder="boş bırakılabilir"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={labelCls} htmlFor="categorySlug">
                Kategori *
              </label>
              <select
                id="categorySlug"
                name="categorySlug"
                defaultValue={defaults.categorySlug || categories[0]?.slug}
                className={inputCls}
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="status">
                Stok durumu
              </label>
              <select
                id="status"
                name="status"
                defaultValue={defaults.status}
                className={inputCls}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={labelCls} htmlFor="stock">
                Stok adedi
              </label>
              <input
                id="stock"
                name="stock"
                type="number"
                min={0}
                defaultValue={defaults.stock}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="sourceUrl">
                Kaynak / Shopier linki
              </label>
              <input
                id="sourceUrl"
                name="sourceUrl"
                defaultValue={defaults.sourceUrl}
                className={inputCls}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Kapak görseli */}
      <div className="border-t border-[color:var(--color-hairline)] pt-6">
        <label className={labelCls}>Kapak görseli</label>
        {coverPreview && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={coverPreview}
            alt="Kapak önizleme"
            className="h-32 w-32 object-cover rounded-md border border-[color:var(--color-border)] mb-3"
          />
        )}
        {storageReady ? (
          <div className="mb-3">
            <Dropzone name="coverFile" hint="tek görsel" />
          </div>
        ) : (
          <p className="text-xs text-[color:var(--color-muted)] mb-2">
            Dosya yükleme kapalı (Supabase secret key eklenince açılır).
            Şimdilik aşağıya görsel yolu veya URL girebilirsiniz.
          </p>
        )}
        <input
          name="coverImagePath"
          defaultValue={defaults.coverImage}
          className={inputCls}
          placeholder="/images/... veya https://..."
          onChange={(e) => setCoverPreview(e.target.value || null)}
        />
      </div>

      {/* Galeri görselleri */}
      <div>
        <label className={labelCls}>Ek görseller</label>
        {storageReady && (
          <div className="mb-3">
            <Dropzone name="galleryFiles" multiple hint="birden çok görsel" />
          </div>
        )}
        <textarea
          name="galleryText"
          rows={3}
          defaultValue={defaults.gallery.join("\n")}
          className={inputCls}
          placeholder="Her satıra bir görsel yolu/URL"
        />
        <p className="text-xs text-[color:var(--color-muted)] mt-1">
          Yüklenen dosyalar bu listenin sonuna eklenir.
        </p>
      </div>

      {/* Sıra + yayın */}
      <div className="grid grid-cols-2 gap-5 items-end">
        <div>
          <label className={labelCls} htmlFor="sortOrder">
            Sıra (küçük önce)
          </label>
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={defaults.sortOrder}
            className={inputCls}
          />
        </div>
        <label className="flex items-center gap-3 text-sm pb-2">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={defaults.isPublished}
            className="h-4 w-4"
          />
          {isArtwork ? "Galeride yayında olsun" : "Sitede yayında olsun"}
        </label>
      </div>

      {/* Aksiyonlar */}
      <div className="flex items-center gap-4 border-t border-[color:var(--color-hairline)] pt-6">
        <button
          type="submit"
          disabled={pending}
          style={{ color: "var(--color-background)" }}
          className="bg-[color:var(--color-foreground)] px-6 py-2.5 rounded-md text-sm font-medium disabled:opacity-50"
        >
          {pending
            ? "Kaydediliyor..."
            : isNew
              ? `${noun}i ekle`
              : "Değişiklikleri kaydet"}
        </button>
        <Link
          href={isArtwork ? "/admin/artworks" : "/admin"}
          className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
        >
          Vazgeç
        </Link>
      </div>
    </form>
  );
}
