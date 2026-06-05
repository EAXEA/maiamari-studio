"use server";
/**
 * MAIAMARI.STUDIO — Admin panel server action'ları
 * ------------------------------------------------
 * Tüm mutasyonlar önce yetki kontrolünden geçer (requireAdmin).
 * Form gönderimleri buraya POST eder; başarıda vitrin cache'i
 * yenilenir (revalidatePath) ve panele dönülür.
 */
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  requireAdmin,
  isAuthed,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/admin/auth";
import {
  dbCreateProduct,
  dbUpdateProduct,
  dbDeleteProduct,
  dbGenerateUniqueSlug,
  dbGetRowById,
} from "@/lib/db/products";
import {
  dbCreateCategory,
  dbUpdateCategory,
  dbDeleteCategory,
  dbCategoryExists,
} from "@/lib/db/categories";
import {
  dbCreateArtist,
  dbUpdateArtist,
  dbDeleteArtist,
  dbArtistExists,
  dbGetArtistBySlug,
} from "@/lib/db/artists";
import {
  dbCreateSeries,
  dbUpdateSeries,
  dbDeleteSeries,
  dbSeriesExists,
  dbGetSeriesBySlug,
} from "@/lib/db/series";
import { uploadProductImage, deleteStorageImages } from "@/lib/admin/storage";
import type { NewProductRow } from "@/lib/db/schema";

export type ActionState = { error?: string } | undefined;

const VALID_STATUSES = new Set([
  "in_stock",
  "low_stock",
  "out_of_stock",
  "new",
  "sale",
]);

/** Vitrinin tüm görünen yüzeylerini tazele (mağaza + galeri + panel). */
function revalidateStore(): void {
  revalidatePath("/", "layout"); // ana sayfa, /shop, /shop/[kategori], /urun, /galeri, sitemap
  revalidatePath("/admin");
  revalidatePath("/admin/artworks");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/series");
  revalidatePath("/admin/artists");
}

/**
 * Para girdisini numeric kolon string'ine çevirir. İki kaynağı da doğru anlar:
 *  - Türkçe elle giriş: "1.299,90" (nokta binlik, virgül ondalık) → "1299.90"
 *  - DB'den gelen / yeniden kaydedilen değer: "294.00", "299.90" (nokta ondalık) → "294.00"
 *
 * Kritik: eskiden tüm noktalar binlik sanılıp siliniyordu; bu yüzden "294.00"
 * değeri her düzenleme kaydında "29400" olup fiyatı ×100 büyütüyordu. Artık
 * tek nokta + en çok 2 hane ondalık kabul edilir, 3 haneli grup binlik sayılır.
 */
function parseMoney(raw: FormDataEntryValue | null): string | null {
  const s = String(raw ?? "").replace(/[^\d.,]/g, "");
  if (!s) return null;

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  let normalized: string;
  if (hasComma && hasDot) {
    // Türkçe tam format: nokta binlik, virgül ondalık
    normalized = s.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    // yalnız virgül → ondalık ayıracı ("294,50")
    normalized = s.replace(",", ".");
  } else if (hasDot) {
    const parts = s.split(".");
    const last = parts[parts.length - 1];
    // tek nokta + ≤2 hane → ondalık ("294.00"); aksi halde binlik ("1.250")
    normalized = parts.length === 2 && last.length <= 2 ? s : s.replace(/\./g, "");
  } else {
    normalized = s;
  }

  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return null;
  return n.toFixed(2);
}

/** Boş string'i null'a çevirir (künye opsiyonel alanları için). */
function strOrNull(raw: FormDataEntryValue | null): string | null {
  const s = String(raw ?? "").trim();
  return s || null;
}

