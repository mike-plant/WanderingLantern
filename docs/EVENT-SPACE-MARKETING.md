# Event Space Marketing Playbook

Everything needed to turn `/reservations/` into a steady booking channel.
Owner: whoever runs the Instagram account. Review quarterly.

---

## 1. What changed on the site, and what you now control

The reservations page is driven by four data files. Edit the JSON, rebuild,
and the page updates — no template work needed.

| File | Controls | Status |
|---|---|---|
| `src/_data/reservationPhotos.json` | Hero photo + gallery | **Empty — needs the professional photos** |
| `src/_data/reservationPricing.json` | "Starting at $X" anchors | **Empty — needs a decision** |
| `src/_data/reservationTestimonials.json` | Quotes from past events | Empty — collect after each booking |
| `src/_data/reservationFaq.json` | FAQ accordions + Google FAQ rich results | 14 questions, live |

Sections with no data hide themselves. The page never shows an empty frame
or a "coming soon" apology.

---

## 2. The two highest-impact things still open

### a. Publish price anchors

Right now the page says "pricing varies, ask us." Parents comparison-shopping
party venues filter on price *first*. A venue page with no number gets skipped,
not inquired about — the inquiry form is a higher-friction action than closing
the tab.

Set a floor price per package in `reservationPricing.json`:

```json
"packages": {
  "secret-garden":          { "from": 150, "unit": "2-hour block" },
  "mad-hatters-tea-party":  { "from": 275, "unit": "2-hour block" },
  "royal-ball":             { "from": 450, "unit": "2-hour block" }
}
```

*(Numbers above are illustrative placeholders — set your own.)*

Doing this also emits `Offer` structured data, which makes the packages
eligible for price display in Google results.

You are not committing to a fixed price. "Starting at" plus the existing
"final pricing depends on group size, day, and time" line preserves every bit
of flexibility you have today.

### b. Collect testimonials

Two or three real quotes will move conversion more than any copy rewrite.
Send this 2–3 days after every event:

> Hi [name] — so glad we got to host [child]'s party! If you have 30 seconds,
> would you mind sending back a sentence or two about how it went? We'd love to
> share it with other families considering the space (and we'll check with you
> before publishing anything with your name on it).

Add to `reservationTestimonials.json`:

```json
"testimonials": [
  {
    "quote": "The kids were completely absorbed for the entire story time.",
    "name": "Sarah M.",
    "detail": "Birthday party, age 6"
  }
]
```

---

## 3. SEO: what's now in place

- **Title tag** targets `kids birthday party venue lakewood oh` rather than the
  generic "Event Space Rental."
- **Doubled title suffix fixed site-wide.** Every page previously rendered as
  "Our Story - The Wandering Lantern - The Wandering Lantern," which wastes the
  ~60 characters Google displays.
- **`sitemap.xml` and `robots.txt` added.** Neither existed. Submit the sitemap
  in Google Search Console (see §4).
- **Structured data:** `Service` + `OfferCatalog` describing the rental,
  `FAQPage` across all 14 questions, and `BreadcrumbList`. The FAQ markup makes
  the page eligible for expandable questions directly in search results.
- **Open Graph + Twitter cards** so shared links render with a photo and real
  copy instead of a bare URL. This matters most for Facebook — where local
  parent groups do their venue recommendations.
- **Hero uses a real `<img>` with alt text**, so it can rank in Google Images.
  Background-image heroes are invisible to image search.

### Target keywords

| Priority | Query | Where it's addressed |
|---|---|---|
| High | kids birthday party venue lakewood ohio | Title, H1, occasions |
| High | birthday party places cleveland | Description, `areaServed` schema |
| Medium | private event space lakewood oh | Eyebrow, Service schema |
| Medium | baby shower venue cleveland | Occasions section |
| Medium | book club meeting space lakewood | Occasions section |
| Long tail | how much to rent party space lakewood | FAQ #1 |
| Long tail | birthday party venue with parking lakewood | FAQ (parking) |

---

## 4. Off-site setup (30 minutes, do once)

These are the highest-leverage items and none of them are code.

1. **Google Business Profile** — add "Event venue" as a secondary category.
   Post the professional photos there too; GBP photos drive more local
   discovery than website photos do. Add a Product/Service entry for each of
   the three packages with the price anchor.
2. **Google Search Console** — submit `https://thewanderinglantern.com/sitemap.xml`.
   Then check the Performance report monthly filtered to `/reservations/` to see
   which queries are actually landing.
3. **Facebook Page** — add the "Book Now" action button pointing at
   `/reservations/`. Facebook is where Lakewood parent groups trade venue
   recommendations.
