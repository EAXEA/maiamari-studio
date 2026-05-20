/**
 * Schema.org / JSON-LD structured data yardımcıları.
 * Google rich result desteği için layout + sayfalarda kullanılır.
 */
import { getBusiness } from "./data";
import type { Product } from "./types";

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
 * Yardımcı: schema objesini <script type="application/ld+json"> tag'i olarak basmak için
 * dangerouslySetInnerHTML payload'u üretir.
 */
export function jsonLdScript(data: unknown) {
  return {
    __html: JSON.stringify(data),
  };
}
