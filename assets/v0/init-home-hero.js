/* =========================
   HOME HERO (full FLIP + ghosts)
========================= */
function initHomeHero(container) {
  const section = container.querySelector(".home-hero_wrap");
  if (!section) return () => {};
  if (section.dataset.scriptInitialized) return () => {};
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
          .some(l => (l.href || "").startsWith(u.origin));
        if (exists) return;
        const l1 = document.createElement("link");
        l1.rel = "preconnect"; l1.href = u.origin; l1.crossOrigin = "anonymous";
        head.appendChild(l1);
        const l2 = document.createElement("link");
        l2.rel = "dns-prefetch"; l2.href = u.origin;
        head.appendChild(l2);
      } catch (_) {}
    }
    for (let i = 0; i < links.length; i++) {
      addOrigin(links[i].dataset.video);
      addOrigin(links[i].dataset.videoMain);
    }
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
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = "auto";
    v.crossOrigin = "anonymous";
    stage.appendChild(v);
    videoBySrc.set(src, v);
    return v;
  }
  function warmVideo(v) {
    if (!v || v.__warmed || prefersReducedData) return;
    v.__warmed = true;
    const start = () => {
      v.play().then(() => {
        setTimeout(() => { if (!v.__keepAlive) { try { v.pause(); } catch(_){} } }, 250);
      }).catch(() => {});
    };
    (v.readyState >= 2) ? start() : v.addEventListener("canplaythrough", start, { once: true });
  }
  for (let i = 0; i < links.length; i++) {
    const v = createVideo(links[i].dataset.video);
    if (!v) continue;
    if (i < MAX_EAGER) warmVideo(v);
    else (window.requestIdleCallback || ((fn) => setTimeout(fn, 400)))(() => warmVideo(v));
  }

  const defaultFadeSel = ".home-category_ref_text, .home-hero_title, .home-hero_name, .home-hero_heading";
  const fadeTargetsFor = (link) => link.querySelectorAll(link.getAttribute("data-fade-target") || defaultFadeSel);

  let activeVideo = null, activeLink = null;

  function updateLinkState(prev, next) {
    if (prev && prev !== next) {
      prev.setAttribute("aria-current", "false");
      fadeTargetsFor(prev).forEach(n => n.classList.add("u-color-faded"));
    }
    if (next) {
      next.setAttribute("aria-current", "true");
      fadeTargetsFor(next).forEach(n => n.classList.remove("u-color-faded"));
    }
  }

  function restart(v) {
    if (!v) return;
    try { ("fastSeek" in v) ? v.fastSeek(0) : (v.currentTime = 0); } catch (_) {}
    v.play().catch(() => {});
  }

  function setActive(src, linkEl) {
    const next = videoBySrc.get(src) || createVideo(src);
    if (!next) return;
    next.__keepAlive = true;
    if (activeVideo && activeVideo !== next) activeVideo.__keepAlive = false;

    if (next !== activeVideo) {
      if (activeVideo) activeVideo.classList.remove("is-active");
      next.classList.add("is-active");
      activeVideo = next;
    }
    if (linkEl && linkEl !== activeLink) {
      updateLinkState(activeLink, linkEl);
      activeLink = linkEl;
    }
    if (!prefersReducedMotion) restart(next);
  }

  // Cache item categories + hide “Selected” pill
  (function cacheCatsAndHideSelected() {
    const items = Array.from(section.querySelectorAll(".home-hero_list"));
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const cats = new Set();
      it.querySelectorAll(".home-category_ref_text").forEach(n => {
        const t = normalize(n.textContent);
        if (t === "selected") n.setAttribute("hidden", "");
        if (t) cats.add(t);
      });
      it.dataset.cats = Array.from(cats).join("|");
    }
  })();

  // Ghost exit layer
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
    root.querySelectorAll('[data-animate-chars],[data-animate-chars-inner]').forEach(n => {
      n.removeAttribute('data-animate-chars');
      n.removeAttribute('data-animate-chars-inner');
    });
    const nodes = [root, ...root.querySelectorAll('*')];
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.style.background = "transparent";
      n.style.boxShadow = "none";
      n.style.textShadow = "none";
      n.style.mixBlendMode = "normal";
      n.style.webkitTextFillColor = "currentColor";
    }
  }

  function makeGhost(el, rect) {
    const g = el.cloneNode(true);
    g.setAttribute('aria-hidden', 'true');
    const cs = getComputedStyle(el);
    Object.assign(g.style, {
      color: cs.color, position: "fixed", margin: "0",
      left: rect.left + "px", top: rect.top + "px",
      width: rect.width + "px", height: rect.height + "px",
      pointerEvents: "none", willChange: "transform,opacity",
      backfaceVisibility: "hidden", transform: "translateZ(0)", background: "transparent"
    });
    stripArtifacts(g);
    ghostLayer.appendChild(g);
    return g;
  }

  // FLIP filter with ghost exits
  function applyFilterFLIP(label) {
    const items = Array.from(section.querySelectorAll(".home-hero_list"));
    const key = normalize(label) || "all";

    const visibleBefore = items.filter(it => it.style.display !== "none");
    const rectBefore = new Map();
    for (let i = 0; i < visibleBefore.length; i++) {
      rectBefore.set(visibleBefore[i], visibleBefore[i].getBoundingClientRect());
    }

    const toStayOrEnter = [];
    const toExit = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const match = (key === "all") ? true : (it.dataset.cats || "").split("|").includes(key);
      if (match) toStayOrEnter.push(it);
      else if (it.style.display !== "none") toExit.push(it);
    }

    const ghosts = [];
    for (let i = 0; i < toExit.length; i++) {
      const el = toExit[i];
      const r = rectBefore.get(el);
      if (!r) continue;
      const g = makeGhost(el, r);
      ghosts.push(g);
      el.style.display = "none";
    }

    let firstVisibleLink = null;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const shouldShow = toStayOrEnter.includes(it);
      if (shouldShow) {
        if (it.style.display === "none") {
          it.style.display = "";
          it.style.opacity = "0";
        }
        if (!firstVisibleLink) firstVisibleLink = it.querySelector(".home-hero_link");
      } else {
        if (!toExit.includes(it)) it.style.display = "none";
      }
      it.style.transform = "none";
      it.style.willChange = "transform, opacity";
      it.style.backfaceVisibility = "hidden";
      it.style.transformOrigin = "50% 50% 0";
    }

    section.querySelectorAll(".home-category_ref_text").forEach(n => {
      if (normalize(n.textContent) === "selected") n.setAttribute("hidden", "");
    });

    listParent.style.pointerEvents = "none";

    requestAnimationFrame(() => {
      const visibleAfter = toStayOrEnter.filter(el => el.style.display !== "none");
      const rectAfter = new Map();
      for (let i = 0; i < visibleAfter.length; i++) {
        rectAfter.set(visibleAfter[i], visibleAfter[i].getBoundingClientRect());
      }

      const MOVE_DUR = prefersReducedMotion ? 0 : 0.36;
      const ENTER_DUR = prefersReducedMotion ? 0 : 0.32;
      const EXIT_DUR = prefersReducedMotion ? 0 : 0.30;
      const EASE_MOVE = "cubic-bezier(.16,.84,.28,1)";
      const EASE_ENTER = "cubic-bezier(.22,1,.36,1)";
      const EASE_EXIT = "cubic-bezier(.36,0,.1,1)";
      const STAGGER = 12;
      const anims = [];

      for (let i = 0; i < visibleAfter.length; i++) {
        const el = visibleAfter[i];
        const before = rectBefore.get(el);
        const after  = rectAfter.get(el);

        if (!before) {
          if (ENTER_DUR) {
            anims.push(
              el.animate(
                [
                  { opacity: 0, transform: "translateY(12px) translateZ(0)" },
                  { opacity: 1, transform: "translateY(0px) translateZ(0)" }
                ],
                { duration: ENTER_DUR * 1000, easing: EASE_ENTER, delay: i * STAGGER, fill: "both" }
              ).finished.catch(() => {})
            );
          } else {
            el.style.opacity = "";
            el.style.transform = "";
          }
          continue;
        }

        const dx = (before.left - after.left);
        const dy = (before.top - after.top);
        if (dx || dy) {
          anims.push(
            el.animate(
              [
                { transform: `translate(${dx}px, ${dy}px) translateZ(0)` },
                { transform: "translate(0,0) translateZ(0)" }
              ],
              { duration: MOVE_DUR * 1000, easing: EASE_MOVE, delay: i * STAGGER, fill: "both" }
            ).finished.catch(() => {})
          );
        } else {
          el.style.opacity = "";
        }
      }

      for (let i = 0; i < ghosts.length; i++) {
        const g = ghosts[i];
        anims.push(
          g.animate(
            [
              { opacity: 1, transform: "translateY(0px) translateZ(0)" },
              { opacity: 0, transform: "translateY(-10px) translateZ(0)" }
            ],
            { duration: EXIT_DUR * 1000, easing: EASE_EXIT, delay: i * STAGGER, fill: "both" }
          ).finished.then(() => { g.remove(); }).catch(() => { try { g.remove(); } catch(_){} })
        );
      }

      Promise.allSettled(anims).finally(() => {
        visibleAfter.forEach(el => {
          el.style.willChange = "";
          el.style.opacity = "";
          el.style.transform = "";
          el.style.backfaceVisibility = "";
        });
        listParent.style.pointerEvents = "";

        if (activeLink &&
            activeLink.closest(".home-hero_list")?.style.display === "none") {
          if (firstVisibleLink) {
            const src = firstVisibleLink.dataset.video;
            if (src) setActive(src, firstVisibleLink);
          }
        }
        if (document.activeElement &&
            document.activeElement.closest(".home-hero_list")?.style.display === "none" &&
            firstVisibleLink) {
          firstVisibleLink.focus({ preventScroll: true });
        }
      });
    });
  }

  (function setupCategoriesFromNav() {
    const BTN_SEL = ".home-category_text";
    const catWrap = document.querySelector(".home_hero_categories");
    if (!catWrap) return;

    function ensureAllButton() {
      const buttons = Array.from(catWrap.querySelectorAll(BTN_SEL));
      let allBtn = buttons.find(b => normalize(b.textContent) === "all") || null;
      if (!allBtn) {
        const item = document.createElement("div");
        item.setAttribute("role", "listitem");
        item.className = "home-hero_category u-text-style-main w-dyn-item";
        const a = document.createElement("a");
        a.href = "#";
        a.className = "home-category_text u-text-style-main";
        a.textContent = "All";
        a.setAttribute("data-animate-chars", "");
        a.setAttribute("aria-current", "true");
        a.setAttribute("data-animate-delay", catWrap.getAttribute("data-animate-delay") || "0.012");
        item.appendChild(a);
        catWrap.insertBefore(item, catWrap.firstChild);
        allBtn = a;
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
      setActiveCat(label);
      applyFilterFLIP(label);
    }

    ensureAllButton();
    setActiveCat("All");
    applyFilterFLIP("All");
    catWrap.addEventListener("click", onClick, { passive: false });

    section.__catCleanup = () => catWrap.removeEventListener("click", onClick);
  })();

  if (links.length) {
    const first = links[0];
    const src = first.dataset.video;
    const v = createVideo(src);
    if (v) v.__keepAlive = true;
    setActive(src, first);

    const preloadSrc = v?.src;
    if (preloadSrc) {
      const t = document.createElement("link");
      t.rel = "preload"; t.as = "video"; t.href = preloadSrc; t.type = "video/mp4"; t.crossOrigin = "anonymous";
      document.head.appendChild(t);
    }
  }

  function onPointerOver(e) {
    const a = e.target.closest?.(".home-hero_link");
    if (!a || !listParent.contains(a) || a === activeLink) return;
    const src = a.dataset.video;
    if (src) setActive(src, a);
  }
  listParent.addEventListener("pointerover", onPointerOver, { passive:true });
  listParent.addEventListener("focusin", onPointerOver);
  listParent.addEventListener("touchstart", onPointerOver, { passive:true });

  const visHandler = () => {
    if (document.hidden) {
      stage.querySelectorAll(".home-hero_video_el").forEach(v => { try { v.pause(); } catch(_){}} );
    }
  };
  document.addEventListener("visibilitychange", visHandler);

  return () => {
    listParent.removeEventListener("pointerover", onPointerOver);
    listParent.removeEventListener("focusin", onPointerOver);
    listParent.removeEventListener("touchstart", onPointerOver);
    document.removeEventListener("visibilitychange", visHandler);
    section.__catCleanup?.();
    delete section.dataset.scriptInitialized;
  };
}
