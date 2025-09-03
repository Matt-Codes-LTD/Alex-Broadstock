/* route.js — Barba router + simple fade + rAF page:enter dispatch */
(function () {
  'use strict';
  if (window.__routerInit) return;
  window.__routerInit = true;

  // Fire page:enter after the new container is painted
  function fireEnter(container) {
    requestAnimationFrame(function () {
      document.dispatchEvent(
        new CustomEvent('page:enter', { detail: { container: container } })
      );
    });
  }

  // Decide when to let the browser handle navigation (prevent Barba)
  function shouldPrevent({ el }) {
    if (!el || !el.matches) return false;
    if (!el.matches('a')) return true; // not a link
    if (el.hasAttribute('target') || el.hasAttribute('download')) return true;
    var href = el.getAttribute('href') || '';
    if (!href) return true;
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return true;

    // External absolute URLs → prevent
    try {
      var u = new URL(href, location.href);
      if (u.origin !== location.origin) return true;
    } catch (_) {
      // If URL parsing fails, fall back to default link behaviour
      return true;
    }
    // Internal link → allow Barba
    return false;
  }

  // Optional: tiny fade helper (no CSS dependency)
  function fadeOut(el, ms) {
    if (!el) return Promise.resolve();
    el.style.willChange = 'opacity,transform';
    el.style.transition = 'opacity ' + ms + 'ms ease';
    el.style.opacity = '0';
    return new Promise(function (res) { setTimeout(res, ms); });
  }
  function fadeIn(el, ms) {
    if (!el) return;
    el.style.opacity = '0';
    el.style.transition = 'opacity ' + ms + 'ms ease';
    requestAnimationFrame(function () { el.style.opacity = '1'; });
    setTimeout(function () { el.style.transition = ''; el.style.willChange = ''; }, ms + 50);
  }

  // Initialize Barba
  barba.init({
    timeout: 8000,
    prevent: shouldPrevent,
    transitions: [{
      name: 'fade',
      once: function ({ next }) {
        // first page load
        fireEnter(next.container);
      },
      leave: function ({ current }) {
        // animate out the old container
        return fadeOut(current && current.container, 220);
      },
      enter: function ({ next }) {
        // animate in the new container, then notify scripts
        fadeIn(next && next.container, 220);
        fireEnter(next.container);
      }
    }]
  });

  // Optional: fix scroll to top on internal navs (Barba keeps scroll by default)
  barba.hooks.enter(function () {
    // Uncomment if you want to reset scroll on every page:
    // window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  });
})();