/** Geçerli pozitif tamsayı ya da null. */
function intOrNull(raw: FormDataEntryValue | null): number | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const n = parseInt(s.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

/** Ad'dan URL-güvenli slug üretir (kategori için). */
function slugifyTr(s: string): string {
  return (
    s
      .toLocaleLowerCase("tr-TR")
      .replace(/ı/g, "i")
      .replace(/ş/g, "s")
      .replace(/ç/g, "c")
      .replace(/ö/g, "o")
      .replace(/ü/g, "u")
      .replace(/ğ/g, "g")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "kategori"
  );
}

// ---------------------------------------------------------------
// Giriş / çıkış
// ---------------------------------------------------------------
export async function login(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  if (!verifyPassword(password)) {
    return { error: "Parola hatalı." };
  }
  await setSessionCookie();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect("/admin/login");
}

// ---------------------------------------------------------------
// Ürün / Eser kaydet (yeni veya düzenle)
// ---------------------------------------------------------------
export async function saveProduct(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const kind = formData.get("kind") === "artwork" ? "artwork" : "material";
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: `${kind === "artwork" ? "Eser" : "Ürün"} adı zorunludur.` };

  const sortOrder = Math.trunc(Number(formData.get("sortOrder")) || 0);
  const isPublished = formData.get("isPublished") === "on";
  const description = String(formData.get("description") ?? "").trim();

  // --- Görseller: önce yüklenen dosyalar, sonra manuel yollar ---
  let coverImage = String(formData.get("coverImagePath") ?? "").trim();
  const gallery: string[] = String(formData.get("galleryText") ?? "")
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const coverFile = formData.get("coverFile");
    if (coverFile instanceof File && coverFile.size > 0) {
      coverImage = await uploadProductImage(coverFile);
    }
    for (const f of formData.getAll("galleryFiles")) {
      if (f instanceof File && f.size > 0) {
        gallery.push(await uploadProductImage(f));
      }
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Görsel yüklenemedi." };
  }
  if (!coverImage && gallery.length > 0) coverImage = gallery[0];

  // --- Türe göre alanlar ---
  let fields: Partial<NewProductRow>;
  if (kind === "artwork") {
    const artistSlug = String(formData.get("artistSlug") ?? "").trim();
    if (!(await dbArtistExists(artistSlug)))
      return { error: "Geçerli bir sanatçı seçin." };
    const seriesSlug = String(formData.get("seriesSlug") ?? "").trim();
    if (!(await dbSeriesExists(seriesSlug)))
      return { error: "Geçerli bir seri seçin." };
    const artistRow = await dbGetArtistBySlug(artistSlug);
    const editionSize = intOrNull(formData.get("editionSize"));
    // "Satılık" anahtarı: işaretliyse fiyat girilebilir. Mağaza okuması
    // kind="material" filtreli olduğundan eser, forSale=true olsa bile
    // iyzico'ya kadar mağazada görünmez (kayıt ileride hazır olsun diye).
    const forSale = formData.get("forSale") === "on";
    fields = {
      kind: "artwork",
      forSale,
      artistSlug,
      // künyede gösterilen sanatçı adı (taxonomy'den denormalize)
      artist: artistRow?.name ?? "Duygu Sinan",
      seriesSlug,
      technique: strOrNull(formData.get("technique")),
      paper: strOrNull(formData.get("paper")),
      dimensions: strOrNull(formData.get("dimensions")),
      editionSize,
      printCount: editionSize,
      firstSerial: strOrNull(formData.get("firstSerial")),
      year: intOrNull(formData.get("year")),
      // satılıksa fiyat (boşsa "0"); satılık değilse fiyat tutulmaz.
      priceTry: forSale ? (parseMoney(formData.get("priceTry")) ?? "0") : "0",
      compareAtTry: forSale ? parseMoney(formData.get("compareAtTry")) : null,
      // diğer mağaza alanları eser için nötr
      categorySlug: "",
      stock: 0,
      status: "in_stock",
      sourceUrl: "",
    };
  } else {
    const categorySlug = String(formData.get("categorySlug") ?? "").trim();
    if (!(await dbCategoryExists(categorySlug)))
      return { error: "Geçerli bir kategori seçin." };
    const status = String(formData.get("status") ?? "in_stock").trim();
    if (!VALID_STATUSES.has(status)) return { error: "Geçersiz stok durumu." };
    const priceTry = parseMoney(formData.get("priceTry"));
    if (priceTry === null) return { error: "Geçerli bir fiyat girin." };
    fields = {
      kind: "material",
      forSale: true,
      categorySlug,
      priceTry,
      compareAtTry: parseMoney(formData.get("compareAtTry")),
      stock: Math.max(0, Math.trunc(Number(formData.get("stock")) || 0)),
      status,
      sourceUrl: String(formData.get("sourceUrl") ?? "").trim(),
    };
  }

  const common = { title, description, coverImage, gallery, isPublished, sortOrder };

  try {
    if (id) {
      const existing = await dbGetRowById(id);
      if (!existing) return { error: "Kayıt bulunamadı." };
      await dbUpdateProduct(id, { ...fields, ...common });
      // Düzenlemede değiştirilen/çıkarılan eski yüklenmiş görselleri temizle:
      // yeni sette artık bulunmayan eski URL'ler yetim kalmasın.
      const keep = new Set([coverImage, ...gallery]);
      await deleteStorageImages(
        [existing.coverImage, ...(existing.gallery ?? [])].filter(
          (u) => !keep.has(u),
        ),
      );
    } else {
      const slug = await dbGenerateUniqueSlug(title);
      await dbCreateProduct({
        id: `mai_${crypto.randomUUID()}`,
        slug,
        ...common,
        ...fields,
      } as NewProductRow);
    }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Kayıt kaydedilemedi.",
    };
  }

  revalidateStore();
  redirect(kind === "artwork" ? "/admin/artworks" : "/admin");
}

