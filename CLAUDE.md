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
date: 2026-01-15
time: "10:00 AM - 11:30 AM"
ageRange: "3-7"
excerpt: "Short description"
mailchimpFormId: "f1915b185f"
mailchimpTag: "3728680"
showChildFields: true
---

## About This Event
Event description here...
```

2. Event automatically:
   - Appears on `/events/` listing
   - Gets own page at `/events/my-event/`
   - Shows in "Upcoming" or "Past" based on date

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
- **upcomingEvents**: Events with future dates, sorted chronologically
- **pastEvents**: Events with past dates, reverse chronological
- **press**: All press releases, newest first

### Custom Filters
- `date(format)`: Format dates (MMM, MMMM, D, YYYY, MMMM D, YYYY)
- `formatDate()`: Full date formatting
- `limit(n)`: Limit array to n items

### Passthrough Copy
Static files copied as-is:
- `src/assets/` → `_site/assets/`
- `src/root-files/` → `_site/` (root level)
- `src/signup/`, `src/newsletter/`, `src/thankyou/`, `src/launch-dashboard/`

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

All functions initialize on DOMContentLoaded.

## Deployment

### Current Setup
GitHub Pages deploys from `main` branch.

### To Deploy

**Option A: Manual Build (Current)**
1. Build site: `npm run build`
2. Commit `_site/` directory
3. Push to GitHub
4. Configure GitHub Pages to serve from `_site/`

**Option B: GitHub Actions (Recommended)**
Set up automated build/deploy workflow:
1. Create `.github/workflows/deploy.yml`
2. Configure to build on push and deploy `_site/`
3. Don't commit `_site/` to repo

### Deployment Notes
- `_site/` contains built site
- Never edit `_site/` directly - changes will be overwritten
- All source files are in `src/`

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
