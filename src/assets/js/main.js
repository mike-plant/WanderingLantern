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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initStickyBars(); // Homepage-specific sticky tagline bar
    initContactForm();
    initEventRegistrationRedirect(); // Event form redirects
    initGATracking(); // Google Analytics event tracking
});
