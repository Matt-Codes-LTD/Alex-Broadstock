/*! route.js — global router + page bootstrap (Barba 2.x) */
(function () {
  "use strict";
  if (window.__ROUTER_INIT__) return;
  window.__ROUTER_INIT__ = true;

  // --------- Guards ----------
  function hasBarba() { return !!(window.barba && barba.init); }
  // Skip Barba for targets that shouldn't be hijacked
  function shouldBypassLink(a) {
    if (!a) return true;
    const url = new URL(a.href, location.href);
    if (a.hasAttribute("download")) return true;
    if (a.target && a.target !== "_self") return true;
    if (url.origin !== location.origin) return true;
    if (a.hasAttribute("data-barba-prevent")) return true;
    if (a.getAttribute("href") === "#") return true;
    return false;
  }

  // --------- Tiny fade overlay (covers swaps) ----------
  const AppTransition = (() => {
    let el;
    const DUR = 280; // ms
    function ensure() {
      if (el && document.body.contains(el)) return el;
      el = document.createElement("div");
      el.style.cssText =
        "position:fixed;inset:0;background:var(--_theme---background,#000);" +
        "pointer-events:none;opacity:0;z-index:9999;transition:opacity .28s;";
      document.body.appendChild(el);
      return el;
    }
    function wait(ms) {
      return new Promise((r) => setTimeout(r, ms));
    }
    async function leave() {
      ensure();
      el.style.opacity = "1";
      await wait(DUR);
    }
    async function enter() {
      ensure();
      el.style.opacity = "0";
      await wait(DUR);
    }
    return { leave, enter };
  })();

  // --------- Page module dispatch ----------
  function runInitFor(container) {
    const ns = container?.dataset?.barbaNamespace;
    if (ns === "home")    { window.Pages?.home?.init(container); }
    if (ns === "project") { window.Pages?.project?.init(container); }
  }
  function runDestroyFor(container) {
    const ns = container?.dataset?.barbaNamespace;
    if (ns === "home")    { window.Pages?.home?.destroy?.(); }
    if (ns === "project") { window.Pages?.project?.destroy?.(); }
  }

  // --------- Barba setup ----------
  function initBarba() {
    // Defensive: Barba requires a single wrapper in the live DOM
    const wrappers = document.querySelectorAll('[data-barba="wrapper"]');
    if (wrappers.length > 1) {
      // Keep the first; detach extras to avoid undefined behavior
      for (let i = 1; i < wrappers.length; i++) wrappers[i].remove();
    }

    // Link hygiene: let Barba handle only internal same-origin links
    document.addEventListener(
      "click",
      (e) => {
        const a = e.target.closest("a");
        if (!a) return;
        if (shouldBypassLink(a)) return;
        // If link is an in-page hash on the same URL, let default happen
        const to = new URL(a.href, location.href);
        if (to.pathname === location.pathname && to.hash) return;
        // Otherwise allow Barba (no manual preventDefault here)
      },
      { passive: true }
    );

    barba.init({
      timeout: 8000,
      prevent: ({ el }) => shouldBypassLink(el),
      transitions: [
        {
          name: "fade-overlay",
          async leave({ current }) {
            // Kill page-specific stuff before the DOM is swapped
            runDestroyFor(current.container);
            await AppTransition.leave();
          },
          async enter({ next }) {
            // Scroll to top so videos paint consistently on new page
            window.scrollTo(0, 0);
            // Re-initialize the new page
            runInitFor(next.container);
            await AppTransition.enter();
          },
        },
      ],
    });

    // Keep things robust across all lifecycles
    barba.hooks.afterLeave(({ current }) => {
      // As an extra safety; destroy is already called in transition
      runDestroyFor(current.container);
    });

    barba.hooks.afterEnter(({ next }) => {
      // As an extra safety; init is already called in transition
      runInitFor(next.container);
    });
  }

  // --------- First hard load bootstrap ----------
  // Defer scripts run in order; DOMContentLoaded fires AFTER all <script defer>.
  // That means home.js / project.js (which define window.Pages) are ready here.
  function bootstrapOnce() {
    const c = document.querySelector('[data-barba="container"]');
    if (c) runInitFor(c);
  }

  // --------- Start ----------
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (hasBarba()) initBarba();
      bootstrapOnce();
    });
  } else {
    if (hasBarba()) initBarba();
    bootstrapOnce();
  }
})();
