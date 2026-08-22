// Sticky bars on scroll (desktop only, all pages except forms)
function initStickyBars() {
    const taglineBar = document.getElementById('tagline-bar');
    const infoBar = document.querySelector('.info-bar');
    const nav = document.querySelector('nav');

    // Only run if all bars exist
    if (!taglineBar || !infoBar || !nav) return;

    // Check if mobile
    function isMobile() {
        return window.innerWidth <= 768;
    }

    // Only apply on desktop
    if (!isMobile()) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;

            // Show sticky tagline bar after scrolling 300px (or past hero if it exists)
            const hero = document.getElementById('hero');
            const triggerPoint = hero ? hero.offsetHeight * 0.5 : 300;

            if (scrolled > triggerPoint) {
                taglineBar.classList.add('visible');
                infoBar.classList.add('under-tagline');
                nav.classList.add('under-bars');
            } else {
                taglineBar.classList.remove('visible');
                infoBar.classList.remove('under-tagline');
                nav.classList.remove('under-bars');
            }
        });
    }
}

// Handle contact form submission with Mailchimp integration
function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async function(e) {
        const newsletterCheckbox = document.getElementById('newsletter');

        // If newsletter is checked, also submit to Mailchimp
        if (newsletterCheckbox && newsletterCheckbox.checked) {
            const email = document.getElementById('email').value;
            const name = document.getElementById('name').value;

            // Create form data for Mailchimp
            const mailchimpData = new FormData();
            mailchimpData.append('EMAIL', email);
            mailchimpData.append('FNAME', name.split(' ')[0]); // First name
            if (name.split(' ').length > 1) {
                mailchimpData.append('LNAME', name.split(' ').slice(1).join(' ')); // Last name
            }
            mailchimpData.append('tags', '3728681'); // Contact Us Optin tag

            // Submit to Mailchimp (non-blocking)
            fetch('https://thewanderinglantern.us3.list-manage.com/subscribe/post?u=f5535995545a29ebbdc6de523&id=f1915b185f&f_id=0089a2e0f0', {
                method: 'POST',
                mode: 'no-cors',
                body: mailchimpData
            }).catch(() => {
                // Silent fail - form will still submit to Formspree
            });
        }

        // Let the form submit normally to Formspree
    });
}

// Handle Mailchimp event registration forms redirect
function initEventRegistrationRedirect() {
    const eventForm = document.getElementById('mc-embedded-subscribe-form');
    if (!eventForm) return;

    const redirectUrl = eventForm.getAttribute('data-redirect');
    if (!redirectUrl) return;

    eventForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(eventForm);

        // Submit to Mailchimp
        fetch(eventForm.action, {
            method: 'POST',
            body: formData,
            mode: 'no-cors'
        }).then(() => {
            // Redirect after successful submission
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 500);
        }).catch(() => {
            // Even on error, redirect (no-cors mode doesn't report actual errors)
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 500);
        });
    });
}

// Events page: List / Grid view toggle with GA tracking
function initEventsViewToggle() {
    const container = document.querySelector('.events-view-container');
    const buttons = document.querySelectorAll('.view-btn');
    if (!container || !buttons.length) return;

    // Default to 'list', restore saved preference
    const savedView = localStorage.getItem('eventsView') || 'list';
    applyView(savedView);

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            applyView(view);
            localStorage.setItem('eventsView', view);
            if (typeof gtag !== 'undefined') {
                gtag('event', 'events_view_toggle', {
                    event_category: 'engagement',
                    event_label: view
                });
            }
        });
    });

    // Track which view is active when a card is clicked
    document.querySelectorAll('.event-card-link').forEach(link => {
        link.addEventListener('click', () => {
            const activeView = container.dataset.view || 'list';
            if (typeof gtag !== 'undefined') {
                gtag('event', 'event_card_click', {
                    event_category: 'engagement',
                    event_label: activeView
                });
            }
        });
    });

    function applyView(view) {
        container.dataset.view = view;
        buttons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
    }
}

