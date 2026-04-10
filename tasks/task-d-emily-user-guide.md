# Task D: Emily's CMS User Guide

## Context

Sveltia CMS is installed at `/cms/` on the Wandering Lantern website (Task A), the event schema has been expanded (Task B), and GitHub OAuth is working (Task C). The store owner Emily can now log in and edit events herself — but she's non-technical and has never used a content management system before.

**Goal:** Write a plain-language user guide that lets Emily create, edit, and publish events without asking for help.

## Prerequisites

- Tasks A, B, and C must be completed and working in production
- The CMS must be live at `https://mike-plant.github.io/WanderingLantern/cms/`
- Emily's GitHub account must already be added as a collaborator on the repo (if she has one)

## Who This Guide Is For

**Emily.** Imagine someone who:
- Runs a bookstore, not a tech company
- Is comfortable with email, Instagram, Google Docs
- Has never used Git, GitHub, Markdown, or a CMS before
- Just wants to get an event posted and move on with her day

Write for her. Not for developers. Not for yourself.

## Style Rules

1. **No jargon.** Never say "frontmatter," "markdown," "repository," "commit," "branch," "YAML," "slug," "schema." If you catch yourself using a technical term, stop and find the plain-English version.
2. **Short sentences.** One idea per sentence.
3. **Concrete examples over abstract descriptions.** Instead of "Enter a descriptive title," say: *"Type the event title exactly as you want it to appear on the website. For example: 'Meet Charlotte the Perching Detective!'"*
4. **Numbered steps for anything sequential.** No wall-of-text instructions.
5. **Tell her what will happen next.** After every action that does something, say what she'll see: *"Click Save. You'll see a confirmation at the top of the screen that says 'Saved.'"*
6. **Anticipate her questions.** If a field is optional, say so AND say when she'd want to fill it in.
7. **Friendly but not condescending.** Think "helpful coworker showing you the ropes," not "children's book."
8. **No emojis except sparingly in section headers if it helps readability.**

## Deliverables

### 1. The main guide

**File:** `docs/cms-guide-for-emily.md`

Structure:

```
# Your Guide to Editing the Website

Hi Emily! This guide shows you how to add, edit, and publish events
on The Wandering Lantern website — without having to ask anyone for help.

## What you can do with this

- Post new events (workshops, author visits, story times, special events)
- Edit events that are already posted (fix a typo, update a time, mark as full)
- Cancel or unpublish an event
- Add press releases

## What you'll need

- A computer with internet
- Your GitHub login (Michael set this up for you — if you don't remember
  the password, ask him to reset it)

## How to log in

[Step-by-step with screenshots]

## Posting a new event

[Step-by-step with screenshots]

## Understanding each field

[Go through every field in the form with plain-English explanations]

## Editing an existing event

[Step-by-step]

## Saving as a draft vs. publishing

[Explain the difference with a concrete example]

## How long until the change appears on the website?

[Explain that it takes about a minute for the site to rebuild, and
that she'll see the change by refreshing the events page]

## Common things you might want to do

### Cancel an event
### Mark an event as full
### Change the date or time of an event
### Delete an event that's no longer happening
### Add an event where registration is handled by another website
### Add an event that's not at the store

[Short, numbered walkthroughs for each]

## If something goes wrong

[Common problems + what to do]

## Adding a press release

[Brief section — similar to events but with fewer fields]

## Getting help

If you get stuck, take a screenshot of what you're seeing and text it
to Michael. Don't worry about breaking anything — everything you do
can be undone.
```

### 2. Field reference — match the current schema

For the "Understanding each field" section, cover every field currently in `src/cms/config.yml` under the `events` collection. As of Task B, the fields are:

- Draft
- Event Title
- Date
- Time
- Age Range
- Location
- Category
- Short Description (Excerpt)
- Price
- Partner / Host
- Status
- External Registration URL
- Special Guest Name
- Guest Role
- Featured Book
- Mailchimp Form ID
- Mailchimp Tag ID
- Show child-age fields
- Show Flyer Image
- Flyer Image URL
- Recurring event
- Recurring schedule description
- Custom URL path
- Event Details (body)

