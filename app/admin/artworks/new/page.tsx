/**
 * MAIAMARI.STUDIO — Yeni galeri eseri ekleme (künye formatı)
 */
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { isStorageConfigured } from "@/lib/admin/storage";
import { getSeries, getArtists } from "@/lib/data";
import { ProductForm, type ProductFormDefaults } from "@/components/admin/product-form";
import { saveProduct } from "../../actions";

export const dynamic = "force-dynamic";

const EMPTY_ARTWORK: ProductFormDefaults = {
  id: "",
  kind: "artwork",
  title: "",
  description: "",
  priceTry: "",
  compareAtTry: "",
  categorySlug: "",
  stock: 0,
  status: "in_stock",
  sourceUrl: "",
  artistSlug: "",
  seriesSlug: "",
  technique: "",
  paper: "",
  dimensions: "",
  editionSize: "",
  firstSerial: "",
  year: "",
  artist: "Duygu Sinan",
  forSale: false, // yeni eser varsayılan sergilik; satılıksa panelden işaretlenir
  coverImage: "",
  gallery: [],
  isPublished: true,
  sortOrder: 0,
};

export default async function NewArtworkPage({
  searchParams,
}: {
  searchParams: Promise<{ series?: string }>;
}) {
  await requireAdmin();
  const { series: seriesFilter } = await searchParams;
  const [series, artists] = await Promise.all([getSeries(), getArtists()]);

  // Drill-down'dan gelindiyse seri + sanatçı ön-seçili gelir.
  const preSeries = seriesFilter
    ? series.find((s) => s.slug === seriesFilter)
    : undefined;
  const defaults: ProductFormDefaults = preSeries
    ? {
        ...EMPTY_ARTWORK,
        seriesSlug: preSeries.slug,
        artistSlug: preSeries.artistSlug ?? "duygu-sinan",
      }
    : EMPTY_ARTWORK;

  return (
    <div>
      <Link
        href="/admin/artworks"
        className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
      >
        ← Eserler
      </Link>
      <h1 className="font-display text-3xl mt-3 mb-8">Yeni eser</h1>
      <ProductForm
        action={saveProduct}
        defaults={defaults}
        categories={[]}
        seriesList={series.map((s) => ({
          slug: s.slug,
          title: s.title,
          artistSlug: s.artistSlug ?? "duygu-sinan",
        }))}
        artistsList={artists.map((a) => ({
          slug: a.slug ?? "",
          name: a.name,
        }))}
        storageReady={isStorageConfigured()}
        isNew
      />
    </div>
  );
}
