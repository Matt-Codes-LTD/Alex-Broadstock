// https://alex-static-cdn.b-cdn.net/assets/live/v0/split-character-text.js
(function () {
  function preconnect(e) {
    try {
      const { origin } = new URL(e, location.href);
      const head = document.head;
      const exists = [...head.querySelectorAll('link[rel="preconnect"],link[rel="dns-prefetch"]')]
        .some(l => (l.href || '').startsWith(origin));
      if (!exists) {
        const p = document.createElement('link');
        p.rel = 'preconnect'; p.href = origin; p.crossOrigin = 'anonymous'; head.appendChild(p);
        const d = document.createElement('link');
        d.rel = 'dns-prefetch'; d.href = origin; head.appendChild(d);
      }
    } catch {}
  }

  // This warms teaser videos & handles text-state on hover/focus for the Home hero
  function SplitCharsInit(container) {
    const root = (container || document).querySelector('.home-hero_wrap');
    if (!root || root.dataset.simpleWarmInit) return;
    root.dataset.simpleWarmInit = '1';

    let warmedSrc = null;
    async function warm(src) {
      if (!src || src === warmedSrc) return;
      warmedSrc = src;
      try {
        const v = document.createElement('video');
        v.src = src; v.muted = true; v.playsInline = true; v.preload = 'auto'; v.crossOrigin = 'anonymous';
        await new Promise(res => {
          const done = () => res();
          v.addEventListener('loadeddata', done, { once: true });
          v.addEventListener('canplaythrough', done, { once: true });
          v.addEventListener('error', done, { once: true });
          setTimeout(done, 2500);
        });
        const p = v.play?.();
        if (p && p.then) await p.catch(() => {});
        setTimeout(() => { try { v.pause(); } catch {} }, 30);
      } catch {}
    }

    function setTextState(item) {
      root.querySelectorAll('.home-hero_link .home_hero_text, .home-hero_link .home-category_ref_text')
        .forEach(el => el.classList.add('u-color-faded'));
      if (item) {
        item.querySelectorAll('.home_hero_text, .home-category_ref_text')
          .forEach(el => el.classList.remove('u-color-faded'));
      }
    }

    root.addEventListener('pointerover', (ev) => {
      const item = ev.target.closest?.('.home-hero_link');
      if (!item) return;
      const src = item.getAttribute('data-video-main') || item.getAttribute('data-video');
      if (src) { preconnect(src); warm(src); }
      setTextState(item);
    }, { passive: true });

    root.addEventListener('focusin', (ev) => {
      const item = ev.target.closest?.('.home-hero_link');
      if (!item) return;
      const src = item.getAttribute('data-video-main') || item.getAttribute('data-video');
      if (src) { preconnect(src); warm(src); }
      setTextState(item);
    });

    const current = root.querySelector('.home-hero_link[aria-current="true"]') || root.querySelector('.home-hero_link');
    if (current) setTextState(current);
  }

  window.SplitCharsInit = SplitCharsInit;
})();
