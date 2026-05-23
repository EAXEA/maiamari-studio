/**
 * Workshop slug → cover image map.
 * /atolyeler ve anasayfa workshops bölümü için ortak.
 */
export const WORKSHOP_IMAGES: Record<string, { src: string; alt: string }> = {
  "suluboya-aylik-program": {
    src: "/images/atolye/watercolor-framed.jpg",
    alt: "Suluboya · zeytin dalı, Duygu Sinan tarafından çerçeveli bir çalışma",
  },
  "linol-baski-workshop": {
    src: "/images/atolye/linol-workshop.jpg",
    alt: "Linol baskı · oyulmuş kalıp ve taze basılmış kare yan yana",
  },
  "linol-aylik-ders": {
    src: "/images/atolye/print-drying.jpg",
    alt: "Linol aylık ders · taze baskıların atölyede kurutulması",
  },
  "canta-baski-workshop": {
    src: "/images/atolye/tools-grid.jpg",
    alt: "Çanta baskı · atölyedeki alet ve malzeme düzeni",
  },
  "el-yapimi-kagit-workshop": {
    src: "/images/atolye/window-and-press.jpg",
    alt: "El yapımı kâğıt · atölye penceresinden pres ve çalışma alanı",
  },
};
