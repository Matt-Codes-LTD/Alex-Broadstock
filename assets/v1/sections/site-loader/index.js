// assets/v1/sections/site-loader/index.js
export default function initSiteLoader(container) {
  const loaderEl = container.querySelector(".site-loader_wrap");
  if (!loaderEl || loaderEl.dataset.scriptInitialized) return () => {};
  loaderEl.dataset.scriptInitialized = "true";

  console.log("[SiteLoader] Starting sequence…");

  // Lock scroll during preload (independent of Lenis)
  document.documentElement.classList.add("is-preloading");
  const lock = document.createElement("style");
  lock.textContent = `html.is-preloading, html.is-preloading body { overflow: hidden !important }`;
  document.head.appendChild(lock);

  // Require GSAP + CustomEase
  const { gsap } = window;
  if (!gsap) {
    console.warn("[SiteLoader] GSAP not found");
    return () => {};
  }
  if (window.CustomEase && !gsap.parseEase("hop")) {
    window.CustomEase.create("hop", "0.9, 0, 0.1, 1");
  }

  const tl = gsap.timeline({
    delay: 0.3,
    defaults: { ease: "hop" },
    onComplete: () => {
      console.log("[SiteLoader] Finished animation, unlocking scroll");
      loaderEl.style.pointerEvents = "none";
      loaderEl.style.display = "none";
      document.documentElement.classList.remove("is-preloading");
    }
  });

  // COUNTER animation
  const counts = loaderEl.querySelectorAll(".site-loader_count");
  counts.forEach((count, index) => {
    const digits = count.querySelectorAll(".site-loader_digit h1");
    tl.to(digits, { y: "0%", duration: 1, stagger: 0.075 }, index * 1);
    if (index < counts.length) {
      tl.to(digits, { y: "-100%", duration: 1, stagger: 0.075 }, index * 1 + 1);
    }
  });

  // Spinner fades
  tl.to(loaderEl.querySelectorAll(".site-loader_spinner"), { opacity: 0, duration: 0.3 });

  // Words reveal together
  tl.to(loaderEl.querySelectorAll(".site-loader_word h1"), { y: "0%", duration: 1 }, "<");

  // Divider grows, then fades
  tl.to(loaderEl.querySelectorAll(".site-loader_divider"), {
    scaleY: "100%",
    duration: 1,
    onComplete: () =>
      gsap.to(loaderEl.querySelectorAll(".site-loader_divider"), {
        opacity: 0,
        duration: 0.3,
        delay: 0.3
      })
  });

  // Words exit in opposite directions
  tl.to(loaderEl.querySelectorAll("#site-loader_word-1 h1"), { y: "100%", duration: 1, delay: 0.3 });
  tl.to(loaderEl.querySelectorAll("#site-loader_word-2 h1"), { y: "-100%", duration: 1 }, "<");

  // Panels close to reveal page
  const panels = loaderEl.querySelectorAll(".site-loader_panel");
  tl.to(
    panels,
    {
      clipPath: "polygon(0% 0%,100% 0%,100% 0%,0% 0%)",
      duration: 1,
      stagger: 0.1,
      delay: 0.75
    },
    "<"
  );

  // Cleanup
  return () => {
    try {
      loaderEl.remove();
      document.documentElement.classList.remove("is-preloading");
    } catch {}
    delete loaderEl.dataset.scriptInitialized;
  };
}