// Google Analytics Event Tracking
function initGATracking() {
    // Track CTA button clicks
    const ctaButtons = document.querySelectorAll('.cta-button, .primary-cta, .secondary-cta, .secondary-outline');
    ctaButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const buttonText = e.target.textContent.trim();
            const buttonHref = e.target.getAttribute('href');

            if (typeof gtag !== 'undefined') {
                gtag('event', 'cta_click', {
                    'event_category': 'engagement',
                    'event_label': buttonText,
                    'value': buttonHref
                });
            }
        });
    });

    // Track contact form submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', () => {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'form_submission', {
                    'event_category': 'engagement',
                    'event_label': 'contact_form'
                });
            }
        });
    }

    // Track event registration form submission
    const eventForm = document.getElementById('mc-embedded-subscribe-form');
    if (eventForm) {
        eventForm.addEventListener('submit', () => {
            const eventTitle = document.querySelector('h1')?.textContent || 'unknown_event';
            if (typeof gtag !== 'undefined') {
                gtag('event', 'event_registration', {
                    'event_category': 'conversion',
                    'event_label': eventTitle
                });
            }
        });
    }

    // Track newsletter signups
    const newsletterButtons = document.querySelectorAll('a[href*="signup"]');
    newsletterButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'newsletter_click', {
                    'event_category': 'engagement',
                    'event_label': 'newsletter_signup_link'
                });
            }
        });
    });
}

// Homepage promo modal — shows once per session, expires after the event date
function initPromoModal() {
    const modal = document.getElementById('promo-modal');
    if (!modal) return;

    // Auto-hide after April 25, 2026
    if (new Date() >= new Date('2026-04-26T00:00:00')) return;

    // Show once per browser session
    if (sessionStorage.getItem('promoModalSeen')) return;

    setTimeout(() => {
        modal.classList.add('active');
        sessionStorage.setItem('promoModalSeen', '1');
    }, 700);

    modal.querySelector('.promo-modal-close').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') modal.classList.remove('active');
    });
}

// ---------------------------------------------------------------------------
// Reservations page: photo gallery lightbox
// ---------------------------------------------------------------------------
// The gallery only renders when photos exist in src/_data/reservationPhotos.json,
// so every function here exits quietly on pages without it.
function initReservationGallery() {
    const lightbox = document.getElementById('res-lightbox');
    const items = Array.from(document.querySelectorAll('.res-gallery-item'));
    if (!lightbox || !items.length) return;

    const imgEl = document.getElementById('res-lightbox-img');
    const captionEl = document.getElementById('res-lightbox-caption');
    const prevBtn = lightbox.querySelector('.res-lightbox-prev');
    const nextBtn = lightbox.querySelector('.res-lightbox-next');

    // Only show the arrows when there is somewhere to go.
    const multiple = items.length > 1;
    prevBtn.hidden = !multiple;
    nextBtn.hidden = !multiple;

    let current = 0;
    let lastFocused = null;

    const photos = items.map(item => {
        const img = item.querySelector('img');
        return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt') || '',
            caption: item.dataset.galleryCaption || ''
        };
    });

    function show(index) {
        current = (index + photos.length) % photos.length;
        const photo = photos[current];
        imgEl.setAttribute('src', photo.src);
        imgEl.setAttribute('alt', photo.alt);
        captionEl.textContent = photo.caption;
    }

    function open(index) {
        lastFocused = document.activeElement;
        show(index);
        lightbox.hidden = false;
        document.body.style.overflow = 'hidden';
        (multiple ? nextBtn : lightbox.querySelector('.res-lightbox-close')).focus();

        if (typeof gtag !== 'undefined') {
            gtag('event', 'gallery_open', {
                'event_category': 'engagement',
                'event_label': photos[current].caption || photos[current].alt
            });
        }
    }

    function close() {
        lightbox.hidden = true;
        document.body.style.overflow = '';
        // Clear the source so a large photo isn't held in memory while hidden.
        imgEl.setAttribute('src', '');
        if (lastFocused) lastFocused.focus();
    }

    items.forEach((item, index) => {
        item.addEventListener('click', () => open(index));
    });

    prevBtn.addEventListener('click', () => show(current - 1));
    nextBtn.addEventListener('click', () => show(current + 1));

    lightbox.querySelectorAll('[data-lightbox-close]').forEach(el => {
        el.addEventListener('click', close);
    });

    document.addEventListener('keydown', (e) => {
        if (lightbox.hidden) return;
        if (e.key === 'Escape') close();
        if (multiple && e.key === 'ArrowLeft') show(current - 1);
        if (multiple && e.key === 'ArrowRight') show(current + 1);
    });

    // Swipe between photos on touch devices.
    let touchStartX = null;
    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
        if (touchStartX === null || !multiple) return;
        const delta = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(delta) > 50) show(current + (delta < 0 ? 1 : -1));
        touchStartX = null;
    }, { passive: true });
}

