import Image from "next/image";
import Link from "next/link";
import { SiteSearch } from "@/components/search/site-search";

const NAV = [
  { href: "/galeri", label: "Galeri" },
  { href: "/shop", label: "Mağaza" },
  { href: "/atolyeler", label: "Atölyeler" },
  { href: "/journal", label: "Günce" },
  { href: "/about", label: "Hakkımızda" },
  { href: "/contact", label: "İletişim" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[color:var(--color-background)]/90 border-b border-[color:var(--color-hairline)]">
      {/* Top row — brand · search · cart */}
      <div className="container-wide flex items-center gap-6 h-16 lg:h-[72px]">
        <Link
          href="/"
          className="flex items-center gap-3 shrink-0"
          aria-label="Maiamari ana sayfa"
        >
          <Image
            src="/brand/maimari-logo.png"
            alt=""
            width={32}
            height={32}
            priority
          />
          <span className="font-display text-xl lg:text-[22px] tracking-tight leading-none">
            MAIAMARI
          </span>
        </Link>

        {/* Search — A&C tarzı fuzzy autocomplete */}
        <SiteSearch />

        <div className="flex items-center gap-5 text-sm ml-auto md:ml-0">
          <Link
            href="/cart"
            className="relative inline-flex items-center gap-2 hover:opacity-60"
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
              className="text-[10px] tracking-[0.22em] uppercase px-2 py-0.5"
              style={{
                background: "var(--color-surface-2)",
                color: "var(--color-muted)",
              }}
            >
              Yakında
            </span>
          </Link>
        </div>
      </div>

      {/* Bottom row — quiet nav */}
      <nav
        aria-label="Ana"
        className="border-t border-[color:var(--color-hairline)]"
      >
        <div className="container-wide flex items-center gap-7 lg:gap-10 h-11 overflow-x-auto no-scrollbar text-[13px] tracking-[0.04em]">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[color:var(--color-foreground)] hover:opacity-60 transition-opacity whitespace-nowrap"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
