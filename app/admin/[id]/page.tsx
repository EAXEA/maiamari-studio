/**
 * MAIAMARI.STUDIO — Ürün / Eser düzenleme sayfası
 * Aynı sayfa her iki türü de düzenler; form türe göre alanları gösterir.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { isStorageConfigured } from "@/lib/admin/storage";
import { getCategories, getSeries, getArtists } from "@/lib/data";
import { dbGetRowById } from "@/lib/db/products";
import { ProductForm, type ProductFormDefaults } from "@/components/admin/product-form";
import { saveProduct } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const row = await dbGetRowById(id);
  if (!row) notFound();

  const isArtwork = row.kind === "artwork";

  const defaults: ProductFormDefaults = {
    id: row.id,
    kind: isArtwork ? "artwork" : "material",
    title: row.title,
    description: row.description,
    priceTry: String(row.priceTry ?? ""),
    compareAtTry: row.compareAtTry == null ? "" : String(row.compareAtTry),
    categorySlug: row.categorySlug,
    stock: row.stock,
    status: row.status,
    sourceUrl: row.sourceUrl,
    artistSlug: row.artistSlug ?? "",
    seriesSlug: row.seriesSlug ?? "",
    technique: row.technique ?? "",
    paper: row.paper ?? "",
    dimensions: row.dimensions ?? "",
    editionSize: row.editionSize == null ? "" : String(row.editionSize),
    firstSerial: row.firstSerial ?? "",
    year: row.year == null ? "" : String(row.year),
    artist: row.artist ?? "Duygu Sinan",
    forSale: row.forSale,
    coverImage: row.coverImage,
    gallery: row.gallery ?? [],
    isPublished: row.isPublished,
    sortOrder: row.sortOrder,
  };

  const backHref = isArtwork ? "/admin/artworks" : "/admin";

  return (
    <div>
      <Link
        href={backHref}
        className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
      >
        ← {isArtwork ? "Eserler" : "Ürünler"}
      </Link>
      <h1 className="font-display text-3xl mt-3 mb-1">
        {isArtwork ? "Eseri düzenle" : "Ürünü düzenle"}
      </h1>
      <p className="text-sm text-[color:var(--color-muted)] mb-8">
        {isArtwork ? `/galeri/${row.seriesSlug ?? ""}` : `/urun/${row.slug}`}
      </p>
      <ProductForm
        action={saveProduct}
        defaults={defaults}
        categories={await getCategories()}
        seriesList={(await getSeries()).map((s) => ({
          slug: s.slug,
          title: s.title,
          artistSlug: s.artistSlug ?? "duygu-sinan",
        }))}
        artistsList={(await getArtists()).map((a) => ({
          slug: a.slug ?? "",
          name: a.name,
        }))}
        storageReady={isStorageConfigured()}
        isNew={false}
      />
    </div>
  );
}
