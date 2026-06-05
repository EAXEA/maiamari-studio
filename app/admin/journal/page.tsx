/**
 * MAIAMARI.STUDIO — Admin günce yönetimi
 * Günce kayıtlarını (taslaklar dahil) listeler, yeni kayıt formu sunar.
 */
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { isDbConfigured } from "@/lib/db/client";
import { isStorageConfigured } from "@/lib/admin/storage";
import { dbGetJournalRowsAdmin } from "@/lib/db/journal";
import { JournalForm } from "@/components/admin/journal-form";
import { JournalDeleteButton } from "@/components/admin/journal-delete-button";

export const dynamic = "force-dynamic";

export default async function AdminJournalPage() {
  await requireAdmin();
  const posts = (await dbGetJournalRowsAdmin()) ?? [];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-3xl">Günce</h1>
        <Link href="/journal" target="_blank" className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]">
          /journal ↗
        </Link>
      </div>
      <p className="text-sm text-[color:var(--color-muted)] mb-8">
        Atölye notları ve etkinlikler. En yeni tarih üstte görünür. Taslak
        kayıtlar sitede gizlidir.
      </p>

      {!isDbConfigured() && (
        <p className="text-sm text-amber-700 border border-amber-300 bg-amber-50 rounded-md px-3 py-2 mb-6">
          Veritabanı bağlı değil. Günce yönetimi <code>DATABASE_URL</code>{" "}
          olmadan çalışmaz.
        </p>
      )}

      {/* Mevcut kayıtlar */}
      <div className="border border-[color:var(--color-hairline)] rounded-lg divide-y divide-[color:var(--color-hairline)] mb-12">
        {posts.map((p) => (
          <div
            key={p.slug}
            className="flex items-start justify-between gap-4 px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.image || "/images/placeholder.jpg"}
                alt=""
                className="h-10 w-10 object-cover rounded border border-[color:var(--color-border)] shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate max-w-xs">{p.title}</span>
                  {!p.isPublished && (
                    <span className="text-[11px] text-amber-700">Taslak</span>
                  )}
                </div>
                <p className="text-xs text-[color:var(--color-muted)] mt-0.5">
                  {p.dateLabel || p.date}
                  {p.category ? ` · ${p.category}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <Link
                href={`/admin/journal/${p.slug}`}
                className="text-xs underline underline-offset-2 hover:text-[color:var(--color-foreground)]"
              >
                Düzenle
              </Link>
              <JournalDeleteButton slug={p.slug} title={p.title} />
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <p className="px-4 py-3 text-sm text-[color:var(--color-muted)]">
            Henüz günce kaydı yok. Aşağıdan ilk kaydı ekleyin.
          </p>
        )}
      </div>

      {/* Yeni kayıt */}
      <div className="border-t border-[color:var(--color-hairline)] pt-8">
        <h2 className="font-display text-xl mb-5">Yeni günce ekle</h2>
        <JournalForm storageReady={isStorageConfigured()} />
      </div>
    </div>
  );
}
