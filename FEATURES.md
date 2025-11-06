# Feature Flags

This file documents the feature flag system for The Wandering Lantern website.

## What are Feature Flags?

Feature flags allow you to easily turn features on/off without changing code. All flags are controlled in a single file: `src/_data/features.json`

## How to Use

Edit `src/_data/features.json` and change any value from `true` to `false` (or vice versa). The dev server will automatically reload with your changes.

## Available Feature Flags

### Navigation Features

**`navigation.showEventsInMainNav`** (default: `true`)
- Controls whether "Events" link appears in the main navigation bar
- When `false`: Events link only appears in footer navigation

**`navigation.showNewsletterInMainNav`** (default: `true`)
- Controls whether "Stay in the Know" link appears in the main navigation
- When `false`: Newsletter link only appears in footer navigation

**`navigation.showPressInMainNav`** (default: `false`)
- Controls whether "Press & Media" link appears in the main navigation
- Recommended: Keep `false` to reduce nav clutter. Press link always available in footer.

**`navigation.showContactInMainNav`** (default: `true`)
- Controls whether "Get in Touch" link appears in the main navigation
- When `false`: Contact link only appears in footer navigation

### Footer Features

**`footer.showFooterNav`** (default: `true`)
- Controls whether the entire footer navigation section displays
- When `false`: Only shows simple copyright footer

**`footer.showBackToTop`** (default: `true`)
- Controls whether "Back to Top ↑" link appears in footer
- Useful for long scrolling pages

**`footer.showSocialLinks`** (default: `true`)
- Controls whether Instagram/Facebook links appear in footer
- When `false`: Hides social media links

### Homepage Features

**`homepage.showCountdown`** (default: `true`)
- Controls whether the grand opening countdown displays in the hero section
- After opening day, you may want to set this to `false`

**`homepage.showFirstLight`** (default: `true`)
- Controls whether the "Join The First Light" CTA section displays on homepage
- After launch, you might replace this with a different CTA

### Event Features

**`events.showUpcomingEvents`** (default: `true`)
- Controls whether upcoming events section displays on `/events/` page
- When `false`: Hides upcoming events entirely

**`events.showPastEvents`** (default: `true`)
- Controls whether past events section displays on `/events/` page
- When `false`: Hides past events archive

**`events.enableEventFlyers`** (default: `true`)
- Controls whether event flyer images display on individual event pages
- When `false`: Hides flyer images even if `flyerImage` is set in event frontmatter

## Example Use Cases

### Scenario: Launch Day Has Passed
After the grand opening, turn off the countdown:

```json
{
  "homepage": {
    "showCountdown": false,
    "showFirstLight": true
  }
}
```

### Scenario: Simplified Navigation During Events
Temporarily simplify main nav during a big event:

```json
{
  "navigation": {
    "showEventsInMainNav": true,
    "showNewsletterInMainNav": false,
    "showPressInMainNav": false,
    "showContactInMainNav": true
  }
}
```

### Scenario: Hide Past Events Until You Have Some
Start with only upcoming events visible:

```json
{
  "events": {
    "showUpcomingEvents": true,
    "showPastEvents": false,
    "enableEventFlyers": true
  }
}
```

### Scenario: Minimal Footer for Testing
Test with simplified footer:

```json
{
  "footer": {
    "showFooterNav": false,
    "showBackToTop": false,
    "showSocialLinks": false
  }
}
```

## Adding New Feature Flags

To add a new feature flag:

1. Add the flag to `src/_data/features.json`:
   ```json
   {
     "yourSection": {
       "yourFeatureName": true
     }
   }
   ```

2. Use it in your template with conditional logic:
   ```njk
   {% if features.yourSection.yourFeatureName %}
   <!-- Your feature code here -->
   {% endif %}
   ```

3. Document it in this file!

## Best Practices

- **Use descriptive names**: `showEventsInMainNav` is better than `events`
- **Default to true**: Most features should be on by default
- **Document thoroughly**: Explain what happens when the flag is `false`
- **Test both states**: Always test with the flag both `true` and `false`
- **Keep it simple**: Don't over-flag. Only flag things you'll actually want to toggle.

## Technical Notes

- Feature flags are loaded globally via Eleventy's data cascade
- Available in all templates as `features.section.flag`
- Changes to `features.json` trigger automatic rebuild in dev mode
- No JavaScript required - all handled at build time
