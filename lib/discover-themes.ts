export type DiscoverTheme = {
  label: string;
  meta: string;
  image: string;
};

// 4 mecra — atölye süreç fotoğrafları (üretim odaklı, insan figürsüz).
// TODO: stok site / sahnelenmiş mizansen fotoğrafları için kullanıcı seçimi
// gelene kadar var olan atölye fotoğraflarından nötr olanları kullanıyoruz.
export const DISCOVER_THEMES: DiscoverTheme[] = [
  {
    label: "Linol Baskı",
    meta: "Atölyenin ana mecrası",
    image: "/images/atolye/linol-workshop.jpg",
  },
  {
    label: "Suluboya",
    meta: "Aylık program",
    image: "/images/atolye/watercolor-framed.jpg",
  },
  {
    label: "Çanta Baskı",
    meta: "Tek günlük atölye",
    image: "/images/atolye/press-and-brayers.jpg",
  },
  {
    label: "El Yapımı Kâğıt",
    meta: "Doğal liften",
    // Galaksi Koyu Gri katmanları (mağazadaki ürünün detay çekimi, insan figürsüz)
    image: "/images/shopier/38120359/img_02.jpeg",
  },
];
