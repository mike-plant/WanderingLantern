# Adding Events to The Wandering Lantern Website
### A Guide for Emily & Monika

**The CMS:** https://thewanderinglantern.com/cms/
**Log in with your GitHub account.** If you can't log in, ask Michael to make sure you've been added as a collaborator on the repo.

---

## How It Works

When you save and publish an event in the CMS, it:
- Appears on the public events page at `/events/`
- Gets its own page at `/events/your-event-name/`
- Shows up in the homepage event preview

Changes go live automatically within a few minutes of publishing. You don't need to touch any code.

---

## Before You Start: Know Your Event Type

Everything about how an event looks on the site — the button, the registration form, the badge color, the date display — is driven by which fields you fill in. The most important decision is **how people sign up.**

There are four event types:

| Type | When to use | Registration shown |
|---|---|---|
| **A — Mailchimp form** | Free events, store-run signups | Embedded form on the event page |
| **B — Shopify ticket** | Paid events sold through the store | "Purchase Tickets" button |
| **C — Eventbrite** | Paid events run by an outside organizer | "Purchase Tickets" button |
| **D — Walk-in / no signup** | Drop-in events, no registration needed | Nothing (just event info) |

Pick your type first, then follow the instructions for that type below.

---

## Creating a New Event: Step by Step

1. Go to https://thewanderinglantern.com/cms/
2. Click **Events** in the left sidebar
3. Click **New Event** (top right)
4. Fill in the fields — use the guide below for your event type
5. When done, click **Save** (saves a draft) or **Publish** (goes live)

> **Tip:** Save as a draft first if you're not ready to go live. Drafts are invisible to the public but you can preview them by visiting the URL directly.

---

## Event Type A — Free Event with Mailchimp Registration
*Most common. Use this for author visits, workshops, book club, yoga pop-ups, storytime, etc.*

**Real examples:** Family Classics Book Club, Camp Sunshine Kids Yoga (May 2026), Nola the Corgi author visit, Charlotte the Perching Detective

### Fields to fill in

**Title**
The public-facing event name.
> "Storytime with Kellie DuBay Gillis" / "Family Classics Book Club" / "Camp Sunshine Kids Yoga"

**Date**
Pick from the date picker.

**Time**
Type it out exactly as you want it to appear.
> "6:00 PM - 7:00 PM" / "11:00 AM" / "5:00 PM - 7:00 PM" / "11:00 AM & 11:30 AM" ← for two sessions

**Age Range**
> "All ages" (most events) / "6-12" (book club) / "1-10" (yoga) / "All ages" (author visits)

**Category**
Controls the colored badge on the event card. Pick one:
- **Workshop** — craft or skill-based programs (brown badge)
- **Author Visit** — any visiting author or special guest with a book (gold filled badge — stands out most)
- **Story Time** — one-off storytime (gold outline badge)
- **Special Event** — seasonal or one-of-a-kind (red badge)

**Excerpt**
The 1-2 sentence teaser shown on event cards. Lead with the most interesting detail — not the event name.
> ✅ "Stretch, breathe, and celebrate the Earth. Jena from Camp Sunshine Kids Yoga leads two sessions — little ones at 5 PM, bigger kids at 6 — with an Earth Day twist."
> ❌ "Join us for a fun yoga event with Camp Sunshine!"

