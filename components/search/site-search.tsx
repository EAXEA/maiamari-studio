"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import Fuse from "fuse.js";
import type { SearchItem } from "@/app/api/search/route";

const PLACEHOLDER = "Sanatçı, baskı, atölye ara…";
const MAX_RESULTS = 8;

export function SiteSearch() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const fuseRef = useRef<Fuse<SearchItem> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  /** Dış tıklamada kapat */
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  /** ilk focus'ta index yükle */
  const loadIndex = useCallback(async () => {
    if (loaded) return;
    try {
      const res = await fetch("/api/search");
      const data = (await res.json()) as { items: SearchItem[] };
      setItems(data.items);
      fuseRef.current = new Fuse(data.items, {
        keys: [
          { name: "title", weight: 0.7 },
          { name: "subtitle", weight: 0.15 },
          { name: "keywords", weight: 0.15 },
        ],
        threshold: 0.42, // typo tolerant
        ignoreLocation: true,
        includeScore: true,
        minMatchCharLength: 2,
      });
      setLoaded(true);
    } catch {
      // sessiz
    }
  }, [loaded]);

  const results: SearchItem[] =
    query.trim().length >= 2 && fuseRef.current
      ? fuseRef.current
          .search(query.trim(), { limit: MAX_RESULTS })
          .map((r) => r.item)
      : [];

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "Enter" && results[activeIdx]) {
      e.preventDefault();
      window.location.href = results[activeIdx].url;
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    if (results.length > 0) {
      e.preventDefault();
      window.location.href = results[activeIdx]?.url ?? results[0].url;
    }
    // Aksi halde fallback: /shop?q=... (mevcut form action)
  }

  return (
    <div
      ref={containerRef}
      className="relative flex-1 max-w-[520px] mx-auto hidden md:block"
    >
      <form
        role="search"
        action="/shop"
        method="get"
        onSubmit={onSubmit}
        className="flex items-center gap-2 h-10 px-4 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/60 focus-within:border-[color:var(--color-foreground)] transition-colors"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className="opacity-60 shrink-0"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          name="q"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIdx(0);
          }}
          onFocus={() => {
            loadIndex();
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={PLACEHOLDER}
          className="bg-transparent outline-none w-full text-sm placeholder:text-[color:var(--color-soft)]"
          autoComplete="off"
          aria-label="Sitede ara"
        />
      </form>

      {open && query.trim().length >= 2 && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-[color:var(--color-background)] border border-[color:var(--color-border)] shadow-lg max-h-[460px] overflow-y-auto z-50"
          role="listbox"
        >
          {!loaded ? (
            <div className="p-4 text-sm text-[color:var(--color-muted)]">
              Yükleniyor…
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-sm text-[color:var(--color-muted)]">
              Sonuç bulunamadı. Yine de mağazadan göz atabilirsiniz —{" "}
              <Link
                href="/shop"
                className="underline underline-offset-4"
                onClick={() => setOpen(false)}
              >
                tüm ürünler
              </Link>
              .
            </div>
          ) : (
            <ul>
              {results.map((r, i) => (
                <li key={`${r.kind}-${r.url}-${i}`}>
                  <Link
                    href={r.url}
                    onClick={() => setOpen(false)}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={`flex items-center gap-3 p-3 border-b border-[color:var(--color-hairline)] last:border-b-0 transition-colors ${
                      i === activeIdx ? "bg-[color:var(--color-surface)]" : ""
                    }`}
                  >
                    {/* Thumbnail */}
                    {r.cover ? (
                      <div className="relative w-12 h-12 bg-[color:var(--color-surface-2)] overflow-hidden shrink-0">
                        <Image
                          src={r.cover}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-12 h-12 flex items-center justify-center shrink-0 text-[10px] tracking-[0.2em] uppercase"
                        style={{
                          background: "var(--color-walnut-dark)",
                          color: "var(--color-background)",
                        }}
                      >
                        {r.kind === "artist"
                          ? r.title
                              .split(" ")
                              .map((s) => s[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()
                          : r.kind === "category"
                            ? "K"
                            : r.kind === "series"
                              ? "S"
                              : ""}
                      </div>
                    )}

                    {/* Title + subtitle */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-display italic truncate text-[color:var(--color-foreground)]">
                        {r.title}
                      </div>
                      {r.subtitle && (
                        <div className="text-[11px] tracking-wide text-[color:var(--color-muted)] truncate uppercase">
                          {r.subtitle}
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    {r.price !== undefined && (
                      <div className="text-sm text-[color:var(--color-foreground)] shrink-0 tabular-nums">
                        ₺{r.price}
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
