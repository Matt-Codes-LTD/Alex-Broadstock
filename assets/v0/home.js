<script>
(() => {
  'use strict';

  function preconnectOnce(url) {
    try {
      const { origin } = new URL(url, location.href);
      const head = document.head;
      const exists = [...head.querySelectorAll('link[rel="preconnect"],link[rel="dns-prefetch"]')]
        .some(l => (l.href || '').startsWith(origin));
      if (!exists) {
        const a = document.createElement('link');
        a.rel = 'preconnect';
        a.href = origin;
        a.crossOrigin = 'anonymous';
        head.appendChild(a);
        const b = document.createElement('link');
        b.rel = 'dns-prefetch';
        b.href = origin;
        head.appendChild(b);
      }
    } catch(_) {}
  }

  // Force hero videos into instant-play mode
  function prepareHeroVideos() {
    document.querySelectorAll('.home-hero_video_el').forEach((v, i) => {
      v.muted = true;
      v.playsInline = true;
      v.setAttribute('preload', 'auto');
      v.crossOrigin = 'anonymous';

      // First video (or the active one) autoplays immediately
      if (v.classList.contains('is-active') || i === 0) {
        v.autoplay = true;
        const p = v.play?.();
        if (p && p.catch) p.catch(() => {});
      }
    });
  }

  // Warm on hover/focus for snappy switching
  function warmOnHover(root) {
    const section = (root || document).querySelector('.home-hero_wrap');
    if (!section || section.dataset.simpleWarmInit) return;
    section.dataset.simpleWarmInit = '1';

    let warmedUrl = null;

    async function prime(url) {
      if (!url || url === warmedUrl) return;
      warmedUrl = url;
      try {
        const v = document.createElement('video');
        v.src = url;
        v.muted = true;
        v.playsInline = true;
        v.preload = 'auto';
        v.crossOrigin = 'anonymous';
        await new Promise((res) => {
          const done = () => res();
          v.addEventListener('loadeddata', done, { once:true });
          v.addEventListener('canplaythrough', done, { once:true });
          v.addEventListener('error', done, { once:true });
          setTimeout(done, 2500);
        });
        const p = v.play?.(); if (p && p.then) await p.catch(()=>{});
        setTimeout(()=>{ try{ v.pause(); }catch(_){} }, 30);
      } catch(_) {}
    }

    section.addEventListener('pointerover', (e) => {
      const a = e.target.closest?.('.home-hero_link'); if (!a) return;
      const url = a.getAttribute('data-video-main') || a.getAttribute('data-video');
      if (url) { preconnectOnce(url); prime(url); }
    }, { passive:true });

    section.addEventListener('focusin', (e) => {
      const a = e.target.closest?.('.home-hero_link'); if (!a) return;
      const url = a.getAttribute('data-video-main') || a.getAttribute('data-video');
      if (url) { preconnectOnce(url); prime(url); }
    });
  }

  const boot = () => {
    prepareHeroVideos();
    warmOnHover(document);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
</script>
