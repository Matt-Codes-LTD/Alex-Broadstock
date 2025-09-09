// assets/v1/sections/site-loader/index.js
export default function initSiteLoader(container) {
  // ✅ Only run on Home page
  if (container.dataset.namespace !== "home") return () => {};

  const loaderEl = document.querySelector(".site-loader_wrap");
  if (!loaderEl || loaderEl.dataset.scriptInitialized) return () => {};
  loaderEl.dataset.scriptInitialized = "true";

  // Lock scroll during preload
  document.documentElement.classList.add("is-preloading");
  const lock = document.createElement("style");
  lock.textContent = `html.is-preloading, html.is-preloading body{overflow:hidden!important}`;
  document.head.appendChild(lock);

  const { gsap } = window;
  if (!gsap) return () => {};
  if (window.CustomEase && !gsap.parseEase("hop")) {
    window.CustomEase.create("hop", "0.9, 0, 0.1, 1");
  }

  const tl = gsap.timeline({ delay: 0.3, defaults: { ease: "hop" } });

  // Counters
  const counts = loaderEl.querySelectorAll(".site-loader_count");
  counts.forEach((count, index) => {
    const digits = count.querySelectorAll(".site-loader_digit h1");
    tl.to(digits, { y: "0%", duration: 1, stagger: 0.075 }, index * 1);
    if (index < counts.length) {
      tl.to(digits, { y: "-100%", duration: 1, stagger: 0.075 }, index * 1 + 1);
    }
  });

  // Spinner fade
  tl.to(loaderEl.querySelectorAll(".site-loader_spinner"), { opacity: 0, duration: 0.3 });

  // Logo words in
  tl.to(loaderEl.querySelectorAll(".site-loader_word h1"), { y: "0%", duration: 1 }, "<");

  // Divider grow/fade
  tl.to(loaderEl.querySelectorAll(".site-loader_divider"), {
    scaleY: "100%", duration: 1,
    onComplete: () => gsap.to(loaderEl.querySelectorAll(".site-loader_divider"), {
      opacity: 0, duration: 0.3, delay: 0.3
    })
  });

  // Words out
  tl.to(loaderEl.querySelectorAll("#word-1 h1"), { y: "100%", duration: 1, delay: 0.3 });
  tl.to(loaderEl.querySelectorAll("#word-2 h1"), { y: "-100%", duration: 1 }, "<");

  // Panels close
  tl.to(loaderEl.querySelectorAll(".site-loader_block"), {
    clipPath: "polygon(0% 0%,100% 0%,100% 0%,0% 0%)",
    duration: 1, stagger: 0.1, delay: 0.75,
    onComplete: () => {
      loaderEl.style.pointerEvents = "none";
      loaderEl.style.display = "none";
      document.documentElement.classList.remove("is-preloading");
    }
  }, "<");

  // Cleanup
  return () => {
    delete loaderEl.dataset.scriptInitialized;
  };
}
