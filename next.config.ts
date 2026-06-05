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

const nextConfig: NextConfig = {
  // ../data klasöründen JSON okunduğu için outputFileTracingRoot,
  // standalone build'de monorepo gibi davranıp ana klasörü tracelar.
  outputFileTracingRoot: undefined,

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseImageHost(),
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  experimental: {
    // App Router server components için JSON import problemi yaşamayalım
  },
};

export default nextConfig;
