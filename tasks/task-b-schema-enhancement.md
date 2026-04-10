# Task B: Event Schema Enhancement — New Fields for Multi-Output Support

## Context

This is a static Eleventy site for The Wandering Lantern (a children's bookstore in Lakewood, OH). Events are markdown files in `src/events/`. The current event frontmatter schema covers the basics (title, date, time, excerpt, category, Mailchimp, special guest) but is missing fields needed to support additional outputs like the printable in-store event sheet, third-party calendar submissions, and off-site events.

**Goal:** Add five new optional frontmatter fields to events, wire them into all the places events are rendered, and ensure they flow through to the Sveltia CMS form.

## Prerequisite

**Task A (Sveltia CMS Setup) must be completed and merged first.** This task updates the CMS config added in Task A.

## New Fields to Add

| Field | Type | Required | Purpose |
|---|---|---|---|
| `price` | string | No | Ticket or registration fee, e.g. `"Free"`, `"$15 per family"`, `"$5"`. Already partially used in `events-print.njk`. |
| `location` | string | No | Event location. Defaults to the store if omitted. Needed for off-site events like Poetry Crawl. |
| `host` | string | No | Partner organization hosting or co-hosting, e.g. `"Camp Sunshine"`, `"Holistic Lakewood"`. |
| `registrationUrl` | string | No | External registration link (Eventbrite, partner site, etc.). Only used when Mailchimp is not the registration mechanism. |
| `draft` | boolean | No | When `true`, excludes the event from all public collections. Used for events Emily is still drafting. |

### Why these and not others

These five fields are carefully chosen. Do NOT add the following (they were considered and rejected):

- `slug` — auto-generated from the filename, don't duplicate
- `socialCaption`, `printBlurb`, `externalBlurb` — three extra descriptions per event is more work for Emily, not less. We'll generate these on demand from the existing `excerpt` + fields.
- `endTime` as a separate field — the current `time: "10:00 AM - 11:30 AM"` string format already handles this and is parsed by `getEventEndTime()` in `.eleventy.js`.
- `featured` — the `previewSpecialEvents` collection already handles homepage featuring based on chronological order.
- `image` — `flyerImage` already exists for this purpose.

If you think another field should be added, STOP and ask before adding it.

## Deliverables

1. All five fields added to the Sveltia CMS config at `src/cms/config.yml`
2. Eleventy collections updated to exclude `draft: true` events
3. Event layout (`src/_includes/layouts/event.njk`) updated to display new fields where relevant
4. Event card component (`src/_includes/components/event-card.njk`) updated to show `price` and `host` when present
5. Events print page (`src/events-print.njk`) updated to use new fields
6. JSON-LD schema in event layout updated to include `location` and `price` (when present)
7. One example event updated to demonstrate the new fields (pick a real upcoming event, add appropriate values)
8. `CLAUDE.md` updated to document the new fields
9. `npm run build` succeeds and no existing events break

## Implementation Steps

### 1. Update `.eleventy.js` — filter drafts from all collections

Find each `addCollection` block. Currently there are six: `upcomingEvents`, `pastEvents`, `nextEvent`, `previewSpecialEvents`, `thisWeekEvents`, `press`. For each events collection (all except `press`), add `item.data.draft !== true` to the filter.

Example — current `upcomingEvents`:

```js
eleventyConfig.addCollection("upcomingEvents", collection => {
  const now = getNowInEST();
  const fourMonthsFromNow = new Date(now);
  fourMonthsFromNow.setMonth(now.getMonth() + 4);

  return collection.getFilteredByGlob("src/events/*.md")
    .filter(item => {
      if (item.data.recurring) return false;
      const eventEndTime = getEventEndTime(item.data.date, item.data.time);
      const eventDate = parseDate(item.data.date);
      return eventEndTime > now && eventDate <= fourMonthsFromNow;
    })
    .sort((a, b) => parseDate(a.data.date) - parseDate(b.data.date));
});
```

Should become:

```js
eleventyConfig.addCollection("upcomingEvents", collection => {
  const now = getNowInEST();
  const fourMonthsFromNow = new Date(now);
  fourMonthsFromNow.setMonth(now.getMonth() + 4);

  return collection.getFilteredByGlob("src/events/*.md")
    .filter(item => {
      if (item.data.recurring) return false;
      if (item.data.draft === true) return false;
      const eventEndTime = getEventEndTime(item.data.date, item.data.time);
      const eventDate = parseDate(item.data.date);
      return eventEndTime > now && eventDate <= fourMonthsFromNow;
    })
    .sort((a, b) => parseDate(a.data.date) - parseDate(b.data.date));
});
```

Apply the same draft filter to `pastEvents`, `nextEvent`, `previewSpecialEvents`, and `thisWeekEvents`. Do NOT apply it to `press` (drafts of press releases are a separate concern and not in scope).

**Important:** Drafts should still generate their individual page (so Emily can preview them by URL) — they're just hidden from listings. This is the correct Eleventy behavior if you only filter at the collection level. Verify that a draft event still appears at `/events/my-draft-event/` after building.

### 2. Update `src/_includes/layouts/event.njk`

Read the current file first. Then:

**a) Display the new fields in the event detail page hero or sidebar area.** Follow the existing pattern for how `time`, `ageRange`, and `specialGuest` are rendered. Specifically:

