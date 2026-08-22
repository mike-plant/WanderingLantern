# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static website for The Wandering Lantern, a children's bookstore in Lakewood, OH. Built with Eleventy (11ty) static site generator, featuring a vintage aesthetic (warm browns/gold color scheme) with sections for events, press releases, about, and contact information.

## Architecture

- **Static Site Generator:** Eleventy (11ty) v2.0.1
- **Templating:** Nunjucks (.njk files)
- **Content:** Markdown files for events and press releases
- **Styling:** Modular CSS (8 separate files)
- **JavaScript:** Vanilla JS modules
- **Build Output:** `_site/` directory
- **Source Files:** `src/` directory
- **Hosting:** GitHub Pages at https://mike-plant.github.io/WanderingLantern/

## Development Commands

```bash
npm run dev      # Start dev server at http://localhost:8080/ with live reload
npm run build    # Build production site to _site/
npm run clean    # Remove _site/ directory
```

## Project Structure

```
src/
├── _data/              # Global data files
├── _includes/          # Layouts and components
│   ├── components/     # Reusable UI components
│   └── layouts/        # Page layouts (base, event, press-release, page)
├── assets/
│   ├── css/           # Modular CSS (variables, base, hero, nav, forms, etc.)
│   └── js/            # JavaScript modules (main.js)
├── events/            # Event markdown files (auto-generates pages)
├── press/             # Press release markdown files
├── root-files/        # Static assets (logos, images) copied to root
├── signup/            # Mailchimp signup pages (passthrough)
├── newsletter/        # Newsletter page (passthrough)
├── thankyou/          # Thank you page (passthrough)
├── index.njk          # Homepage template
├── events.njk         # Events listing page
├── reservations.njk   # Event space rental page
└── press.njk          # Press room page
```

## Design System

### Color Palette (CSS Custom Properties)
- `--warm-brown: #8b6f47` - Primary brown
- `--deep-brown: #5c4d3c` - Dark brown for text/headings
- `--aged-gold: #c9a961` - Primary gold
- `--muted-gold: #a38b5f` - Secondary gold
- `--cream: #faf7f0` - Light backgrounds
- `--parchment: #f5eedc` - Page background
- `--dark-text: #3a2f27` - Body text

### Typography
- Display: 'Playfair Display', serif (Google Fonts)
- Body: 'Libre Baskerville', 'Georgia', serif (Google Fonts)
- Warm, literary, traditional feel

### Responsive Breakpoints
- Desktop: Default styles
- Mobile: `@media (max-width: 768px)` in `mobile.css`

## Content Management

### Adding Events

1. Create file in `src/events/my-event.md`:
```yaml
---
layout: layouts/event.njk
title: "Event Title"
date: 2026-04-15
time: "10:00 AM - 11:30 AM"
ageRange: "3-7"
category: "workshop"           # workshop | author-visit | story-time | special-event
excerpt: "Short description"
mailchimpFormId: "f1915b185f"
mailchimpTag: "3728680"
showChildFields: true
# Optional display fields:
# price: "Free"                  # Ticket/registration fee, shown in event meta and card
# location: "Lakewood Library"  # Only for off-site events; omit for store events
# host: "Camp Sunshine"         # Partner/co-host organization name
# registrationUrl: "https://..." # External registration link (only when not using Mailchimp)
# draft: true                    # Hides from all listings; page still accessible by URL
# For author visits with a special guest (human or animal):
# specialGuest: "Author Name"
# specialGuestRole: "Author & Environmental Scientist"
# specialGuestBook: "Book Title"
# For recurring events (excluded from all collections):
# recurring: true
---

## About This Event
Event description here...
```

2. Event automatically:
   - Appears on `/events/` listing grouped under its month
   - Gets own page at `/events/my-event/`
   - Shows in "Upcoming" or "Past" based on date
   - If `category: "author-visit"` and falls on a Saturday, a **gold ★** appears on that date in the Saturday Story Time banner (fully automatic — no extra steps needed)

### Event Categories

Set `category` in frontmatter. Controls the badge color on event cards:

