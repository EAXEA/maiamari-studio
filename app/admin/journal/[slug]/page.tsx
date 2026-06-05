/**
 * MAIAMARI.STUDIO — Günce düzenleme
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { isStorageConfigured } from "@/lib/admin/storage";
import { dbGetJournalRow } from "@/lib/db/journal";
import { JournalForm } from "@/components/admin/journal-form";

export const dynamic = "force-dynamic";

export default async function EditJournalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  const row = await dbGetJournalRow(slug);
  if (!row) notFound();

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/journal"
        className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
      >
        ← Günce
      </Link>
      <h1 className="font-display text-3xl mt-3 mb-8">Günceyi düzenle</h1>
      <JournalForm
        defaults={{
          slug: row.slug,
          title: row.title,
          excerpt: row.excerpt,
          body: row.body,
          date: row.date,
          dateLabel: row.dateLabel,
          category: row.category,
          location: row.location,
          locationUrl: row.locationUrl,
          image: row.image,
          imageAlt: row.imageAlt,
          gallery: row.gallery ?? [],
          instagramUrl: row.instagramUrl,
          isPublished: row.isPublished,
          sortOrder: row.sortOrder,
        }}
        storageReady={isStorageConfigured()}
      />
    </div>
  );
}
