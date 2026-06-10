import Image from "next/image";
import Link from "next/link";
import { getBusiness, getPortfolio, getSeries } from "@/lib/data";
import { WhatsappCTA } from "@/components/inquiry/whatsapp-cta";
import { PhoneCTA } from "@/components/inquiry/phone-cta";
import { TransitInfo } from "@/components/transit/transit-info";
import { PaymentMarks } from "@/components/brand/payment-marks";

export async function SiteFooter() {
  const biz = getBusiness();

  // Galeri alt rail — son üretilen 5 eser (yıl desc + ilk 5)
  const galleryRail = getPortfolio()
    .filter((w) => w.image && w.year)
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
    .slice(0, 5);
  const seriesByslug = Object.fromEntries(
    (await getSeries()).map((s) => [s.slug, s.title]),
  );

  return (
    <footer className="mt-24 lg:mt-32 border-t border-[color:var(--color-hairline)]">
      {/* Alt rail — son üretilen 5 eserin mini önizlemesi */}
      {galleryRail.length > 0 && (
        <div className="border-b border-[color:var(--color-hairline)] bg-[color:var(--color-surface)]">
          <div className="container-wide py-8 lg:py-10">
            <div className="flex items-end justify-between mb-5 gap-6">
              <p className="eyebrow">Son üretimler · Galeride</p>
              <Link href="/galeri" className="text-xs editorial-link shrink-0">
                Tüm galeri →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
              {galleryRail.map((w) => (
                <Link
                  key={w.id}
                  href={`/galeri/${w.series ?? "kapilar"}`}
                  className="group block bg-[color:var(--color-surface-2)] ring-[0.5px] ring-[color:var(--color-hairline)] hover:ring-[color:var(--color-walnut)] transition"
                  aria-label={`${seriesByslug[w.series ?? ""] ?? ""} · ${w.title}`}
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={w.image}
                      alt={w.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-contain p-2 transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="px-2 py-2 text-[10px] tracking-[0.18em] uppercase text-[color:var(--color-muted)] flex items-center justify-between">
                    <span className="truncate">{seriesByslug[w.series ?? ""] ?? "—"}</span>
                    <span className="font-mono tabular-nums shrink-0 ml-2">{w.year}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="container-wide py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-12 lg:gap-16">
        <div>
          <div className="flex items-center gap-3">
            <Image src="/brand/maiamari-logo.png" alt="" width={36} height={36} />
            <div className="font-display text-2xl tracking-tight">MAIAMARI</div>
          </div>
          <p className="mt-6 text-sm text-[color:var(--color-muted)] max-w-sm leading-relaxed">
            {biz.tagline}. Atölyede elle çoğaltılan baskılar, doğal liflerden el
            yapımı kâğıtlar ve baskı atölyeleri.
          </p>
          <address className="not-italic mt-6 text-sm leading-relaxed text-[color:var(--color-muted)]">
            {biz.address.full}
          </address>
          <div className="mt-4">
            <TransitInfo transit={biz.transit} size="sm" />
          </div>
        </div>

        <div className="text-sm">
          <h3 className="eyebrow mb-5">Keşfet</h3>
          <ul className="space-y-1 [&_a]:block [&_a]:py-1.5">
            <li><Link href="/galeri">Galeri</Link></li>
            <li><Link href="/atolyeler">Atölyeler</Link></li>
            <li><Link href="/journal">Günce</Link></li>
            <li><Link href="/about">Hakkımızda</Link></li>
          </ul>
        </div>

        <div className="text-sm">
          <h3 className="eyebrow mb-5">Mağaza</h3>
          <ul className="space-y-1 [&_a]:block [&_a]:py-1.5">
            <li><Link href="/shop/el-yapimi-kagitlar">Kâğıtlar</Link></li>
            <li><Link href="/shop/linol-boyalari">Boyalar</Link></li>
            <li><Link href="/shop/aletler">Aletler</Link></li>
            <li><Link href="/shop/cantalar">Çantalar</Link></li>
          </ul>
        </div>

        <div className="text-sm">
          <h3 className="eyebrow mb-5">İletişim</h3>
          <ul className="space-y-1 [&_a]:block [&_a]:py-1.5">
            <li>
              <PhoneCTA variant="link" label="Telefon" />
            </li>
            <li>
              <a href={biz.contact.instagram} target="_blank" rel="noreferrer">
                Instagram
              </a>
            </li>
            {biz.contact.email && (
              <li>
                <a href={`mailto:${biz.contact.email}`}>E-posta</a>
              </li>
            )}
            <li>
              <WhatsappCTA variant="list" context="Maiamari atölyesi" path="/" />
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[color:var(--color-hairline)]">
        <div className="container-wide py-6 space-y-5">
          {/* Güvenli ödeme — kabul edilen kartlar + iyzico altyapısı */}
          <PaymentMarks />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-[color:var(--color-muted)]">
            <span>
              © {new Date().getFullYear()} Maiamari Baskı Atölyesi · Küçükesat, Ankara
            </span>
            <div className="flex flex-wrap gap-x-6 gap-y-1 [&_a]:inline-block [&_a]:py-2">
              <Link href="/legal/mesafeli-satis">Mesafeli Satış</Link>
              <Link href="/legal/iade">Teslimat ve İade</Link>
              <Link href="/legal/gizlilik">Gizlilik</Link>
              <Link href="/legal/kvkk">KVKK</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