// ---------------------------------------------------------------
// Kategori kaydet / sil
// ---------------------------------------------------------------
export async function saveCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const originalSlug = String(formData.get("originalSlug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Kategori adı zorunludur." };
  const nameEn = String(formData.get("nameEn") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sortOrder = Math.trunc(Number(formData.get("sortOrder")) || 0);

  try {
    if (originalSlug) {
      await dbUpdateCategory(originalSlug, { name, nameEn, description, sortOrder });
    } else {
      const slug = slugifyTr(name);
      if (await dbCategoryExists(slug))
        return { error: "Bu isimde bir kategori zaten var." };
      await dbCreateCategory({ slug, name, nameEn, description, sortOrder });
    }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Kategori kaydedilemedi.",
    };
  }

  revalidateStore();
  redirect("/admin/categories");
}

export async function deleteCategory(formData: FormData): Promise<void> {
  if (!(await isAuthed())) redirect("/admin/login");
  const slug = String(formData.get("slug") ?? "").trim();
  if (slug) {
    await dbDeleteCategory(slug);
    revalidateStore();
  }
  redirect("/admin/categories");
}

// ---------------------------------------------------------------
// Ürün sil
// ---------------------------------------------------------------
export async function deleteProduct(formData: FormData): Promise<void> {
  if (!(await isAuthed())) redirect("/admin/login");
  const id = String(formData.get("id") ?? "").trim();
  let backTo = "/admin";
  if (id) {
    const row = await dbGetRowById(id);
    if (row?.kind === "artwork") backTo = "/admin/artworks";
    await dbDeleteProduct(id);
    // Kayda ait yüklenmiş görselleri Storage'dan da kaldır (best-effort).
    if (row) await deleteStorageImages([row.coverImage, ...(row.gallery ?? [])]);
    revalidateStore();
  }
  redirect(backTo);
}

// ---------------------------------------------------------------
// Görsel alanı: yüklenen dosya öncelikli, yoksa manuel yol/URL.
// ---------------------------------------------------------------
async function resolveCover(
  formData: FormData,
  fileField: string,
  pathField: string,
): Promise<string> {
  const f = formData.get(fileField);
  if (f instanceof File && f.size > 0) return uploadProductImage(f);
  return String(formData.get(pathField) ?? "").trim();
}

