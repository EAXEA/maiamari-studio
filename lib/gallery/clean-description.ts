/**
 * Arşiv sync'inden gelen şablon CTA cümlesini gösterimde temizler.
 * "...Edisyon, boyut ve fiyat bilgisi için iletişime geçin." — edisyon, boyut
 * (ve fiyatlı eserlerde fiyat) zaten künyede gösterildiğinden bu cümle artık
 * gereksiz/çelişik. Kaynak veriye/DB'ye DOKUNULMAZ; yalnız render'da düşülür.
 */
export function cleanDescription(desc: string): string {
  return desc
    .replace(
      /\s*Edisyon,\s*boyut\s*ve\s*fiyat\s*bilgisi\s*için\s*iletişime\s*geçin\.?\s*/giu,
      " ",
    )
    .trim();
}
