import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProductBySlug,
  getAllProducts,
  getCategoryBySlug,
} from "@/lib/data";
import { formatTRY } from "@/lib/format";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductTutorialReel } from "@/components/product/product-tutorial-reel";
import { getTutorialsForProduct } from "@/lib/product-tutorials";
import {
  productSchema,
  breadcrumbSchema,
  jsonLdScript,
} from "@/lib/structured-data";

const BASE_URL = "https://www.maiamari.art";

export async function generateStaticParams() {
  return (await getAllProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: `/urun/${p.slug}` },
    openGraph: {
      title: p.title,
      description: p.description,
      // OG image: app/urun/[slug]/opengraph-image.tsx file convention.
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const cat = await getCategoryBySlug(product.categorySlug);
  const tutorials = getTutorialsForProduct(product.slug);
  const related = (await getAllProducts())
    .filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id)
    .slice(0, 4);

  const breadcrumb = breadcrumbSchema(
    [
      { name: "Ana sayfa", url: `${BASE_URL}/` },
      { name: "Mağaza", url: `${BASE_URL}/shop` },
      ...(cat
        ? [{ name: cat.name, url: `${BASE_URL}/shop/${cat.slug}` }]
        : []),
      { name: product.title, url: `${BASE_URL}/urun/${product.slug}` },
    ],
  );

  return (
    <div className="container-x py-12 lg:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(productSchema(product))}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(breadcrumb)}
      />
      {/* Breadcrumb */}
      <nav className="mb-10 text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
        <Link href="/shop">Mağaza</Link>
        {cat && (
          <>
            <span className="mx-2">·</span>
            <Link href={`/shop/${cat.slug}`}>{cat.name}</Link>
          </>
        )}
      </nav>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-20 items-start">
        {/* Gallery — interaktif: thumb değişimi + lightbox zoom */}
        <ProductGallery
          images={
            product.gallery.length > 0 ? product.gallery : [product.coverImage]
          }
          title={product.title}
        />

        {/* Detail */}
        <div className="lg:sticky lg:top-28">
          {cat && (
            <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
              {cat.name}
            </p>
          )}
          <h1 className="font-display text-3xl lg:text-4xl mt-2 leading-tight">
            {product.title}
          </h1>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-display text-2xl">
              {formatTRY(product.priceTRY)}
            </span>
            {product.compareAtTRY &&
              product.compareAtTRY > product.priceTRY && (
                <span className="text-base text-[color:var(--color-muted)] line-through">
                  {formatTRY(product.compareAtTRY)}
                </span>
              )}
          </div>

          {product.status === "out_of_stock" ? (
            <p className="mt-6 text-sm uppercase tracking-widest text-[color:var(--color-press)]">
              Şu an stokta yok
            </p>
          ) : (
            <div className="mt-8 flex gap-3">
              <div className="relative flex-1">
                <span
                  className="absolute -top-2 right-3 z-10 inline-flex items-center px-2 py-0.5 text-[10px] tracking-[0.2em] uppercase font-medium"
                  style={{
                    background: "var(--color-accent-pink)",
                    color: "var(--color-walnut-dark)",
                  }}
                >
                  Yakında
                </span>
                <button
                  disabled
                  aria-disabled="true"
                  className="w-full h-12 text-xs tracking-[0.2em] uppercase opacity-60 cursor-not-allowed"
                  style={{
                    background: "var(--color-walnut-dark)",
                    color: "var(--color-background)",
                  }}
                  title="Online sepet yakında — şimdilik Shopier üzerinden sipariş alıyoruz"
                >
                  Sepete ekle
                </button>
              </div>
              <a
                href={product.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="h-12 px-6 inline-flex items-center text-xs tracking-[0.2em] uppercase border transition-colors hover:bg-[color:var(--color-foreground)] hover:text-[color:var(--color-background)]"
                style={{
                  borderColor: "var(--color-foreground)",
                  color: "var(--color-foreground)",
                }}
              >
                Shopier&apos;de aç
              </a>
            </div>
          )}
          <p
            className="mt-3 text-xs"
            style={{ color: "var(--color-muted)" }}
          >
            Online sepet ve güvenli ödeme yakında. Şimdilik siparişler{" "}
            <a
              href={product.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              Shopier
            </a>{" "}
            üzerinden alınmaktadır.
          </p>

          {product.description && (
            <div className="mt-10 prose prose-sm max-w-none">
              <h2 className="font-display text-lg mb-3">Ürün açıklaması</h2>
              <p className="text-sm leading-relaxed text-[color:var(--color-foreground)] whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          <dl className="mt-10 border-t border-[color:var(--color-border)] pt-6 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-xs">
            <dt className="text-[color:var(--color-muted)] uppercase tracking-wider">
              Kategori
            </dt>
            <dd>{cat?.name}</dd>
            <dt className="text-[color:var(--color-muted)] uppercase tracking-wider">
              Durum
            </dt>
            <dd>
              {product.status === "out_of_stock"
                ? "Tükendi"
                : product.status === "low_stock"
                ? "Son birkaç adet"
                : product.status === "new"
                ? "Yeni gelen"
                : "Stokta"}
            </dd>
          </dl>
        </div>
      </div>

      {tutorials.length > 0 && (
        <section className="mt-20 lg:mt-24 border-t border-[color:var(--color-border)] pt-12">
          <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
            Nasıl kullanılır
          </p>
          <h2 className="font-display mt-3 text-2xl lg:text-3xl">
            {tutorials.length === 1 ? tutorials[0].title : "Kullanımı"}
          </h2>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-3xl">
            {tutorials.map((t) => (
              <ProductTutorialReel key={t.reelId} tutorial={t} />
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-24 border-t border-[color:var(--color-border)] pt-12">
          <h2 className="font-display text-2xl lg:text-3xl mb-8">
            Aynı koleksiyondan
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
