import Link from "next/link";
import type { ReactNode } from "react";
import { LEGAL_UPDATED } from "@/lib/legal";

/**
 * Yasal sayfalar (mesafeli satış, teslimat/iade, gizlilik, KVKK) için ortak
 * kabuk: tutarlı başlık, "son güncelleme" satırı ve okunaklı tipografi.
 * Marka kuralı: em-dash ve "+" yok; başlıklar walnut accent.
 */
export function LegalShell({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <div className="container-x py-16 lg:py-24">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="text-[11px] tracking-[0.22em] uppercase text-[color:var(--color-muted)] hover:opacity-70 transition-opacity"
        >
          Ana sayfa
        </Link>

        <h1
          className="font-display text-3xl lg:text-4xl mt-6 leading-tight"
          style={{ fontWeight: 500 }}
        >
          {title}
        </h1>
        <p className="mt-3 text-xs text-[color:var(--color-muted)]">
          Son güncelleme: {LEGAL_UPDATED}
        </p>
        {lead && (
          <p className="mt-6 text-sm leading-relaxed text-[color:var(--color-muted)]">
            {lead}
          </p>
        )}

        <div
          className="mt-10 space-y-5 text-sm leading-relaxed
            [&_h2]:font-display [&_h2]:text-lg [&_h2]:mt-10 [&_h2]:mb-1
            [&_h2]:text-[color:var(--color-walnut-dark)]
            [&_h3]:font-medium [&_h3]:mt-5 [&_h3]:mb-1
            [&_p]:text-[color:var(--color-foreground)]
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:mt-1
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:mt-1
            [&_li]:text-[color:var(--color-foreground)]
            [&_dl]:grid [&_dl]:grid-cols-[max-content_1fr] [&_dl]:gap-x-6 [&_dl]:gap-y-1.5
            [&_dt]:text-[color:var(--color-muted)] [&_dt]:uppercase [&_dt]:tracking-wider [&_dt]:text-[11px]
            [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:opacity-70
            [&_strong]:font-medium"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
