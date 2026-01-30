/* ============================================
   GO TOOLLY - MAIN JAVASCRIPT
   ============================================ */

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
    initAccordions();
    initTabs();
    normalizeRootPaths();
    setActiveNavLink();
    initCopyButtons();
    initFileInputs();
    initTooltips();
});

// Mobile Menu Toggle
function initMobileMenu() {
    const menuButton = document.querySelector('.mobile-menu-button');
    const mobileMenu = document.querySelector('#mobile-menu') || document.querySelector('.mobile-menu');

    if (menuButton && mobileMenu) {
        // Ensure ARIA attributes have sensible defaults
        if (!menuButton.hasAttribute('aria-expanded')) menuButton.setAttribute('aria-expanded', 'false');
        if (!mobileMenu.hasAttribute('aria-hidden')) mobileMenu.setAttribute('aria-hidden', 'true');

        menuButton.addEventListener('click', function() {
            const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
            const willOpen = !isExpanded;

            // Toggle visual state
            menuButton.setAttribute('aria-expanded', willOpen.toString());
            mobileMenu.classList.toggle('active');
            mobileMenu.setAttribute('aria-hidden', (!willOpen).toString());

            // Toggle visual icon (☰ ⇄ ✕)
            const iconSpan = menuButton.querySelector('span[aria-hidden]');
            if (iconSpan) {
                iconSpan.textContent = willOpen ? '✕' : '☰';
            }

            // Move focus into the menu when opening
            if (willOpen) {
                const firstLink = mobileMenu.querySelector('a, button');
                if (firstLink) firstLink.focus();
            } else {
                menuButton.focus();
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!mobileMenu.contains(event.target) && !menuButton.contains(event.target)) {
                mobileMenu.classList.remove('active');
                menuButton.setAttribute('aria-expanded', 'false');
                mobileMenu.setAttribute('aria-hidden', 'true');
                const iconSpan = menuButton.querySelector('span[aria-hidden]');
                if (iconSpan) iconSpan.textContent = '☰';
            }
        });

        // Close on Escape key and restore focus to the toggle
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' || e.key === 'Esc') {
                if (mobileMenu.classList.contains('active')) {
                    mobileMenu.classList.remove('active');
                    menuButton.setAttribute('aria-expanded', 'false');
                    mobileMenu.setAttribute('aria-hidden', 'true');
                    const iconSpan = menuButton.querySelector('span[aria-hidden]');
                    if (iconSpan) iconSpan.textContent = '☰';
                    menuButton.focus();
                }
            }
        });
    }
}

// Accordion Functionality
function initAccordions() {
    const accordionHeaders = document.querySelectorAll('.accordion-header, .faq-question');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const isActive = this.classList.contains('active');
            const content = this.nextElementSibling;
            
            // Close all accordion items in the same group
            const parent = this.closest('.accordion, .faq-section');
            if (parent) {
                const allHeaders = parent.querySelectorAll('.accordion-header, .faq-question');
                const allContents = parent.querySelectorAll('.accordion-content, .faq-answer');
                
                allHeaders.forEach(h => h.classList.remove('active'));
                allContents.forEach(c => {
                    c.classList.remove('active');
                    c.style.maxHeight = null;
                });
            }
            
            // Open clicked item if it wasn't active
            if (!isActive) {
                this.classList.add('active');
                content.classList.add('active');
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        });
    });
}

// Tab Functionality
function initTabs() {
    const tabContainers = document.querySelectorAll('.tabs');
    
    tabContainers.forEach(container => {
        const tabButtons = container.querySelectorAll('.tab-button');
        const tabPanels = container.parentElement.querySelectorAll('.tab-panel');
        
        tabButtons.forEach((button, index) => {
            button.addEventListener('click', function() {
                // Update active button
                tabButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Show corresponding panel
                tabPanels.forEach(panel => panel.classList.remove('active'));
                if (tabPanels[index]) {
                    tabPanels[index].classList.add('active');
                }
            });
        });
    });
}