**Price**
Leave blank if free (the registration form alone communicates it's sign-up-only). Use "Free" only if it's worth calling out specifically (like a chess afternoon or IBD).

**Mailchimp Form ID**
Almost always: `f1915b185f`
Leave this exactly as it is unless Michael tells you a new form has been created.

**Mailchimp Tag ID**
This is how Mailchimp knows which event someone signed up for. Use the right one:

| Tag ID | Use for |
|---|---|
| `3728680` | General events — author visits, workshops, one-off events |
| `3728683` | Family Classics Book Club (every month) |
| `3728684` | Saturday Story Time |

**→ If this is a brand-new recurring series** (like a new monthly club), you need to create a new tag in Mailchimp first. See [Creating a New Mailchimp Tag](#creating-a-new-mailchimp-tag) below.

**Show child name & age fields in registration form**
Leave this **checked** for most events — it collects each child's name and age group.
Uncheck it for adult-only evening workshops where child details aren't needed.

**Everything else** — leave blank.

---

## Event Type B — Paid Event via Shopify Store
*Use when customers buy tickets through thewanderinglantern.store*

**Real examples:** Cardboard Maker's Space, Postcard Pen Pals, Layered Paper Art Workshop, Stories Pretend & Puppets, Improv Puppetry & Performance camp

### Fields to fill in

Same as Type A for: Title, Date, Time, Age Range, Category, Excerpt.

**Price**
Always fill this in for paid events. It shows in the event details.
> "$12" / "$15" / "$135" / "$150"

**Ticket Purchase URL (Shopify)**
Paste the full URL from the Shopify product page.
> `https://thewanderinglantern.store/products/cardboard-makers-space-april-3rd-2026`

This adds a **"Purchase Tickets"** button to the event page. The Mailchimp fields are not needed — leave them blank.

**Host** (if applicable)
If another organization is running the event.
> "Ohio City Art House" / "Camp Sunshine"

**Do NOT fill in:** Mailchimp Form ID, Mailchimp Tag ID, External Registration URL.

---

## Event Type C — Paid Event via Eventbrite
*Use when an outside organizer is running the event and selling tickets through Eventbrite*

**Real examples:** Parent & Child Painting Class with Ohio City Art House, Silhouettes by Chris Casey

### Fields to fill in

Same as Type B. The only difference is where the ticket URL comes from.

**Ticket Purchase URL (Shopify)**
Despite the label saying "Shopify," paste the Eventbrite URL here. Both types use the same field and show the same "Purchase Tickets" button.
> `https://www.eventbrite.com/e/parent-and-child-painting-class-tickets-1986106351562`

**Price**
Fill in the ticket price.
> "$20 per pair" / "$30"

---

## Event Type D — Walk-in / No Registration
*Use for free drop-in events where no signup is needed*

**Real examples:** Once Upon a Dime (10-cent book day), White Rabbit Visit, live music events, Independent Bookstore Day

### Fields to fill in

Same basics: Title, Date, Time, Age Range, Category, Excerpt.

**Leave ALL registration fields blank:** Mailchimp Form ID, Mailchimp Tag ID, Ticket Purchase URL, External Registration URL.

The event page will just show the event info and description — no form, no button. That's correct for walk-in events.

**Time**
For all-day or flexible events, use:
> "During Store Hours" / "11:00 AM - 2:00 PM" / "By appointment"

---

## Special Cases

### Author Visit Events
Author visits need three extra fields on top of the Type A setup. These power the **gold star on the Saturday Story Time banner** (appears automatically when the author visit falls on a Saturday) and show a guest spotlight section on the event page.

**Special Guest Name**
Full name of the author or guest.
> "Matthew Swinehart" / "Kristine Sheppard" / "Kellie DuBay Gillis"

**Guest Role / Title**
Short description of who they are.
> "Author" / "Author & Environmental Scientist" / "Author & Illustrator"

**Featured Book**
The book being celebrated. For multiple books, use "&".
> "Nola the Noble Corgi Visits the Hospital" / "Big Bike, Little Bike & If You Find a Fawn"

Set **Category** to **Author Visit** — this gives the event a gold filled badge, the most prominent style.

---

### Multi-Day Camps
For camps that run across several days (like the summer theater camp or Stories, Pretend & Puppets).

**Date**
Set this to the **first day** of the camp — this controls where it appears on the events calendar.

**Date Range (multi-day events only)**
Type the full date range exactly as you want it displayed.
> "Tuesday–Friday, May 26–29, 2026"
> "Monday–Friday, June 8–12, 2026"

This replaces the single date on the event card with the full range.

**Time**
Include "daily" to make clear it repeats.
> "10:00 AM - 1:00 PM daily" / "5:30 PM - 8:30 PM daily"

**Age Range**
Be specific for camps.
> "Rising kindergarteners" / "Rising 6th–7th graders"

---

### Events Hosted by Outside Organizations
When The Wandering Lantern is the venue but someone else is running it.

**Real examples:** Winter Simple Portraits pop-up (A Little Bit Perfect), yoga events (Camp Sunshine), painting class (Ohio City Art House)

**Host**
> "Camp Sunshine" / "Ohio City Art House" / "A Little Bit Perfect"

**Location**
Only fill this in if the event is NOT at the store.
> "Wagar Park, Lakewood" ← for outdoor events that start at the park

---

### Events with a Flyer
If you have a flyer image to show on the event page:

**Flyer Image URL**
Paste the image URL or local file path. If you've uploaded the image to the media library, paste the path it gives you.
> `/event-images/my-flyer.jpg` ← uploaded through the CMS media library
> `https://...` ← direct link from Google Drive, Canva, etc.

The flyer appears automatically below the event description when this field is set. No other toggle needed.

---

## Fields That Change How the Site Looks

This is a complete reference of every field that affects the public-facing HTML. If you're not sure why something looks different, check these.

| Field | What it changes on the site |
|---|---|
| **Category** | Badge on the event card: Workshop = brown, Author Visit = gold filled, Story Time = gold outline, Special Event = red |
| **Status: Full** | Replaces registration with "This event is full" + phone & email contact info |
| **Status: Cancelled** | Replaces registration with a red cancellation notice |
| **Draft: checked** | Hides the event from all listings (still accessible by direct URL) |
| **Special Guest** (on a Saturday author-visit) | Adds a gold ★ and gold border to that date on the Saturday Story Time banner |
| **Price** | Appears in the event details block and on the event card |
| **Location** | Appears in the event details block (leave blank for store events) |
| **Host** | Appears in the event details block |
| **Date Range** | Replaces the single date on the event card with the full range |
| **Flyer Image URL** | Shows a flyer image below the event description |
| **Ticket Purchase URL** | Shows a "Purchase Tickets" button (overrides Mailchimp form) |
| **Mailchimp Form ID + Tag ID** | Shows the embedded registration form |
| **External Registration URL** | Shows a "Register here →" button |
| **Show child fields** | Adds/removes child name & age questions from the Mailchimp form |

---

## Creating a New Mailchimp Tag

Do this when you're setting up a **new recurring series** (like a new monthly club) and want to track signups separately from everything else.

1. Log into Mailchimp at mailchimp.com
2. Go to **Audience** → **Tags**
3. Click **Create Tag**
4. Name it clearly: "Family Classics Book Club" / "Saturday Story Time" / "Monthly Craft Night"
5. After saving, click on the tag — the tag ID number is in the URL:
   `https://us12.admin.mailchimp.com/lists/members/?tagId=`**3728683**
6. Copy that number and paste it into the **Mailchimp Tag ID** field in the CMS

For one-off events, just use `3728680` (general events) — no new tag needed.

---

## Marking an Event as Full or Cancelled

Both of these **replace the entire registration section** — the form or ticket button disappears and a notice appears instead.

**Full:**
Set **Status** to **Full**. The event page shows:
> *"This event is full. We're sorry — registration is closed for this one. Reach out if you have any questions: (216) 999-4462 · thewanderinglanterncle@gmail.com"*

The event card also gets a "FULL" badge.

**Cancelled:**
Set **Status** to **Cancelled**. The event page shows a red cancellation notice.

You don't need to edit the description or remove the ticket URL — changing the Status field handles everything.

---

## Draft vs. Published

**Save as Draft** — use this when:
- You're still writing and not ready to go live
- You want Michael to review before publishing
- The event details might change

**Publish** — use this when the event is ready to go live. It usually appears on the site within 2-3 minutes.

You can always unpublish by checking the **Draft** checkbox and saving.

---

## Quick Reference: Common Event Setups

### Family Classics Book Club (any month)
- Category: *(leave blank — it's a recurring series, not a one-off category)*
- Time: `6:00 PM - 7:00 PM`
- Age Range: `6-12`
- Mailchimp Form ID: `f1915b185f`
- Mailchimp Tag ID: `3728683`
- Show child fields: ✓

### Author Visit (standard)
- Category: `Author Visit`
- Time: `11:00 AM` (or specific time)
- Age Range: `All ages`
- Special Guest: *[author name]*
- Guest Role: `Author`
- Featured Book: *[book title]*
- Mailchimp Form ID: `f1915b185f`
- Mailchimp Tag ID: `3728680`
- Show child fields: ✓

### Camp Sunshine Yoga Pop-Up
- Category: `Special Event`
- Time: `5:00 PM - 7:00 PM`
- Age Range: `1-10`
- Host: `Camp Sunshine`
- Price: `$10`
- Ticket Purchase URL: *(Shopify product URL)*

### Summer Camp (multi-day)
- Category: `Workshop`
- Date: *(first day)*
- Date Range: `Monday–Friday, June 8–12, 2026`
- Time: `10:00 AM - 1:00 PM daily`
- Age Range: `Rising kindergarteners`
- Price: `$150`
- Ticket Purchase URL: *(Shopify product URL)*

### Walk-In / Drop-In Event
- Category: `Special Event` (or whichever fits)
- Time: `During Store Hours` or specific hours
- Age Range: `All ages`
- *(Leave all registration fields blank)*
