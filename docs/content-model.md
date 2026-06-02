# Content Model

All site content lives as JSON under `data/` and is read at build time through `lib/data.ts`. There is no CMS and no runtime database.

## Source of truth

The canonical source for **artwork and series data** is an external art source archive maintained outside this repository. The site does not author that data; it **syncs** from the archive into `data/portfolio.json` and `data/series.json`. When art data is wrong, fix it at the archive and re-sync rather than hand-editing the JSON, otherwise the next sync overwrites the change.

Business details, journal entries, and the product catalog are authored or scraped into their respective JSON files.

## Files

| File | Shape | Holds |
| --- | --- | --- |
| `data/business.json` | object | Studio profile: name, tagline, owner, artist, address, transit, contact, hours, workshops, Google Business Profile, geo |
| `data/series.json` | array (8) | Print series: `slug`, `title`, `subtitle`, `year`, `yearRange`, `description`, `coverImage`, `totalArtworks`, `artworkCount` |
| `data/portfolio.json` | array (56) | Individual artworks: `id`, `slug`, `title`, `description`, `image`, `year`, `series`, `width`, `height`, `technique`, `paper`, `dimensions`, `editionSize`, `printCount`, `firstSerial`, `artist` |
| `data/products_list.json` | array (56) | Lightweight product listing: `id`, `url`, `title`, `statuses`, `priceText`, `priceTRY`, `compareAtTRY`, `imageThumb` |
| `data/products_full.json` | array (57) | Full product records: listing fields plus `title_full`, `description`, `gallery`, `coverImage`, `localImages` |
| `data/journal.json` | array (3) | Journal posts: `slug`, `title`, `excerpt`, `body`, `date`, `dateLabel`, `category`, `location`, `locationUrl`, `image`, `imageAlt`, `gallery` |
| `data/instagram.json` | object | Instagram metadata |

## Relationships

- A `portfolio` work belongs to a `series` via its `series` slug. Gallery series pages (`/galeri/[series]`) list the works whose `series` matches.
- Products are grouped into categories by classification logic in `lib/data.ts`; shop category pages (`/shop/[category]`) and product pages (`/urun/[slug]`) derive from the product JSON.
- `data/scripts/` holds the reproducible enrichment and processing scripts used to (re)build the product and portfolio data.

## Editing rules

- Treat `portfolio.json` and `series.json` as **derived** from the external archive.
- Keep titles as the raw archive values (do not invent fallbacks like "Print № N").
- Refer to the artist as "Duygu Sinan" with no prefix (see [brand-guidelines.md](./brand-guidelines.md)).
