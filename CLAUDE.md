# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static HTML website for The Wandering Lantern, a children's bookstore in Lakewood, OH. Single-page design with old-world mysterious aesthetic (green/gold color scheme), featuring sections for events, about, special features, forms, and contact information.

## Architecture

- **Single HTML file** (`index.html`) with embedded CSS - no build process required
- **Static hosting** via GitHub Pages at: https://mike-plant.github.io/WanderingLantern/
- **Forms** handled by Formspree (external service)
- **Images** stored in root directory

## Design System

### Color Palette
- `--deep-green: #1a4d2e` - Primary dark green
- `--forest-green: #2d5f3f` - Secondary green
- `--sage-green: #4a7c59` - Accent green
- `--old-gold: #d4af37` - Primary gold
- `--warm-gold: #f0c674` - Secondary gold
- `--cream: #faf8f3` - Light text/backgrounds
- `--dark-brown: #3d2817` - Body text
- `--parchment: #f5f1e8` - Page background

### Typography
- Font family: 'Georgia', 'Garamond', serif
- Warm, literary, traditional feel

### Responsive Breakpoints
- Desktop: Default styles
- Tablet: `@media (max-width: 768px)`
- Mobile: `@media (max-width: 480px)`

## Form Setup (Formspree)

The site has two forms that require Formspree configuration:

1. **Halloween RSVP Form** (line ~447)
2. **Newsletter Signup** (line ~527)

### To Activate Forms:
1. Sign up at https://formspree.io (free tier: 50 submissions/month)
2. Create two forms in your Formspree dashboard
3. Get the form IDs (format: `xyzabc123`)
4. Replace `YOUR_RSVP_FORM_ID` and `YOUR_NEWSLETTER_FORM_ID` in `index.html`
5. First submission to each form will require email verification

### Form Endpoints
- RSVP: `https://formspree.io/f/YOUR_RSVP_FORM_ID`
- Newsletter: `https://formspree.io/f/YOUR_NEWSLETTER_FORM_ID`

## Deployment

### To Deploy Changes:
```bash
git add .
git commit -m "Description of changes"
git push
```

GitHub Pages automatically deploys from the `main` branch within 1-2 minutes.

### Local Preview:
Simply open `index.html` in a browser. Forms won't work locally until Formspree is configured.

## Common Updates

### Update Event Information
Edit the `.event-banner` section (lines ~433-438)

### Add/Remove Sections
Each section follows this structure:
```html
<section id="section-name">
    <h2>Section Title</h2>
    <p>Content here</p>
</section>
```

### Modify Contact Information
Update the `.contact-grid` cards (lines ~540-559)

### Change Logo
Replace `logo.png` in root directory (current: 206KB PNG)

## Repository Structure
```
/
├── index.html          # Main website file
├── logo.png           # Bookstore logo
└── CLAUDE.md          # This file
```

## Business Details
- **Name:** The Wandering Lantern
- **Tagline:** "Follow the light, find the wonder"
- **Location:** 15729 Madison Ave, Lakewood, OH 44107
- **Email:** thewanderinglanterncle@gmail.com
- **Instagram:** @thewanderinglanterncle
