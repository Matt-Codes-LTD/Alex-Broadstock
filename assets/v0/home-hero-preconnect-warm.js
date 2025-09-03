(() => {
  'use strict';

  const conn = navigator.connection || navigator.webkitConnection || navigator.mozConnection;
  const slowNet = !!conn && (['slow-2g','2g'].includes(conn.effectiveType) || conn.saveData === true);

  function preconnectOnce(url) {
    try {
      const { origin } = new URL(url, location.href);
      if (!origin) return;
      const key = 'pc:' + origin;
      if (sessionStorage.getItem(key) === '1') return;

      const head = document.head;
      const exists = [...head.querySelectorAll('link[rel="preconnect"],link[rel="dns-prefetch"]')]
        .some(l => (l.href || '').startsWith(origin));
      if (!exists) {
        const a = document.createElement('link'); a.rel='preconnect'; a.href=origin; a.crossOrigin='anonymous'; head.appendChild(a);
        const b = document.createElement('link'); b.rel='dns-prefetch'; b.href=origin; head.appendChild(b);
      }
      sessionStorage.setItem(key, '1');
    } catch(_) {}
  }

  // Always preconnect the static + video CDNs
  preconnectOnce('https://alex-static-cdn.b-cdn.net/');
  preconnectOnce('https://alexbroadstock.b-cdn.net/');

  function warmOnHover(root) {
    const section = (root || document).querySelector('.home-hero_wrap');
    if (!section || section.dataset.simpleWarmInit) return;
    section.dataset.simpleWarmInit = '1';

    let warmedUrl = null, warmedVideo = null;
    const warmBudget = slowNet ? 0 : 1; // one warm slot on normal, none on slow networks

    async function prime(url) {
      if (!url || url === warmedUrl || warmBudget <= 0) return;
      warmedUrl = url;
      try {
        const v = document.createElement('video');
        v.src = url; v.muted = true; v.playsInline = true; v.preload = 'auto'; v.crossOrigin = 'anonymous';
        await new Promise((res) => {
          const done = () => res();
          v.addEventListener('loadeddata', done, { once:true });
          v.addEventListener('canplaythrough', done, { once:true });
          v.addEventListener('error', done, { once:true });
          setTimeout(done, 1800);
        });
        const p = v.play?.(); if (p && p.then) await p.catch(()=>{});
        setTimeout(()=>{ try{ v.pause(); }catch(_){} }, 30);
        warmedVideo = v;
      } catch(_) {}
    }

    function getUrlFromEvent(e) {
      const a = e.target.closest?.('.home-hero_link'); if (!a) return '';
      return a.getAttribute('data-video-main') || a.getAttribute('data-video') || '';
    }

    section.addEventListener('pointerover', (e) => {
      const url = getUrlFromEvent(e);
      if (url) { preconnectOnce(url); prime(url); }
    }, { passive:true });

    section.addEventListener('focusin', (e) => {
      const url = getUrlFromEvent(e);
      if (url) { preconnectOnce(url); prime(url); }
    });
  }

  const boot = () => warmOnHover(document);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
