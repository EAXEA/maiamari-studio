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
import { headers } from "next/headers";
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
import {
  dbCreateJournal,
  dbUpdateJournal,
  dbDeleteJournal,
  dbJournalExists,
  dbGetJournalRow,
} from "@/lib/db/journal";
import {
  dbCreateWorkshop,
  dbUpdateWorkshop,
  dbDeleteWorkshop,
  dbWorkshopExists,
  dbGetWorkshopRow,
} from "@/lib/db/workshops";
import { uploadProductImage, deleteStorageImages } from "@/lib/admin/storage";
import {
  checkLoginRate,
  recordLoginFailure,
  clearLoginAttempts,
} from "@/lib/db/login-attempts";
import { slugify } from "@/lib/slug";
import type { NewProductRow } from "@/lib/db/schema";

export type ActionState = { error?: string } | undefined;

const VALID_STATUSES = new Set([
  "in_stock",
  "low_stock",
  "out_of_stock",
  "new",
  "sale",
]);

/**
 * Mutasyon sonrası yalnız etkilenen vitrin bölümünü yeniler.
 *
 * Neden tag değil yol (revalidatePath): galeri/mağaza sayfaları build sırasında
 * (getDb()=null) JSON fallback'ten üretilir; o yol unstable_cache'e dokunmaz,
 * dolayısıyla cache etiketine bağlanmaz ve `revalidateTag/updateTag` bu statik
 * sayfaları yakalayamaz. revalidatePath ise yol bazlıdır: statik sayfayı zorla
 * yeniden ürettirir ve runtime'da DB-otoriter okutur.
 *
 * Neden tüm site değil: eski `revalidatePath("/", "layout")` 150+ sayfayı
 * geçersiz kılıyordu; mutasyon sonrası gezilen her sayfa DB'den yeniden
 * üretildiğinden yavaşlık ve geç yansıma oluyordu. Artık yalnız ilgili bölüm
 * dokunulur. Admin sayfaları force-dynamic olduğundan ayrıca yenilenmez.
 */
function revalidateStore(
  ...sections: Array<"shop" | "gallery" | "journal" | "workshop">
): void {
  revalidatePath("/"); // ana sayfa galeri/mağaza/atölye özetini gösterir
  for (const s of sections) {
    if (s === "shop") {
      revalidatePath("/shop", "layout"); // /shop + /shop/[kategori]
      revalidatePath("/urun", "layout"); // ürün/eser detay sayfaları
    } else if (s === "gallery") {
      revalidatePath("/galeri", "layout"); // /galeri + /galeri/[seri] + /galeri/sanatci/[slug]
    } else if (s === "journal") {
      revalidatePath("/journal"); // günce kronoloji (tek sayfa)
    } else {
      revalidatePath("/atolyeler"); // atölye programı (tek sayfa)
    }
  }
  revalidatePath("/sitemap.xml"); // yeni/silinen kayıt sitemap'e yansısın
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

/**
 * Form'dan kapak + galeri görsellerini çözer: yüklenen dosyalar önceliklidir,
 * yoksa manuel yol/URL alanları; kapak boşsa ilk galeri görseline düşülür.
 * Yükleme hatasında uploadProductImage fırlatır (çağıran try/catch yakalar).
 * Önceden saveProduct ile saveJournal'da birebir kopyalanmış bloğun tek kaynağı.
 */
async function resolveImages(
  formData: FormData,
): Promise<{ cover: string; gallery: string[] }> {
  let cover = String(formData.get("coverImagePath") ?? "").trim();
  const gallery = String(formData.get("galleryText") ?? "")
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const coverFile = formData.get("coverFile");
  if (coverFile instanceof File && coverFile.size > 0) {
    cover = await uploadProductImage(coverFile);
  }
  for (const f of formData.getAll("galleryFiles")) {
    if (f instanceof File && f.size > 0) {
      gallery.push(await uploadProductImage(f));
    }
  }
  if (!cover && gallery.length > 0) cover = gallery[0];
  return { cover, gallery };
}

// ---------------------------------------------------------------
// Giriş / çıkış
// ---------------------------------------------------------------
/**
 * İstemci IP'si — rate limit anahtarı.
 *
 * GÜVENLİK: x-forwarded-for'un SOLDAKİ değeri istemci tarafından uydurulabilir;
 * onu kullanmak saldırganın her istekte sahte IP göndererek per-IP limiti
 * sıfırlamasına (bypass) izin verir. Bu yüzden:
 *   1) Vercel edge'in yazdığı `x-vercel-forwarded-for` (x-vercel-* reserved'dır,
 *      istemci enjekte edemez) tercih edilir.
 *   2) Ham XFF'e düşülürse gerçek hop EN SAĞDA olur (proxy zinciri sona ekler);
 *      soldakiler spoof'lanabildiği için en sağdaki alınır.
 */
async function getClientIp(): Promise<string> {
  const h = await headers();
  const vercel = h.get("x-vercel-forwarded-for");
  if (vercel) {
    const first = vercel.split(",")[0].trim();
    if (first) return first;
  }
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return h.get("x-real-ip") || "unknown";
}

export async function login(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ip = await getClientIp();

  // Rate limit: IP başına 3 hatalı deneme → 3 dk kilit (brute-force koruması).
  const gate = await checkLoginRate(ip);
  if (gate.locked) {
    const dk = Math.max(1, Math.ceil(gate.retryAfterSec / 60));
    return {
      error: `Çok fazla hatalı deneme. ${dk} dakika sonra tekrar deneyin.`,
    };
  }

  const password = String(formData.get("password") ?? "");
  if (!verifyPassword(password)) {
    const st = await recordLoginFailure(ip);
    if (st.locked) {
      return {
        error: "Çok fazla hatalı deneme. 3 dakika boyunca giriş kapalı.",
      };
    }
    return { error: `Parola hatalı. Kalan deneme: ${st.remaining}.` };
  }

  await clearLoginAttempts(ip);
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
  let coverImage: string;
  let gallery: string[];
  try {
    ({ cover: coverImage, gallery } = await resolveImages(formData));
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Görsel yüklenemedi." };
  }

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
    // Ham DB/driver hatasını yalnız sunucuya logla; client'a generic mesaj dön.
    console.error("admin action failed:", err);
    return { error: "Kayıt kaydedilemedi." };
  }

  revalidateStore(kind === "artwork" ? "gallery" : "shop");
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
      const slug = slugify(name, "kategori");
      if (await dbCategoryExists(slug))
        return { error: "Bu isimde bir kategori zaten var." };
      await dbCreateCategory({ slug, name, nameEn, description, sortOrder });
    }
  } catch (err) {
    // Ham DB/driver hatasını yalnız sunucuya logla; client'a generic mesaj dön.
    console.error("admin action failed:", err);
    return { error: "Kategori kaydedilemedi." };
  }

  revalidateStore("shop");
  redirect("/admin/categories");
}

