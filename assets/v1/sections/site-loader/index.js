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

  // Reset initial states
  gsap.set(loaderEl, { pointerEvents: "all", display: "block" });
  gsap.set(".spinner", { opacity: 1 });
  gsap.set("#word-1 h1", { y: "-120%" });
  gsap.set("#word-2 h1", { y: "120%" });
  gsap.set(".divider", { scaleY: "0%", opacity: 1 });
  gsap.set(".count .digit h1", { y: "120%" });
  gsap.set(".block", { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" });

  const tl = gsap.timeline({
    delay: 0.3,
    defaults: { ease: "hop" },
    onComplete: () => {
      loaderEl.style.pointerEvents = "none";
      loaderEl.style.display = "none";
      document.documentElement.classList.remove("is-preloading");
      lock.remove();
      console.log("[SiteLoader] done");
    },
  });

  // === DIGIT COUNTS ===
  const counts = loaderEl.querySelectorAll(".count");
  counts.forEach((count, index) => {
    const digits = count.querySelectorAll(".digit h1");
    
    // Animate digits in
    tl.to(
      digits,
      { y: "0%", duration: 1, stagger: 0.075 },
      index * 1
    );
    
    // Animate digits out
    if (index < counts.length) {
      tl.to(
        digits,
        { y: "-100%", duration: 1, stagger: 0.075 },
        index * 1 + 1
      );
    }
  });

  // === SPINNER FADE ===
  tl.to(".spinner", {
    opacity: 0,
    duration: 0.3,
  });

  // === WORDS IN ===
  tl.to(
    ".word h1",
    { y: "0%", duration: 1 },
    "<"
  );

  // === DIVIDER GROW + FADE ===
  tl.to(loaderEl.querySelectorAll(".divider"), {
    scaleY: "100%",
    duration: 1,
    onComplete: () =>
      gsap.to(loaderEl.querySelectorAll(".divider"), { 
        opacity: 0, 
        duration: 0.3, 
        delay: 0.3 
      }),
  });

  // === WORDS OUT ===
  tl.to(loaderEl.querySelectorAll("#word-1 h1"), { 
    y: "100%", 
    duration: 1, 
    delay: 0.3 
  });
  
  tl.to(
    loaderEl.querySelectorAll("#word-2 h1"),
    { y: "-100%", duration: 1 },
    "<"
  );

  // === PANELS CLOSE (REVEAL CONTENT BEHIND) ===
  tl.to(
    loaderEl.querySelectorAll(".block"),
    {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
      duration: 1,
      stagger: 0.1,
      delay: 0.75,
    },
    "<"
  );

  // Cleanup
  return () => {
    console.log("[SiteLoader] cleanup");
    gsap.killTweensOf(loaderEl.querySelectorAll("*"));
    lock.remove();
    delete loaderEl.dataset.scriptInitialized;
  };
}