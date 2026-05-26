import type { CSSProperties } from "react";
import { WHATSAPP_URL } from "@/lib/contact";

const SITE_URL = "https://www.maiamari.art";

type Variant = "button" | "inline" | "list";

type Props = {
  /** Görsel varyant — eski WhatsappComingSoon ile aynı API. */
  variant?: Variant;
  /** Eser veya seri adı. Verilirse mesaj o esere özelleşir. */
  title?: string;
  /** Bağlam (ör. "galerideki", "atölye programı için"). */
  context?: string;
  /** Site içi yol — mesaj sonuna referans olarak eklenir. */
  path?: string;
  /** Buton metni (sadece variant=button için anlamlı). */
  label?: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * WhatsApp CTA — wa.me deep-link ile prefilled mesaj açar.
 * 3 varyant: button (border + uppercase), inline (editorial-link), list (footer satırı).
 *
 * Mesaj kalıbı:
 *  - title yoksa: "Merhaba, {context} hakkında bilgi almak istiyorum.\n{SITE_URL}{path}"
 *  - title varsa: "Merhaba, {context} \"{title}\" hakkında bilgi almak istiyorum.\n{SITE_URL}{path}"
 *
 * Tıklamada yeni sekmede wa.me açılır. Tarayıcı / mobil cihaz WhatsApp Web veya
 * uygulamaya yönlendirir; kullanıcı sadece "gönder"'e basar.
 */
export function WhatsappCTA({
  variant = "button",
  title,
  context = "galerideki bir eser",
  path = "/",
  label = "WhatsApp'tan bilgi al",
  className,
  style,
}: Props) {
  const intro = title
    ? `Merhaba, ${context} "${title}" hakkında bilgi almak istiyorum.`
    : `Merhaba, ${context} hakkında bilgi almak istiyorum.`;
  const reference = `${SITE_URL}${path}`;
  const message = `${intro}\n${reference}`;
  const href = `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;

  const commonProps = {
    href,
    target: "_blank" as const,
    rel: "noreferrer" as const,
    "aria-label": "WhatsApp üzerinden mesaj gönder — mesaj otomatik doldurulur",
    title: "WhatsApp'ta hazır mesajla açılır",
  };

  if (variant === "list") {
    return (
      <a
        {...commonProps}
        className={`inline-flex items-center gap-2 hover:text-[color:var(--color-foreground)] ${className ?? ""}`}
        style={style}
      >
        <span>WhatsApp</span>
      </a>
    );
  }

  if (variant === "inline") {
    return (
      <a
        {...commonProps}
        className={`editorial-link text-sm ${className ?? ""}`}
        style={style}
      >
        WhatsApp&apos;tan yaz →
      </a>
    );
  }

  // variant === "button"
  return (
    <a
      {...commonProps}
      className={`inline-flex h-11 px-6 items-center text-[12px] tracking-[0.22em] uppercase border whitespace-nowrap hover:bg-[color:var(--color-surface)] transition-colors ${className ?? ""}`}
      style={{ borderColor: "var(--color-foreground)", ...style }}
    >
      {label}
    </a>
  );
}
