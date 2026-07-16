/* global script.js – Yadav Web Tools */

(function() {
    'use strict';

    // ===== HAMBURGER NAV =====
    const hamburger = document.querySelector('.hamburger');
    const nav = document.getElementById('primary-nav');

    if (hamburger && nav) {
        // Close nav on outside click
        const closeNav = function(e) {
            if (nav.classList.contains('open') && !nav.contains(e.target) && !hamburger.contains(e.target)) {
                nav.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        };

        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            const isOpen = nav.classList.toggle('open');
            hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        document.addEventListener('click', closeNav);

        // Close nav on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && nav.classList.contains('open')) {
                nav.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
                hamburger.focus();
            }
        });

        // Close nav on link click (single-page nav)
        nav.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
                nav.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // ===== BUTTON RIPPLE =====
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    document.addEventListener('click', function(e) {
        // Only if reduced motion is not preferred
        if (prefersReducedMotion.matches) return;

        const btn = e.target.closest('.btn');
        if (!btn) return;

        // Prevent ripples on disabled buttons
        if (btn.disabled) return;

        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 0.6;
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';

        btn.appendChild(ripple);

        // Remove ripple after animation ends
        ripple.addEventListener('animationend', function() {
            ripple.remove();
        });
    });

    // ===== SCROLL REVEAL =====
    const revealElements = document.querySelectorAll('.reveal');

    if (revealElements.length > 0 && 'IntersectionObserver' in window) {
        // If reduced motion, just make all visible immediately
        if (prefersReducedMotion.matches) {
            revealElements.forEach(function(el) {
                el.classList.add('visible');
            });
        } else {
            const observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        // Optionally unobserve after reveal to improve performance
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -20px 0px'
            });

            revealElements.forEach(function(el) {
                observer.observe(el);
            });
        }
    } else {
        // Fallback: show all if no observer support
        revealElements.forEach(function(el) {
            el.classList.add('visible');
        });
    }

})();
// ============================================================
//  "Explore More Tools" - Auto Recommendation Module
//  Shows 4 random tool cards on every tool page
//  Black title bar, fade-in on scroll, 4-column grid
// ============================================================
(function() {
    'use strict';

    // ----- Tool List (Add new tools here) -----
    var tools = [
        {
            name: 'Age Calculator',
            desc: 'Calculate exact age in years, months and days',
            path: 'tools/age-calculator/index.html'
        },
        {
            name: 'SIP Calculator',
            desc: 'Plan your investments with our comprehensive SIP calculator',
            path: 'tools/sip-calculator/index.html'
        },
        {
            name: 'PDF Editor',
            desc: 'Reorder and delete pages from your PDF files',
            path: 'tools/pdf-editor/index.html'
        },
        {
            name: 'Image Resizer',
            desc: 'Resize, compress, and convert images to JPG format',
            path: 'tools/image-resizer/index.html'
        },
        {
            name: 'Text Counter',
            desc: 'Count characters, words, sentences and paragraphs',
            path: 'tools/text-counter/index.html'
        },
        {
            name: 'Unit Converter',
            desc: 'Convert length, mass, volume and temperature',
            path: 'tools/unit-converter/index.html'
        },
        {
            name: 'Password Generator',
            desc: 'Generate strong and secure random passwords',
            path: 'tools/password-generator/index.html'
        },
        {
            name: 'QR Generator',
            desc: 'Create QR codes from any text or URL',
            path: 'tools/qr-generator/index.html'
        },
        {
            name: 'GST Calculator',
            desc: 'Calculate GST amount, CGST/SGST or IGST breakdown',
            path: 'tools/gst-calculator/index.html'
        },
        {
            name: 'Number Converter',
            desc: 'Convert between binary, octal, decimal and hex',
            path: 'tools/number-converter/index.html'
        },
        {
            name: 'Percentage Calculator',
            desc: 'Calculate percentages quickly and accurately',
            path: 'tools/percentage-calculator/index.html'
        },
        {
            name: 'BMI Calculator',
            desc: 'Calculate body mass index from height and weight',
            path: 'tools/bmi-calculator/index.html'
        },
        {
            name: 'Loan Calculator',
            desc: 'Estimate monthly payments and total interest',
            path: 'tools/loan-calculator/index.html'
        },
        {
            name: 'Accessibility Tool',
            desc: 'Voice-to-text, font size controls, and contrast modes',
            path: 'tools/accessibility-tool/index.html'
        }
    ];

    // ----- Get current page path (excluding "dav/" prefix if any) -----
    function getCurrentPath() {
        var path = window.location.pathname.replace(/^\/+/, '');
        if (path.indexOf('dav/') === 0) {
            path = path.substring(4);
        }
        return path;
    }

    // ----- Get 4 random tools (excluding current page) -----
    function getRandomTools(currentPath, count) {
        var normalizedCurrent = currentPath.replace(/\/index\.html$/, '') + '/index.html';
        var available = tools.filter(function(t) {
            return t.path !== normalizedCurrent;
        });

        if (available.length <= count) {
            return available;
        }

        // Fisher-Yates shuffle
        var shuffled = available.slice();
        for (var i = shuffled.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = temp;
        }

        return shuffled.slice(0, count);
    }

    // ----- Build "Explore More Tools" HTML -----
    function buildMoreToolsHTML() {
        var currentPath = getCurrentPath();

        // Only show on tool pages (path contains "tools/")
        if (currentPath.indexOf('tools/') !== 0) {
            return null;
        }

        var randomTools = getRandomTools(currentPath, 4);

        if (randomTools.length === 0) {
            return null;
        }

        var html = '';
        // Add a spacer for proper separation from the tool area above
        html += '<div class="spacer" style="height:28px;"></div>';
        html += '<section class="section tools-section more-tools-section" aria-labelledby="more-tools-heading">';
        // Black title bar with reduced padding
        html += '    <div class="section-title-bar more-tools-title" style="background:#1e1e1e;padding:6px 18px;border-radius:8px 8px 0 0;">';
        html += '        <h2 id="more-tools-heading" style="color:#fff;font-size:1.1rem;font-weight:600;margin:0;letter-spacing:-0.2px;">Explore More Tools</h2>';
        html += '    </div>';
        html += '    <div class="section-body" style="border-radius:0 0 8px 8px;">';
        html += '        <div class="tools-grid" role="list" style="grid-template-columns:repeat(4,1fr);">';

        for (var i = 0; i < randomTools.length; i++) {
            var tool = randomTools[i];
            html += '            <a href="' + tool.path + '" class="tool-card" role="listitem">';
            html += '                <span class="tool-name">' + tool.name + '</span>';
            html += '                <span class="tool-desc">' + tool.desc + '</span>';
            html += '            </a>';
        }

        html += '        </div>';
        html += '    </div>';
        html += '</section>';
        html += '<div class="spacer"></div>';

        return html;
    }

    // ----- Insert "Explore More Tools" before footer -----
    function insertMoreTools() {
        var html = buildMoreToolsHTML();
        if (!html) return;

        var footer = document.querySelector('.site-footer');
        if (!footer) return;

        var temp = document.createElement('div');
        temp.innerHTML = html;

        while (temp.children.length > 0) {
            footer.parentNode.insertBefore(temp.children[0], footer);
        }

        // ----- Fade-in on scroll using Intersection Observer -----
        var moreSection = document.querySelector('.more-tools-section');
        if (moreSection) {
            // Start with opacity 0 and a slight translate
            moreSection.style.opacity = '0';
            moreSection.style.transform = 'translateY(20px)';
            moreSection.style.transition = 'opacity 0.7s ease, transform 0.7s ease';

            var observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.15,
                rootMargin: '0px 0px -50px 0px'
            });

            observer.observe(moreSection);
        }
    }

    // ----- Run when page is ready -----
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', insertMoreTools);
    } else {
        insertMoreTools();
    }

})();
