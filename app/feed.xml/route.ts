import { getAllProducts, getCategories } from "@/lib/data";

const BASE_URL = "https://www.maiamari.art";

// Ürün feed'i (Google Merchant RSS 2.0). iyzico/pazarlama tarafının istediği
// "XML linki" budur; saatte bir tazelenir.
export const revalidate = 3600;

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toAbsolute(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export async function GET() {
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getCategories(),
  ]);
  const categoryName = new Map(categories.map((c) => [c.slug, c.name]));

  const items = products
    .map((p) => {
      const availability =
        p.status === "out_of_stock" ? "out_of_stock" : "in_stock";
      const lines = [
        `      <g:id>${esc(p.slug)}</g:id>`,
        `      <g:title>${esc(p.title)}</g:title>`,
        `      <g:description>${esc(p.description)}</g:description>`,
        `      <g:link>${BASE_URL}/urun/${esc(p.slug)}</g:link>`,
        `      <g:image_link>${esc(toAbsolute(p.coverImage))}</g:image_link>`,
        `      <g:price>${p.priceTRY.toFixed(2)} TRY</g:price>`,
        `      <g:availability>${availability}</g:availability>`,
        `      <g:condition>new</g:condition>`,
        `      <g:brand>MAIAMARI</g:brand>`,
      ];
      const cat = categoryName.get(p.categorySlug);
      if (cat) lines.push(`      <g:product_type>${esc(cat)}</g:product_type>`);
      return `    <item>\n${lines.join("\n")}\n    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Maiamari Baskı Atölyesi</title>
    <link>${BASE_URL}</link>
    <description>Maiamari Baskı Atölyesi ürün listesi</description>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
