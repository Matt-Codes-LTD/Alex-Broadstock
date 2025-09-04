// barba.js — global router/orchestrator
(function () {
  if (window.__barbaInit) return;
  window.__barbaInit = true;

  function initPage(containerOrDoc) {
    const el = containerOrDoc.querySelector
      ? containerOrDoc
      : document;

    const container =
      el.matches?.('[data-barba="container"]') ? el :
      el.querySelector?.('[data-barba="container"]') || document;

    const ns = container.dataset.barbaNamespace || "";

    // Page-specific modules
    if (ns === "home") {
      window.App?.splitChars?.init(container);
      window.App?.home?.init(container);
    } else if (ns === "project") {
      window.App?.project?.init(container);
    }

    // Optional: re-run Webflow IX2 if you use interactions
    try {
      if (window.Webflow && window.Webflow.require) {
        const ix2 = window.Webflow.require("ix2");
        ix2 && ix2.init();
      }
    } catch {}
  }

  function destroyPage(container) {
    const ns = container?.dataset?.barbaNamespace || "";
    if (ns === "home") {
      window.App?.home?.destroy(container);
      // splitChars has no-op destroy (scoped listeners are removed with node)
    } else if (ns === "project") {
      window.App?.project?.destroy(container);
    }
  }

  function onReady() {
    // Run once on first paint (direct load)
    initPage(document);

    barba.init({
      preventRunning: true,
      timeout: 7000,
      transitions: [
        {
          name: "fade",
          async leave({ current }) {
            destroyPage(current.container);
            await gsap.to(current.container, { autoAlpha: 0, duration: 0.28, ease: "power1.out" });
          },
          async enter({ next }) {
            window.scrollTo(0, 0);
            gsap.set(next.container, { autoAlpha: 0 });
            initPage(next.container);
            await gsap.to(next.container, { autoAlpha: 1, duration: 0.28, ease: "power1.out" });
          }
        }
      ]
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }
})();
