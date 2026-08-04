/**
 * OG image helpers — Next.js 16 `opengraph-image.tsx` file convention.
 * Satori (next/og) ile build-time'da statik üretilir.
 */
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  getProductBySlug,
  getCategoryBySlug,
  getSeriesBySlug,
  getPortfolioBySeries,
  getArtworkBySlug,
} from "./data";

function formatPriceForOG(value: number): string {
  return `${value.toLocaleString("tr-TR")} ₺`;
}

// Font cache — build-time'da tek defa okunur, tüm OG route'ları paylaşır.
// Static font dosyaları assets/fonts/ altında, full Latin + Latin Extended
// + Currency (₺ U+20BA dahil) coverage'la. Satori variable font'u tam
// desteklemiyor (`Cannot read properties of undefined (reading '256')`).
// @fontsource subset bazlı (latin / latin-ext ayrı) olduğundan Satori font
// matching subset fallback yapmıyor; her dosyada full coverage olan rsms
// Inter + CatharsisFonts Cormorant kullanılır.
const fontCache: {
  interRegular?: Buffer;
  interSemiBold?: Buffer;
  cormorantMediumItalic?: Buffer;
} = {};

async function loadFonts() {
  const fontsBase = join(process.cwd(), "assets", "fonts");
  if (!fontCache.interRegular) {
    fontCache.interRegular = await readFile(join(fontsBase, "Inter-Regular.ttf"));
    fontCache.interSemiBold = await readFile(join(fontsBase, "Inter-SemiBold.ttf"));
    fontCache.cormorantMediumItalic = await readFile(
      join(fontsBase, "CormorantGaramond-MediumItalic.ttf"),
    );
  }
  return [
    { name: "Inter", data: fontCache.interRegular!, style: "normal" as const, weight: 400 as const },
    { name: "Inter", data: fontCache.interSemiBold!, style: "normal" as const, weight: 600 as const },
    { name: "Cormorant", data: fontCache.cormorantMediumItalic!, style: "italic" as const, weight: 500 as const },
  ];
}

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png" as const;

const BRAND = {
  background: "#FAF7F2",
  surface: "#F4EFE8",
  surface2: "#ECE4D7",
  foreground: "#1A1A1A",
  muted: "#6B6157",
  walnut: "#5A3E2B",
  walnutDark: "#2B1E12",
  hairline: "#ECE4D7",
};

/**
 * Magic byte ile dosyanın gerçek formatını tespit eder.
 * Shopier scrape görsellerinde .JPG uzantılı PNG dosyalar var (yanlış
 * uzantı), uzantıdan MIME türetmek Satori'de DataView range error veriyor.
 */
function sniffImageMime(buf: Buffer): string | null {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return "image/png";
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) {
    return "image/webp";
  }
  if (buf.length >= 4 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) {
    return "image/gif";
  }
  return null;
}

async function loadPublicAsBase64(publicPath: string): Promise<string | null> {
  try {
    const abs = join(process.cwd(), "public", publicPath.replace(/^\//, ""));
    const data = await readFile(abs);
    const mime = sniffImageMime(data);
    if (!mime) return null;
    return `data:${mime};base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: BRAND.background,
        padding: 64,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {children}
    </div>
  );
}

function BrandFooter() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        fontSize: 22,
        letterSpacing: 6,
        textTransform: "uppercase",
        color: BRAND.walnutDark,
      }}
    >
      <span style={{ fontWeight: 600 }}>MAIAMARI</span>
      <span style={{ color: BRAND.muted }}>·</span>
      <span style={{ color: BRAND.muted, letterSpacing: 4 }}>maiamari.art</span>
    </div>
  );
}

export async function defaultOGImage() {
  const fonts = await loadFonts();
  return new ImageResponse(
    (
      <Frame>
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                fontSize: 20,
                letterSpacing: 8,
                textTransform: "uppercase",
                color: BRAND.muted,
              }}
            >
              Baskı Atölyesi · Galeri
            </div>
            <div
              style={{
                fontSize: 180,
                fontWeight: 600,
                letterSpacing: -4,
                color: BRAND.walnutDark,
                lineHeight: 1,
              }}
            >
              MAIAMARI
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div
              style={{
                fontSize: 44,
                color: BRAND.foreground,
                lineHeight: 1.15,
                maxWidth: 900,
              }}
            >
              Atölyeden galeriye, sanatın elle dokunulmuş hali.
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 16,
                paddingTop: 24,
                borderTop: `1px solid ${BRAND.hairline}`,
              }}
            >
              <BrandFooter />
              <div
                style={{
                  fontSize: 20,
                  color: BRAND.muted,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                }}
              >
                Ankara · Çankaya · Küçükesat
              </div>
            </div>
          </div>
        </div>
      </Frame>
    ),
    { ...OG_SIZE, fonts },
  );
}

export async function seriesOGImage(slug: string) {
  const fonts = await loadFonts();
  const series = await getSeriesBySlug(slug);
  if (!series) return defaultOGImage();
  const works = await getPortfolioBySeries(series.slug);
  const coverPath = series.coverImage ?? works[0]?.image;
  const cover = coverPath ? await loadPublicAsBase64(coverPath) : null;
  const yearLabel = series.yearRange ?? (series.year ? String(series.year) : "");

  return new ImageResponse(
    (
      <Frame>
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            gap: 56,
          }}
        >
          {/* Left: pasapartu cover */}
          <div
            style={{
              width: 470,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: BRAND.surface,
              padding: 36,
              boxSizing: "border-box",
            }}
          >
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt=""
                width={398}
                height={430}
                style={{ objectFit: "contain", maxWidth: "100%", maxHeight: "100%" }}
              />
            ) : (
              <div style={{ display: "flex", fontSize: 24, color: BRAND.muted }}>
                {series.title}
              </div>
            )}
          </div>
          {/* Right: meta */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              paddingTop: 12,
              paddingBottom: 12,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <div
                style={{
                  fontSize: 18,
                  letterSpacing: 6,
                  textTransform: "uppercase",
                  color: BRAND.muted,
                }}
              >
                Galeri · Duygu Sinan
              </div>
              <div
                style={{
                  fontFamily: "Cormorant, serif",
                  fontStyle: "italic",
                  fontSize: 110,
                  fontWeight: 500,
                  letterSpacing: -2,
                  color: BRAND.walnutDark,
                  lineHeight: 1.02,
                }}
              >
                {series.title}
              </div>
              <div
                style={{
                  fontSize: 26,
                  color: BRAND.foreground,
                  lineHeight: 1.3,
                  maxWidth: 540,
                  display: "-webkit-box",
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {series.description}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                paddingTop: 22,
                borderTop: `1px solid ${BRAND.hairline}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  color: BRAND.walnut,
                  letterSpacing: 2,
                }}
              >
                {`${works.length} eser${yearLabel ? ` · ${yearLabel}` : ""}`}
              </div>
              <BrandFooter />
            </div>
          </div>
        </div>
      </Frame>
    ),
    { ...OG_SIZE, fonts },
  );
}

