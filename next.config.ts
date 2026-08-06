import type { NextConfig } from "next";

/**
 * Panelden yüklenen görseller Supabase Storage'ta tutulur ve tam URL olarak
 * kaydedilir. next/image bu host'u ancak remotePatterns'da izinliyse optimize
 * eder; aksi halde /_next/image 400 döner ve görsel kırık görünür. Host'u
 * NEXT_PUBLIC_SUPABASE_URL'den türetiyoruz, env yoksa bilinen projeye düşüyoruz.
 */
function supabaseImageHost(): string {
  try {
    const u = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (u) return new URL(u).hostname;
  } catch {
    // geçersiz URL → fallback
  }
  return "wagaijlbpdyfbmhsjmho.supabase.co";
}

/**
 * Güvenlik başlıkları (2026-07-20 sertleştirme).
 * - Statik başlıklar ENFORCE: clickjacking (X-Frame-Options), MIME-sniff
 *   (nosniff), referrer sızıntısı (Referrer-Policy), gereksiz tarayıcı
 *   API'leri (Permissions-Policy). Bunlar siteyi bozmaz.
 * - CSP yalnız REPORT-ONLY: bloklamaz, sadece ihlal bildirir. Next inline
 *   script/style ürettiği için script/style-src 'unsafe-inline' ile başlıyoruz;
 *   ihlaller Playwright/konsol ile gözlenip daraltıldıktan sonra ENFORCE'a geçilecek.
 *   iyzico ödeme akışı tam-sayfa yönlendirmedir (embed değil) → CSP'yi etkilemez.
 */
const supabaseHost = supabaseImageHost();
const cspReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `img-src 'self' data: https://${supabaseHost}`,
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  `connect-src 'self' https://${supabaseHost}`,
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
];

const nextConfig: NextConfig = {
  // Framework/sürüm ifşasını kapat (X-Powered-By: Next.js başlığı gönderilmez).
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  // bcryptjs CommonJS modülü Next.js bundler'ı tarafından sarmalandığında
  // Vercel production'da TypeError: Invalid URL hatası üretiyordu.
  // External olarak işaretleyince Node.js runtime CJS loader'ı kullanır.
  serverExternalPackages: ["bcryptjs"],

  // ../data klasöründen JSON okunduğu için outputFileTracingRoot,
  // standalone build'de monorepo gibi davranıp ana klasörü tracelar.
  outputFileTracingRoot: undefined,

  images: {
    formats: ["image/avif", "image/webp"],
    // Kodda kullanilan tum quality degerleri burada acikca izinli olmali
    // (Next 16 izinli-liste disindaki q'yu 75'e dusurur). 85 = atolye/mekan
    // fotolari icin yeni hedef; 82/88/90 mevcut kullanim.
    qualities: [75, 82, 85, 88, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseImageHost(),
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  experimental: {
    serverActions: {
      // Panelden yüklenen görseller Server Action'ın multipart gövdesiyle
      // taşınır. Next varsayılanı 1 MB'dır ve gerçek bir fotoğraf bunu kolayca
      // aşıp isteği action koduna ulaşmadan reddettirir (404/500 belirtisi).
      // İstemci tarafı (Dropzone) görselleri yüklemeden önce küçültür; bu yalnız
      // güvenlik tamponudur. Vercel function payload sert tavanı ~4.5 MB
      // olduğundan değeri onun altında tutuyoruz; asıl koruma istemci sıkıştırma.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