4. **Instagram** — put `/reservations/` in the bio link rotation, and create a
   permanent Story Highlight called **Parties** with the gallery photos.
5. **Local directories** — Lakewood Chamber of Commerce, Macaroni KID Cleveland,
   and Cleveland-area "kids birthday party venue" roundup listicles. These
   listicles rank above individual venues for the exact query you want, so
   being *in* them beats competing with them.

---

## 5. Social launch sequence

Run this once the professional photos are on the page. One post every 3–4 days.

### Post 1 — The reveal
> Our event space, finally photographed properly. 📸
>
> Birthday parties, baby showers, book clubs — after hours, the whole
> bookstore is yours.
>
> Three packages, from "just the room" to "we handle everything."
> Link in bio for dates.

*Carousel: 4–5 of the best gallery photos. Lead with the widest room shot.*

### Post 2 — The objection
> "Where do we even have it?"
>
> Not a party room with a laminate floor. Not your living room.
>
> A bookstore, after close, with the lights low and the shelves full.
> Up to 50 guests.

*Single photo: the room at its most atmospheric.*

### Post 3 — The package explainer
> Three ways to do this 👇
>
> 🌿 **The Secret Garden** — the room is yours, bring your own plans
> 🎩 **Mad Hatter's Tea Party** — story time + a craft, we run it
> 👑 **The Royal Ball** — snacks, setup, cleanup, all of it
>
> Most families pick the middle one.

*Carousel: one photo per package, or a text-over-photo card each.*

### Post 4 — Proof
> [Testimonial quote from a real event]
>
> Booking dates for [next month]. Link in bio.

*Photo from the actual event, with permission.*

### Post 5 — Urgency, no hype
> Weekend dates in [month] are going. Weekdays are wide open and cheaper.
>
> If you're planning something for [season], now's the time to ask.

*Photo of the space set up.*

### Ongoing cadence
- **After every event you host:** one photo + one line, with permission. This is
  the highest-converting content you have and it costs nothing.
- **Monthly:** a "dates still open in [month]" Story with a link sticker.
- **Never:** posting the space with no people and no context. The room alone
  doesn't sell — the room *in use* does.

### Caption rules
- Lead with the specific, not the category. "The lights go down at 6" beats
  "Book our event space today!"
- One CTA per post. Always the same one: link in bio.
- Skip hashtag walls. `#lakewoodohio #clevelandmoms #birthdaypartyideas` and
  stop.

---

## 6. Measuring it

GA4 events now fire on the reservations page:

| Event | Fires when | Read it as |
|---|---|---|
| `cta_click` | Any `[data-ga]` element clicked | Which CTA earns the click |
| `gallery_open` | A gallery photo is opened | Whether the photos hold attention |
| `reservation_inquiry` | Inquiry form submitted | **The conversion** |
| `reservation_scroll_depth` | 25/50/75/100% of page | Where people give up |

The one to watch: if `reservation_scroll_depth` shows people reaching 75% but
`reservation_inquiry` stays flat, the problem is the form or the missing price —
not the copy above it.

The `reservation_inquiry` event carries the selected package, event type, and
guest count, so you can see what people actually want versus what you promote.

---

## 7. Adding the professional photos

1. Export at ~1600px on the long edge, quality 80. Aim for under 300KB each.
2. Name them descriptively — `event-space-birthday-table.jpg`, not `DSC_0421.jpg`.
   Filenames are a real image-search ranking signal.
3. Drop into `src/assets/images/reservations/`.
4. Add entries to `src/_data/reservationPhotos.json`:

```json
{
  "hero": {
    "src": "/assets/images/reservations/event-space-wide.jpg",
    "alt": "The event space at The Wandering Lantern set for a children's birthday party"
  },
  "gallery": [
    {
      "src": "/assets/images/reservations/story-time-corner.jpg",
      "alt": "Children seated on cushions for story time among the bookshelves",
      "caption": "Story time, included with two of our three packages",
      "wide": true
    }
  ]
}
```

**Write the `alt` text carefully.** It is read by screen readers *and* indexed
by Google Images — for a venue, image search is real inbound traffic. Describe
what is happening in the photo, not just what the room is.

### Which photos to pick

Choose 6–9. Prioritize, in order:

1. **The room set up for a party**, wide, showing scale. This is the hero.
2. **Kids mid-activity** — a story time or craft in progress. People buy the
   experience, not the square footage.
3. **A detail shot** — the shelves, the lighting, a table setting.
4. **The room empty and clean**, so people can picture their own decorations.
5. **The storefront**, so guests know what to look for.

Skip anything blurry, anything with an unflattering angle of the ceiling, and
anything where a stranger's child is identifiable without a release on file.
