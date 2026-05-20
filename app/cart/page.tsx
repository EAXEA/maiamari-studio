import Link from "next/link";

export const metadata = { title: "Sepet" };

export default function CartPage() {
  return (
    <div className="container-x py-24 lg:py-32 text-center max-w-xl mx-auto">
      <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
        Sepet
      </p>
      <h1 className="font-display text-4xl lg:text-5xl mt-4">
        Sepetiniz şu an boş.
      </h1>
      <p className="text-base text-[color:var(--color-muted)] mt-6 leading-relaxed">
        Sepet ve güvenli ödeme akışı yakında bu sayfada olacak. Şimdilik
        beğendiğiniz parçaları Shopier üzerinden sipariş edebilirsiniz.
      </p>
      <div className="mt-10 flex gap-3 justify-center">
        <Link
          href="/shop"
          className="inline-flex h-11 px-6 items-center text-xs tracking-[0.2em] uppercase hover:opacity-90"
          style={{
            background: "var(--color-walnut-dark)",
            color: "var(--color-background)",
          }}
        >
          Mağazaya dön
        </Link>
        <a
          href="https://www.shopier.com/maiamari"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 px-6 items-center text-xs tracking-[0.2em] uppercase border transition-colors hover:bg-[color:var(--color-foreground)] hover:text-[color:var(--color-background)]"
          style={{
            borderColor: "var(--color-foreground)",
            color: "var(--color-foreground)",
          }}
        >
          Shopier&apos;de aç
        </a>
      </div>
    </div>
  );
}
