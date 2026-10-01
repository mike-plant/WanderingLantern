# Shopify Store Theme (Lantern Shop)

The online store (`shop.thewanderinglantern.com`, Shopify theme **Vessel**)
is styled to match this website and built around one job: help people find a
book and buy it. The plan behind it is "Lantern Online Shop Plan" (Oct 1, 2026).

This folder is the source of truth for our changes to the theme. Shopify
holds the full theme; we only add or override the files below.

| File | What it does |
|---|---|
| `theme/sections/lantern-info-bar.liquid` | Deep-brown top bar: pickup notice, address, hours, phone, socials. Mirrors `src/_includes/components/header.njk`. |
| `theme/sections/lantern-search-bar.liquid` | Search field under the header on desktop (not on the homepage or search page). |
| `theme/sections/lantern-shelves.liquid` | Homepage first screen: search + six equal age-shelf tiles. |
| `theme/sections/lantern-book-row.liquid` | A row of in-stock books from one collection (homepage). |
| `theme/sections/lantern-special-order.liquid` | Special-order form (Shopify contact form). Always on the homepage; on search, only when nothing matches, pre-filled with the search. |
| `theme/sections/lantern-topic-links.liquid` | Topic shortcuts under a shelf title, from `Topic: X` tags → `/collections/<shelf>/topic-x`. |
| `theme/sections/lantern-product-shelf.liquid` | Product page: shelf/format/topic links + "More from this shelf". The `Shelf:` tag → collection map is a section setting. |
| `theme/blocks/lantern-card-text.liquid` | Product-card block: title and author on separate lines, or the "Ready for pickup" line. |
| `theme/snippets/lantern-book-text.liquid` | Splits "Title: Author" product titles. |
| `theme/snippets/lantern-book-card.liquid` | Book card used in rows. |
| `theme/snippets/cart-note.liquid` | Vessel's cart note, relabeled as the gift-wrap request. |
| `theme/assets/lantern.css` | All Lantern styles, incl. the 2:3 uncropped cover frame on every product card. |
| `theme/templates/*.json` | **Generated** by `build_templates.py`: homepage, collection, search, product. |
| `theme/config/settings_data.json`, `theme/sections/header-group.json` | **Generated** by `build_settings.py`: fonts, colors, cart note, header layout. |
| `original/` | Snapshot of the Vessel config before the redesign. |

## Themes in Shopify

- **Vessel – Lantern Redesign** (`185703366879`): live. First pass (colors,
  fonts, shared header).
- **Lantern Shop v2 (working copy)** (`185704743135`): unpublished. Everything
  in this folder. Publish it to replace the live theme.
- **Vessel** (`154285703391`): the original, kept as a rollback.

Preview v2: https://shop.thewanderinglantern.com/?preview_theme_id=185704743135

The Shopify connection Claude uses can only write to **unpublished** themes.
To keep working after v2 is published, duplicate it, edit the copy, publish.

## Store menu

Both themes use **Lantern Main Menu** (`lantern-main-menu`). "Shop Books" is a
dropdown: the six age shelves, Emily's Picks, Halloween, Gifts & Goodies,
Gift Cards. The website's nav renders the same list from `site.shopMenu` in
`src/_data/site.json` — **change both** when the menu changes (e.g. swap
Halloween for Holiday in November).

## Keeping the two headers in sync

The info bar exists twice (Nunjucks here, Liquid in Shopify). When address,
hours, phone or socials change:

1. Update `src/_data/site.json` (website).
2. Update the **Lantern info bar** section in the Shopify theme editor
   (all fields are editable there — no code needed).

## Seasonal changes

- Homepage seasonal row: theme editor → Home page → "Halloween Reads" row →
  pick the next collection and rename it.
- Menu: edit `lantern-main-menu` in Shopify admin → Content → Menus, and
  `site.shopMenu` in this repo.

## Not done yet

- **Load more button.** Vessel uses infinite scroll (24 per load). The plan
  asks for a button (24 phone / 48 desktop); that needs a change to Vessel's
  JavaScript.
- **Labeled filters (Age, Format, Topic, Occasion)** need the tags copied to
  metafields and set up in Search & Discovery, plus the search synonyms. That
  is store data, not theme code.
- **Mega-menu product images.** The header dropdown shows three featured
  products next to the links (Vessel's `featured_products` menu style).
  Change it in the theme editor → Header → Menu if you'd rather show only links.

## Updating the theme

Edit the files here, regenerate the JSON (`python3 shopify/build_templates.py`,
`python3 shopify/build_settings.py`), then upload to an **unpublished** theme
(Shopify CLI `shopify theme push --theme <id> --only <file>`, the theme code
editor, or ask Claude). Settings changed in the theme editor live only in
Shopify, so pull those files back here before regenerating, or they'll be
overwritten.