export async function productOGImage(slug: string) {
  const fonts = await loadFonts();
  const product = await getProductBySlug(slug);
  if (!product) return defaultOGImage();
  const cat = await getCategoryBySlug(product.categorySlug);
  const imagePath = product.coverImage ?? product.gallery[0];
  const image = imagePath ? await loadPublicAsBase64(imagePath) : null;

  return new ImageResponse(
    (
      <Frame>
        <div style={{ width: "100%", height: "100%", display: "flex", gap: 56 }}>
          {/* Left: pasapartu product image */}
          <div
            style={{
              width: 470,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: BRAND.surface,
              padding: 36,
              boxSizing: "border-box",
            }}
          >
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt=""
                width={398}
                height={430}
                style={{ objectFit: "contain", maxWidth: "100%", maxHeight: "100%" }}
              />
            ) : (
              <div style={{ display: "flex", fontSize: 24, color: BRAND.muted }}>
                {product.title}
              </div>
            )}
          </div>
          {/* Right: meta */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              paddingTop: 12,
              paddingBottom: 12,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
              <div
                style={{
                  fontSize: 18,
                  letterSpacing: 6,
                  textTransform: "uppercase",
                  color: BRAND.muted,
                }}
              >
                {`Mağaza${cat ? ` · ${cat.name}` : ""}`}
              </div>
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 600,
                  letterSpacing: -1,
                  color: BRAND.walnutDark,
                  lineHeight: 1.08,
                  display: "-webkit-box",
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {product.title}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 16,
                  fontSize: 48,
                  color: BRAND.walnut,
                  fontWeight: 600,
                }}
              >
                <span>{formatPriceForOG(product.priceTRY)}</span>
                {product.compareAtTRY && product.compareAtTRY > product.priceTRY && (
                  <span
                    style={{
                      fontSize: 28,
                      color: BRAND.muted,
                      textDecoration: "line-through",
                      fontWeight: 400,
                    }}
                  >
                    {formatPriceForOG(product.compareAtTRY)}
                  </span>
                )}
              </div>
            </div>
            <div
              style={{
                paddingTop: 22,
                borderTop: `1px solid ${BRAND.hairline}`,
                display: "flex",
              }}
            >
              <BrandFooter />
            </div>
          </div>
        </div>
      </Frame>
    ),
    { ...OG_SIZE, fonts },
  );
}

/** Eser OG görseli — /eser/[slug] paylaşımlarında görünür. */
export async function artworkOGImage(slug: string) {
  const fonts = await loadFonts();
  const work = await getArtworkBySlug(slug);
  if (!work) return defaultOGImage();
  const image = work.image ? await loadPublicAsBase64(work.image) : null;
  const meta = [
    work.technique ?? "Linol baskı",
    work.year ? String(work.year) : null,
    work.editionSize ? `${work.editionSize} adetlik edisyon` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return new ImageResponse(
    (
      <Frame>
        <div style={{ width: "100%", height: "100%", display: "flex", gap: 56 }}>
          <div
            style={{
              width: 470,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: BRAND.surface,
              padding: 36,
              boxSizing: "border-box",
            }}
          >
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt=""
                width={398}
                height={430}
                style={{ objectFit: "contain", maxWidth: "100%", maxHeight: "100%" }}
              />
            ) : (
              <div style={{ display: "flex", fontSize: 24, color: BRAND.muted }}>
                {work.title}
              </div>
            )}
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              paddingTop: 12,
              paddingBottom: 12,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
              <div style={{ display: "flex", fontSize: 54, color: BRAND.foreground }}>
                {work.title}
              </div>
              <div style={{ display: "flex", fontSize: 26, color: BRAND.muted }}>
                {meta}
              </div>
            </div>
            <BrandFooter />
          </div>
        </div>
      </Frame>
    ),
    { ...OG_SIZE, fonts },
  );
}
