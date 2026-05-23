import type { CSSProperties, ReactNode } from "react";
import { PHONE_PRIMARY_TEL } from "@/lib/contact";

type Variant = "button" | "outline" | "inline" | "link" | "bare";

type Props = {
  variant?: Variant;
  /** Görünen etiket. Varsayılan "TELEFON". /contact dışında numara açık verilmemeli. */
  label?: ReactNode;
  /** Aria-label; etiket ikonsa veya kısaysa açıklama için. */
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
};

const BASE: Record<Variant, string> = {
  button:
    "inline-flex h-11 px-6 items-center text-[12px] tracking-[0.22em] uppercase",
  outline:
    "inline-flex h-11 px-6 items-center text-[12px] tracking-[0.22em] uppercase border whitespace-nowrap",
  inline: "underline underline-offset-4",
  link: "hover:opacity-70 transition-opacity",
  bare: "",
};

/**
 * Site genelinde telefon CTA'sı. Açık numara yerine "TELEFON" etiketiyle
 * çalışır; tıklandığında tel: linki açılır. Numarayı sadece /contact
 * sayfasında açık gösteriyoruz (orada bu component yerine düz <a> kullanılır).
 */
export function PhoneCTA({
  variant = "button",
  label = "Telefon",
  ariaLabel,
  className,
  style,
}: Props) {
  const base = BASE[variant];
  const cls = [base, className].filter(Boolean).join(" ");

  const defaultStyle: CSSProperties | undefined =
    variant === "button"
      ? {
          background: "var(--color-walnut-dark)",
          color: "var(--color-background)",
          ...style,
        }
      : variant === "outline"
        ? { borderColor: "var(--color-walnut-dark)", ...style }
        : style;

  return (
    <a
      href={`tel:${PHONE_PRIMARY_TEL}`}
      className={cls}
      style={defaultStyle}
      aria-label={ariaLabel ?? "Atölyeyi telefonla ara"}
    >
      {label}
    </a>
  );
}
