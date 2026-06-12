/**
 * Footer ödeme güveni satırı — kabul edilen kart şemaları + iyzico altyapısı.
 * Yerel resmi SVG logolar (`public/brand/payment`). iyzico merchant onboarding
 * gereği gösterilir. Düz <img> kullanılır (next/image SVG'leri varsayılan
 * olarak engeller; bunlar güvenilir yerel asset).
 */
const MARKS = [
  { src: "/brand/payment/visa.svg", alt: "Visa" },
  { src: "/brand/payment/mastercard.svg", alt: "Mastercard" },
  // iyzico onboarding şartı: resmi "iyzico ile Öde" logosu (iyzico-logo-pack,
  // checkout TR colored horizontal varyantı) birebir kullanılır.
  { src: "/brand/payment/iyzico-ile-ode.svg", alt: "iyzico ile Öde" },
] as const;

export function PaymentMarks() {
  return (
    <div className="flex items-center gap-x-5 gap-y-2 flex-wrap">
      <span className="text-[10px] tracking-[0.28em] uppercase text-[color:var(--color-muted)]">
        Güvenli ödeme
      </span>
      <div className="flex items-center gap-3.5">
        {MARKS.map((m) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={m.src}
            src={m.src}
            alt={m.alt}
            className="h-[22px] w-auto select-none"
            loading="lazy"
            draggable={false}
          />
        ))}
      </div>
    </div>
  );
}