// Set Active Navigation Link
function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const normalizedCurrent = currentPath.replace(/^\/gotoolly\.com/, '');
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkPathRaw = link.getAttribute('href');
        const linkPath = (linkPathRaw || '').replace(/^\/gotoolly\.com/, '');
        if (normalizedCurrent === linkPath || 
            (normalizedCurrent.startsWith('/tools/') && linkPath === '/tools/index.html') ||
            (normalizedCurrent.startsWith('/guides/') && linkPath === '/guides/index.html')) {
            link.classList.add('active');
        }
    });
}

// Fix root-absolute paths for project GitHub Pages (prefix '/')
function normalizeRootPaths() {
    try {
        const repoBase = '';

        // Anchor tags
        document.querySelectorAll('a[href^="/"]').forEach(el => {
            const href = el.getAttribute('href');
            if (!href) return;
            if (href.startsWith('//') || href.startsWith('/')) return;
            // Ensure root single slash ('/') maps to '/'
            el.setAttribute('href', href === '/' ? repoBase + '/' : repoBase + href);
        });

        // Elements with src attributes (images, scripts)
        document.querySelectorAll('[src^="/"]').forEach(el => {
            const src = el.getAttribute('src');
            if (!src) return;
            if (src.startsWith('//') || src.startsWith('/')) return;
            el.setAttribute('src', repoBase + src);
        });

        // Link tags (css, manifest)
        document.querySelectorAll('link[href^="/"]').forEach(el => {
            const h = el.getAttribute('href');
            if (!h) return;
            if (h.startsWith('//') || h.startsWith('/')) return;
            el.setAttribute('href', repoBase + h);
        });
    } catch (err) {
        console.warn('normalizeRootPaths failed:', err);
    }
}

// Copy to Clipboard
function initCopyButtons() {
    const copyButtons = document.querySelectorAll('[data-copy-target]');
    
    copyButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const targetId = this.getAttribute('data-copy-target');
            const targetElement = document.querySelector(targetId);
            
            if (!targetElement) return;
            
            const textToCopy = targetElement.textContent || targetElement.value;
            
            try {
                await navigator.clipboard.writeText(textToCopy);
                
                // Visual feedback
                const originalText = this.textContent;
                this.textContent = 'Copied!';
                this.classList.add('btn-success');
                
                setTimeout(() => {
                    this.textContent = originalText;
                    this.classList.remove('btn-success');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
                // Fallback for older browsers
                targetElement.select();
                document.execCommand('copy');
            }
        });
    });
}

// File Input Handling
function initFileInputs() {
    const fileInputs = document.querySelectorAll('.file-input');
    
    fileInputs.forEach(input => {
        const label = input.nextElementSibling;
        const preview = document.querySelector(`[data-preview="${input.id}"]`);
        
        input.addEventListener('change', function(e) {
            const file = this.files[0];
            if (!file) return;
            
            // Update label text
            if (label) {
                const fileName = file.name.length > 20 
                    ? file.name.substring(0, 20) + '...' 
                    : file.name;
                label.innerHTML = `<span>${fileName}</span>`;
            }
            
            // Show preview if applicable
            if (preview && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.innerHTML = `<img src="${e.target.result}" class="image-preview" alt="Preview" height="300">`;
                    preview.classList.add('has-content');
                };
                reader.readAsDataURL(file);
            }
        });
    });
}

// Simple Tooltips
function initTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            const tooltipText = this.getAttribute('data-tooltip');
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = tooltipText;
            tooltip.style.cssText = `
                position: absolute;
                background: var(--color-gray-800);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 1000;
                white-space: nowrap;
                pointer-events: none;
            `;
            
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.top = (rect.top - tooltip.offsetHeight - 8) + 'px';
            tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
            
            this._tooltip = tooltip;
        });
        
        element.addEventListener('mouseleave', function() {
            if (this._tooltip) {
                this._tooltip.remove();
                delete this._tooltip;
            }
        });
    });
}

