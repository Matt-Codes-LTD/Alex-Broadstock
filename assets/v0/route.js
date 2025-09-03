(function () {
  if (!window.barba) return;

  // Overlay for the smooth fade (no CSS file needed)
  var overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed", inset: "0", background: "var(--_theme---background, #000)",
    pointerEvents: "none", opacity: "0", zIndex: "9999", transition: "opacity .28s ease"
  });
  document.addEventListener("DOMContentLoaded", function(){ document.body.appendChild(overlay); });

  function fadeIn(){ overlay.style.opacity = "1"; return new Promise(r=>setTimeout(r, 300)); }
  function fadeOut(){ overlay.style.opacity = "0"; return new Promise(r=>setTimeout(r, 280)); }

  // Pause any HTML5 videos inside a container
  function pauseVideos(root){
    root && root.querySelectorAll("video").forEach(function(v){ try{ v.pause(); }catch(_){} });
  }

  // Re-init your page scripts after each swap.
  // We emit a custom event your scripts can listen for.
  function reinit(container){
    var ev = new CustomEvent("page:enter", { detail: { container: container } });
    document.dispatchEvent(ev);
  }

  // Don’t hijack external or hash links, or links you mark with data-no-barba
  function shouldPrevent(data){
    var el = data && data.el;
    if (!el || !el.href) return true;
    if (el.hasAttribute("data-no-barba")) return true;
    if (el.target && el.target !== "_self") return true;
    if (el.origin !== location.origin) return true;
    if (el.getAttribute("href").indexOf("#") > -1) return true;
    return false;
  }

  barba.init({
    preventRunning: true,
    timeout: 7000,
    // Only intercept internal, non-hash links
    prevent: shouldPrevent,
    transitions: [{
      name: "fade-overlay",
      async leave(data) {
        pauseVideos(data.current.container);
        await fadeIn();
      },
      async enter(data) {
        // Reset scroll and re-init scripts for new markup
        try { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); } catch(_) { window.scrollTo(0,0); }
        reinit(data.next.container);
        await fadeOut();
      }
    }]
  });

  // Optional: simple prefetch on hover for snappier nav
  document.addEventListener("mouseover", function(e){
    var a = e.target.closest && e.target.closest('a[href^="/"]:not([data-no-barba])');
    if (!a || a.origin !== location.origin) return;
    var url = a.href;
    if (document.querySelector('link[rel="prefetch"][href="'+url+'"]')) return;
    var l = document.createElement("link"); l.rel="prefetch"; l.href=url; l.as="document";
    document.head.appendChild(l);
  }, { passive: true });

})();
