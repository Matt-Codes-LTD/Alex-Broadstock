/* =========================
   HOME HERO (per container)
========================= */
export default function initHomeHero(container) {
  const section = container.querySelector(".home-hero_wrap");
  if (!section || section.dataset.scriptInitialized) return () => {};
  section.dataset.scriptInitialized = "true";

  const stage = section.querySelector(".home-hero_video");
  const listParent = section.querySelector(".home-hero_list_parent");
  if (!stage || !listParent) return () => {};

  const links = Array.from(section.querySelectorAll(".home-hero_link"));

  // Preconnect video origins
  (function preconnectFromLinks() {
    const head = document.head;
    const seen = new Set();
    function addOrigin(val) {
      try {
        const u = new URL(val || "", location.href);
        if (!u.origin || seen.has(u.origin)) return;
        seen.add(u.origin);
        const exists = [...head.querySelectorAll('link[rel="preconnect"],link[rel="dns-prefetch"]')]
          .some((l) => (l.href || "").startsWith(u.origin));
        if (exists) return;
        const l1 = document.createElement("link");
        l1.rel = "preconnect"; l1.href = u.origin; l1.crossOrigin = "anonymous"; head.appendChild(l1);
        const l2 = document.createElement("link");
        l2.rel = "dns-prefetch"; l2.href = u.origin; head.appendChild(l2);
      } catch {}
    }
    for (const link of links) { addOrigin(link.dataset.video); addOrigin(link.dataset.videoMain); }
  })();

  // Video pool
  const videoBySrc = new Map();
  const MAX_EAGER = Number(section.getAttribute("data-warm-eager") || 3);

  function createVideo(src) {
    if (!src) return null;
    let v = videoBySrc.get(src);
    if (v) return v;
    v = document.createElement("video");
    v.className = "home-hero_video_el";
    v.src = src;
    v.muted = true; v.loop = true; v.playsInline = true;
    v.preload = "auto"; v.crossOrigin = "anonymous";
    stage.appendChild(v);
    videoBySrc.set(src, v);
    return v;
  }
  function warmVideo(v) {
    if (!v || v.__warmed || prefersReducedData) return;
    v.__warmed = true;
    const start = () => { v.play().then(() => setTimeout(() => { if (!v.__keepAlive) v.pause?.(); }, 250)).catch(() => {}); };
    v.readyState >= 2 ? start() : v.addEventListener("canplaythrough", start, { once: true });
  }
  links.forEach((lnk, i) => {
    const v = createVideo(lnk.dataset.video);
    if (v) i < MAX_EAGER ? warmVideo(v) : (window.requestIdleCallback || ((fn) => setTimeout(fn, 400)))(() => warmVideo(v));
  });

  const defaultFadeSel = ".home-category_ref_text, .home-hero_title, .home-hero_name, .home-hero_heading";
  const fadeTargetsFor = (link) => link.querySelectorAll(link.getAttribute("data-fade-target") || defaultFadeSel);

  let activeVideo = null, activeLink = null;
  function updateLinkState(prev, next) {
    if (prev && prev !== next) {
      prev.setAttribute("aria-current", "false");
      fadeTargetsFor(prev).forEach((n) => n.classList.add("u-color-faded"));
    }
    if (next) {
      next.setAttribute("aria-current", "true");
      fadeTargetsFor(next).forEach((n) => n.classList.remove("u-color-faded"));
    }
  }
  function restart(v) { try { "fastSeek" in v ? v.fastSeek(0) : (v.currentTime = 0); v.play?.(); } catch {} }
  function setActive(src, linkEl) {
    const next = videoBySrc.get(src) || createVideo(src);
    if (!next) return;
    next.__keepAlive = true;
    if (activeVideo && activeVideo !== next) activeVideo.__keepAlive = false;
    if (next !== activeVideo) {
      activeVideo?.classList.remove("is-active");
      next.classList.add("is-active");
      activeVideo = next;
    }
    if (linkEl && linkEl !== activeLink) { updateLinkState(activeLink, linkEl); activeLink = linkEl; }
    if (!prefersReducedMotion) restart(next);
  }

  // Cache categories
  (function cacheCats() {
    const items = Array.from(section.querySelectorAll(".home-hero_list"));
    for (const it of items) {
      const cats = new Set();
      it.querySelectorAll(".home-category_ref_text").forEach((n) => {
        const t = normalize(n.textContent);
        if (t === "selected") n.setAttribute("hidden", "");
        if (t) cats.add(t);
      });
      it.dataset.cats = Array.from(cats).join("|");
    }
  })();

  // Ghost layer
  const ghostLayer = (() => {
    let gl = document.__ghostExitLayer;
    if (gl && document.body.contains(gl)) return gl;
    gl = document.createElement("div");
    gl.className = "ghost-exit-layer";
    document.body.appendChild(gl);
    document.__ghostExitLayer = gl;
    return gl;
  })();

  function stripArtifacts(root) {
    root.querySelectorAll("[data-animate-chars],[data-animate-chars-inner]").forEach((n) => {
      n.removeAttribute("data-animate-chars"); n.removeAttribute("data-animate-chars-inner");
    });
    [...[root], ...root.querySelectorAll("*")].forEach((n) => {
      Object.assign(n.style, { background: "transparent", boxShadow: "none", textShadow: "none", mixBlendMode: "normal", webkitTextFillColor: "currentColor" });
    });
  }
  function makeGhost(el, rect) {
    const g = el.cloneNode(true); g.setAttribute("aria-hidden", "true");
    const cs = getComputedStyle(el);
    Object.assign(g.style, {
      color: cs.color, position: "fixed", margin: "0",
      left: rect.left + "px", top: rect.top + "px",
      width: rect.width + "px", height: rect.height + "px",
      pointerEvents: "none", willChange: "transform,opacity", backfaceVisibility: "hidden", transform: "translateZ(0)", background: "transparent",
    });
    stripArtifacts(g); ghostLayer.appendChild(g); return g;
  }

  // FLIP filter
  function applyFilterFLIP(label) {
    const items = Array.from(section.querySelectorAll(".home-hero_list"));
    const key = normalize(label) || "all";
    const visibleBefore = items.filter((it) => it.style.display !== "none");
    const rectBefore = new Map(visibleBefore.map((it) => [it, it.getBoundingClientRect()]));

    const toStayOrEnter = [], toExit = [];
    items.forEach((it) => {
      const match = key === "all" ? true : (it.dataset.cats || "").split("|").includes(key);
      if (match) toStayOrEnter.push(it); else if (it.style.display !== "none") toExit.push(it);
    });

    const ghosts = [];
    toExit.forEach((el) => { const r = rectBefore.get(el); if (r) { ghosts.push(makeGhost(el, r)); el.style.display = "none"; } });

    let firstVisibleLink = null;
    items.forEach((it) => {
      const shouldShow = toStayOrEnter.includes(it);
      if (shouldShow) {
        if (it.style.display === "none") { it.style.display = ""; it.style.opacity = "0"; }
        if (!firstVisibleLink) firstVisibleLink = it.querySelector(".home-hero_link");
      } else if (!toExit.includes(it)) it.style.display = "none";
      Object.assign(it.style, { transform: "none", willChange: "transform, opacity", backfaceVisibility: "hidden", transformOrigin: "50% 50% 0" });
    });

    section.querySelectorAll(".home-category_ref_text").forEach((n) => { if (normalize(n.textContent) === "selected") n.setAttribute("hidden", ""); });
    listParent.style.pointerEvents = "none";

    requestAnimationFrame(() => {
      const visibleAfter = toStayOrEnter.filter((el) => el.style.display !== "none");
      const rectAfter = new Map(visibleAfter.map((el) => [el, el.getBoundingClientRect()]));
      const MOVE_DUR = prefersReducedMotion ? 0 : 0.36;
      const ENTER_DUR = prefersReducedMotion ? 0 : 0.32;
      const EXIT_DUR = prefersReducedMotion ? 0 : 0.3;
      const EASE_MOVE = "cubic-bezier(.16,.84,.28,1)";
      const EASE_ENTER = "cubic-bezier(.22,1,.36,1)";
      const EASE_EXIT = "cubic-bezier(.36,0,.1,1)";
      const STAGGER = 12;

      const anims = [];
      visibleAfter.forEach((el, i) => {
        const before = rectBefore.get(el), after = rectAfter.get(el);
        if (!before) {
          if (ENTER_DUR) {
            anims.push(el.animate([{ opacity: 0, transform: "translateY(12px) translateZ(0)" }, { opacity: 1, transform: "translateY(0px) translateZ(0)" }], { duration: ENTER_DUR * 1000, easing: EASE_ENTER, delay: i * STAGGER, fill: "both" }).finished.catch(() => {}));
          } else { el.style.opacity = ""; el.style.transform = ""; }
        } else {
          const dx = before.left - after.left, dy = before.top - after.top;
          if (dx || dy) anims.push(el.animate([{ transform: `translate(${dx}px, ${dy}px) translateZ(0)` }, { transform: "translate(0,0) translateZ(0)" }], { duration: MOVE_DUR * 1000, easing: EASE_MOVE, delay: i * STAGGER, fill: "both" }).finished.catch(() => {}));
          else el.style.opacity = "";
        }
      });
      ghosts.forEach((g, i) => anims.push(g.animate([{ opacity: 1, transform: "translateY(0px) translateZ(0)" }, { opacity: 0, transform: "translateY(-10px) translateZ(0)" }], { duration: EXIT_DUR * 1000, easing: EASE_EXIT, delay: i * STAGGER, fill: "both" }).finished.then(() => g.remove()).catch(() => g.remove())));
      Promise.allSettled(anims).finally(() => {
        visibleAfter.forEach((el) => { el.style.willChange = ""; el.style.opacity = ""; el.style.transform = ""; el.style.backfaceVisibility = ""; });
        listParent.style.pointerEvents = "";
        if (activeLink && activeLink.closest(".home-hero_list")?.style.display === "none" && firstVisibleLink) { const src = firstVisibleLink.dataset.video; if (src) setActive(src, firstVisibleLink); }
        if (document.activeElement && document.activeElement.closest(".home-hero_list")?.style.display === "none" && firstVisibleLink) firstVisibleLink.focus({ preventScroll: true });
      });
    });
  }

  // Categories from nav
  (function setupCategoriesFromNav() {
    const BTN_SEL = ".home-category_text";
    const catWrap = document.querySelector(".home_hero_categories");
    if (!catWrap) return;
    function ensureAllButton() {
      const buttons = Array.from(catWrap.querySelectorAll(BTN_SEL));
      let allBtn = buttons.find((b) => normalize(b.textContent) === "all") || null;
      if (!allBtn) {
        const item = document.createElement("div");
        item.setAttribute("role", "listitem");
        item.className = "home-hero_category u-text-style-main w-dyn-item";
        const a = document.createElement("a");
        a.href = "#"; a.className = "home-category_text u-text-style-main"; a.textContent = "All";
        a.setAttribute("data-animate-chars", ""); a.setAttribute("aria-current", "true");
        a.setAttribute("data-animate-delay", catWrap.getAttribute("data-animate-delay") || "0.012");
        item.appendChild(a); catWrap.insertBefore(item, catWrap.firstChild); allBtn = a;
      }
      return allBtn;
    }
    function setActiveCat(label) {
      const key = normalize(label);
      catWrap.querySelectorAll(BTN_SEL).forEach((b) => {
        const isActive = normalize(b.textContent) === key;
        b.setAttribute("aria-current", isActive ? "true" : "false");
        b.classList.toggle("u-color-faded", !isActive);
      });
    }
    function onClick(e) {
      const btn = e.target.closest(BTN_SEL);
      if (!btn || !catWrap.contains(btn)) return;
      e.preventDefault();
      const label = btn.textContent || "All";
      setActiveCat(label); applyFilterFLIP(label);
    }
    ensureAllButton(); setActiveCat("All"); applyFilterFLIP("All");
    catWrap.addEventListener("click", onClick, { passive: false });
    section.__catCleanup = () => catWrap.removeEventListener("click", onClick);
  })();

  // Init first video
  if (links.length) {
    const first = links[0]; const src = first.dataset.video; const v = createVideo(src);
    if (v) v.__keepAlive = true; setActive(src, first);
    if (v?.src) {
      const t = document.createElement("link");
      t.rel = "preload"; t.as = "fetch"; t.href = v.src; t.type = "video/mp4"; t.crossOrigin = "anonymous"; document.head.appendChild(t);
    }
  }

  function onPointerOver(e) { const a = e.target.closest?.(".home-hero_link"); if (!a || !listParent.contains(a) || a === activeLink) return; const src = a.dataset.video; if (src) setActive(src, a); }
  listParent.addEventListener("pointerover", onPointerOver, { passive: true });
  listParent.addEventListener("focusin", onPointerOver);
  listParent.addEventListener("touchstart", onPointerOver, { passive: true });

  const visHandler = () => { if (document.hidden) stage.querySelectorAll(".home-hero_video_el").forEach((v) => v.pause?.()); };
  document.addEventListener("visibilitychange", visHandler);

  // Cleanup
  return () => {
    listParent.removeEventListener("pointerover", onPointerOver);
    listParent.removeEventListener("focusin", onPointerOver);
    listParent.removeEventListener("touchstart", onPointerOver);
    document.removeEventListener("visibilitychange", visHandler);
    section.__catCleanup?.(); delete section.dataset.scriptInitialized;
  };
}

// Helpers (kept in same file to avoid globals)
function normalize(t) { return (t || "").trim().toLowerCase(); }
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const prefersReducedData = navigator.connection?.saveData;
