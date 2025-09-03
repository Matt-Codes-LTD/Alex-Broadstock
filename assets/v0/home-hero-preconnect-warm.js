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
        const a = document.createElement('link'); a.rel='preconnect'; a.href=origin; a.crossOrigin='anonymous'; head.appendChild(a);
        const b = document.createElement('link'); b.rel='dns-prefetch'; b.href=origin; head.appendChild(b);
      }
    } catch(_) {}
  }

  // Preconnect your video CDN immediately
  preconnectOnce('https://alexbroadstock.b-cdn.net/');

  // Warm first hovered hero link on the Home page
  function warmOnHover(root) {
    const section = (root || document).querySelector('.home-hero_wrap');
    if (!section || section.dataset.simpleWarmInit) return;
    section.dataset.simpleWarmInit = '1';

    let warmedUrl = null, warmedVideo = null;

    async function prime(url) {
      if (!url || url === warmedUrl) return;
      warmedUrl = url;
      try {
        const v = document.createElement('video');
        v.src = url; v.muted = true; v.playsInline = true; v.preload = 'auto'; v.crossOrigin = 'anonymous';
        await new Promise((res) => {
          const done = () => res();
          v.addEventListener('loadeddata', done, { once:true });
          v.addEventListener('canplaythrough', done, { once:true });
          v.addEventListener('error', done, { once:true });
          setTimeout(done, 2500);
        });
        const p = v.play?.(); if (p && p.then) await p.catch(()=>{});
        setTimeout(()=>{ try{ v.pause(); }catch(_){} }, 30);
        warmedVideo = v;
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

  const boot = () => warmOnHover(document);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
</script>