| Value | Label | Badge Style | Use For |
|---|---|---|---|
| `workshop` | WORKSHOP | Brown outline | Craft, creative, skill-based events |
| `author-visit` | AUTHOR VISIT | **Gold filled** | Author readings, book signings, special guests |
| `story-time` | STORY TIME | Gold outline | Storytime instances (non-recurring) |
| `special-event` | SPECIAL EVENT | Red outline | Seasonal, one-of-a-kind celebrations |

### Author Visit Events

Author visits use three optional frontmatter fields to identify the special guest:

```yaml
specialGuest: "Kristine Sheppard"
specialGuestRole: "Author"               # displayed on event page
specialGuestBook: "Charlotte the Perching Detective"
```

**Gold star on Saturday Story Time banner:** When an event with `specialGuest` falls on a Saturday, the Saturday Story Time date square automatically gets a gold ★ and a gold border. This is driven by `getSpecialGuestForDate()` in `.eleventy.js` — no manual configuration needed. Just set `specialGuest` in the frontmatter and it works.

### Writing Event Excerpts

Every excerpt must feel like it could only describe *that one event* — never reuse structural patterns across events, even for similar formats like author visits.

**Don't:** "Author [Name] brings their book — and the real [animal] — to The Wandering Lantern for a special storytime."

**Do:** Lead with the most specific, unusual, or emotionally charged detail about that event.

Rules:
- Start with action, surprise, or the sharpest hook — not the author's name or a generic intro
- Each excerpt should have a distinct rhythm and angle from every other excerpt
- For author visits with animals: lean into what makes *this* animal's story unique (trained detective vs. therapy dog vs. something else)
- For book launches: the timing/newness can be the hook ("The book comes out March 10th — Nola arrives March 21st")
- Read all existing excerpts before writing a new one — if the structure feels familiar, rewrite it

### Adding Press Releases

1. Create file in `src/press/my-release.md`:
```yaml
---
layout: layouts/press-release.njk
title: "Press Release Title"
date: 2025-12-01
excerpt: "Brief summary"
---

**FOR IMMEDIATE RELEASE**
Content here...
```

2. Press release automatically appears on `/press/` and gets own page

### Event Space Reservations

The `/reservations/` page is the site's primary commercial page. It is
**data-driven** — most updates are JSON edits, not template edits.

| Data file | Controls | Hides when empty? |
|---|---|---|
| `src/_data/reservationPhotos.json` | Hero photo + gallery | Yes — gallery section disappears |
| `src/_data/reservationPricing.json` | "Starting at $X" anchors + `Offer` schema | Yes — falls back to "request a quote" |
| `src/_data/reservationTestimonials.json` | Quotes from past events | Yes — section disappears |
| `src/_data/reservationFaq.json` | FAQ accordions + `FAQPage` schema | n/a |

Each file carries a `_README` array explaining its fields. Sections with no
data hide themselves rather than rendering a placeholder.

**Packages:** The Secret Garden (space only), Mad Hatter's Tea Party
(story + activity), The Royal Ball (fully hosted).

**Inquiry form:** Formspree ID `xnjdroye`. Subject line is rewritten client-side
to include the sender's name.

**Adding photos:** drop optimized files (~1600px long edge, WebP, <200KB) into
`src/assets/images/reservations/`, then add entries to
`reservationPhotos.json`. Descriptive filenames and `alt` text both matter —
they are indexed by Google Images, which is real traffic for a venue page.
Include `width`/`height` to prevent layout shift.

The gallery is a CSS column masonry, so portrait and landscape photos both
render uncropped at their natural shape — no orientation flag needed. It ships
collapsed (`is-collapsed` in the markup, so there's no flash of the full
gallery) with a "Show all" button revealed by JS.

**Styling:** `src/assets/css/reservations.css`, entirely scoped under
`.reservations-page`. Keep new rules inside that wrapper — an earlier version
used unscoped selectors (`section`, `html`, `div[style*="..."]`) that leaked
onto every other page.

**Marketing playbook:** `docs/EVENT-SPACE-MARKETING.md` covers SEO targets,
the social launch sequence, off-site setup (Google Business Profile, Search
Console), and how to read the GA4 events.