// ---------------------------------------------------------------
// Sanatçı kaydet / sil
// ---------------------------------------------------------------
export async function saveArtist(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const originalSlug = String(formData.get("originalSlug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Sanatçı adı zorunludur." };
  const title = String(formData.get("title") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const instagramHandle = String(formData.get("instagramHandle") ?? "").trim();
  const instagramUrl = String(formData.get("instagramUrl") ?? "").trim();
  const sortOrder = Math.trunc(Number(formData.get("sortOrder")) || 0);

  let coverImage: string;
  try {
    coverImage = await resolveCover(formData, "coverFile", "coverImagePath");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Görsel yüklenemedi." };
  }

  try {
    const data = {
      name,
      title,
      bio,
      instagramHandle,
      instagramUrl,
      coverImage,
      sortOrder,
    };
    if (originalSlug) {
      const prev = await dbGetArtistBySlug(originalSlug);
      await dbUpdateArtist(originalSlug, data);
      // Kapak değiştirildiyse eski yüklenmiş görseli temizle.
      if (prev?.coverImage && prev.coverImage !== coverImage)
        await deleteStorageImages([prev.coverImage]);
    } else {
      const slug = slugifyTr(name);
      if (await dbArtistExists(slug))
        return { error: "Bu isimde bir sanatçı zaten var." };
      await dbCreateArtist({ slug, ...data });
    }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Sanatçı kaydedilemedi.",
    };
  }

  revalidateStore();
  redirect("/admin/artists");
}

export async function deleteArtist(formData: FormData): Promise<void> {
  if (!(await isAuthed())) redirect("/admin/login");
  const slug = String(formData.get("slug") ?? "").trim();
  if (slug) {
    const artist = await dbGetArtistBySlug(slug);
    await dbDeleteArtist(slug);
    if (artist?.coverImage) await deleteStorageImages([artist.coverImage]);
    revalidateStore();
  }
  redirect("/admin/artists");
}

// ---------------------------------------------------------------
// Seri kaydet / sil
// ---------------------------------------------------------------
export async function saveSeries(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const originalSlug = String(formData.get("originalSlug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Seri adı zorunludur." };
  const artistSlug = String(formData.get("artistSlug") ?? "").trim();
  if (!(await dbArtistExists(artistSlug)))
    return { error: "Geçerli bir sanatçı seçin." };

  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const yearRange = String(formData.get("yearRange") ?? "").trim();
  const paperNote = String(formData.get("paperNote") ?? "").trim();
  const year = intOrNull(formData.get("year"));
  const sortOrder = Math.trunc(Number(formData.get("sortOrder")) || 0);

  let coverImage: string;
  try {
    coverImage = await resolveCover(formData, "coverFile", "coverImagePath");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Görsel yüklenemedi." };
  }

  try {
    const data = {
      title,
      subtitle,
      description,
      year,
      yearRange,
      coverImage,
      paperNote,
      artistSlug,
      sortOrder,
    };
    if (originalSlug) {
      const prev = await dbGetSeriesBySlug(originalSlug);
      await dbUpdateSeries(originalSlug, data);
      // Kapak değiştirildiyse eski yüklenmiş görseli temizle.
      if (prev?.coverImage && prev.coverImage !== coverImage)
        await deleteStorageImages([prev.coverImage]);
    } else {
      const slug = slugifyTr(title);
      if (await dbSeriesExists(slug))
        return { error: "Bu isimde bir seri zaten var." };
      await dbCreateSeries({ slug, ...data });
    }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Seri kaydedilemedi.",
    };
  }

  revalidateStore();
  redirect("/admin/series");
}

export async function deleteSeries(formData: FormData): Promise<void> {
  if (!(await isAuthed())) redirect("/admin/login");
  const slug = String(formData.get("slug") ?? "").trim();
  if (slug) {
    const series = await dbGetSeriesBySlug(slug);
    await dbDeleteSeries(slug);
    if (series?.coverImage) await deleteStorageImages([series.coverImage]);
    revalidateStore();
  }
  redirect("/admin/series");
}
