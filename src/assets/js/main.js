// Countdown Timer
function updateCountdown() {
    const openingDay = new Date('2025-11-29T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysLeft = Math.ceil((openingDay - today) / (1000 * 60 * 60 * 24));
    const countdownEl = document.getElementById('countdown');

    if (!countdownEl) return;

    if (daysLeft > 0) {
        countdownEl.textContent = daysLeft;
    } else if (daysLeft === 0) {
        countdownEl.textContent = 'TODAY!';
        countdownEl.style.fontSize = 'clamp(3rem, 7vw, 5rem)';
    } else {
        countdownEl.textContent = "We're Open!";
        countdownEl.style.fontSize = 'clamp(3rem, 7vw, 5rem)';
    }
}

// Sticky bars on scroll (desktop only)
function initStickyBars() {
    const hero = document.getElementById('hero');
    const taglineBar = document.getElementById('tagline-bar');
    const infoBar = document.querySelector('.info-bar');
    const nav = document.querySelector('nav');

    if (!hero || !taglineBar || !infoBar || !nav) return;

    // Check if mobile
    function isMobile() {
        return window.innerWidth <= 768;
    }

    // Only apply parallax on desktop
    if (!isMobile()) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const heroHeight = hero.offsetHeight;

            // Show sticky tagline bar after scrolling past hero
            if (scrolled > heroHeight * 0.5) {
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCountdown();
    // Update countdown daily (every 24 hours)
    setInterval(updateCountdown, 24 * 60 * 60 * 1000);

    initStickyBars();
    initContactForm();
});
