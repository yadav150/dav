(function() {
  'use strict';

  // --- Ripple Effect ---
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn');
    if (!btn) return;

    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';

    btn.appendChild(ripple);

    // Remove after animation ends
    ripple.addEventListener('animationend', function() {
      ripple.remove();
    });
  });

  // --- Scroll Fade (IntersectionObserver) ---
  const fadeElements = document.querySelectorAll('.fade-el');
  if (fadeElements.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        } else {
          // Optionally remove class to fade out when leaving viewport (optional)
          // entry.target.classList.remove('visible');
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    fadeElements.forEach(function(el) {
      observer.observe(el);
    });
  }

  // --- Hamburger Menu ---
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');

  if (hamburger && navLinks) {
    // Set initial aria-expanded
    hamburger.setAttribute('aria-expanded', 'false');

    function toggleMenu(expanded) {
      const isOpen = expanded !== undefined ? expanded : navLinks.classList.contains('open');
      if (expanded !== undefined) {
        if (expanded) {
          navLinks.classList.add('open');
          hamburger.classList.add('active');
          hamburger.setAttribute('aria-expanded', 'true');
        } else {
          navLinks.classList.remove('open');
          hamburger.classList.remove('active');
          hamburger.setAttribute('aria-expanded', 'false');
        }
      } else {
        // Toggle
        navLinks.classList.toggle('open');
        hamburger.classList.toggle('active');
        const nowOpen = navLinks.classList.contains('open');
        hamburger.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
      }
    }

    hamburger.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleMenu();
    });

    // Close menu when a nav link is clicked (on mobile)
    navLinks.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
          toggleMenu(false);
        }
      });
    });

    // Close menu when clicking outside (optional)
    document.addEventListener('click', function(e) {
      if (window.innerWidth <= 768) {
        const header = document.querySelector('header');
        if (header && !header.contains(e.target) && navLinks.classList.contains('open')) {
          toggleMenu(false);
        }
      }
    });

    // Handle resize: if screen becomes larger than 768px, ensure menu is open (visible)
    window.addEventListener('resize', function() {
      if (window.innerWidth > 768 && navLinks.classList.contains('open')) {
        // Keep it open but we want the CSS to handle visibility via media query
        // We'll just ensure the classes are consistent: no need to toggle, but we can remove open class to avoid conflict
        // Actually the CSS uses .open only for mobile; on desktop the nav is always visible.
        // But to be safe, we remove the open class so it doesn't interfere with desktop display.
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

})();