### SEO Conventions

`src/_includes/components/head.njk` reads these optional front matter fields:

| Field | Purpose |
|---|---|
| `seoTitle` | Overrides the `<title>` entirely. Use for keyword targeting; keep under ~60 chars. |
| `description` | Meta description and OG/Twitter description. |
| `ogTitle` | Social-share title, when it should differ from the page title. |
| `ogImage` | Share image path (site-root relative). Defaults to the store interior. |
| `ogImageAlt` | Alt text for the share image. |
| `preloadImage` | Preloads an LCP image. |
| `noindex` | Emits `noindex, follow`. Also excludes the page from `sitemap.xml`. |

Titles only get the `- The Wandering Lantern` suffix appended when the page
title doesn't already contain the store name, so don't remove it from existing
front matter titles expecting the suffix to appear.

`src/sitemap.njk` generates `/sitemap.xml` from `collections.all`, excluding
drafts, `noindex` pages, XML outputs, and `/events-print/`. Passthrough-copied
pages aren't in collections, so they're listed manually at the bottom of that
file.

`src/root-files/robots.txt` points at the sitemap.

Page-specific structured data (`Service`, `FAQPage`, `BreadcrumbList`) lives in
the page body — Google reads JSON-LD from the body as well as the head. The
store-wide `BookStore` schema stays in `head.njk`.

## Forms & Mailchimp

### Mailchimp Tags
- **3728680**: Newsletter Signup
- **3728681**: Contact Us Optin
- **3728682**: Newsletter Only

### Contact Form (Formspree)
Contact form (`src/_includes/components/contact.njk`) submits to Formspree:
- Form ID: `xkgqdarv`
- Redirects to `/thankyou/` after submission
- Optional Mailchimp newsletter opt-in with tag 3728681

### Event Registration Forms
Events use embedded Mailchimp forms via `mailchimp-event-form.njk` component. Configure in event frontmatter:
```yaml
mailchimpFormId: "f1915b185f"
mailchimpTag: "3728680"
showChildFields: true
```

## Eleventy Configuration (.eleventy.js)

### Collections

All collections exclude events with `recurring: true` (e.g. Saturday Story Time) and `draft: true`. Draft events still generate their individual page but are hidden from all listings.

| Collection | Contents | Used In |
|---|---|---|
| `upcomingEvents` | Future non-recurring events, next 4 months, chronological | `/events/` listing |
| `pastEvents` | Past non-recurring events, reverse chronological | `/events/` past section |
| `nextEvent` | Single next upcoming event | Homepage hero |
| `previewSpecialEvents` | Next 3 upcoming events | Homepage events preview |
| `thisWeekEvents` | Events within next 7 days (non-recurring) | Homepage "This Week" section |
| `press` | All press releases, newest first | `/press/` listing |

### Custom Filters
- `date(format)`: Format dates — supported formats: `MMM`, `MMMM`, `D`, `DD`, `YYYY`, `MMMM D, YYYY`, `YYYY-MM-DD`
- `formatDate()`: Full date formatting
- `limit(n)`: Limit array to n items
- `groupByMonth(events)`: Groups event array into `[{ month: "April 2026", events: [...] }]` — used in `/events/` for month-group headers

### Nunjucks Globals

- `upcomingSaturdays()`: Returns next 5 Saturdays as `[{ month, day, isoDate }]`. The `isoDate` field (`YYYY-MM-DD`) is used to match against event dates for the special guest star.
- `getSpecialGuestForDate(isoDate, events)`: Given a date string and the `upcomingEvents` collection, returns the `specialGuest` name if an author-visit event falls on that date, or `null`. Powers the gold ★ on Saturday Story Time date squares.

### Passthrough Copy
Static files copied as-is:
- `src/assets/` → `_site/assets/`
- `src/root-files/` → `_site/` (root level)
- `src/signup/`, `src/newsletter/`, `src/thankyou/`, `src/launch-dashboard/`