- **`host`**: If present, show as "Hosted by {host}" or "Presented with {host}" near the event title area.
- **`location`**: If present, show as a line with an emoji or icon prefix, e.g. "📍 {location}". If not present, do NOT show a default — the template should just not render a location line.
- **`price`**: If present, show in the event meta section (near date/time/ageRange).
- **`registrationUrl`**: If present AND `mailchimpFormId` is NOT present, show a button "Register here →" that links externally. If both are present, prefer the Mailchimp form (the existing behavior). If only Mailchimp is present, existing behavior.

**b) Update the JSON-LD `Event` schema block** (there's an existing one in the layout). Add:
- `"location"` — if `location` is set, use it; otherwise use the existing default (the store address).
- `"offers"` — if `price` is set, include an offers object with the price string.

Don't remove or rename any existing JSON-LD fields.

### 3. Update `src/_includes/components/event-card.njk`

Read the current file. Events cards are used in both the grid and list views on `/events/`. Update the card to:

- Show `price` when present, formatted subtly (e.g. small text next to time, or in the meta row)
- Show `host` when present (e.g. "with {host}" under the title, or as a small label)

Keep it tasteful — don't clutter the card. If the card is already dense, prefer showing `host` over `price` (price is more important on the detail page).

### 4. Update `src/events-print.njk`

Read the current file. This page already partially uses `price`. Update it to:

- Read `price` from frontmatter (not a hardcoded or missing field)
- Display `host` when present (e.g. under the title)
- Display `location` when present (otherwise implicit: at the store)

This page is optimized for print, so keep formatting compact.

### 5. Update `src/cms/config.yml` (from Task A)

Add the five new fields as top-level fields in the `events` collection. Place them in this logical order within the fields array:

- After `ageRange`, add `location` (since it's a core event detail)
- After `excerpt`, add `price` and `host` (these are display details)
- Before `specialGuest`, add `registrationUrl` (it's part of registration config)
- At the very top of the form (after `layout`), add `draft` so it's the first thing Emily sees

```yaml
# Add this near the top, after the hidden layout field
- { name: "draft", label: "Draft (not published)", widget: "boolean", required: false, default: false, hint: "Check this to save your work without publishing. Drafts are hidden from the public site." }

# Add after ageRange field
- { name: "location", label: "Location", widget: "string", required: false, hint: "Leave blank for events at the store. Only set for off-site events, e.g. 'Lakewood Public Library Main Branch'." }

# Add after excerpt field
- { name: "price", label: "Price", widget: "string", required: false, hint: "e.g. 'Free', '$15 per family', '$5 per child'. Leave blank if free." }
- { name: "host", label: "Partner / Host", widget: "string", required: false, hint: "If this event is co-hosted with a partner organization, enter their name here. e.g. 'Camp Sunshine', 'Holistic Lakewood'." }

# Add before the Mailchimp fields
- { name: "registrationUrl", label: "External Registration URL", widget: "string", required: false, hint: "Only set this if registration is handled by an outside site (e.g. Eventbrite). If you're using the Mailchimp form below, leave this blank." }
```

### 6. Update one example event to demonstrate new fields

Pick a real upcoming event that would reasonably have a `host` field — for example, the Camp Sunshine yoga events. Add appropriate values:

```yaml
host: "Camp Sunshine"
price: "Free"
```

Don't invent fake data. Only add fields where you have reasonable information from the existing event content. If unclear, add just `price: "Free"` to one event as a minimal demonstration.

### 7. Update `CLAUDE.md`

Find the "Event Frontmatter Fields" section (or equivalent) and add documentation for the five new fields, following the existing format. Keep it concise.

### 8. Build & verify

```bash
npm run build
```

Verify:
- Build succeeds without errors
- The example event with new fields renders correctly
- All existing events still render correctly
- A test draft event (create a temporary one with `draft: true`, build, then delete) does NOT appear in `/events/` listing but DOES get its own page

## Acceptance Criteria

- [ ] All five new fields added to `src/cms/config.yml` with appropriate hints
- [ ] `draft: true` events excluded from all 5 events collections in `.eleventy.js`
- [ ] `draft: true` events still generate their individual pages
- [ ] Event layout displays `host`, `location`, `price`, and `registrationUrl` when present
- [ ] JSON-LD schema includes `location` and `offers` when those fields are set
- [ ] Event card component shows `host` and `price` when present (without looking cluttered)
- [ ] Events print page uses `price`, `host`, `location`
- [ ] At least one existing event updated with new field values as a demo
- [ ] `CLAUDE.md` updated with new field documentation
- [ ] `npm run build` succeeds
- [ ] No visual regression on existing events (spot check 3–4 in the dev server)

## Notes for the agent

- **Stay disciplined on the field list.** Do not add extra fields. Do not "improve" the schema beyond what's specified.
- **Preserve backward compatibility.** Every existing event must continue to work without modification. All new fields are optional.
- **Test the draft filter carefully.** It's the most important new behavior — if it's broken, Emily could accidentally publish unfinished events.
- **Do not touch the GitHub OAuth setup.** That's a separate task.
- **Do not touch `/admin/` tools** (audit, import, orders). Those are unrelated.
