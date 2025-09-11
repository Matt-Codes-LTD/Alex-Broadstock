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

  // CustomEase setup - smoother curve instead of bouncy hop
  if (window.CustomEase) {
    // Create a smoother, more refined ease curve
    window.CustomEase.create("smooth-out", "0.25, 0.46, 0.45, 0.94");
    window.CustomEase.create("smooth-in-out", "0.645, 0.045, 0.355, 1.000");
    window.CustomEase.create("gentle-bounce", "0.34, 1.56, 0.64, 1");
  }

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Minimum display time to prevent loader from disappearing too quickly
  const minDisplayTime = 2500; // 2.5 seconds minimum for smoother experience
  const startTime = Date.now();

  // Reset initial states with smoother values
  gsap.set(loaderEl, { pointerEvents: "all", display: "block", opacity: 1 });
  gsap.set("#word-1 h1", { y: "-100%", opacity: 0 });
  gsap.set("#word-2 h1", { y: "100%", opacity: 0 });
  gsap.set(".block", { 
    clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
    opacity: 1 
  });

  const tl = gsap.timeline({
    delay: 0.3, // Shorter initial delay
    onComplete: () => {
      // Ensure minimum display time
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDisplayTime - elapsed);
      
      setTimeout(() => {
        // Smooth fade out before removing
        gsap.to(loaderEl, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.inOut",
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
    tl.timeScale(3); // Faster but not instant
  }

  // === WORDS IN - Smoother entrance ===
  // First word slides in from top with fade
  tl.to("#word-1 h1", { 
    y: "0%", 
    opacity: 1,
    duration: 0.8,
    ease: "power3.out" // Smooth deceleration
  }, 0);
  
  // Second word slides in from bottom with slight delay for elegance
  tl.to("#word-2 h1", { 
    y: "0%", 
    opacity: 1,
    duration: 0.8,
    ease: "power3.out"
  }, 0.1); // Slight stagger for smoother feel

  // === HOLD - Let the name breathe ===
  tl.set({}, {}, "+=1.2"); // Hold for readability

  // === WORDS OUT - Coordinated exit ===
  tl.to("#word-1 h1", { 
    y: "100%", 
    opacity: 0,
    duration: 0.6, 
    ease: "power2.in" // Accelerate out
  });
  
  tl.to("#word-2 h1", { 
    y: "-100%", 
    opacity: 0,
    duration: 0.6,
    ease: "power2.in"
  }, "<"); // Start at same time for synchronized exit

  // === PANELS CLOSE - Refined reveal ===
  // Now targeting each block individually for clear stagger
  tl.to(".block:first-child", {
    clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
    duration: 0.8,
    ease: "power3.inOut"
  }, "-=0.3");
  
  // Second panel closes with stagger delay
  tl.to(".block:last-child", {
    clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
    duration: 0.8,
    ease: "power3.inOut"
  }, "-=0.7"); // Overlap by 0.7s, creating a 0.1s stagger

  // Optional: Add subtle scale animation to panels for depth
  tl.to(".block", {
    scaleY: 0.98,
    duration: 0.8,
    ease: "power2.inOut"
  }, "<");

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