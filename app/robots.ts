import type { MetadataRoute } from "next";

const BASE_URL = "https://www.maiamari.art";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /cart ve /checkout client bileşeni olduğu için metadata (noindex)
        // veremiyor; dizine girmemeleri robots kuralıyla sağlanır.
        disallow: ["/api/", "/cart", "/checkout"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
