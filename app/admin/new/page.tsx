/**
 * MAIAMARI.STUDIO — Yeni mağaza ürünü ekleme sayfası
 */
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { isStorageConfigured } from "@/lib/admin/storage";
import { getCategories } from "@/lib/data";
import { ProductForm, type ProductFormDefaults } from "@/components/admin/product-form";
import { saveProduct } from "../actions";

export const dynamic = "force-dynamic";

const EMPTY_MATERIAL: ProductFormDefaults = {
  id: "",
  kind: "material",
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
  forSale: true,
  coverImage: "",
  gallery: [],
  isPublished: true,
  sortOrder: 0,
};

export default async function NewProductPage() {
  await requireAdmin();

  return (
    <div>
      <Link
        href="/admin"
        className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
      >
        ← Ürünler
      </Link>
      <h1 className="font-display text-3xl mt-3 mb-8">Yeni ürün</h1>
      <ProductForm
        action={saveProduct}
        defaults={EMPTY_MATERIAL}
        categories={await getCategories()}
        seriesList={[]}
        artistsList={[]}
        storageReady={isStorageConfigured()}
        isNew
      />
    </div>
  );
}
