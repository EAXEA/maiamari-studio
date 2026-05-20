import Image from "next/image";
import Link from "next/link";
import { getBusiness } from "@/lib/data";

export function SiteFooter() {
  const biz = getBusiness();
  return (
    <footer className="mt-24 lg:mt-32 border-t border-[color:var(--color-hairline)]">
      <div className="container-wide py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-12 lg:gap-16">
        <div>
          <div className="flex items-center gap-3">
            <Image src="/brand/maimari-logo.png" alt="" width={36} height={36} />
            <div className="font-display text-2xl tracking-tight">MAIMARI</div>
          </div>
          <p className="mt-6 text-sm text-[color:var(--color-muted)] max-w-sm leading-relaxed">
            {biz.tagline}. Atölyede elle çoğaltılan baskılar, doğal liflerden el
            yapımı kâğıtlar ve baskı atölyeleri.
          </p>
          <address className="not-italic mt-6 text-sm leading-relaxed text-[color:var(--color-muted)]">
            {biz.address.full}
            <br />
            <span className="block mt-1 opacity-70">
              Yakın metro: {biz.transit.nearestMetro}
            </span>
          </address>
        </div>

        <div className="text-sm">
          <h3 className="eyebrow mb-5">Keşfet</h3>
          <ul className="space-y-3">
            <li><Link href="/galeri">Galeri</Link></li>
            <li><Link href="/workshops">Atölyeler</Link></li>
            <li><Link href="/journal">Günce</Link></li>
            <li><Link href="/about">Hakkımızda</Link></li>
          </ul>
        </div>

        <div className="text-sm">
          <h3 className="eyebrow mb-5">Mağaza</h3>
          <ul className="space-y-3">
            <li><Link href="/shop/linol-baskilari">Linol Baskıları</Link></li>
            <li><Link href="/shop/el-yapimi-kagitlar">Kâğıtlar</Link></li>
            <li><Link href="/shop/linol-boyalari">Boyalar</Link></li>
            <li><Link href="/shop/aletler">Aletler</Link></li>
            <li><Link href="/shop/cantalar">Çantalar</Link></li>
          </ul>
        </div>

        <div className="text-sm">
          <h3 className="eyebrow mb-5">İletişim</h3>
          <ul className="space-y-3">
            <li>
              <a href={`tel:${biz.contact.phonePrimary.replace(/\s/g, "")}`}>
                {biz.contact.phonePrimary}
              </a>
            </li>
            <li>
              <a
                href={`https://wa.me/${biz.contact.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            </li>
            <li>
              <a href={biz.contact.instagram} target="_blank" rel="noreferrer">
                Instagram
              </a>
            </li>
            <li>
              <a href={biz.contact.shopier} target="_blank" rel="noreferrer">
                Shopier mağaza
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[color:var(--color-hairline)]">
        <div className="container-wide py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-[color:var(--color-muted)]">
          <span>
            © {new Date().getFullYear()} Maiamari Baskı Atölyesi · Küçükesat, Ankara
          </span>
          <div className="flex gap-6">
            <Link href="/legal/kvkk">KVKK</Link>
            <Link href="/legal/mesafeli-satis">Mesafeli Satış</Link>
            <Link href="/legal/iade">İade ve Değişim</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