// Format File Size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Debounce Function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle Function
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Show Notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Mobile debug & safe-display helper (temporary / remove after fix)
(function enableMobileToolDebug() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    console.log('🚨 MOBILE DEBUG MODE ENABLED');

    function showToolStatus(msg, type = 'info') {
        let el = document.getElementById('mobile-debug-status');
        if (!el) {
            el = document.createElement('div');
            el.id = 'mobile-debug-status';
            el.style = 'position:fixed;bottom:12px;left:12px;right:12px;padding:10px;border-radius:8px;background:#111;color:#fff;z-index:99999;font-size:14px;';
            document.body.appendChild(el);
        }
        el.textContent = msg;
        el.style.background = type === 'error' ? '#b91c1c' : '#111';
        setTimeout(() => { if (el) el.remove(); }, type === 'error' ? 8000 : 3000);
    }

    document.querySelectorAll('button[id^="generate"], button.generate, .btn-generate').forEach(btn => {
        btn.addEventListener('click', (e) => {
            setTimeout(() => {
                try {
                    const tool = btn.closest('.tool-interface, .tool-layout, .tool-page') || document;
                    const resultEl = tool.querySelector('#result-area, .result-area, .generated-content, .output, .results') || document.querySelector('#result-area, .result-area, .generated-content, .output, .results');

                    if (resultEl) {
                        resultEl.style.display = 'block';
                        resultEl.style.opacity = '1';
                        resultEl.style.visibility = 'visible';
                        resultEl.setAttribute('role', 'status');
                        resultEl.setAttribute('aria-live', 'polite');

                        const text = (resultEl.textContent || '').trim();
                        console.log('📱 resultEl found - content length:', text.length);
                        if (!text) {
                            showToolStatus('No content generated — check console for errors', 'error');
                            console.log('📱 lastToolError:', window.lastToolError || 'none');
                        } else {
                            resultEl.scrollIntoView({behavior:'smooth', block:'center'});
                            try { resultEl.focus(); } catch (e) {}
                        }
                    } else {
                        showToolStatus('No result container found', 'error');
                        console.warn('No result container found for generate button:', btn);
                    }
                } catch (err) {
                    console.error('Mobile debug wrapper error:', err);
                    showToolStatus('Error during generation (see console)', 'error');
                }
            }, 50);
        });
    });

    window.addEventListener('error', (ev) => {
        window.lastToolError = {message: ev.message, source: ev.filename, lineno: ev.lineno};
        console.error('Global error captured:', window.lastToolError);
    });
    window.addEventListener('unhandledrejection', (ev) => {
        window.lastToolError = {message: ev.reason?.message || String(ev.reason)};
        console.error('Unhandled rejection captured:', window.lastToolError);
    });
})();

// Generic post-generation guard: if a generate button was clicked and no visible output appears, show an inline message
(function addResultEmptyGuard() {
    document.querySelectorAll('button[id^="generate"], button.generate, .btn-generate').forEach(btn => {
        btn.addEventListener('click', () => {
            setTimeout(() => {
                try {
                    const tool = btn.closest('.tool-interface, .tool-layout, .tool-page') || document;
                    const resultEl = tool.querySelector('#result-area, .result-area, .generated-content, .output, .results');
                    const list = tool.querySelector('#keywords-list, .keywords-list');
                    const hasContent = resultEl && (resultEl.textContent || '').trim().length > 0;
                    if (resultEl && !hasContent) {
                        // show inline helper message
                        let help = tool.querySelector('.result-empty-help');
                        if (!help) {
                            help = document.createElement('div');
                            help.className = 'result-empty-help';
                            help.style.cssText = 'padding:10px;background:#fff4f4;border:1px solid #f8d7da;color:#721c24;border-radius:6px;margin-top:10px;';
                            help.textContent = 'No output was generated — try a slightly different input or check your browser console for errors.';
                            (resultEl || tool).appendChild(help);
                            setTimeout(() => help.remove(), 8000);
                        }
                    }
                } catch (e) {
                    // ignore
                }
            }, 350);
        });
    });
})();