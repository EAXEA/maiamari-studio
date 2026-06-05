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

/**
 * Tek bir görseli yükler, public URL döner.
 * @throws yapılandırma yoksa veya yükleme başarısızsa.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const client = getClient();
  if (!client) {
    throw new Error(
      "Görsel yükleme kapalı: SUPABASE_SERVICE_ROLE_KEY tanımlı değil. " +
        "Şimdilik görsel alanına bir yol veya URL girebilirsiniz.",
    );
  }
  const ext = EXT[file.type] || "jpg";
  const name = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await client.storage.from(BUCKET).upload(name, buffer, {
    contentType: file.type || "image/jpeg",
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
