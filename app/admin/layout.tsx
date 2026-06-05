/**
 * MAIAMARI.STUDIO — Admin panel layout
 * Yetkiliyse üst menü (logout dahil) gösterilir; login sayfasında gizli.
 */
import Link from "next/link";
import { isAuthed } from "@/lib/admin/auth";
import { logout } from "./actions";

export const metadata = {
  title: "Yönetim",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthed();

  const navCls =
    "text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]";
  const groupLabel =
    "text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-muted)]";
  const sep = "text-[color:var(--color-muted)] opacity-40 text-xs";

  return (
    <div className="min-h-screen">
      {authed && (
        <header className="border-b border-[color:var(--color-hairline)]">
          <div className="container-x flex flex-wrap items-center gap-x-5 gap-y-2 py-3">
            <Link href="/admin" className="font-display text-lg tracking-wide mr-1">
              MAIAMARI Yönetim
            </Link>

            {/* Galeri grubu — hiyerarşi: Sanatçılar › Seriler › Eserler */}
            <div className="flex items-center gap-3">
              <span className={groupLabel}>Galeri</span>
              <Link href="/admin/artists" className={navCls}>
                Sanatçılar
              </Link>
              <span className={sep}>›</span>
              <Link href="/admin/series" className={navCls}>
                Seriler
              </Link>
              <span className={sep}>›</span>
              <Link href="/admin/artworks" className={navCls}>
                Eserler
              </Link>
            </div>

            <span className="opacity-25">|</span>

            {/* Mağaza grubu — Kategoriler › Ürünler */}
            <div className="flex items-center gap-3">
              <span className={groupLabel}>Mağaza</span>
              <Link href="/admin/categories" className={navCls}>
                Kategoriler
              </Link>
              <span className={sep}>›</span>
              <Link href="/admin" className={navCls}>
                Ürünler
              </Link>
            </div>

            <span className="opacity-25">|</span>

            {/* İçerik grubu */}
            <div className="flex items-center gap-3">
              <span className={groupLabel}>İçerik</span>
              <Link href="/admin/journal" className={navCls}>
                Günce
              </Link>
              <span className={sep}>›</span>
              <Link href="/admin/workshops" className={navCls}>
                Atölyeler
              </Link>
            </div>

            <div className="ml-auto flex items-center gap-5">
              <Link href="/" target="_blank" className={navCls}>
                Siteyi gör ↗
              </Link>
              <form action={logout}>
                <button type="submit" className={navCls}>
                  Çıkış
                </button>
              </form>
            </div>
          </div>
        </header>
      )}
      <main className="container-x py-10">{children}</main>
    </div>
  );
}