**IMPORTANT:** Verify the list against the actual `src/cms/config.yml` before writing — if Task B was modified during implementation, the fields may differ slightly.

For each field, answer:
1. What is this?
2. When should I fill it in? (required vs. optional, and when optional, when is it useful)
3. What's an example value?

**Hide the advanced fields in a "You probably won't need these" section:**
- Mailchimp Form ID / Tag ID (say: "These are already set correctly. Don't change them unless Michael tells you to.")
- Custom URL path (say: "Leave this blank. It's only for special recurring events.")
- Show Flyer Image / Flyer Image URL (if not actively used, note this)

### 3. Screenshot placeholders

You can't take screenshots. Insert clear placeholders like this:

```
> **📸 Screenshot needed:** The login page, showing the "Login with GitHub"
> button highlighted.
```

Use these placeholders at these key moments:
- The CMS login page
- The collection list (Events / Press Releases)
- The "New Event" button
- An empty event form
- A filled-in event form ready to save
- The "Save as Draft" vs. "Publish" buttons
- The draft workflow (if editorial workflow is enabled and shows a "Ready for review" state)
- The published event on the live site

Michael will add real screenshots later.

### 4. Link the guide from the CMS

Add a small link in `src/cms/index.html` so Emily can always find the guide from inside the CMS:

```html
<div style="position: fixed; bottom: 10px; right: 10px; z-index: 9999; font-family: sans-serif; font-size: 12px;">
  <a href="https://github.com/mike-plant/WanderingLantern/blob/main/docs/cms-guide-for-emily.md"
     target="_blank"
     style="color: #8b6f47; text-decoration: none; background: white; padding: 6px 10px; border: 1px solid #c9a961; border-radius: 4px;">
    📖 Help Guide
  </a>
</div>
```

Place this inside the `<body>` tag, before the CMS `<script>` tag. Verify the CMS still loads correctly after adding it.

### 5. Printable version (optional but nice)

Alongside the markdown guide, create `docs/cms-guide-for-emily-print.html` — a simple self-contained HTML version that Emily can print and keep next to her computer. Use the site's warm brown/gold color palette from `src/assets/css/variables.css`. Keep it 2–4 pages when printed.

This is lower priority than the markdown version. Skip if time is tight.

## Acceptance Criteria

- [ ] `docs/cms-guide-for-emily.md` exists and is readable start-to-finish by a non-technical person
- [ ] Every field currently in `src/cms/config.yml` is explained in plain language
- [ ] No technical jargon (run a final pass to catch slipups)
- [ ] Screenshot placeholders at the 8+ key moments listed above
- [ ] Help link added to `src/cms/index.html` and the CMS still works
- [ ] "Common things you might want to do" section covers at least 6 scenarios
- [ ] Troubleshooting section covers at least 3 common issues
- [ ] (Optional) Printable HTML version exists

## Notes for the agent

- **Don't invent features.** If you're not sure whether the CMS supports a workflow, read `src/cms/config.yml` and the Sveltia docs (https://github.com/sveltia/sveltia-cms) before describing it.
- **Match reality, not the ideal.** The guide must describe what the CMS actually does right now, not what it should do. If editorial workflow is enabled but confusing, explain how it actually works in practice.
- **Show the guide to yourself and ask: "Could someone's mom follow this?"** If the answer is no, rewrite it.
- **Don't over-pad.** A 15-page guide is worse than a 6-page guide. Cut anything Emily doesn't need.
- **Don't write a section called "Markdown Basics."** Emily will never write markdown. The CMS has a rich text editor for the event body. If there's any place she'd benefit from basic formatting (bold, italic, headings), explain it as "use the toolbar above the text box," not "use markdown syntax."
