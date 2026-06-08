import Image from "next/image";
import Link from "next/link";
import { SiteSearch } from "@/components/search/site-search";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { PhoneCTA } from "@/components/inquiry/phone-cta";
import { getBusiness } from "@/lib/data";

const NAV = [
  { href: "/galeri", label: "Galeri" },
  { href: "/shop", label: "Mağaza" },
  { href: "/atolyeler", label: "Atölyeler" },
  { href: "/journal", label: "Günce" },
  { href: "/about", label: "Hakkımızda" },
  { href: "/contact", label: "İletişim" },
];

export function SiteHeader() {
  const biz = getBusiness();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[color:var(--color-background)]/90 border-b border-[color:var(--color-hairline)]">
      {/* Birleşik tek satır — brand · nav (ortalı) · arama · sepet · hamburger */}
      <div className="container-wide flex items-center gap-3 lg:gap-4 h-16">
        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0"
          aria-label="Maiamari ana sayfa"
        >
          <Image
            src="/brand/maimari-logo.png"
            alt=""
            width={28}
            height={28}
            priority
          />
          <span className="font-display text-lg sm:text-xl lg:text-[20px] tracking-tight leading-none">
            MAIAMARI
          </span>
        </Link>

        {/* Nav — md+, esnek ortalı */}
        <nav
          aria-label="Ana"
          className="hidden xl:flex items-center gap-5 lg:gap-6 mx-auto"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative group text-[12px] tracking-[0.22em] uppercase text-[color:var(--color-foreground)] hover:text-[color:var(--color-walnut-dark)] transition-colors whitespace-nowrap"
            >
              <span>{item.label}</span>
              <span
                aria-hidden
                className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[-8px] h-px w-0 group-hover:w-[28px] transition-[width] duration-300"
                style={{ background: "var(--color-walnut-dark)" }}
              />
            </Link>
          ))}
        </nav>

        {/* Search — md+ inline kompakt; mobilde hamburger içinde */}
        <div className="hidden xl:block w-[170px] lg:w-[200px] shrink-0">
          <SiteSearch />
        </div>

        {/* Telefon — kompakt outline (lg+) */}
        <PhoneCTA
          variant="outline"
          label={
            <span className="inline-flex items-center gap-1.5">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              Bilgi için
            </span>
          }
          ariaLabel="Atölyeyi telefonla ara — bilgi için"
          className="hidden xl:inline-flex shrink-0 h-9 px-3 text-[10px]"
        />

        {/* Sepet */}
        <Link
          href="/cart"
          className="relative inline-flex items-center gap-2 hover:opacity-60 shrink-0"
          aria-label="Sepet — yakında"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden
          >
            <path d="M3 6h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.5L21 9H6" />
            <circle cx="10" cy="21" r="1.2" />
            <circle cx="17" cy="21" r="1.2" />
          </svg>
          <span
            className="hidden lg:inline-flex text-[10px] tracking-[0.22em] uppercase px-2 py-0.5"
            style={{
              background: "var(--color-surface-2)",
              color: "var(--color-muted)",
            }}
          >
            Yakında
          </span>
        </Link>

        {/* Mobil menü trigger — md+'ta gizli */}
        <MobileMenu nav={NAV} instagramUrl={biz.contact.instagram} />
      </div>
    </header>
  );
}
