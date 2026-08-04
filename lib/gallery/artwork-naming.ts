import type { PortfolioWork, Series } from "@/lib/types";

export type ArtworkNaming = {
  /** Sayfadaki h1. Veri neyse odur; sanatçının tercihi değiştirilmez. */
  heading: string;
  /** h1 üstündeki küçük satır. Seri yoksa null. */
  eyebrow: string | null;
  /** Seri vitrinindeki kart adı. */
  cardTitle: string;
  /** Tarayıcı sekmesi + arama sonucu başlığı. */
  pageTitle: string;
  /** JSON-LD `name` (müze künyesi biçimi). */
  schemaName: string;
};

const UNTITLED_LABEL = "İsimsiz";

/**
 * Başlık "isimsiz"/"untitled" kalıbında mı. Yayındaki 57 eserin 27'si
 * "İsimsiz / Untitled" taşıyor; hepsi kendi sayfasını aldığı için bunlar
 * ayrıştırılmazsa 27 sayfa aynı başlıkla çıkar ve arama motoru kopya sayar.
 */
function isUntitled(title: string): boolean {
  const t = title.toLocaleLowerCase("tr").replace(/[^a-zçğıöşü]+/g, " ").trim();
  return t === "isimsiz" || t === "untitled" || t === "isimsiz untitled";
}

/** "kapilar-03" → "03"; numarası olmayan slug'da null. */
function workNumber(slug: string): string | null {
  const m = /-(\d+)$/.exec(slug);
  return m ? m[1] : null;
}

/**
 * Bir eserin farklı bağlamlardaki görünen adlarını üretir. Adı olan eserlerde
 * her alan başlığın kendisidir; yalnız isimsiz eserlerde seri adı + eser
 * numarasıyla ayrıştırma yapılır. Veri katmanına DOKUNULMAZ.
 */
export function artworkNaming(
  work: PortfolioWork,
  series: Series | null,
): ArtworkNaming {
  const title = work.title;
  const num = workNumber(work.slug);

  if (!isUntitled(title) || !series || !num) {
    return {
      heading: title,
      eyebrow: series ? series.title : null,
      cardTitle: title,
      pageTitle: title,
      schemaName: title,
    };
  }

  const ref = `${series.title} ${num}`;
  const yearSuffix = work.year ? `, ${work.year}` : "";

  return {
    heading: title,
    eyebrow: `${series.title} · Eser ${num}`,
    cardTitle: ref,
    pageTitle: `${ref} · ${UNTITLED_LABEL}${yearSuffix}`,
    schemaName: `${UNTITLED_LABEL} (${ref})${yearSuffix}`,
  };
}