export async function deleteCategory(formData: FormData): Promise<void> {
  if (!(await isAuthed())) redirect("/admin/login");
  const slug = String(formData.get("slug") ?? "").trim();
  if (slug) {
    await dbDeleteCategory(slug);
    revalidateStore("shop");
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
    revalidateStore(row?.kind === "artwork" ? "gallery" : "shop");
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
      const slug = slugify(name, "kategori");
      if (await dbArtistExists(slug))
        return { error: "Bu isimde bir sanatçı zaten var." };
      await dbCreateArtist({ slug, ...data });
    }
  } catch (err) {
    // Ham DB/driver hatasını yalnız sunucuya logla; client'a generic mesaj dön.
    console.error("admin action failed:", err);
    return { error: "Sanatçı kaydedilemedi." };
  }

  revalidateStore("gallery");
  redirect("/admin/artists");
}

export async function deleteArtist(formData: FormData): Promise<void> {
  if (!(await isAuthed())) redirect("/admin/login");
  const slug = String(formData.get("slug") ?? "").trim();
  if (slug) {
    const artist = await dbGetArtistBySlug(slug);
    await dbDeleteArtist(slug);
    if (artist?.coverImage) await deleteStorageImages([artist.coverImage]);
    revalidateStore("gallery");
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
      const slug = slugify(title, "kategori");
      if (await dbSeriesExists(slug))
        return { error: "Bu isimde bir seri zaten var." };
      await dbCreateSeries({ slug, ...data });
    }
  } catch (err) {
    // Ham DB/driver hatasını yalnız sunucuya logla; client'a generic mesaj dön.
    console.error("admin action failed:", err);
    return { error: "Seri kaydedilemedi." };
  }

  revalidateStore("gallery");
  redirect("/admin/series");
}

export async function deleteSeries(formData: FormData): Promise<void> {
  if (!(await isAuthed())) redirect("/admin/login");
  const slug = String(formData.get("slug") ?? "").trim();
  if (slug) {
    const series = await dbGetSeriesBySlug(slug);
    await dbDeleteSeries(slug);
    if (series?.coverImage) await deleteStorageImages([series.coverImage]);
    revalidateStore("gallery");
  }
  redirect("/admin/series");
}

