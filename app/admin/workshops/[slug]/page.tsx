/**
 * MAIAMARI.STUDIO — Atölye düzenleme
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { isStorageConfigured } from "@/lib/admin/storage";
import { dbGetWorkshopRow } from "@/lib/db/workshops";
import { WorkshopForm } from "@/components/admin/workshop-form";

export const dynamic = "force-dynamic";

export default async function EditWorkshopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  const row = await dbGetWorkshopRow(slug);
  if (!row) notFound();

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/workshops"
        className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
      >
        ← Atölyeler
      </Link>
      <h1 className="font-display text-3xl mt-3 mb-8">Atölyeyi düzenle</h1>
      <WorkshopForm
        defaults={{
          slug: row.slug,
          title: row.title,
          instructor: row.instructor,
          instructorInstagramHandle: row.instructorInstagramHandle,
          instructorInstagramUrl: row.instructorInstagramUrl,
          schedule: row.schedule,
          description: row.description,
          image: row.image,
          imageAlt: row.imageAlt,
          priceTry: row.priceTry ?? "",
          isPublished: row.isPublished,
          sortOrder: row.sortOrder,
        }}
        storageReady={isStorageConfigured()}
      />
    </div>
  );
}
