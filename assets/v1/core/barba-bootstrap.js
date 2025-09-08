import { initPageScripts, initGlobal } from "./page-scripts.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("[Barba] init starting…");

  initGlobal();

  barba.init({
    transitions: [
      {
        name: "dramatic-crossfade",

        /* First load */
        once({ next }) {
          const main = next.container;
          main.__cleanup = initPageScripts(main);
          gsap.set(main, { opacity: 1, scale: 1, rotate: 0, y: 0, filter: "blur(0px)" });
        },

        /* Leave */
        leave({ current, next }) {
          console.log(`[Barba] leave() from: ${current.namespace} → to: ${next.namespace}`);
          if (current?.container?.__cleanup) {
            current.container.__cleanup();
            delete current.container.__cleanup;
          }
          return Promise.resolve();
        },

        /* Enter */
        enter({ current, next }) {
          console.log(`[Barba] enter() from: ${current.namespace} → to: ${next.namespace}`);

          const oldMain = current.container;
          const newMain = next.container;
          newMain.__cleanup = initPageScripts(newMain);

          // Stack containers
          Object.assign(oldMain.style, { position: "absolute", inset: "0", zIndex: "1" });
          Object.assign(newMain.style, { position: "absolute", inset: "0", zIndex: "2" });

          // Starting state
          gsap.set(newMain, {
            opacity: 0, scale: 1.15, rotate: 3, y: 50,
            filter: "blur(20px)", transformOrigin: "50% 50%",
          });

          const tl = gsap.timeline({
            defaults: { ease: "power4.inOut" },
            onComplete: () => {
              // Reset
              newMain.style.position = "";
              newMain.style.inset = "";
              newMain.style.zIndex = "";
              if (oldMain && oldMain.parentNode) oldMain.remove();
              window.scrollTo(0, 0);
            },
          });

          // Old page exit
          tl.to(oldMain, {
            opacity: 0, scale: 0.9, rotate: -5, y: -60,
            filter: "blur(20px)", duration: 0.9,
          }, 0);

          // New page enter
          tl.to(newMain, {
            opacity: 1, scale: 1, rotate: 0, y: 0,
            filter: "blur(0px)", duration: 1.2,
          }, "-=0.6");

          return tl;
        },
      },
    ],
  });
});
