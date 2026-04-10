# Task A: Sveltia CMS Setup for Events & Press Releases

## Context

This is a static Eleventy site for The Wandering Lantern (a children's bookstore in Lakewood, OH). The site is deployed to GitHub Pages via GitHub Actions on push to `main`. Content (events, press releases) currently lives as markdown files in `src/events/` and `src/press/` and can only be edited by developers.

**Goal:** Install Sveltia CMS at `/cms/` so the store owner Emily can create, edit, and publish events and press releases through a form-based web UI without touching code.

**Sveltia CMS** is a modern, actively-maintained, drop-in replacement for Decap CMS / Netlify CMS. It uses the same config format. Docs: https://github.com/sveltia/sveltia-cms

## Deliverables

1. A working `/cms/` admin page that loads Sveltia CMS
2. A `config.yml` defining Events and Press Releases collections
3. All current frontmatter fields represented in the CMS forms with correct types and validation
4. Editorial workflow enabled (so saves create PRs instead of direct commits — drafts stay unpublished until merged)
5. Local backend configured for development testing (Emily/Michael can run it locally before OAuth is set up)
6. Passthrough copy configured in `.eleventy.js` so `/cms/` is served
7. Eleventy build still succeeds and no existing functionality breaks

**Out of scope for this task:**
- GitHub OAuth proxy (separate task — for now, the `local` backend is fine for testing)
- Adding new frontmatter fields like `price`, `location`, `host` (separate task)
- Press release schema beyond what currently exists

## Current Frontmatter Schema

### Events (`src/events/*.md`)

Required fields on all events:
- `layout` — always `layouts/event.njk`
- `title` — string
- `date` — YYYY-MM-DD (stored as date)
- `time` — string, e.g. `"10:00 AM - 11:30 AM"` or `"11:00 AM"`
- `ageRange` — string, e.g. `"All ages"`, `"3-7"`, `"0-5"`
- `excerpt` — string, short description

Optional fields:
- `category` — one of: `workshop`, `author-visit`, `story-time`, `special-event`
- `status` — one of: `full`, `cancelled` (omit for normal events)
- `specialGuest` — string (author/guest name)
- `specialGuestRole` — string (e.g. `"Author"`, `"Author & Illustrator"`)
- `specialGuestBook` — string (book title)
- `mailchimpFormId` — string (e.g. `"f1915b185f"`)
- `mailchimpTag` — string (e.g. `"3728680"`)
- `showChildFields` — boolean
- `enableEventFlyers` — boolean
- `flyerImage` — string (URL)
- `recurring` — boolean
- `recurringSchedule` — string, e.g. `"Every Saturday"`
- `permalink` — string (only used for recurring events)

Body: markdown content describing the event.

**Reference files to study before writing config:**
- `src/events/charlotte-perching-detective-apr-2026.md` — author visit with specialGuest fields
- `src/events/saturday-storytime.md` — recurring event
- `src/events/family-classics-apr-2026.md` — simple event
- `src/_includes/layouts/event.njk` — template that consumes the fields

### Press Releases (`src/press/*.md`)

Study `src/press/` files to identify the schema. At minimum:
- `layout` — always `layouts/press-release.njk`
- `title` — string
- `date` — YYYY-MM-DD
- `excerpt` — string

Body: markdown content.

## Implementation Steps

### 1. Create `/cms/` directory structure

Create these files:

**`src/cms/index.html`** — A minimal HTML page that loads Sveltia CMS from CDN.

```html
---
layout: null
permalink: /cms/index.html
---
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Content Manager — The Wandering Lantern</title>
  <link rel="icon" href="/favicon.ico" />
</head>
<body>
  <script type="module" src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script>
</body>
</html>
```

**`src/cms/config.yml`** — The Sveltia CMS config. See "Config.yml Specification" below.

### 2. Update `.eleventy.js` to pass through the CMS directory

Find the section in `.eleventy.js` where passthrough copy is configured (look for `addPassthroughCopy`). Add:

```js
eleventyConfig.addPassthroughCopy("src/cms");
```

Verify this results in `_site/cms/index.html` and `_site/cms/config.yml` after running `npm run build`.

### 3. Write `config.yml`

Create `src/cms/config.yml` with:

- **Backend:** Use `local` backend for now (Sveltia supports this). Docs: https://github.com/sveltia/sveltia-cms#work-with-local-git-repository
- **Media folder:** `src/root-files/event-images` with public folder `/event-images`
- **Editorial workflow:** `publish_mode: editorial_workflow`
- **Two collections:** `events` and `press`

### Config.yml Specification

```yaml
backend:
  name: github
  repo: mike-plant/WanderingLantern
  branch: main
  # OAuth proxy will be added in a later task. For local development:
  # Run `npx @sveltia/cms-proxy-server` in the repo root and Sveltia will
  # auto-detect it and use the local backend instead.

# Use editorial workflow so saves create PRs, not direct commits
publish_mode: editorial_workflow

# Where uploaded images go in the repo
media_folder: "src/root-files/event-images"
# The URL path that corresponds to media_folder on the deployed site
public_folder: "/event-images"

# Site URL (used in preview links)
site_url: "https://mike-plant.github.io/WanderingLantern/"
display_url: "https://mike-plant.github.io/WanderingLantern/"

collections:
  - name: "events"
    label: "Events"
    label_singular: "Event"
    folder: "src/events"
    create: true
    slug: "{{slug}}"
    preview_path: "events/{{slug}}/"
    summary: "{{title}} — {{date | date('YYYY-MM-DD')}}"
    sortable_fields: ["date", "title"]
    view_filters:
      - label: "Upcoming"
        field: "date"
        pattern: "2026"
      - label: "Recurring"
        field: "recurring"
        pattern: true
    fields:
      - { name: "layout", label: "Layout", widget: "hidden", default: "layouts/event.njk" }
      - { name: "title", label: "Event Title", widget: "string" }
      - { name: "date", label: "Date", widget: "datetime", date_format: "YYYY-MM-DD", time_format: false, picker_utc: false }
      - { name: "time", label: "Time", widget: "string", hint: "e.g. '10:00 AM - 11:30 AM' or '11:00 AM'" }
      - { name: "ageRange", label: "Age Range", widget: "string", hint: "e.g. 'All ages', '3-7', '0-5'", default: "All ages" }
      - name: "category"
        label: "Category"
        widget: "select"
        required: false
        options:
          - { label: "Workshop", value: "workshop" }
          - { label: "Author Visit", value: "author-visit" }
          - { label: "Story Time", value: "story-time" }
          - { label: "Special Event", value: "special-event" }
      - { name: "excerpt", label: "Short Description (Excerpt)", widget: "text", hint: "One or two sentences that will appear on event cards and previews. Lead with the most specific, unusual, or emotionally charged detail about this event — not a generic intro." }
      - name: "status"
        label: "Status"
        widget: "select"
        required: false
        options:
          - { label: "Normal (no badge)", value: "" }
          - { label: "Full", value: "full" }
          - { label: "Cancelled", value: "cancelled" }
      - label: "Special Guest (optional)"
        name: "specialGuestGroup"
        widget: "object"
        required: false
        collapsed: true
        fields:
          - { name: "specialGuest", label: "Guest Name", widget: "string", required: false }
          - { name: "specialGuestRole", label: "Guest Role", widget: "string", required: false, hint: "e.g. 'Author', 'Illustrator', 'Author & Environmental Scientist'" }
          - { name: "specialGuestBook", label: "Featured Book", widget: "string", required: false }
      - label: "Registration (Mailchimp)"
        name: "registrationGroup"
        widget: "object"
        required: false
        collapsed: true
        fields:
          - { name: "mailchimpFormId", label: "Mailchimp Form ID", widget: "string", required: false, default: "f1915b185f" }
          - { name: "mailchimpTag", label: "Mailchimp Tag ID", widget: "string", required: false, default: "3728680" }
          - { name: "showChildFields", label: "Show Child Fields (ages, count)", widget: "boolean", required: false, default: true }
      - label: "Flyer Image (optional)"
        name: "flyerGroup"
        widget: "object"
        required: false
        collapsed: true
        fields:
          - { name: "enableEventFlyers", label: "Show Flyer", widget: "boolean", required: false, default: false }
          - { name: "flyerImage", label: "Flyer Image URL", widget: "string", required: false, hint: "Paste a full image URL, or upload an image in the media library and paste its path here." }
      - label: "Recurring Event (advanced)"
        name: "recurringGroup"
        widget: "object"
        required: false
        collapsed: true
        fields:
          - { name: "recurring", label: "This is a recurring event", widget: "boolean", required: false, default: false }
          - { name: "recurringSchedule", label: "Schedule description", widget: "string", required: false, hint: "e.g. 'Every Saturday'" }
          - { name: "permalink", label: "Custom URL path", widget: "string", required: false, hint: "Only set this for recurring events. e.g. /events/saturday-storytime/" }
      - { name: "body", label: "Event Details (long description)", widget: "markdown" }

  - name: "press"
    label: "Press Releases"
    label_singular: "Press Release"
    folder: "src/press"
    create: true
    slug: "{{slug}}"
    summary: "{{title}} — {{date | date('YYYY-MM-DD')}}"
    sortable_fields: ["date", "title"]
    fields:
      - { name: "layout", label: "Layout", widget: "hidden", default: "layouts/press-release.njk" }
      - { name: "title", label: "Title", widget: "string" }
      - { name: "date", label: "Date", widget: "datetime", date_format: "YYYY-MM-DD", time_format: false, picker_utc: false }
      - { name: "excerpt", label: "Brief Summary", widget: "text" }
      - { name: "body", label: "Press Release Content", widget: "markdown" }
```

### ⚠️ Important: "object" widget nesting

The `object` widget in Decap/Sveltia wraps fields in a nested object in the frontmatter, which would break the existing flat frontmatter structure. **Do NOT use `object` widgets as shown above if they would nest the fields.**

Instead, flatten all fields to the top level of each collection. The "groups" above are there to visually organize the form — in Sveltia/Decap, you can't collapse arbitrary groups of top-level fields, but you CAN use `hint` text and clear labels to separate logical sections.

**Revise the config:** Remove all `object` widgets and put their child fields directly as top-level fields in the collection. Use field order to group related fields visually. Example:

```yaml
fields:
  - { name: "layout", widget: "hidden", default: "layouts/event.njk" }
  - { name: "title", label: "Event Title", widget: "string" }
  - { name: "date", label: "Date", widget: "datetime", date_format: "YYYY-MM-DD", time_format: false }
  - { name: "time", label: "Time", widget: "string", hint: "e.g. '10:00 AM - 11:30 AM'" }
  - { name: "ageRange", label: "Age Range", widget: "string", default: "All ages" }
  - name: "category"
    label: "Category"
    widget: "select"
    required: false
    options: [...]
  - { name: "excerpt", label: "Short Description", widget: "text" }
  - name: "status"
    label: "Status"
    widget: "select"
    required: false
    options: [...]
  # Special guest (all optional, top-level)
  - { name: "specialGuest", label: "Special Guest Name", widget: "string", required: false }
  - { name: "specialGuestRole", label: "Guest Role", widget: "string", required: false }
  - { name: "specialGuestBook", label: "Featured Book", widget: "string", required: false }
  # Mailchimp (all top-level)
  - { name: "mailchimpFormId", label: "Mailchimp Form ID", widget: "string", required: false, default: "f1915b185f" }
  - { name: "mailchimpTag", label: "Mailchimp Tag", widget: "string", required: false, default: "3728680" }
  - { name: "showChildFields", label: "Show child-age fields in registration", widget: "boolean", required: false, default: true }
  # Flyer
  - { name: "enableEventFlyers", label: "Show Flyer Image", widget: "boolean", required: false, default: false }
  - { name: "flyerImage", label: "Flyer Image URL", widget: "string", required: false }
  # Recurring (advanced)
  - { name: "recurring", label: "Recurring event", widget: "boolean", required: false, default: false }
  - { name: "recurringSchedule", label: "Recurring schedule", widget: "string", required: false }
  - { name: "permalink", label: "Custom URL path (recurring only)", widget: "string", required: false }
  # Body
  - { name: "body", label: "Event Details", widget: "markdown" }
```

This preserves the current flat frontmatter shape that `.eleventy.js` and the templates expect.

### 4. Verify round-trip compatibility with existing events

This is critical. Open 3–4 existing event markdown files in `src/events/` and confirm:
- Every field present in those files is covered by your config
- Loading an existing event in Sveltia would not lose any data
- Saving an edited event produces frontmatter in the same shape

Test files to check:
- `src/events/charlotte-perching-detective-apr-2026.md` (author visit)
- `src/events/family-classics-apr-2026.md` (simple event)
- `src/events/saturday-storytime.md` (recurring)
- `src/events/poetry-crawl-apr-2026.md` (if it has unusual fields)

If you find a field in an existing event that isn't in your config, add it.

### 5. Build & test

```bash
npm run build
```

Verify:
- `_site/cms/index.html` exists
- `_site/cms/config.yml` exists
- The main site build still succeeds with no new errors
- Opening `http://localhost:8080/cms/` in `npm run dev` shows the Sveltia CMS login screen

### 6. Document the local backend workflow

Create `tasks/cms-local-dev.md` with instructions for running Sveltia CMS locally for testing:

```
## Running Sveltia CMS Locally (before OAuth is set up)

1. In one terminal, run the Eleventy dev server:
   npm run dev

2. In another terminal, run the Sveltia local proxy:
   npx @sveltia/cms-proxy-server

3. Open http://localhost:8080/cms/ — it should auto-detect the local proxy
   and let you edit files directly in the repo without any login.

4. Changes save directly to src/events/ and src/press/ as markdown files.
   Commit and push like normal.
```

## Acceptance Criteria

- [ ] `/cms/` loads Sveltia CMS UI when visiting `npm run dev`
- [ ] All 11 current frontmatter fields on events are present in the CMS form
- [ ] Press release collection is configured
- [ ] Editorial workflow is enabled in config
- [ ] `npm run build` succeeds without errors
- [ ] An existing event (e.g. `charlotte-perching-detective-apr-2026.md`) can be opened in the CMS and saved without the frontmatter changing shape or losing fields (test this by viewing the file diff after a no-op save via the local proxy)
- [ ] No existing site functionality breaks
- [ ] `tasks/cms-local-dev.md` exists with clear instructions

## Notes for the agent

- **Do not commit `_site/`** — it's gitignored and built by GitHub Actions.
- **Do not add any npm dependencies** — Sveltia CMS loads from CDN via ES module import in the HTML file. No package.json changes.
- **If Sveltia's `local` backend doesn't auto-work**, leave the `github` backend config in place and document in `tasks/cms-local-dev.md` what manual steps are needed.
- **The GitHub OAuth proxy is a separate task.** Until it exists, the `github` backend won't work in production. That's expected.
- **If you run into any field mapping ambiguity**, err on the side of matching existing files exactly. Do not "improve" the schema in this task — schema changes are Task B.
