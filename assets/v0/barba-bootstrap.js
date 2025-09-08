
/* ========= Helpers ========= */
function ensureCurtain() {
  let wrap = document.querySelector(".curtain_wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.className = "curtain_wrap";
    wrap.innerHTML = `
      <div class="curtain_panel curtain_panel--top"></div>
      <div class="curtain_panel curtain_panel--bottom"></div>
    `;
    document.body.appendChild(wrap);
    console.log("[Curtain] created");
  }
  const top = wrap.querySelector(".curtain_panel--top");
  const bottom = wrap.querySelector(".curtain_panel--bottom");
  gsap.set(top,    { yPercent: -100 });
  gsap.set(bottom, { yPercent:  100 });
  return { wrap, top, bottom };
}

function lockScroll(lock) {
  document.documentElement.style.overflow = lock ? "hidden" : "";
  document.body.style.overflow = lock ? "hidden" : "";
}

/* ========= Page scripts (per container) ========= */
function initPageScripts(container) {
  const cleanups = [];
  try { cleanups.push(initSplitChars?.(container)); } catch(e){ console.warn("[initSplitChars] failed", e); }
  try { cleanups.push(initHomeHero?.(container)); }  catch(e){ console.warn("[initHomeHero] failed", e); }
  try { cleanups.push(initProjectPlayer?.(container)); } catch(e){ console.warn("[initProjectPlayer] failed", e); }
  return () => {
    cleanups.forEach(fn => { try { fn && fn(); } catch(e){ console.warn("[cleanup] error", e); } });
  };
}

/* ========= Barba + Curtain ========= */
document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  try { initCursor?.(); } catch(e) { console.warn("[Cursor] init error", e); }

  const curtain = ensureCurtain();

  // Extra logging to catch Barba lifecycle issues
  try {
    barba.hooks.before((data) => console.log("[Barba] before", data.trigger));
    barba.hooks.leave((data)  => console.log("[Barba] hook leave", data.current?.namespace));
    barba.hooks.enter((data)  => console.log("[Barba] hook enter", data.next?.namespace));
    barba.hooks.after(() => console.log("[Barba] after"));
  } catch(e) {
    console.warn("[Barba] hooks not available (is barba loaded?)", e);
  }

  barba.init({
    transitions: [{
      name: "curtain-close-open",

      once({ next }) {
        const main = next.container;
        main.__cleanup = initPageScripts(main);
        gsap.set(main, { opacity: 1 });
        gsap.set(curtain.top,    { yPercent: -100 });
        gsap.set(curtain.bottom, { yPercent:  100 });
        console.log("[Barba] once() complete");
      },

      // Close over CURRENT page
      leave({ current }) {
        if (prefersReducedMotion) return Promise.resolve();
        console.log("[Curtain] closing");
        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
          onComplete: () => {
            try {
              current?.container?.__cleanup?.();
              delete current?.container?.__cleanup;
            } catch(e){ console.warn("[leave cleanup] error", e); }
          }
        });

        // Start from open state, then close to meet in middle
        tl.set(curtain.top,    { yPercent: -100 }, 0);
        tl.set(curtain.bottom, { yPercent:  100 }, 0);
        lockScroll(true);
        tl.to([curtain.top, curtain.bottom], { yPercent: 0, duration: 0.45 }, 0);

        return tl;
      },

      // Stack, init new page behind closed curtain, then open
      enter({ current, next }) {
        console.log("[Curtain] opening & swapping");
        const oldMain = current.container;
        const newMain = next.container;

        // Absolute stack (your existing pattern)
        Object.assign(oldMain.style, { position:"absolute", inset:"0", zIndex:"1" });
        Object.assign(newMain.style, { position:"absolute", inset:"0", zIndex:"2" });

        // Init new page while covered
        newMain.__cleanup = initPageScripts(newMain);
        gsap.set(newMain, { opacity: 1 });

        const tl = gsap.timeline({
          onComplete: () => {
            // Reset new page & remove old
            newMain.style.position = ""; newMain.style.inset = ""; newMain.style.zIndex = "";
            if (oldMain && oldMain.parentNode) oldMain.remove();

            // Re-open (off-screen) & unlock scroll
            gsap.set(curtain.top,    { yPercent: -100 });
            gsap.set(curtain.bottom, { yPercent:  100 });
            lockScroll(false);

            window.scrollTo(0, 0);
            console.log("[Curtain] done");
          }
        });

        if (!prefersReducedMotion) {
          tl.to(curtain.top,    { yPercent: -100, duration: 0.55, ease: "power3.inOut" }, 0);
          tl.to(curtain.bottom, { yPercent:  100, duration: 0.55, ease: "power3.inOut" }, 0.02);
        }

        return tl;
      }
    }]
  });

  // Make sure first container is initialized (no transition)
  const first = document.querySelector('[data-barba="container"]');
  if (first && !first.__cleanup) first.__cleanup = initPageScripts(first);

  // Optional: press "C" to test curtains without navigating
  window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "c") {
      const tl = gsap.timeline();
      tl.set([curtain.top, curtain.bottom], { yPercent: (i)=> i===0 ? -100 : 100 });
      tl.to([curtain.top, curtain.bottom], { yPercent: 0, duration: 0.4, ease: "power3.out" })
        .to(curtain.top,    { yPercent: -100, duration: 0.5, ease: "power3.inOut" }, "+=0.05")
        .to(curtain.bottom, { yPercent:  100, duration: 0.5, ease: "power3.inOut" }, "<+0.02");
    }
  });
});

