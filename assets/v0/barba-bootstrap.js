
/* =========================
   Curtain helpers (global)
========================= */
function ensureCurtain() {
  let wrap = document.querySelector(".curtain_wrap");
  if (!wrap) {
    // In case HTML wasn't added to the document
    wrap = document.createElement("div");
    wrap.className = "curtain_wrap";
    wrap.innerHTML = `
      <div class="curtain_panel curtain_panel--top"></div>
      <div class="curtain_panel curtain_panel--bottom"></div>
    `;
    document.body.appendChild(wrap);
  }
  const top = wrap.querySelector(".curtain_panel--top");
  const bottom = wrap.querySelector(".curtain_panel--bottom");

  // Reset to the "open/hidden" state
  gsap.set(top, { yPercent: -100 });
  gsap.set(bottom, { yPercent: 100 });

  return { wrap, top, bottom };
}

function lockScroll(lock) {
  document.documentElement.style.overflow = lock ? "hidden" : "";
  document.body.style.overflow = lock ? "hidden" : "";
}

/* =========================
   PAGE SCRIPTS (per Barba container)
========================= */
function initPageScripts(container) {
  const cleanups = [];
  cleanups.push(initSplitChars?.(container));
  cleanups.push(initHomeHero?.(container));
  cleanups.push(initProjectPlayer?.(container));
  return () => cleanups.forEach((fn) => fn && fn());
}

/* =========================
   BARBA BOOTSTRAP with CURTAIN
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  try { initCursor?.(); } catch (e) { console.warn("[Cursor] init error", e); }

  const curtain = ensureCurtain();

  barba.init({
    transitions: [
      {
        name: "curtain-close-open",

        /* First load */
        once({ next }) {
          const main = next.container;
          main.__cleanup = initPageScripts(main);
          gsap.set(main, { opacity: 1 });
          // Ensure curtain is open/hidden
          gsap.set([curtain.top, curtain.bottom], { yPercent: (i) => (i === 0 ? -100 : 100) });
        },

        /* Leave: close the curtain over the CURRENT page */
        leave({ current }) {
          if (prefersReducedMotion) return Promise.resolve();
          const { top, bottom } = curtain;

          // Make sure we start from open
          gsap.set(top, { yPercent: -100 });
          gsap.set(bottom, { yPercent: 100 });

          // Prevent scroll during the blackout
          lockScroll(true);

          // Close to meet at 0%
          const tl = gsap.timeline();
          tl.to([top, bottom], {
            yPercent: 0,
            duration: 0.45,
            ease: "power3.out"
          }, 0);

          // Run per-page cleanup right at the end of leave
          tl.add(() => {
            if (current?.container?.__cleanup) {
              current.container.__cleanup();
              delete current.container.__cleanup;
            }
          });

          return tl;
        },

        /* Enter: stack containers, init the NEW page behind the closed curtain, then open */
        enter({ current, next }) {
          const oldMain = current.container;
          const newMain = next.container;

          // Stack containers (same as your current setup)
          oldMain.style.position = "absolute";
          oldMain.style.inset = "0";
          oldMain.style.zIndex = "1";

          newMain.style.position = "absolute";
          newMain.style.inset = "0";
          newMain.style.zIndex = "2";

          // Init new page while hidden by the closed curtain
          newMain.__cleanup = initPageScripts(newMain);

          // No fade needed—curtain covers the swap.
          gsap.set(newMain, { opacity: 1 });

          // Open curtain to reveal the new page
          const tl = gsap.timeline({
            onComplete: () => {
              // Reset new page inline styles, remove old page
              newMain.style.position = "";
              newMain.style.inset = "";
              newMain.style.zIndex = "";
              if (oldMain && oldMain.parentNode) oldMain.remove();

              // Return curtain to open/hidden state & re-enable scroll
              gsap.set(curtain.top, { yPercent: -100 });
              gsap.set(curtain.bottom, { yPercent: 100 });
              lockScroll(false);

              // Ensure we start at the top of the new page
              window.scrollTo(0, 0);
            }
          });

          if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
            tl.to(curtain.top,    { yPercent: -100, duration: 0.55, ease: "power3.inOut" }, 0);
            tl.to(curtain.bottom, { yPercent:  100, duration: 0.55, ease: "power3.inOut" }, 0.02); // tiny offset feels nice
          }

          return tl;
        }
      }
    ]
  });

  // Run page scripts for the very first container (no transition)
  const firstContainer = document.querySelector('[data-barba="container"]');
  if (firstContainer && !firstContainer.__cleanup) {
    firstContainer.__cleanup = initPageScripts(firstContainer);
  }
});

