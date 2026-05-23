"use client";

import { useState, type CSSProperties } from "react";

const IG_DM_URL = "https://ig.me/m/maiamari.studio";
const SITE_URL = "https://www.maiamari.art";

type Props = {
  /** Eser veya ürün adı. Verilirse mesaj o esere özelleşir. */
  title?: string;
  /** Site içi yol — mesaja eklenir. Default: /galeri */
  path?: string;
  label?: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * Galerideki eserler için Instagram DM yönlendirme.
 *
 * Instagram, prefilled mesaj parametresi sunmadığı için:
 *  1. Tıklamada hazır mesaj clipboard'a kopyalanır
 *  2. Aynı anda DM URL yeni sekmede açılır
 *  3. Buton "✓ Mesaj kopyalandı" feedback'i gösterir (2.5 sn)
 * Kullanıcı DM ekranında Ctrl+V / uzun bas + yapıştır yapar.
 */
export function InstagramInquiryButton({
  title,
  path = "/galeri",
  label = "Instagram'dan bilgi al",
  className,
  style,
}: Props) {
  const [copied, setCopied] = useState(false);

  const message = title
    ? `Merhaba, galerideki "${title}" baskısı hakkında bilgi almak istiyorum.\n${SITE_URL}${path}`
    : `Merhaba, galerideki baskılar hakkında bilgi almak istiyorum.\n${SITE_URL}${path}`;

  async function handleClick() {
    // Try clipboard; ignore failure (older browsers / insecure context)
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(message);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // noop — proceed regardless
    }
    // Don't preventDefault — let the anchor open IG DM in a new tab.
    // Browsers may block window.open in async handlers, so the href fallback handles it.
  }

  return (
    <a
      href={IG_DM_URL}
      onClick={handleClick}
      className={className}
      style={style}
      target="_blank"
      rel="noreferrer"
      aria-label="Instagram üzerinden bilgi al — mesaj otomatik kopyalanır"
      title="Tıklayınca mesaj panoya kopyalanır, Instagram DM yeni sekmede açılır"
    >
      {copied ? "✓ Kopyalandı · IG açılıyor" : label}
    </a>
  );
}
