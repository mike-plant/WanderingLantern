# Creating a Printable Monthly Events Page

## Creating a Printable Monthly Events Page

### 1. Create the Template File

Create a new file: `src/events-print.njk`

### 2. Add the Complete Template Code

```njk
---
permalink: /events-print/
---

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monthly Events - The Wandering Lantern</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Libre+Baskerville:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --warm-brown: #8b6f47;
            --deep-brown: #5c4d3c;
            --aged-gold: #c9a961;
            --muted-gold: #a38b5f;
            --cream: #faf7f0;
            --parchment: #f5eedc;
            --dark-text: #3a2f27;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background: white;
            font-family: 'Libre Baskerville', 'Georgia', serif;
            color: var(--dark-text);
        }

        @media print {
            .no-print {
                display: none !important;
            }
            body {
                background: white !important;
            }
            .print-page {
                max-width: 100% !important;
                margin: 0 !important;
                padding: 8mm !important;
            }
            @page {
                size: letter;
                margin: 8mm;
            }
            /* Moderate scaling for two-column layout */
            .print-page {
                transform: scale(0.85);
                transform-origin: top center;
            }
            /* Minimize all spacing */
            .print-header {
                padding-bottom: 0.5rem !important;
                margin-bottom: 0.75rem !important;
                border-bottom-width: 1px !important;
            }
            #events-container {
                gap: 1.25rem !important;
            }

            .print-event {
                padding: 0.85rem !important;
                border-width: 1px !important;
            }
            .print-event-title {
                font-size: 1.1rem !important;
                margin-bottom: 0.25rem !important;
            }
            .print-event-meta {
                padding: 0.4rem 0.6rem !important;
                margin-bottom: 0.4rem !important;
                font-size: 0.85rem !important;
                line-height: 1.4 !important;
            }
            .print-event-description {
                font-size: 0.8rem !important;
                line-height: 1.4 !important;
                margin-top: 0.25rem !important;
            }
            .print-footer {
                margin-top: 1rem !important;
                padding-top: 1rem !important;
                border-top-width: 1px !important;
            }
            .footer-branding h2 {
                font-size: 1.2rem !important;
                margin-bottom: 0.1rem !important;
            }
            .footer-branding .tagline {
                font-size: 0.8rem !important;
                margin-bottom: 0.25rem !important;
            }
            .footer-info {
                font-size: 0.75rem !important;
                line-height: 1.4 !important;
            }
            .footer-right {
                gap: 0.5rem !important;
            }
            .qr-main-section {
                padding: 0.75rem !important;
                border-width: 1px !important;
            }
            .qr-main-section img {
                width: 100px !important;
                height: 100px !important;
                margin-bottom: 0.5rem !important;
            }
            .qr-main-label {
                font-size: 0.9rem !important;
            }
            .month-highlight {
                font-size: 1.5rem !important;
                padding: 0.5rem 1.5rem !important;
                margin-bottom: 0.5rem !important;
            }
            .social-item img {
                width: 40px !important;
                height: 40px !important;
            }
            .footer-social {
                gap: 0.5rem !important;
            }
            .social-item {
                font-size: 0.7rem !important;
            }
        }

        .print-page {
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.5in;
            background: white;
        }

        .print-header {
            text-align: center;
            padding-bottom: 2rem;
            margin-bottom: 5rem;
            border-bottom: 2px solid var(--aged-gold);
        }

        .month-highlight {
            color: var(--deep-brown);
            display: inline-block;
            padding: 0.5rem 0;
            font-family: 'Playfair Display', serif;
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 1rem;
        }

        #events-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
        }

        .print-event {
            margin-bottom: 0;
            padding: 1.25rem;
            border: 2px solid var(--aged-gold);
            border-radius: 8px;
            page-break-inside: avoid;
            background: var(--cream);
        }

        .print-event-title {
            font-family: 'Playfair Display', serif;
            color: var(--deep-brown);
            font-size: 1.5rem;
            margin: 0 0 0.5rem 0;
        }

        .print-event-meta {
            background: var(--aged-gold);
            color: white;
            padding: 0.75rem 1rem;
            margin-bottom: 0.75rem;
            border-radius: 4px;
            font-size: 1rem;
            line-height: 1.6;
        }

        .print-event-meta div {
            margin-bottom: 0.25rem;
        }

        .print-event-meta div:last-child {
            margin-bottom: 0;
        }

        .print-event-meta strong {
            color: white;
            font-weight: bold;
        }

        .print-event-description {
            color: var(--dark-text);
            line-height: 1.6;
            font-size: 0.95rem;
            margin-top: 0.5rem;
        }

        .qr-main-section {
            text-align: center;
            padding: 1rem;
            background: var(--cream);
            border: 2px solid var(--aged-gold);
            border-radius: 8px;
        }

        .qr-main-section img {
            width: 150px;
            height: 150px;
            border: 3px solid var(--aged-gold);
            padding: 0.5rem;
            background: white;
            margin: 0 auto 0.75rem auto;
        }

        .qr-main-label {
            font-family: 'Playfair Display', serif;
            font-size: 1.2rem;
            color: var(--deep-brown);
            font-weight: bold;
            max-width: 250px;
            margin: 0 auto;
            line-height: 1.3;
        }

        .print-footer {
            margin-top: 5rem;
            padding-top: 1.5rem;
            padding-bottom: 1.5rem;
            border-top: 2px solid var(--aged-gold);
            border-bottom: 2px solid var(--aged-gold);
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }

        .footer-left {
            flex: 1;
        }

        .footer-branding h2 {
            font-family: 'Playfair Display', serif;
            color: var(--deep-brown);
            font-size: 1.8rem;
            margin-bottom: 0.25rem;
        }

        .footer-branding .tagline {
            color: var(--warm-brown);
            font-style: italic;
            font-size: 1rem;
            margin-bottom: 0.5rem;
        }

        .footer-info {
            color: var(--dark-text);
            font-size: 0.95rem;
            line-height: 1.6;
        }

        .footer-right {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            align-items: flex-end;
        }

        .footer-social {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            align-items: flex-start;
        }

        .social-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.85rem;
            color: var(--dark-text);
        }

        .social-item img {
            width: 60px;
            height: 60px;
            border: 2px solid var(--aged-gold);
            padding: 0.25rem;
            background: white;
        }

        .social-info {
            text-align: left;
        }

        .social-label {
            font-weight: bold;
            color: var(--deep-brown);
            display: block;
            margin-bottom: 0.125rem;
        }

        .social-url {
            color: var(--warm-brown);
            font-size: 0.8rem;
        }

        .no-events-message {
            text-align: center;
            padding: 3rem;
            color: var(--warm-brown);
            font-style: italic;
            font-size: 1.1rem;
        }

        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--aged-gold);
            color: white;
            border: none;
            padding: 1rem 2rem;
            font-size: 1rem;
            border-radius: 8px;
            cursor: pointer;
            font-family: 'Playfair Display', serif;
            font-weight: bold;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1000;
        }

        .print-button:hover {
            background: var(--warm-brown);
        }

        .hidden {
            display: none;
        }
    </style>
</head>
<body>

    <button class="print-button no-print" onclick="window.print()">🖨️ Print This Page</button>

    <div class="print-page">
        <div class="print-header">
            <div class="month-highlight" id="current-month"></div>
        </div>

        <div id="events-container">
            {% for event in collections.upcomingEvents %}
                <div class="print-event" data-event-date="{{ event.data.date | date('YYYY-MM-DD') }}">
                    <h2 class="print-event-title">{{ event.data.title }}</h2>
                    <div class="print-event-meta">
                        <div><strong>Date:</strong> {{ event.data.date | date('MMMM D, YYYY') }}</div>
                        {% if event.data.time %}
                        <div><strong>Time:</strong> {{ event.data.time }}</div>
                        {% endif %}
                        {% if event.data.ageRange %}
                        <div><strong>Ages:</strong> {{ event.data.ageRange }}</div>
                        {% endif %}
                    </div>
                    <p class="print-event-description">{{ event.data.excerpt }}</p>
                </div>
            {% endfor %}
        </div>

        <div id="no-events-message" class="no-events-message hidden">
            No events scheduled for this month. Check back soon for upcoming events!
        </div>

        <div class="qr-main-section" id="qr-section">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://thewanderinglantern.com/events/" alt="Events QR">
            <div class="qr-main-label">VIEW ALL OUR EVENTS & REGISTER ONLINE</div>
        </div>

        <div class="print-footer">
            <div class="footer-left">
                <div class="footer-branding">
                    <h2>The Wandering Lantern</h2>
                    <div class="tagline">"Follow the light, find the wonder"</div>
                </div>
                <div class="footer-info">
                    15729 Madison Ave, Lakewood, OH 44107<br>
                    (216) 999-4462<br>
                    hello@thewanderinglantern.com
                </div>
            </div>
            <div class="footer-right">
                <div class="footer-social">
                    <div class="social-item">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=https://www.instagram.com/thewanderinglanterncle/" alt="Instagram QR">
                        <div class="social-info">
                            <span class="social-label">INSTAGRAM</span>
                            <span class="social-url">@thewanderinglanterncle</span>
                        </div>
                    </div>
                    <div class="social-item">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=http://www.facebook.com/thewanderinglantern" alt="Facebook QR">
                        <div class="social-info">
                            <span class="social-label">FACEBOOK</span>
                            <span class="social-url">@thewanderinglantern</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Display current month/year in header
        const now = new Date();
        const monthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        document.getElementById('current-month').textContent = monthYear;

        // Filter events to show only current month
        const currentMonth = now.getMonth(); // 0-11 (January = 0)
        const currentYear = now.getFullYear();

        const eventElements = document.querySelectorAll('.print-event');
        let visibleCount = 0;

        eventElements.forEach((eventEl) => {
            const dateStr = eventEl.getAttribute('data-event-date');

            if (!dateStr) {
                eventEl.style.display = 'none';
                return;
            }

            // Parse the date string (YYYY-MM-DD format)
            const parts = dateStr.split('-');
            const eventYear = parseInt(parts[0]);
            const eventMonth = parseInt(parts[1]); // This is 1-12, not 0-indexed

            // Compare month (1-12) and year directly
            if (eventMonth === (currentMonth + 1) && eventYear === currentYear) {
                eventEl.style.display = 'block';
                visibleCount++;
            } else {
                eventEl.style.display = 'none';
            }
        });

        // Show "no events" message if no events this month
        if (visibleCount === 0) {
            document.getElementById('no-events-message').classList.remove('hidden');
        }

        // Make QR section part of grid if odd number of events
        const qrSection = document.getElementById('qr-section');
        if (visibleCount % 2 !== 0) {
            // Odd number - add QR to grid
            const container = document.getElementById('events-container');
            container.appendChild(qrSection);
        }
    </script>
</body>
</html>
```

### 3. Update `.eleventy.js` Date Filter

Ensure your `.eleventy.js` file has the YYYY-MM-DD date format case. Add this to the date filter function (around line 176-177):

```javascript
case 'YYYY-MM-DD':
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
```

### 4. Build and View

```bash
npm run build
npm run dev
```

Visit: `http://localhost:8080/events-print/`

### Key Features

- **Automatic Month Filtering**: JavaScript filters events to show only the current month
- **Two-Column Grid Layout**: Events display in a responsive grid
- **Dynamic QR Placement**: Main QR code becomes a grid item when there's an odd number of events
- **Print Optimized**: `@media print` rules scale to 85% for one-page printing
- **Gold Highlighting**: Date/time info boxes use aged-gold background with white text
- **Social QR Codes**: Instagram and Facebook QR codes stack vertically in footer
- **Generous Spacing**: 5rem spacing above and below events container

### Customization Points

- Update business info in footer section
- Change QR code URLs for events, Instagram, Facebook
- Adjust color variables in `:root`
- Modify spacing in print media queries to fit more/fewer events
- Change grid gap and padding to adjust density
