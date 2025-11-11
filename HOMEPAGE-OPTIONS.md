# Homepage Layout Options for About Section

## Option A: Short Teaser with Link (RECOMMENDED)
**File:** `src/_includes/components/about-short.njk`

Keep a condensed version on the homepage that captures the essence of your story, then link to the full `/about/` page.

**Homepage structure:**
```
- Hero
- First Light (signup CTA)
- What We Offer
- About (short teaser) ← NEW VERSION
  └─ "Read Our Story" button → links to /about/
- Contact
```

**Pros:**
- Gives visitors a taste of your story without overwhelming
- Encourages click-through to dedicated page
- Keeps homepage flowing and scannable
- SEO benefit from separate About page

**To implement:**
In `src/index.njk`, change line 19 from:
```njk
{% include "components/about.njk" %}
```
to:
```njk
{% include "components/about-short.njk" %}
```

---

## Option B: Two-Column Layout (About + Contact)
Split the bottom of your homepage into two columns side-by-side.

**Homepage structure:**
```
- Hero
- First Light (signup CTA)
- What We Offer
- [About Teaser | Contact Form] ← TWO COLUMNS
```

**Pros:**
- Modern, magazine-style layout
- Efficient use of space
- Creates visual interest

**Cons:**
- Less emphasis on each section
- May feel cramped on tablet sizes
- Contact form deserves prominence

**To implement:**
Would need to create new two-column component and CSS grid layout.

---

## Option C: Remove from Homepage Entirely
Move About completely off the homepage. Rely on navigation only.

**Homepage structure:**
```
- Hero
- First Light (signup CTA)
- What We Offer
- Contact
```

**Pros:**
- Cleanest, most focused homepage
- Drives people to dedicated About page
- Emphasizes action (events, signup, contact)

**Cons:**
- Visitors may not know who you are
- Misses storytelling opportunity
- No human connection on first page

**To implement:**
In `src/index.njk`, delete line 19:
```njk
{% include "components/about.njk" %} ← DELETE THIS
```

Add "About" to main navigation in features.json.

---

## My Recommendation: Option A

Your story is compelling and beautifully written. A short teaser on the homepage establishes the human connection and trust, while the "Read Our Story" button creates a natural journey for those who want to know more.

The full story deserves space to breathe — and a dedicated `/about/` page gives it that room without making your homepage feel too long.

**Next Steps if you choose Option A:**
1. Update `src/index.njk` to use `about-short.njk`
2. Add "About" link to navigation
3. Test the flow

Let me know which option you prefer!
