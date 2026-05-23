"use client";

import { useState, type CSSProperties, type MouseEvent } from "react";

type Variant = "button" | "inline" | "list";

type Props = {
  /** Görsel varyant. */
  variant?: Variant;
  /** Tooltip / yardımcı metin. */
  hint?: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * WhatsApp "yakında" placeholder — tıklanmaz, gerçek aksiyon vermez.
 * Tıklayan kullanıcıya 2 sn boyunca "WhatsApp yakında" ipucu gösterir.
 *
 * 3 varyant:
 *  - button: galeri/atölye buton sırasındaki ölçüde, kenarlıklı, soluk
 *  - inline: editorial link tarzı (küçük metin)
 *  - list:   footer / iletişim listesi <li> içinde tek satır
 */
export function WhatsappComingSoon({
  variant = "button",
  hint = "WhatsApp hattımız yakında devreye girer.",
  className,
  style,
}: Props) {
  const [show, setShow] = useState(false);

  function notify(e: MouseEvent<HTMLElement>) {
    e.preventDefault();
    setShow(true);
    window.setTimeout(() => setShow(false), 2200);
  }

  const label = show ? "Yakında devreye girer" : "WhatsApp";

  if (variant === "list") {
    return (
      <span
        className={`inline-flex items-center gap-2 cursor-not-allowed select-none ${className ?? ""}`}
        style={{ opacity: 0.55, ...style }}
        onClick={notify}
        role="button"
        aria-disabled
        title={hint}
      >
        <span>{label}</span>
        <span
          className="text-[9px] tracking-[0.28em] uppercase px-1.5 py-0.5"
          style={{ background: "var(--color-surface-2)" }}
        >
          Yakında
        </span>
      </span>
    );
  }

  if (variant === "inline") {
    return (
      <span
        className={`inline-flex items-center gap-2 cursor-not-allowed select-none text-sm ${className ?? ""}`}
        style={{ opacity: 0.55, ...style }}
        onClick={notify}
        role="button"
        aria-disabled
        title={hint}
      >
        <span>{label}</span>
        <span
          className="text-[9px] tracking-[0.28em] uppercase px-1.5 py-0.5"
          style={{ background: "var(--color-surface-2)" }}
        >
          Yakında
        </span>
      </span>
    );
  }

  // variant === "button"
  return (
    <span
      className={`inline-flex h-11 px-6 items-center gap-3 text-[12px] tracking-[0.22em] uppercase border cursor-not-allowed select-none ${className ?? ""}`}
      style={{
        borderColor: "var(--color-hairline)",
        color: "var(--color-muted)",
        opacity: 0.7,
        ...style,
      }}
      onClick={notify}
      role="button"
      aria-disabled
      title={hint}
    >
      <span>{label}</span>
      <span
        className="text-[9px] tracking-[0.3em] px-2 py-0.5"
        style={{
          background: "var(--color-surface-2)",
          color: "var(--color-walnut)",
        }}
      >
        Yakında
      </span>
    </span>
  );
}
