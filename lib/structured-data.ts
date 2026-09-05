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
    logo: `${BASE_URL}/brand/maiamari-logo.png`,
    image: [
      `${BASE_URL}/images/atolye/studio-interior-wide.jpg`,
      `${BASE_URL}/images/atolye/storefront.jpg`,
      `${BASE_URL}/images/atolye/gallery-wall.jpg`,
    ],
    telephone: biz.contact.phonePrimary,
    email: biz.contact.email,
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
    logo: `${BASE_URL}/brand/maiamari-logo.png`,
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
 * Mağaza malzemelerinin hedef kitlesi. Malzemeler atölye pratiğinde ve güzel
 * sanatlar derslerinde kullanılıyor; bunu makine-okur beyan etmek arama ve LLM
 * tarafında ürünü doğru bağlama oturtur. Sayfada görünür karşılığı yoktur.
 *
 * Yalnız kind="material" için; eserlerde (visualArtworkSchema) kullanılmaz.
 */
const MATERIAL_AUDIENCE = {
  "@type": "EducationalAudience",
  educationalRole: "student",
  audienceType: "Güzel sanatlar öğrencileri ve baskı atölyeleri",
} as const;

/**
 * Kategori başına, ürünün gerçek kullanım bağlamını anlatan arama terimleri.
 * Anahtar kelime yığma değil: her biri ürünün ne olduğunu ve hangi derste
 * kullanıldığını tarif eder. Bilinmeyen kategoride alan hiç basılmaz.
 */
const CATEGORY_KEYWORDS: Record<string, string> = {
  "linol-boyalari":
    "linol baskı boyası, su bazlı blok baskı boyası, güzel sanatlar malzemesi, baskıresim atölyesi",
  linolyum:
    "linolyum plaka, oyma linol, yüksek baskı, güzel sanatlar baskıresim dersi malzemesi",
  merdaneler:
    "baskı merdanesi, kauçuk merdane, linol baskı merdanesi, güzel sanatlar atölye malzemesi",
  "el-yapimi-kagitlar":
    "el yapımı kâğıt, baskı kâğıdı, pamuk lifli kâğıt, güzel sanatlar resim ve baskı kâğıdı",
  aletler:
    "linol oyma bıçağı, baskı aletleri, kayıt pini, güzel sanatlar atölye ekipmanı",
  cantalar: "kanvas kitap çantası, el dikimi çanta, atölye hediyesi",
};

/**
 * Product schema — /urun/[slug] sayfasında basılır.
 * `urlOverride`: eserler /eser/<slug> adresinde yaşar; markup'taki url
 * canonical ile çelişmemeli (aksi halde 301 veren bir adres gösterilir).
 * `categoryName`: okunabilir kategori adı ("Linol Boyaları"). Kategoriler
 * panelden düzenlendiği için burada slug→ad haritası tutulmaz, çağıran taraf
 * geçirir. Verilmezse `category` alanı hiç basılmaz; slug basmaktan iyidir.
 */
export function productSchema(
  product: Product,
  urlOverride?: string,
  categoryName?: string,
) {
  const url = urlOverride ?? `${BASE_URL}/urun/${product.slug}`;
  const images = product.gallery.length > 0
    ? product.gallery.map((p) => `${BASE_URL}${p}`)
    : [`${BASE_URL}${product.coverImage}`];

  const availability =
    product.status === "out_of_stock"
      ? "https://schema.org/OutOfStock"
      : product.status === "low_stock"
        ? "https://schema.org/LimitedAvailability"
        : "https://schema.org/InStock";

  // Eserler de bu şemadan geçer (/eser/[slug], categorySlug boş). İzleyici ve
  // kategori alanları yalnız mağaza malzemesine aittir; esere basılmaz.
  // categorySlug tipte boş stringi kapsamaz ama eser çağrısı "" gönderir
  // (app/eser/[slug] içindeki cast'in aynası) → karşılaştırma string üzerinden.
  const isMaterial = (product.categorySlug as string) !== "";
  const keywords = isMaterial ? CATEGORY_KEYWORDS[product.categorySlug] : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || `${product.title}. Maiamari atölyesinden.`,
    image: images,
    url,
    sku: product.id,
    ...(isMaterial ? { audience: MATERIAL_AUDIENCE } : {}),
    ...(isMaterial && categoryName ? { category: categoryName } : {}),
    ...(keywords ? { keywords } : {}),
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
export function visualArtworkSchema(work: PortfolioWork, series: Series | null) {
  const absoluteImage = work.image.startsWith("http")
    ? work.image
    : `${BASE_URL}${work.image}`;
  // Eserin kanonik adresi kendi sayfasıdır; markup canonical ile çelişmemeli.
  const workUrl = `${BASE_URL}/eser/${work.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    "@id": workUrl,
    name: work.title,
    image: absoluteImage,
    url: workUrl,
    description:
      work.description ||
      (series
        ? `${work.title}. ${series.title} serisinden linol baskı.`
        : `${work.title}. Linol baskı.`),
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
    ...(series && {
      isPartOf: { "@id": `${BASE_URL}/galeri/${series.slug}#collection` },
    }),
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
    audience: MATERIAL_AUDIENCE,
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
      "Duygu Sinan'ın atölyede elle çoğaltılmış sayılı edisyon linol baskıları. 8 seri.",
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
 * FAQPage — /contact sayfasındaki Sık Sorulanlar bölümü.
 * Google FAQ rich result + AI asistanlarının (AI Overview, ChatGPT vb.)
 * işletme sorularına doğrudan cevap bulabilmesi için.
 */
export function faqPageSchema(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${BASE_URL}/contact#faq`,
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: it.answer,
      },
    })),
  };
}

/**
 * Yardımcı: schema objesini <script type="application/ld+json"> tag'i olarak basmak için
 * dangerouslySetInnerHTML payload'u üretir.
 */
export function jsonLdScript(data: unknown) {
  // GÜVENLİK: JSON.stringify `<`, `>`, `&`, U+2028/2029 karakterlerini kaçırmaz.
  // DB'den gelen başlık/açıklama gibi alanlar `</script>` içerirse script
  // bloğundan kaçıp stored XSS'e yol açabilir. Bu karakterleri unicode escape
  // ederek tag breakout'unu engelliyoruz (üretilen JSON yine geçerli kalır).
  return {
    __html: JSON.stringify(data)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026")
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029"),
  };
}
