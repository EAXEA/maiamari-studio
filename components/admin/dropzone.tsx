"use client";
/**
 * MAIAMARI.STUDIO — Sürükle-bırak görsel alanı (client)
 * -----------------------------------------------------
 * Görselleri sürükleyip bırakarak (ya da tıklayıp seçerek) ekler.
 * Seçilen dosyalar gizli bir <input type="file"> üzerine DataTransfer
 * ile yazılır; böylece form gönderiminde mevcut server action
 * (coverFile / galleryFiles) hiç değişmeden çalışır.
 *
 * Yükleme yalnızca Supabase Storage yapılandırıldığında (storageReady)
 * anlamlıdır; bu yüzden bileşen yalnızca o durumda render edilir.
 *
 * Dosyalar Server Action'ın multipart gövdesiyle taşındığından, gövde
 * Next'in varsayılan 1 MB sınırını (ve Vercel'in ~4.5 MB function payload
 * tavanını) aşmasın diye görseller YÜKLENMEDEN ÖNCE tarayıcıda küçültülür.
 * Web için 2200px uzun kenar fazlasıyla yeterli; çıktı JPEG'e çevrilir.
 */
import { useRef, useState } from "react";

type Item = { id: number; file: File; url: string };

let idSeq = 0;

// İstemci-taraflı yeniden boyutlandırma/sıkıştırma hedefleri.
const MAX_EDGE = 2200; // uzun kenar piksel sınırı
const JPEG_QUALITY = 0.82; // çıktı JPEG kalitesi
// Yalnız raster fotoğraf tiplerini sıkıştır; GIF (animasyon olabilir) dokunulmaz.
const COMPRESS_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

/**
 * Görseli canvas'a çizip yeniden boyutlandırarak JPEG'e sıkıştırır. Tarayıcı
 * desteklemiyorsa ya da sıkıştırma fayda sağlamıyorsa orijinali döndürür
 * (sunucu yine magic-byte + 8 MB ile, bodySizeLimit ise tampon olarak korur).
 */
async function compressImage(file: File): Promise<File> {
  if (!COMPRESS_TYPES.has(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      return file;
    }
    // PNG/WebP şeffaflığı JPEG'de siyaha dönmesin diye beyaz zemin.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;
    const base = file.name.replace(/\.[^.]+$/, "") || "gorsel";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function Dropzone({
  name,
  multiple = false,
  hint,
}: {
  name: string;
  multiple?: boolean;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);

  // Seçili dosyaları gizli input'a yansıt (form gönderimi bunu okur).
  function sync(next: Item[]) {
    const dt = new DataTransfer();
    next.forEach((it) => dt.items.add(it.file));
    if (inputRef.current) inputRef.current.files = dt.files;
  }

  async function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (incoming.length === 0) return;

    setBusy(true);
    try {
      const processed = await Promise.all(incoming.map(compressImage));
      const mapped: Item[] = processed.map((file) => ({
        id: ++idSeq,
        file,
        url: URL.createObjectURL(file),
      }));

      let next: Item[];
      if (multiple) {
        next = [...items, ...mapped];
      } else {
        items.forEach((it) => URL.revokeObjectURL(it.url));
        mapped.slice(1).forEach((m) => URL.revokeObjectURL(m.url));
        next = [mapped[0]];
      }
      setItems(next);
      sync(next);
    } finally {
      setBusy(false);
    }
  }

  function remove(id: number) {
    const next = items.filter((it) => {
      if (it.id === id) URL.revokeObjectURL(it.url);
      return it.id !== id;
    });
    setItems(next);
    sync(next);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void addFiles(e.target.files);
        }}
      />

      <div
        role="button"
        tabIndex={0}
        aria-busy={busy}
        onClick={() => {
          if (!busy) inputRef.current?.click();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!busy) inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!dragOver) setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!busy && e.dataTransfer.files?.length)
            void addFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-1 rounded-md border border-dashed px-4 py-8 text-center transition-colors ${
          busy ? "cursor-wait opacity-70" : "cursor-pointer"
        } ${
          dragOver
            ? "border-[color:var(--color-foreground)] bg-[color:var(--color-surface)]"
            : "border-[color:var(--color-border)]"
        }`}
      >
        <span className="text-sm text-[color:var(--color-foreground)]">
          {busy ? "Görsel işleniyor…" : "Görseli buraya sürükleyin"}
        </span>
        <span className="text-xs text-[color:var(--color-muted)]">
          {busy
            ? "Yüklemeye hazırlanıyor"
            : `ya da tıklayıp seçin${hint ? ` · ${hint}` : ""}`}
        </span>
      </div>

      {items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {items.map((it) => (
            <div key={it.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.url}
                alt={it.file.name}
                className="h-24 w-24 object-cover rounded-md border border-[color:var(--color-border)]"
              />
              <button
                type="button"
                onClick={() => remove(it.id)}
                aria-label={`${it.file.name} görselini kaldır`}
                style={{ color: "var(--color-background)" }}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-[color:var(--color-foreground)] text-sm leading-none flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
