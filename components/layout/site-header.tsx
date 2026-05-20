import Image from "next/image";
import Link from "next/link";

const NAV = [
  { href: "/galeri", label: "Galeri" },
  { href: "/shop", label: "Mağaza" },
  { href: "/workshops", label: "Atölyeler" },
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
          aria-label="Maimari ana sayfa"
        >
          <Image
            src="/brand/maimari-logo.png"
            alt=""
            width={32}
            height={32}
            priority
          />
          <span className="font-display text-xl lg:text-[22px] tracking-tight leading-none">
            MAIMARI
          </span>
        </Link>

        {/* Search — A&C style centered input */}
        <form
          role="search"
          action="/shop"
          method="get"
          className="hidden md:flex flex-1 max-w-[520px] mx-auto items-center gap-2 h-10 px-4 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/60 focus-within:border-[color:var(--color-foreground)] transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="opacity-60 shrink-0"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            name="q"
            placeholder="Sanatçı, baskı, atölye ara…"
            className="bg-transparent outline-none w-full text-sm placeholder:text-[color:var(--color-soft)]"
            aria-label="Sitede ara"
          />
        </form>

        <div className="flex items-center gap-5 text-sm ml-auto md:ml-0">
          <Link
            href="/cart"
            className="relative inline-flex items-center gap-2 hover:opacity-60"
            aria-label="Sepet"
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
            <span className="font-sans text-[13px] text-[color:var(--color-muted)]">
              (0)
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