// ---------------------------------------------------------------
// Günce (journal) kaydet / sil
// ---------------------------------------------------------------
export async function saveJournal(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const originalSlug = String(formData.get("originalSlug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Başlık zorunludur." };
  const date = String(formData.get("date") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    return { error: "Geçerli bir tarih girin (YYYY-AA-GG)." };

  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const dateLabel = String(formData.get("dateLabel") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const locationUrl = String(formData.get("locationUrl") ?? "").trim();
  const imageAlt = String(formData.get("imageAlt") ?? "").trim();
  const instagramUrl = String(formData.get("instagramUrl") ?? "").trim();
  const isPublished = formData.get("isPublished") === "on";
  const sortOrder = Math.trunc(Number(formData.get("sortOrder")) || 0);

  // --- Görseller: kapak (yüklenen öncelik) + galeri (yollar + yüklenenler) ---
  let image: string;
  let gallery: string[];
  try {
    ({ cover: image, gallery } = await resolveImages(formData));
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Görsel yüklenemedi." };
  }

  const data = {
    title,
    excerpt,
    body,
    date,
    dateLabel,
    category,
    location,
    locationUrl,
    image,
    imageAlt,
    gallery,
    instagramUrl,
    isPublished,
    sortOrder,
  };

  try {
    if (originalSlug) {
      const prev = await dbGetJournalRow(originalSlug);
      if (!prev) return { error: "Kayıt bulunamadı." };
      await dbUpdateJournal(originalSlug, data);
      // Çıkarılan/değiştirilen eski yüklenmiş görselleri Storage'dan temizle.
      const keep = new Set([image, ...gallery]);
      await deleteStorageImages(
        [prev.image, ...(prev.gallery ?? [])].filter((u) => !keep.has(u)),
      );
    } else {
      const base = slugify(title, "gunce");
      let slug = base;
      let i = 2;
      while (await dbJournalExists(slug)) slug = `${base}-${i++}`;
      await dbCreateJournal({ slug, ...data });
    }
  } catch (err) {
    // Ham DB/driver hatasını yalnız sunucuya logla; client'a generic mesaj dön.
    console.error("admin action failed:", err);
    return { error: "Günce kaydedilemedi." };
  }

  revalidateStore("journal");
  redirect("/admin/journal");
}

export async function deleteJournal(formData: FormData): Promise<void> {
  if (!(await isAuthed())) redirect("/admin/login");
  const slug = String(formData.get("slug") ?? "").trim();
  if (slug) {
    const row = await dbGetJournalRow(slug);
    await dbDeleteJournal(slug);
    if (row) await deleteStorageImages([row.image, ...(row.gallery ?? [])]);
    revalidateStore("journal");
  }
  redirect("/admin/journal");
}

// ---------------------------------------------------------------
// Atölye (workshop) kaydet / sil
// ---------------------------------------------------------------
export async function saveWorkshop(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const originalSlug = String(formData.get("originalSlug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Başlık zorunludur." };

  const instructor = String(formData.get("instructor") ?? "").trim();
  const instructorInstagramHandle = String(
    formData.get("instructorInstagramHandle") ?? "",
  )
    .trim()
    .replace(/^@/, "");
  const instructorInstagramUrl = String(
    formData.get("instructorInstagramUrl") ?? "",
  ).trim();
  const schedule = String(formData.get("schedule") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const imageAlt = String(formData.get("imageAlt") ?? "").trim();
  const priceTry = parseMoney(formData.get("priceTry")); // null = fiyat gösterme
  const isPublished = formData.get("isPublished") === "on";
  const sortOrder = Math.trunc(Number(formData.get("sortOrder")) || 0);

  let image: string;
  try {
    image = await resolveCover(formData, "coverFile", "coverImagePath");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Görsel yüklenemedi." };
  }

  const data = {
    title,
    instructor,
    instructorInstagramHandle,
    instructorInstagramUrl,
    schedule,
    description,
    image,
    imageAlt,
    priceTry,
    isPublished,
    sortOrder,
  };

  try {
    if (originalSlug) {
      const prev = await dbGetWorkshopRow(originalSlug);
      if (!prev) return { error: "Kayıt bulunamadı." };
      await dbUpdateWorkshop(originalSlug, data);
      // Kapak değiştirildiyse eski yüklenmiş görseli temizle.
      if (prev.image && prev.image !== image)
        await deleteStorageImages([prev.image]);
    } else {
      const base = slugify(title, "atolye");
      let slug = base;
      let i = 2;
      while (await dbWorkshopExists(slug)) slug = `${base}-${i++}`;
      await dbCreateWorkshop({ slug, ...data });
    }
  } catch (err) {
    // Ham DB/driver hatasını yalnız sunucuya logla; client'a generic mesaj dön.
    console.error("admin action failed:", err);
    return { error: "Atölye kaydedilemedi." };
  }

  revalidateStore("workshop");
  redirect("/admin/workshops");
}

export async function deleteWorkshop(formData: FormData): Promise<void> {
  if (!(await isAuthed())) redirect("/admin/login");
  const slug = String(formData.get("slug") ?? "").trim();
  if (slug) {
    const row = await dbGetWorkshopRow(slug);
    await dbDeleteWorkshop(slug);
    if (row?.image) await deleteStorageImages([row.image]);
    revalidateStore("workshop");
  }
  redirect("/admin/workshops");
}
