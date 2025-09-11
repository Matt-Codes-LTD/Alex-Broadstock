export default function initSiteLoader(container) {
  const loaderEl = container.querySelector(".loader");
  if (!loaderEl || loaderEl.dataset.scriptInitialized) return () => {};
  loaderEl.dataset.scriptInitialized = "true";

  console.log("[SiteLoader] init");

  // Lock scroll during preload
  document.documentElement.classList.add("is-preloading");
  const lock = document.createElement("style");
  lock.textContent = `html.is-preloading, html.is-preloading body { overflow:hidden!important }`;
  document.head.appendChild(lock);

  // CustomEase setup
  if (window.CustomEase && !gsap.parseEase("hop")) {
    window.CustomEase.create("hop", "0.68, -0.55, 0.265, 1.55");
  }

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Minimum display time to prevent loader from disappearing too quickly
  const minDisplayTime = 2000; // 2 seconds minimum
  const startTime = Date.now();

  // Reset initial states
  gsap.set(loaderEl, { pointerEvents: "all", display: "block" });
  gsap.set("#word-1 h1", { y: "-120%" });
  gsap.set("#word-2 h1", { y: "120%" });
  gsap.set(".block", { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" });

  const tl = gsap.timeline({
    delay: 1.5, // Short delay before animation starts
    defaults: { ease: "hop" },
    onComplete: () => {
      // Ensure minimum display time
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDisplayTime - elapsed);
      
      setTimeout(() => {
        // Smooth backdrop filter fade before hiding loader
        gsap.to(loaderEl.querySelector(".overlay"), {
          backdropFilter: "blur(0px)",
          webkitBackdropFilter: "blur(0px)",
          duration: 0.4,
          ease: "power2.out",
          onComplete: () => {
            loaderEl.style.pointerEvents = "none";
            loaderEl.style.display = "none";
            document.documentElement.classList.remove("is-preloading");
            lock.remove();
            console.log("[SiteLoader] done");
          }
        });
      }, remaining);
    },
  });

  // Apply reduced motion if user prefers it
  if (prefersReducedMotion) {
    tl.timeScale(10); // Much faster for users who prefer reduced motion
  }

  // === WORDS IN ===
  tl.to(
    ".word h1",
    { y: "0%", duration: 1 },
    0 // Start immediately when timeline begins
  );

  // === WORDS OUT ===
  tl.to(loaderEl.querySelectorAll("#word-1 h1"), { 
    y: "100%", 
    duration: 1, 
    delay: 1.5 // Let words stay visible for 1.5 seconds
  });
  
  tl.to(
    loaderEl.querySelectorAll("#word-2 h1"),
    { y: "-100%", duration: 1 },
    "<" // Start at same time as word-1
  );

  // === PANELS CLOSE (REVEAL CONTENT BEHIND) ===
  tl.to(
    loaderEl.querySelectorAll(".block"),
    {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
      duration: 1,
      stagger: 0.05,
      delay: 0.75,
    },
    "<" // Start with words out animation
  );

  // Cleanup
  return () => {
    console.log("[SiteLoader] cleanup");
    gsap.killTweensOf(loaderEl.querySelectorAll("*"));
    if (lock && lock.parentNode) {
      lock.remove();
    }
    delete loaderEl.dataset.scriptInitialized;
  };
}