/**
 * Schema.org / JSON-LD structured data yardımcıları.
 * Google rich result desteği için layout + sayfalarda kullanılır.
 */
import { getBusiness } from "./data";
import type { Category, PortfolioWork, Product, Series } from "./types";

const BASE_URL = "https://www.maiamari.art";

/**
 * LocalBusiness (Store) — anasayfada / layout'ta global olarak basılır.
 * Google sidebar paneli, harita kartı, işletme bilgi widget'ı için kullanılır.
 */
export function localBusinessSchema() {
  const biz = getBusiness();
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${BASE_URL}#business`,
    name: "Maiamari Baskı Atölyesi",
    alternateName: ["Maiamari", "Maiamari Studio", "MAIAMARI"],
    description:
      "Ankara Çankaya Küçükesat'ta linol baskı, el yapımı kâğıt, baskı malzemeleri ve sanat atölyeleri sunan baskı stüdyosu ve galerisi.",
    url: BASE_URL,
    logo: `${BASE_URL}/brand/maimari-logo.png`,
    image: [
      `${BASE_URL}/images/atolye/studio-interior-wide.jpg`,
      `${BASE_URL}/images/atolye/storefront.jpg`,
      `${BASE_URL}/images/atolye/gallery-wall.jpg`,
    ],
    telephone: biz.contact.phonePrimary,
    address: {
      "@type": "PostalAddress",
      streetAddress: biz.address.street,
      addressLocality: biz.address.district,
      addressRegion: biz.address.city,
      postalCode: biz.address.postalCode,
      addressCountry: "TR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: biz.latitude,
      longitude: biz.longitude,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        closes: biz.hours.closingTime,
      },
    ],
    sameAs: [
      biz.contact.instagram,
      biz.contact.shopier,
      biz.googleMapsUrl,
    ],
    priceRange: "₺₺",
    paymentAccepted: ["Cash", "Credit Card"],
    currenciesAccepted: "TRY",
  };
}

/**
 * Organization — brand entity (LocalBusiness ile birlikte güçlendirir).
 */
export function organizationSchema() {
  const biz = getBusiness();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}#organization`,
    name: "Maiamari Baskı Atölyesi",
    url: BASE_URL,
    logo: `${BASE_URL}/brand/maimari-logo.png`,
    founder: {
      "@type": "Person",
      name: "Duygu Sinan",
      jobTitle: "Sanatçı, baskı eğitmeni",
      sameAs: ["https://www.instagram.com/duygu.sinan.printmaker/"],
    },
    sameAs: [biz.contact.instagram, biz.contact.shopier],
  };
}

/**
 * WebSite — site arama box'ı için Google Sitelinks searchbox desteği.
 */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}#website`,
    url: BASE_URL,
    name: "MAIAMARI",
    inLanguage: "tr-TR",
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE_URL}/shop?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Product schema — /urun/[slug] sayfasında basılır.
 */
export function productSchema(product: Product) {
  const url = `${BASE_URL}/urun/${product.slug}`;
  const images = product.gallery.length > 0
    ? product.gallery.map((p) => `${BASE_URL}${p}`)
    : [`${BASE_URL}${product.coverImage}`];

  const availability =
    product.status === "out_of_stock"
      ? "https://schema.org/OutOfStock"
      : product.status === "low_stock"
        ? "https://schema.org/LimitedAvailability"
        : "https://schema.org/InStock";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || `${product.title} — Maiamari atölyesinden.`,
    image: images,
    url,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: "Maiamari",
    },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "TRY",
      price: product.priceTRY.toString(),
      availability,
      seller: {
        "@type": "Organization",
        name: "Maiamari Baskı Atölyesi",
      },
    },
  };
}

/**
 * BreadcrumbList — kategori ve ürün sayfalarında "Mağaza > X > Y" yolu.
 */
export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/**
 * VisualArtwork — galeri serisindeki tek bir eser.
 * Google Images rich result + "Artworks by Duygu Sinan" Knowledge panel için.
 */
export function visualArtworkSchema(work: PortfolioWork, series: Series) {
  const absoluteImage = work.image.startsWith("http")
    ? work.image
    : `${BASE_URL}${work.image}`;
  const seriesUrl = `${BASE_URL}/galeri/${series.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    "@id": `${seriesUrl}#${work.slug}`,
    name: work.title,
    image: absoluteImage,
    url: seriesUrl,
    description: work.description || `${work.title} — ${series.title} serisinden linol baskı.`,
    creator: {
      "@type": "Person",
      name: work.artist || "Duygu Sinan",
      sameAs: "https://www.instagram.com/duygu.sinan.printmaker/",
    },
    artform: "Printmaking",
    artMedium: work.technique || "Linol baskı (Linocut)",
    ...(work.paper && { artworkSurface: work.paper }),
    ...(work.editionSize && { artEdition: work.editionSize }),
    ...(work.year && {
      dateCreated: String(work.year),
      copyrightYear: work.year,
    }),
    isPartOf: { "@id": `${seriesUrl}#collection` },
  };
}

