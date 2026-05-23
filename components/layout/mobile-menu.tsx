"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { SiteSearch } from "@/components/search/site-search";
import { PhoneCTA } from "@/components/inquiry/phone-cta";

type NavItem = { href: string; label: string };

type Props = {
  nav: NavItem[];
  instagramUrl?: string;
};

/**
 * Mobil tam-ekran menü. Hamburger ikonu açar; sağdan kayan panel,
 * body scroll'unu kilitler, ESC + dış arka plana tıklama kapatır.
 * İçerik: brand + search + büyük italic nav linkleri + telefon CTA + sosyal.
 */
export function MobileMenu({ nav, instagramUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Menüyü aç"
        aria-expanded={open}
        className="md:hidden inline-flex items-center justify-center w-10 h-10 -mr-2 text-[color:var(--color-foreground)]"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M3 7h18" />
          <path d="M3 12h18" />
          <path d="M3 17h18" />
        </svg>
      </button>

      {mounted &&
        createPortal(
          <DrawerContents
            open={open}
            close={() => setOpen(false)}
            nav={nav}
            instagramUrl={instagramUrl}
          />,
          document.body,
        )}
    </>
  );
}

function DrawerContents({
  open,
  close,
  nav,
  instagramUrl,
}: {
  open: boolean;
  close: () => void;
  nav: NavItem[];
  instagramUrl?: string;
}) {
  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden
        onClick={close}
        className={`md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Site menüsü"
        className={`md:hidden fixed top-0 right-0 bottom-0 z-50 w-[88vw] max-w-[420px] bg-[color:var(--color-background)] border-l border-[color:var(--color-hairline)] flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Üst satır — close + brand */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <span className="font-display text-[15px] tracking-[0.32em] uppercase">
            MAIAMARI
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Menüyü kapat"
            className="inline-flex items-center justify-center w-10 h-10 -mr-2"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Arama */}
        <div className="px-6 pb-4">
          <SiteSearch variant="mobile" onNavigate={close} />
        </div>

        <hr className="border-t border-[color:var(--color-hairline)] mx-6" />

        {/* Nav */}
        <nav aria-label="Mobil ana menü" className="flex-1 overflow-y-auto px-6 py-6">
          <ol className="space-y-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={close}
                  className="block py-3 font-display text-[clamp(1.8rem,7vw,2.4rem)] leading-[1.1] tracking-tight italic hover:opacity-70 transition-opacity"
                  style={{ color: "var(--color-walnut-dark)" }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        {/* Alt — iletişim */}
        <div className="border-t border-[color:var(--color-hairline)] px-6 py-6 space-y-4 bg-[color:var(--color-surface)]">
          <PhoneCTA
            variant="bare"
            label="Telefon · Randevu al"
            className="inline-flex w-full justify-center h-12 px-5 items-center text-[12px] tracking-[0.22em] uppercase"
            style={{
              background: "var(--color-walnut-dark)",
              color: "var(--color-background)",
            }}
          />
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="block text-center text-xs tracking-[0.22em] uppercase text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] transition-colors"
            >
              @maiamari.studio · Instagram
            </a>
          )}
        </div>
      </aside>
    </>
  );
}
