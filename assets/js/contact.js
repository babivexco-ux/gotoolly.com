// Client-side contact form handler with simple rate limiting
class RateLimiter {
    constructor(maxRequests, timeWindow) {
        this.maxRequests = maxRequests; // maximum
        this.timeWindow = timeWindow; // Time window (milliseconds)
        this.requests = new Map(); // per-identifier storage
    }

    canMakeRequest(identifier) {
        const now = Date.now();
        const userRequests = this.requests.get(identifier) || [];

        // Remove old requests
        const validRequests = userRequests.filter(time => now - time < this.timeWindow);

        if (validRequests.length >= this.maxRequests) {
            this.requests.set(identifier, validRequests);
            return false; // Exceeding the limit
        }

        // Register a new request
        validRequests.push(now);
        this.requests.set(identifier, validRequests);
        return true;
    }

    getRemainingRequests(identifier) {
        const now = Date.now();
        const userRequests = this.requests.get(identifier) || [];
        const validRequests = userRequests.filter(time => now - time < this.timeWindow);
        return Math.max(0, this.maxRequests - validRequests.length);
    }
}

// Create a Rate Limiter (5 requests every 15 minutes per pseudo-IP)
const rateLimiter = new RateLimiter(5, 15 * 60 * 1000);

function getClientIdentifier() {
    // Approximate client identifier (not a real IP). Helps throttle repeated sends.
    return navigator.userAgent + '|' + navigator.language + '|' + screen.width + '|' + screen.height;
}

async function submitContactForm(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const statusEl = document.getElementById('contact-form-status');
    const originalText = submitBtn ? submitBtn.textContent : 'Send';

    // Honeypot check (server also enforces this)
    const honeypot = form.querySelector('input[name="website"]');
    if (honeypot && honeypot.value) {
        console.log('Bot detected via honeypot');
        if (statusEl) {
            statusEl.textContent = 'Message submitted.'; // silent success for bots
            statusEl.style.color = 'var(--color-text-light)';
        }
        return;
    }

    // Rate limit check
    const clientId = getClientIdentifier();
    if (!rateLimiter.canMakeRequest(clientId)) {
        const waitMsg = '⏳ Please wait before sending another message. You can send up to 5 messages every 15 minutes.';
        if (statusEl) {
            statusEl.textContent = waitMsg;
            statusEl.style.color = 'var(--color-danger)';
        } else {
            alert(waitMsg);
        }
        return;
    }

    if (submitBtn) {
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
    }

    // Collect form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
        const resp = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await resp.json().catch(() => ({}));

        if (resp.ok) {
            form.reset();
            if (statusEl) {
                statusEl.textContent = "Thank you! Your message was sent. We'll respond within 1-3 business days.";
                statusEl.style.color = 'var(--color-success)';
            } else {
                alert('✅ Message sent successfully! We will reply as soon as possible.');
            }
        } else {
            const errMsg = result.error || result.message || `Server responded with status ${resp.status}`;
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                statusEl.innerHTML = `<strong>Error:</strong> ${String(errMsg)} <br><small>Check /api/health and server logs.</small>`;
            } else {
                statusEl.textContent = 'An error occurred while sending your message. Please try again later.';
            }
            statusEl.style.color = 'var(--color-danger)';
            console.error('Contact API error:', resp.status, result);
        }
    } catch (err) {
        console.error('Network/CORS error while sending contact form:', err);
        if (statusEl) {
            statusEl.innerHTML = 'Network error — could not reach the contact API. Make sure the API server is running on the same origin.';
            statusEl.style.color = 'var(--color-danger)';
        } else {
            alert('❌ Network error — could not reach the contact API.');
        }
    } finally {
        if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
        // Log remaining quota for debugging
        console.log('Remaining messages:', rateLimiter.getRemainingRequests(clientId));
    }
}

// Initialize form behavior on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        // Add honeypot if not present
        if (!contactForm.querySelector('input[name="website"]')) {
            const honeypot = document.createElement('input');
            honeypot.type = 'text';
            honeypot.name = 'website';
            honeypot.style.position = 'absolute';
            honeypot.style.left = '-10000px';
            honeypot.setAttribute('aria-hidden', 'true');
            honeypot.tabIndex = -1;
            contactForm.appendChild(honeypot);
        }

        contactForm.addEventListener('submit', submitContactForm);
    }
});