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
//  "Explore More Tools" - Full Width, Responsive, 4 Cards
//  Parent container spans full content width
// ============================================================
(function() {
    'use strict';

    // ----- Tool List (SVG icons, short names) -----
    var tools = [
        {
            name: 'Age',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#1a5c3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
            path: '/dav/tools/age-calculator/index.html'
        },
        {
            name: 'SIP',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#1a5c3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
            path: '/dav/tools/sip-calculator/index.html'
        },
        {
            name: 'PDF',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#1a5c3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>',
            path: '/dav/tools/pdf-editor/index.html'
        },
        {
            name: 'Image',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#1a5c3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
            path: '/dav/tools/image-resizer/index.html'
        },
        {
            name: 'Text',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#1a5c3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
            path: '/dav/tools/text-counter/index.html'
        },
        {
            name: 'Unit',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#1a5c3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
            path: '/dav/tools/unit-converter/index.html'
        },
        {
            name: 'Pass',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#1a5c3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
            path: '/dav/tools/password-generator/index.html'
        },
        {
            name: 'QR',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#1a5c3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><line x1="14" y1="14" x2="14" y2="21"/><line x1="17" y1="14" x2="17" y2="21"/><line x1="14" y1="17" x2="21" y2="17"/></svg>',
            path: '/dav/tools/qr-generator/index.html'
        },
        {
            name: 'GST',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#1a5c3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
            path: '/dav/tools/gst-calculator/index.html'
        },
        {
            name: 'Base',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#1a5c3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
            path: '/dav/tools/number-converter/index.html'
        },
        {
            name: 'Percent',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#1a5c3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><line x1="5" y1="5" x2="19" y2="19"/></svg>',
            path: '/dav/tools/percentage-calculator/index.html'
        },
        {
            name: 'BMI',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#1a5c3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16v12H4z"/><line x1="8" y1="6" x2="8" y2="18"/><line x1="12" y1="6" x2="12" y2="18"/><line x1="16" y1="6" x2="16" y2="18"/></svg>',
            path: '/dav/tools/bmi-calculator/index.html'
        },
        {
            name: 'Loan',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#1a5c3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
            path: '/dav/tools/loan-calculator/index.html'
        },
        {
            name: 'Access',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#1a5c3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
            path: '/dav/tools/accessibility-tool/index.html'
        }
    ];

    // ----- Get current page path -----
    function getCurrentPath() {
        return window.location.pathname;
    }

    // ----- Get 4 random tools excluding current -----
    function getRandomTools(currentPath, count) {
        var available = tools.filter(function(t) {
            return t.path !== currentPath;
        });

        if (available.length <= count) return available;

        // Shuffle
        var shuffled = available.slice();
        for (var i = shuffled.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = temp;
        }
        return shuffled.slice(0, count);
    }

    // ----- Build HTML -----
    function buildMoreToolsHTML() {
        var currentPath = getCurrentPath();

        // Only show on tool pages
        if (currentPath.indexOf('/tools/') === -1) return null;

        var randomTools = getRandomTools(currentPath, 4);
        if (randomTools.length === 0) return null;

        var html = '';
        html += '<div class="spacer" style="height:24px;"></div>';

        // SECTION - full width, matches your site's container
        html += '<section class="section tools-section more-tools-section" style="max-width:1200px;margin:0 auto;padding:0 16px;display:block;width:100%;box-sizing:border-box;">';

        // BLACK TITLE BAR - spans full container width
        html += '  <div class="section-title-bar more-tools-title" style="background:#1e1e1e;padding:6px 18px;border-radius:8px 8px 0 0;display:block;width:100%;box-sizing:border-box;">';
        html += '    <h2 style="color:#fff;font-size:1.1rem;font-weight:600;margin:0;letter-spacing:-0.2px;">Explore More Tools</h2>';
        html += '  </div>';

        // WHITE BODY - spans full container width
        html += '  <div class="section-body" style="border-radius:0 0 8px 8px;padding:16px 16px;display:block;width:100%;box-sizing:border-box;background:#fff;border:1px solid #e6e6e6;border-top:0;">';

        // GRID - full width, responsive, auto-fill
        html += '    <div class="more-tools-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(140px, 1fr));gap:12px;width:100%;box-sizing:border-box;">';

        for (var i = 0; i < randomTools.length; i++) {
            var tool = randomTools[i];
            html += '      <a href="' + tool.path + '" class="more-tool-card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fff;border:1px solid #e6e6e6;border-radius:8px;padding:16px 10px;transition:border-color .15s,background .15s,transform .15s,box-shadow .15s;cursor:pointer;color:#1e1e1e;text-decoration:none;min-height:82px;text-align:center;width:100%;box-sizing:border-box;">';
            html += '        <span style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;margin-bottom:4px;">' + tool.icon + '</span>';
            html += '        <span style="font-weight:600;font-size:.85rem;color:#1a5c3a;letter-spacing:-0.2px;">' + tool.name + '</span>';
            html += '      </a>';
        }

        html += '    </div>';
        html += '  </div>';
        html += '</section>';
        html += '<div class="spacer"></div>';

        return html;
    }

    // ----- Insert before footer -----
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

        // Hover effects
        var cards = document.querySelectorAll('.more-tool-card');
        cards.forEach(function(card) {
            card.addEventListener('mouseenter', function() {
                this.style.borderColor = '#1a5c3a';
                this.style.background = '#f4f8f6';
                this.style.transform = 'translateY(-3px)';
                this.style.boxShadow = '0 6px 16px rgba(0,0,0,0.10)';
            });
            card.addEventListener('mouseleave', function() {
                this.style.borderColor = '#e6e6e6';
                this.style.background = '#fff';
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            });
        });

        // Fade-in on scroll
        var section = document.querySelector('.more-tools-section');
        if (section) {
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            var observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
            observer.observe(section);
        }
    }

    // ----- Run when page is ready -----
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', insertMoreTools);
    } else {
        insertMoreTools();
    }

})();
(function(){'use strict';var t=document.getElementById('themeToggle');if(!t)return;var s=sessionStorage.getItem('theme');if(s==='dark'){document.body.classList.add('dark-mode')}t.addEventListener('click',function(){document.body.classList.toggle('dark-mode');var n=document.body.classList.contains('dark-mode');if(n){sessionStorage.setItem('theme','dark')}else{sessionStorage.removeItem('theme')}});})();
// ===== DYNAMIC TOOL NAME IN NAVBAR =====
(function() {
    'use strict';

    var path = window.location.pathname;
    if (path.indexOf('/tools/') === -1) return;

    var toolName = '';
    var title = document.title;
    var match = title.match(/^(.*?)\s*·\s*Yadav Web Tools$/);
    if (match) {
        toolName = match[1].trim();
    } else {
        var parts = path.split('/');
        for (var i = 0; i < parts.length; i++) {
            if (parts[i] === 'tools' && i + 1 < parts.length) {
                var folder = parts[i + 1];
                toolName = folder.replace(/-/g, ' ')
                    .replace(/\b\w/g, function(l) { return l.toUpperCase(); });
                break;
            }
        }
    }

    if (!toolName) return;

    var navList = document.querySelector('.nav-list');
    if (!navList) return;

    var allLinks = navList.querySelectorAll('a');
    allLinks.forEach(function(link) {
        link.removeAttribute('aria-current');
    });

    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = '#';
    a.textContent = toolName;
    a.setAttribute('aria-current', 'page');
    a.style.cursor = 'default';
    a.style.pointerEvents = 'none';
    li.appendChild(a);
    navList.appendChild(li);

})();
