# Eleventy Migration - The Wandering Lantern

## Overview

The site has been successfully migrated to Eleventy (11ty), a powerful static site generator. This provides better organization, easier content management, and a more maintainable codebase.

## Project Structure

```
WanderingLantern/
├── src/
│   ├── _data/              # Global data files
│   ├── _includes/          # Layouts and components
│   │   ├── components/     # Reusable components
│   │   │   ├── about.njk
│   │   │   ├── contact.njk
│   │   │   ├── event-card.njk
│   │   │   ├── first-light.njk
│   │   │   ├── footer.njk
│   │   │   ├── head.njk
│   │   │   ├── header.njk
│   │   │   ├── hero.njk
│   │   │   ├── mailchimp-event-form.njk
│   │   │   ├── nav.njk
│   │   │   └── offerings.njk
│   │   └── layouts/        # Page layouts
│   │       ├── base.njk           # Base HTML structure
│   │       ├── event.njk          # Event detail pages
│   │       ├── page.njk           # Standard content pages
│   │       └── press-release.njk  # Press release pages
│   ├── assets/
│   │   ├── css/           # Modular CSS files
│   │   │   ├── main.css         # Main import file
│   │   │   ├── variables.css    # CSS custom properties
│   │   │   ├── base.css         # Base styles
│   │   │   ├── hero.css         # Hero section
│   │   │   ├── navigation.css   # Navigation & bars
│   │   │   ├── forms.css        # Form styles
│   │   │   ├── buttons.css      # CTA buttons
│   │   │   ├── events.css       # Event pages
│   │   │   ├── press.css        # Press pages
│   │   │   └── mobile.css       # Mobile responsive
│   │   └── js/
│   │       └── main.js          # JavaScript modules
│   ├── events/            # Event markdown files
│   │   ├── sample-storytime.md
│   │   └── author-visit-january.md
│   ├── press/             # Press release markdown files
│   │   └── grand-opening-announcement.md
│   ├── root-files/        # Files copied to site root
│   │   ├── logo.png
│   │   ├── storefront-temp.webp
│   │   └── ...
│   ├── signup/            # Existing signup pages (passthrough)
│   ├── newsletter/        # Existing newsletter pages (passthrough)
│   ├── thankyou/          # Thank you page (passthrough)
│   ├── launch-dashboard/  # Dashboard (passthrough)
│   ├── index.njk          # Homepage
│   ├── events.njk         # Events listing page
│   └── press.njk          # Press room page
├── _site/                 # Built site (generated, don't edit)
├── .eleventy.js           # Eleventy configuration
├── package.json           # Node dependencies
└── .gitignore            # Git ignore rules
```

## Development Workflow

### Start Development Server
```bash
npm run dev
```
This starts a local server at `http://localhost:8080/` with live reloading. The server watches for changes and automatically rebuilds.

### Build for Production
```bash
npm run build
```
Generates the complete site in the `_site` directory.

### Clean Build Artifacts
```bash
npm run clean
```
Removes the `_site` directory.

## Adding Content

### Adding a New Event

1. Create a new markdown file in `src/events/`:
   ```bash
   src/events/my-new-event.md
   ```

2. Add frontmatter and content:
   ```markdown
   ---
   layout: layouts/event.njk
   title: "Your Event Title"
   date: 2026-01-15
   time: "10:00 AM - 11:30 AM"
   ageRange: "3-7"
   excerpt: "Short description for event cards"
   mailchimpFormId: "f1915b185f"
   mailchimpTag: "3728680"
   showChildFields: true
   ---

   ## About This Event

   Your event description here...
   ```

3. The event will automatically:
   - Appear on `/events/` listing page
   - Get its own page at `/events/my-new-event/`
   - Show in "Upcoming Events" if the date is in the future
   - Move to "Past Events" automatically after the date passes

### Adding a Press Release

1. Create a new markdown file in `src/press/`:
   ```bash
   src/press/my-press-release.md
   ```

2. Add frontmatter and content:
   ```markdown
   ---
   layout: layouts/press-release.njk
   title: "Press Release Title"
   date: 2025-12-01
   excerpt: "Brief summary for press room listing"
   ---

   **FOR IMMEDIATE RELEASE**

   Your press release content here...
   ```

3. The press release will automatically appear on `/press/` and get its own page.

## Key Configuration Files

### .eleventy.js

Main configuration file that defines:
- **Collections**: Groups content (upcomingEvents, pastEvents, press)
- **Filters**: Custom functions for dates and formatting
- **Passthrough Copy**: Static files that are copied as-is
- **Directory Structure**: Input/output paths

### package.json

Defines npm scripts and dependencies:
- `npm run dev`: Development server with hot reload
- `npm run build`: Production build
- `npm run clean`: Remove build artifacts

## Mailchimp Integration

### Event Registration Forms

Each event can include a Mailchimp registration form by setting these frontmatter values:

```yaml
mailchimpFormId: "f1915b185f"        # Your Mailchimp form ID
mailchimpTag: "3728680"               # Tag for tracking registrations
showChildFields: true                 # Show/hide child age fields
```

### Form Tags

Current Mailchimp tags:
- **3728680**: Newsletter Signup
- **3728681**: Contact Us Optin
- **3728682**: Newsletter Only

## Styling

### CSS Architecture

Styles are organized into modular files:
1. **variables.css** - Color palette and fonts
2. **base.css** - Typography, layout, global styles
3. **Component-specific CSS** - Hero, navigation, forms, etc.
4. **mobile.css** - Responsive overrides (loaded last)

To modify styles, edit the relevant CSS file in `src/assets/css/`.

### Adding New Styles

1. Edit the appropriate CSS file or create a new one
2. If creating a new file, import it in `main.css`:
   ```css
   @import 'your-new-file.css';
   ```

## JavaScript

JavaScript has been extracted to `src/assets/js/main.js` and includes:
- Countdown timer for grand opening
- Sticky navigation bars on scroll
- Contact form Mailchimp integration

Functions are modular and initialize on DOM ready.

## Deployment

### GitHub Pages Setup

The site is configured to deploy to GitHub Pages. To update:

1. Build the site:
   ```bash
   npm run build
   ```

2. Commit and push changes:
   ```bash
   git add .
   git commit -m "Update site content"
   git push
   ```

3. Configure GitHub Pages to use the `_site` directory or set up a GitHub Action to build and deploy.

### Deployment Notes

- The `_site` directory contains the complete built site
- All source files are in `src/`
- Never edit files directly in `_site` - they'll be overwritten on next build

## Collections

### Upcoming Events
Events with dates in the future, sorted chronologically.

### Past Events
Events with dates in the past, sorted reverse chronologically.

### Press
All press releases, sorted by date (newest first).

## Troubleshooting

### Dev server won't start
- Make sure you ran `npm install`
- Check that port 8080 isn't in use

### Changes not appearing
- The dev server should auto-reload
- If not, stop the server (Ctrl+C) and run `npm run dev` again

### Build errors
- Check the terminal output for specific error messages
- Ensure all frontmatter is valid YAML
- Verify file paths and image references

### CSS not loading
- Check that `main.css` imports all necessary CSS files
- Verify the path `/assets/css/main.css` in base.njk

## Next Steps

1. **Add more events**: Create markdown files in `src/events/`
2. **Customize press kit**: Update links in press.njk
3. **Add images**: Place event images in `src/root-files/` or `src/assets/images/`
4. **Configure deployment**: Set up automated deployment to GitHub Pages

## Support

For questions or issues with Eleventy:
- Documentation: https://www.11ty.dev/docs/
- Discord: https://www.11ty.dev/blog/discord/

For site-specific questions, contact the development team.
