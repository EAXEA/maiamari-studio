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