// ---------------------------------------------------------------------------
// Reservations page: sticky mobile CTA
// ---------------------------------------------------------------------------
// Appears once the hero has scrolled away, hides again once the inquiry form
// is on screen so it never covers the thing it is pointing at.
function initReservationStickyCta() {
    const bar = document.getElementById('res-sticky-cta');
    const hero = document.querySelector('.res-hero');
    const form = document.getElementById('inquiry-form');
    if (!bar || !hero) return;

    let heroPassed = false;
    let formVisible = false;

    const update = () => {
        const shouldShow = heroPassed && !formVisible;
        bar.classList.toggle('is-visible', shouldShow);
        bar.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
    };

    if (!('IntersectionObserver' in window)) return;

    new IntersectionObserver(([entry]) => {
        heroPassed = !entry.isIntersecting;
        update();
    }, { threshold: 0 }).observe(hero);

    if (form) {
        new IntersectionObserver(([entry]) => {
            formVisible = entry.isIntersecting;
            update();
        }, { threshold: 0 }).observe(form);
    }
}

// ---------------------------------------------------------------------------
// Reservations page: inquiry form behavior + conversion tracking
// ---------------------------------------------------------------------------
function initReservationForm() {
    const form = document.getElementById('reservation-form');
    if (!form) return;

    // Name the inbound email after the sender so the inbox is scannable.
    form.addEventListener('submit', () => {
        const name = document.getElementById('name').value.trim();
        const subject = document.getElementById('rental-subject');
        if (name && subject) {
            subject.value = 'Event Space Rental Inquiry from ' + name + ' - The Wandering Lantern';
        }

        // Guard against double submission on slow connections.
        form.setAttribute('data-submitting', 'true');

        if (typeof gtag !== 'undefined') {
            gtag('event', 'reservation_inquiry', {
                'event_category': 'conversion',
                'event_label': document.getElementById('package').value || 'undecided',
                'event_type': document.getElementById('event-type').value || 'unspecified',
                'guest_count': document.getElementById('guest-count').value || ''
            });
        }
    });

    // Report how far down the page people get before giving up. Knowing whether
    // visitors bail before the packages or before the form is the difference
    // between a copy problem and a pricing problem.
    const marks = [25, 50, 75, 100];
    const fired = new Set();
    let ticking = false;

    const checkDepth = () => {
        const doc = document.documentElement;
        const scrollable = doc.scrollHeight - window.innerHeight;
        if (scrollable <= 0) return;
        const pct = Math.round((window.scrollY / scrollable) * 100);

        marks.forEach(mark => {
            if (pct >= mark && !fired.has(mark)) {
                fired.add(mark);
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'reservation_scroll_depth', {
                        'event_category': 'engagement',
                        'event_label': mark + '%',
                        'value': mark
                    });
                }
            }
        });
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(checkDepth);
        }
    }, { passive: true });
}

// ---------------------------------------------------------------------------
// Generic click tracking for any element carrying a data-ga label
// ---------------------------------------------------------------------------
function initDataGaTracking() {
    document.querySelectorAll('[data-ga]').forEach(el => {
        el.addEventListener('click', () => {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'cta_click', {
                    'event_category': 'engagement',
                    'event_label': el.dataset.ga,
                    'page_path': window.location.pathname
                });
            }
        });
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initStickyBars(); // Homepage-specific sticky tagline bar
    initContactForm();
    initEventRegistrationRedirect(); // Event form redirects
    initEventsViewToggle(); // Events page list/grid toggle
    initGATracking(); // Google Analytics event tracking
    initPromoModal(); // Homepage promo modal (expires after event date)
    initReservationGallery(); // Reservations photo gallery + lightbox
    initReservationStickyCta(); // Reservations sticky mobile CTA
    initReservationForm(); // Reservations inquiry form + conversion tracking
    initDataGaTracking(); // Click tracking for [data-ga] elements
});
