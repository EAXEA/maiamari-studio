import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ../data klasöründen JSON okunduğu için outputFileTracingRoot,
  // standalone build'de monorepo gibi davranıp ana klasörü tracelar.
  outputFileTracingRoot: undefined,

  images: {
    formats: ["image/avif", "image/webp"],
  },

  experimental: {
    // App Router server components için JSON import problemi yaşamayalım
  },
};

export default nextConfig;
