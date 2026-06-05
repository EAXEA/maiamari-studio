/**
 * MAIAMARI.STUDIO — Admin atölye yönetimi
 * Atölyeleri (taslaklar dahil) listeler, yeni kayıt formu sunar.
 */
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { isDbConfigured } from "@/lib/db/client";
import { isStorageConfigured } from "@/lib/admin/storage";
import { dbGetWorkshopRowsAdmin } from "@/lib/db/workshops";
import { WorkshopForm } from "@/components/admin/workshop-form";
import { WorkshopDeleteButton } from "@/components/admin/workshop-delete-button";

export const dynamic = "force-dynamic";

export default async function AdminWorkshopsPage() {
  await requireAdmin();
  const rows = (await dbGetWorkshopRowsAdmin()) ?? [];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-3xl">Atölyeler</h1>
        <Link
          href="/atolyeler"
          target="_blank"
          className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
        >
          /atolyeler ↗
        </Link>
      </div>
      <p className="text-sm text-[color:var(--color-muted)] mb-8">
        Atölye programları ve eğitmenler. Sıra küçükten büyüğe görünür. Taslak
        kayıtlar sitede gizlidir.
      </p>

      {!isDbConfigured() && (
        <p className="text-sm text-amber-700 border border-amber-300 bg-amber-50 rounded-md px-3 py-2 mb-6">
          Veritabanı bağlı değil. Atölye yönetimi <code>DATABASE_URL</code>{" "}
          olmadan çalışmaz.
        </p>
      )}

      {/* Mevcut kayıtlar */}
      <div className="border border-[color:var(--color-hairline)] rounded-lg divide-y divide-[color:var(--color-hairline)] mb-12">
        {rows.map((w) => (
          <div
            key={w.slug}
            className="flex items-start justify-between gap-4 px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={w.image || "/images/placeholder.jpg"}
                alt=""
                className="h-10 w-10 object-cover rounded border border-[color:var(--color-border)] shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate max-w-xs">
                    {w.title}
                  </span>
                  {!w.isPublished && (
                    <span className="text-[11px] text-amber-700">Taslak</span>
                  )}
                </div>
                <p className="text-xs text-[color:var(--color-muted)] mt-0.5">
                  {w.instructor || "Eğitmen yok"}
                  {w.schedule ? ` · ${w.schedule}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <Link
                href={`/admin/workshops/${w.slug}`}
                className="text-xs underline underline-offset-2 hover:text-[color:var(--color-foreground)]"
              >
                Düzenle
              </Link>
              <WorkshopDeleteButton slug={w.slug} title={w.title} />
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="px-4 py-3 text-sm text-[color:var(--color-muted)]">
            Henüz atölye kaydı yok. Aşağıdan ilk kaydı ekleyin.
          </p>
        )}
      </div>

      {/* Yeni kayıt */}
      <div className="border-t border-[color:var(--color-hairline)] pt-8">
        <h2 className="font-display text-xl mb-5">Yeni atölye ekle</h2>
        <WorkshopForm storageReady={isStorageConfigured()} />
      </div>
    </div>
  );
}
