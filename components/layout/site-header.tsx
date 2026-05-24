import Image from "next/image";
import Link from "next/link";
import { SiteSearch } from "@/components/search/site-search";
import { MobileMenu } from "@/components/layout/mobile-menu";
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
      <div className="container-wide flex items-center gap-4 lg:gap-6 h-16">
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
          className="hidden md:flex items-center gap-6 lg:gap-9 mx-auto"
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
        <div className="hidden md:block w-[200px] lg:w-[240px] shrink-0">
          <SiteSearch />
        </div>

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
