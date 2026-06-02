# Brand Guidelines

The site speaks in an editorial, gallery-like voice. These rules keep that voice consistent and are enforced in code review.

## Visual language

- **Ground:** cream-white. **Accent:** walnut. Dark sections use a charcoal ground.
- **Typography:** Cormorant Garamond (display, often italic) and Inter (text).
- **Interface language:** Turkish.
- **Mood:** "production trace" — the physical evidence of printmaking (presses, tools, paper, hands at work).

## Imagery rules

- **Gallery artworks are always uncropped**, shown in a passe-partout frame with `object-contain`. They must never be cropped to fill a container.
- **Studio photography fills its frame** (`object-cover`) for atmosphere.
- **Forbidden imagery:** showroom shots, drone footage, building facades, and posed people. Keep the focus on the work and the process.
- A single brand **watermark** is applied through a CSS variable (`--watermark-url`) and the `components/brand/watermark.tsx` component, so the asset is decoded once and shared as one GPU texture.

## Writing rules

- **No em-dash (—) and no "+" in site copy.** Use a period and a separate sentence instead.
- **Refer to the artist as "Duygu Sinan"**, never with a "Sanatçı" (Artist) prefix.
- Keep claims honest: handmade paper and artist-sewn bags are made in the studio; paints, plates, rollers, tools, and bag fabric/printing are sourced. Do not generalize "everything is handmade".

## Implementation note (Tailwind 4)

Tailwind 4 does not parse arbitrary color tokens such as `text-[color:var(--color-background)]` (the text renders invisible). For CSS-variable colors, use an inline style:

```tsx
<span style={{ color: "var(--color-background)" }}>…</span>
```

## Brand assets

Original brand assets live in an external brand source archive outside this repository. Only the web-optimized versions that the site actually uses are committed, under `public/`.
