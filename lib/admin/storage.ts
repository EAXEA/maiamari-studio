/**
 * MAIAMARI.STUDIO — Ürün görseli yükleme (Supabase Storage, server-only)
 * ---------------------------------------------------------------------
 * `SUPABASE_SERVICE_ROLE_KEY` + `NEXT_PUBLIC_SUPABASE_URL` tanımlıysa
 * görseli `product-images` bucket'ına yükler ve public URL döner.
 * Anahtar yoksa `null` döner; panel bu durumda yalnızca manuel
 * görsel yolu/URL girişine izin verir.
 */
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "product-images";

function getServiceKey(): string | null {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k || k.startsWith("<")) return null; // doldurulmamış şablon
  return k;
}

/** Görsel yükleme yapılandırılmış mı (secret key var mı). */
export function isStorageConfigured(): boolean {
  return getServiceKey() !== null && !!process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getServiceKey();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

/** İzin verilen en büyük görsel boyutu (8 MB). Storage/DoS suistimaline karşı. */
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

type ImageMime = keyof typeof EXT;

/** Dosyanın ilk byte'larından gerçek tipini doğrula (client `file.type`'a güvenme). */
function sniffImageType(buf: Buffer): ImageMime | null {
  if (buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  )
    return "image/png";
  // GIF: "GIF8"
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38)
    return "image/gif";
  // RIFF....WEBP
  if (
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  // AVIF: ....ftyp + "avif"/"avis" brand
  if (buf.toString("ascii", 4, 8) === "ftyp") {
    const brand = buf.toString("ascii", 8, 12);
    if (brand === "avif" || brand === "avis") return "image/avif";
  }
  return null;
}

/**
 * Tek bir görseli yükler, public URL döner.
 * @throws yapılandırma yoksa, dosya geçersiz/çok büyükse veya yükleme başarısızsa.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const client = getClient();
  if (!client) {
    throw new Error(
      "Görsel yükleme kapalı: SUPABASE_SERVICE_ROLE_KEY tanımlı değil. " +
        "Şimdilik görsel alanına bir yol veya URL girebilirsiniz.",
    );
  }

  // 1) Boyut sınırı (buffer'a almadan önce; büyük dosyayı belleğe çekme).
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Görsel en fazla 8 MB olabilir.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // 2) Gerçek içerik tipini magic-byte ile doğrula; client'ın gönderdiği
  //    `file.type`'a güvenme (SVG/HTML gibi içerik görsel gibi etiketlenebilir).
  const sniffed = sniffImageType(buffer);
  if (!sniffed) {
    throw new Error("Sadece JPEG, PNG, WebP, AVIF veya GIF yükleyebilirsiniz.");
  }

  const ext = EXT[sniffed];
  const name = `${crypto.randomUUID()}.${ext}`;

  const { error } = await client.storage.from(BUCKET).upload(name, buffer, {
    contentType: sniffed, // doğrulanmış tip; client değerini kullanma
    upsert: false,
  });
  if (error) throw new Error(`Görsel yüklenemedi: ${error.message}`);

  const { data } = client.storage.from(BUCKET).getPublicUrl(name);
  return data.publicUrl;
}

/**
 * Verilen public URL'lerden YALNIZ bu bucket'a ait olanları siler (best-effort).
 * Yerel `/images/...` yolları ve dış URL'ler atlanır. Kayıt silinince ona ait
 * yüklenmiş görseller de Storage'dan otomatik kalksın diye kullanılır; silme
 * başarısız olsa bile (loglanır) çağıran akış —DB silme— engellenmez.
 */
export async function deleteStorageImages(
  urls: (string | null | undefined)[],
): Promise<void> {
  const client = getClient();
  if (!client || !process.env.NEXT_PUBLIC_SUPABASE_URL) return;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const paths = Array.from(
    new Set(
      urls
        .map((u) => {
          if (!u) return null;
          const i = u.indexOf(marker);
          if (i === -1) return null; // bizim bucket değil → dokunma
          return decodeURIComponent(u.slice(i + marker.length).split("?")[0]);
        })
        .filter((p): p is string => !!p),
    ),
  );
  if (paths.length === 0) return;
  const { error } = await client.storage.from(BUCKET).remove(paths);
  if (error) console.error("Storage görselleri silinemedi:", error.message);
}
