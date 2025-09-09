export default function initSiteLoader(container) {
  const loaderEl = container.querySelector(".site-loader_wrap");
  if (!loaderEl || loaderEl.dataset.scriptInitialized) return;
  loaderEl.dataset.scriptInitialized = "true";

  console.log("[SiteLoader] init");

  // Lock scroll during preload
  document.documentElement.classList.add("is-preloading");
  const lock = document.createElement("style");
  lock.textContent = `html.is-preloading, html.is-preloading body { overflow:hidden!important }`;
  document.head.appendChild(lock);

  // CustomEase setup
  if (window.CustomEase && !gsap.parseEase("hop")) {
    window.CustomEase.create("hop", "0.9, 0, 0.1, 1");
  }

  const tl = gsap.timeline({
    delay: 0.3,
    defaults: { ease: "hop" },
    onComplete: () => {
      loaderEl.style.pointerEvents = "none";
      loaderEl.style.display = "none";
      document.documentElement.classList.remove("is-preloading");
      console.log("[SiteLoader] done");
    },
  });

  // === DIGIT COUNTS ===
  const counts = loaderEl.querySelectorAll(".site-loader_count");
  counts.forEach((count, index) => {
    const digits = count.querySelectorAll(".site-loader_digit h1");
    // In: slide up
    tl.to(
      digits,
      { y: "0%", duration: 1, stagger: 0.075 },
      index * 1 // offset per column
    );
    // Out: slide further up
    if (index < counts.length) {
      tl.to(
        digits,
        { y: "-100%", duration: 1, stagger: 0.075 },
        index * 1 + 1
      );
    }
  });

  // === SPINNER FADE ===
  tl.to(loaderEl.querySelectorAll(".site-loader_spinner"), {
    opacity: 0,
    duration: 0.3,
  });

  // === WORDS IN ===
  tl.to(
    loaderEl.querySelectorAll(".site-loader_word h1"),
    { y: "0%", duration: 1 },
    "<"
  );

  // === DIVIDER GROW + FADE ===
  tl.to(loaderEl.querySelectorAll(".site-loader_divider"), {
    scaleY: "100%",
    duration: 1,
    onComplete: () =>
      gsap.to(loaderEl.querySelectorAll(".site-loader_divider"), {
        opacity: 0,
        duration: 0.3,
        delay: 0.3,
      }),
  });

  // === WORDS OUT ===
  tl.to("#site-loader_word-1 h1", { y: "100%", duration: 1, delay: 0.3 });
  tl.to("#site-loader_word-2 h1", { y: "-100%", duration: 1 }, "<");

  // === PANELS CLOSE ===
  const panels = loaderEl.querySelectorAll(".site-loader_panel");
  tl.to(
    panels,
    {
      clipPath: "polygon(0 0,100% 0,100% 0,0 0)",
      duration: 1,
      stagger: 0.1,
      delay: 0.75,
    },
    "<"
  );

  return () => {
    console.log("[SiteLoader] cleanup");
    gsap.killTweensOf(loaderEl);
  };
}