/**
 * CollectionPage (seri sayfası) — ImageGallery + hasPart: VisualArtwork × N.
 * /galeri/[series] sayfasında basılır.
 */
export function seriesCollectionPageSchema(series: Series, works: PortfolioWork[]) {
  const seriesUrl = `${BASE_URL}/galeri/${series.slug}`;
  const coverAbsolute = series.coverImage
    ? (series.coverImage.startsWith("http") ? series.coverImage : `${BASE_URL}${series.coverImage}`)
    : works[0]
      ? `${BASE_URL}${works[0].image}`
      : `${BASE_URL}/og-image.jpg`;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${seriesUrl}#collection`,
    name: `${series.title} · Galeri · MAIAMARI`,
    description: series.description,
    url: seriesUrl,
    isPartOf: { "@id": `${BASE_URL}/galeri#collection` },
    about: {
      "@type": "CreativeWorkSeries",
      name: series.title,
      ...(series.yearRange && { temporalCoverage: series.yearRange }),
      ...(series.year && { datePublished: String(series.year) }),
      creator: {
        "@type": "Person",
        name: "Duygu Sinan",
        sameAs: "https://www.instagram.com/duygu.sinan.printmaker/",
      },
    },
    mainEntity: {
      "@type": "ImageGallery",
      name: series.title,
      image: coverAbsolute,
      numberOfItems: works.length,
      hasPart: works.map((w) => visualArtworkSchema(w, series)),
    },
  };
}

/**
 * CollectionPage (shop kategori) — kategorinin ürünlerini ItemList olarak.
 * /shop/[category] sayfasında basılır. Google Merchant + kategori rich-result için.
 */
export function categoryCollectionPageSchema(category: Category, products: Product[]) {
  const url = `${BASE_URL}/shop/${category.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    name: `${category.name} · MAIAMARI`,
    description: category.description,
    url,
    isPartOf: { "@id": `${BASE_URL}#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((p, idx) => {
        const productUrl = `${BASE_URL}/urun/${p.slug}`;
        const images = p.gallery.length > 0
          ? p.gallery.map((g) => (g.startsWith("http") ? g : `${BASE_URL}${g}`))
          : [p.coverImage.startsWith("http") ? p.coverImage : `${BASE_URL}${p.coverImage}`];
        const availability =
          p.status === "out_of_stock"
            ? "https://schema.org/OutOfStock"
            : p.status === "low_stock"
              ? "https://schema.org/LimitedAvailability"
              : "https://schema.org/InStock";
        return {
          "@type": "ListItem",
          position: idx + 1,
          url: productUrl,
          item: {
            "@type": "Product",
            name: p.title,
            url: productUrl,
            image: images,
            sku: p.id,
            brand: { "@type": "Brand", name: "Maiamari" },
            offers: {
              "@type": "Offer",
              url: productUrl,
              priceCurrency: "TRY",
              price: p.priceTRY.toString(),
              availability,
              seller: {
                "@type": "Organization",
                name: "Maiamari Baskı Atölyesi",
              },
            },
          },
        };
      }),
    },
  };
}

/**
 * CollectionPage (galeri landing) — 8 serinin ItemList'i.
 * /galeri sayfasında basılır.
 */
export function galleryLandingSchema(allSeries: Series[]) {
  const galleryUrl = `${BASE_URL}/galeri`;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${galleryUrl}#collection`,
    name: "Galeri · Duygu Sinan · MAIAMARI",
    description:
      "Duygu Sinan'ın atölyede elle çoğaltılmış sayılı edisyon linol baskıları — 8 seri.",
    url: galleryUrl,
    isPartOf: { "@id": `${BASE_URL}#website` },
    about: {
      "@type": "Person",
      name: "Duygu Sinan",
      sameAs: "https://www.instagram.com/duygu.sinan.printmaker/",
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: allSeries.length,
      itemListElement: allSeries.map((s, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `${BASE_URL}/galeri/${s.slug}`,
        item: {
          "@type": "CreativeWorkSeries",
          "@id": `${BASE_URL}/galeri/${s.slug}#collection`,
          name: s.title,
          description: s.description,
          url: `${BASE_URL}/galeri/${s.slug}`,
          ...(s.coverImage && {
            image: s.coverImage.startsWith("http")
              ? s.coverImage
              : `${BASE_URL}${s.coverImage}`,
          }),
          creator: {
            "@type": "Person",
            name: "Duygu Sinan",
          },
        },
      })),
    },
  };
}

/**
 * Yardımcı: schema objesini <script type="application/ld+json"> tag'i olarak basmak için
 * dangerouslySetInnerHTML payload'u üretir.
 */
export function jsonLdScript(data: unknown) {
  return {
    __html: JSON.stringify(data),
  };
}