### Incremental Build Note
When adding a **new event `.md` file** in dev (`npm run dev`), Eleventy's watch mode only rebuilds that event's individual page — it does **not** automatically recompute collection-dependent pages like `events/index.html`. Fix: `touch src/events.njk` (or `.eleventy.js` for a full restart) to force a collection rebuild.

## Styling

### CSS Architecture
1. `variables.css` - CSS custom properties
2. `base.css` - Typography, layout, global styles
3. `hero.css` - Hero section with countdown
4. `navigation.css` - Sticky bars and nav
5. `forms.css` - Form styling
6. `buttons.css` - CTA buttons and community sections
7. `events.css` - Event cards and pages
8. `press.css` - Press room styling
9. `mobile.css` - Responsive overrides (loaded last)

Main import: `src/assets/css/main.css`

### Adding Styles
Edit relevant CSS file or create new one and import in `main.css`:
```css
@import 'your-new-file.css';
```

## JavaScript (src/assets/js/main.js)

Modular functions:
- `updateCountdown()`: Grand opening countdown timer
- `initStickyBars()`: Sticky navigation on scroll (desktop only)
- `initContactForm()`: Mailchimp integration for contact form
- `initEventsViewToggle()`: List/grid view toggle on `/events/`. Persists choice in `localStorage` key `eventsView`. Default: `list`. Fires GA events `events_view_toggle` (on toggle) and `event_card_click` (on card click, with `view_type` property).

All functions initialize on DOMContentLoaded.

## Deployment

### Current Setup
GitHub Actions builds and deploys automatically on every push to `main`. Workflow: `.github/workflows/deploy.yml`.

### To Deploy
Push source changes to `main` — GitHub Actions handles the build and deploys to GitHub Pages automatically.

**Do NOT manually build or commit `_site/`** — GitHub Actions builds its own copy. Committing `_site/` adds noise with no benefit.

### Deployment Notes
- Never edit `_site/` directly — it is built by CI
- All source files are in `src/`

### CMS GitHub OAuth Proxy (Cloudflare Worker)

The CMS at `/cms/` requires a small server-side OAuth proxy to authenticate
users with GitHub. This is a one-time setup.

- **Worker code:** `workers/cms-auth/worker.js`
- **Deploy config:** `workers/cms-auth/wrangler.toml` (worker name: `wl-cms-auth`)
- **Setup guide:** `workers/cms-auth/README.md` — follow these 7 steps once to deploy
- **Secrets:** `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are stored in the
  Cloudflare Worker environment (via `wrangler secret put`). They are **not** in
  the repo.
- **CMS config:** After deploying, uncomment `base_url` in `src/cms/config.yml`
  and fill in the Worker URL (`https://wl-cms-auth.<subdomain>.workers.dev`)
- **Redeploy the Worker** (after editing `worker.js`): `cd workers/cms-auth && wrangler deploy`
- **Secrets persist** across Worker deploys — no need to re-set them unless rotating

## Common Updates

### Update Grand Opening Date
Edit countdown date in `src/assets/js/main.js:2`:
```javascript
const openingDay = new Date('2025-11-29T00:00:00');
```

### Update Store Hours
Edit `src/press.njk` in the "Store Information" section

### Add New Navigation Links
Edit `src/_includes/components/nav.njk`

### Modify Hero Section
Edit `src/_includes/components/hero.njk`

### Change Contact Information
Edit `src/_includes/components/contact.njk`

## Business Details
- **Name:** The Wandering Lantern
- **Tagline:** "Follow the light, find the wonder"
- **Location:** 15729 Madison Ave, Lakewood, OH 44107
- **Phone:** (216) 999-4462
- **Email:** thewanderinglanterncle@gmail.com
- **Instagram:** @thewanderinglanterncle
- **Facebook:** @thewanderinglanterncle
- **Website:** thewanderinglantern.com

## Documentation

See `ELEVENTY-README.md` for detailed Eleventy usage, troubleshooting, and best practices.

## Key Files

- `.eleventy.js` - Eleventy configuration
- `package.json` - Dependencies and scripts
- `src/_includes/layouts/base.njk` - Base HTML structure
- `src/assets/css/main.css` - CSS entry point
- `src/assets/js/main.js` - JavaScript entry point
