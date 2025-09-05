/* =========================
   PAGE SCRIPTS (per Barba container)
========================= */
function initPageScripts(container) {
  const cleanups = [];
  cleanups.push(initSplitChars(container));
  cleanups.push(initHomeHero(container));
  cleanups.push(initProjectPlayer(container));
  return () => cleanups.forEach(fn => fn && fn());
}

/* =========================
   BARBA BOOTSTRAP
========================= */
document.addEventListener("DOMContentLoaded", ()=>{
  initCursor(); // global overlay (once)
  let activeCleanup = ()=>{};

  barba.init({
    transitions:[{
      name:"fade",
      leave({current}) { activeCleanup(); return gsap.to(current.container,{opacity:0,duration:0.3}); },
      enter({next})    { return gsap.from(next.container,{opacity:0,duration:0.3}); },
      afterEnter({next}) { activeCleanup = initPageScripts(next.container); }
    }]
  });

  const firstContainer = document.querySelector('[data-barba="container"]');
  activeCleanup = initPageScripts(firstContainer);
});
