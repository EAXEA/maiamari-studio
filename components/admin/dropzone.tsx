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
 */
import { useRef, useState } from "react";

type Item = { id: number; file: File; url: string };

let idSeq = 0;

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

  // Seçili dosyaları gizli input'a yansıt (form gönderimi bunu okur).
  function sync(next: Item[]) {
    const dt = new DataTransfer();
    next.forEach((it) => dt.items.add(it.file));
    if (inputRef.current) inputRef.current.files = dt.files;
  }

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (incoming.length === 0) return;

    const mapped: Item[] = incoming.map((file) => ({
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
          if (e.target.files?.length) addFiles(e.target.files);
        }}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
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
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-1 cursor-pointer rounded-md border border-dashed px-4 py-8 text-center transition-colors ${
          dragOver
            ? "border-[color:var(--color-foreground)] bg-[color:var(--color-surface)]"
            : "border-[color:var(--color-border)]"
        }`}
      >
        <span className="text-sm text-[color:var(--color-foreground)]">
          Görseli buraya sürükleyin
        </span>
        <span className="text-xs text-[color:var(--color-muted)]">
          ya da tıklayıp seçin{hint ? ` · ${hint}` : ""}
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
