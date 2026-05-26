/**
 * Ürün sayfası için opsiyonel "Nasıl kullanılır" reel'leri.
 * Slug → tutorial[] map. Slug yoksa section render edilmez.
 *
 * Tutorial veri kaynağı sanatçı/atölye Instagram'ı olduğunda credit alanını
 * (creditName / creditHandle / creditUrl) doldurun — alttaki künyede gösterilir.
 */
export type ProductTutorial = {
  title: string;
  /** Instagram reel/post ID (URL'in /reel/<ID>/ kısmı). */
  reelId: string;
  /** Tam reel URL'i. */
  url: string;
  /** Kredi gösterilen isim (ör. "Duygu Sinan"). */
  creditName: string;
  /** "@" olmadan handle (ör. "duygu.sinan.printmaker"). */
  creditHandle: string;
  /** Kredinin Instagram profil URL'i. */
  creditUrl: string;
};

export const PRODUCT_TUTORIALS: Record<string, ProductTutorial[]> = {
  "stripping-tabs-ayirma-seritleri": [
    {
      title: "Kullanımı",
      reelId: "DYzpUV5szb7",
      url: "https://www.instagram.com/reel/DYzpUV5szb7/",
      creditName: "Duygu Sinan",
      creditHandle: "duygu.sinan.printmaker",
      creditUrl: "https://www.instagram.com/duygu.sinan.printmaker/",
    },
  ],
};

export function getTutorialsForProduct(slug: string): ProductTutorial[] {
  return PRODUCT_TUTORIALS[slug] ?? [];
}
