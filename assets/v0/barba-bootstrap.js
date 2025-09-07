/* =========================
   PAGE SCRIPTS (per Barba container)
========================= */
function initPageScripts(container) {
  const cleanups = [];
  cleanups.push(initSplitChars(container));
  cleanups.push(initHomeHero(container));
  cleanups.push(initProjectPlayer(container));
  return () => cleanups.forEach((fn) => fn && fn());
}

/* =========================
   BOOTSTRAP (with barba.init)
========================= */
document.addEventListener("DOMContentLoaded", () => {
  try { initCursor() } catch(e) {}

  barba.init({
    transitions: [
      {
        name: "default",

        async once({ next }) {
          // first load
          next.container.__cleanup = initPageScripts(next.container);
        },

        async leave({ current }) {
          // cleanup before removing old container
          if (current.container.__cleanup) {
            current.container.__cleanup();
            delete current.container.__cleanup;
          }
        },

        async enter({ next }) {
          // init scripts for new container
          next.container.__cleanup = initPageScripts(next.container);
        },
      },
    ],
  });
});
