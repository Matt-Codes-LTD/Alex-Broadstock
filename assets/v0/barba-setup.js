/* =========================
   GLOBAL PREFS / HELPERS
========================= */
const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const prefersReducedData   = matchMedia("(prefers-reduced-data: reduce)").matches;
const normalize = (s) => (s || "").replace(/\s+/g, " ").trim().toLowerCase();

/* =========================
   CURSOR (global, once)
========================= */
function initCursor() {
  if (window.__cursorInit) return;
  window.__cursorInit = true;

  const overlay = document.querySelector(".cursor-crosshair_wrap");
  if (!overlay) return;

  // Remove legacy bits if left in DOM
  overlay.querySelectorAll(".cursor-crosshair_line, .cursor-crosshair_dot, .cursor-crosshair_dot-top, .cursor-crosshair_pulse")
    .forEach(n => { try { n.remove(); } catch(_){} });

  // Ensure square exists
  let box = overlay.querySelector(".cursor-follow_box");
  if (!box) {
    box = document.createElement("div");
    box.className = "cursor-follow_box";
    overlay.appendChild(box);
  }

  // Geometry & observers
  let rect = overlay.getBoundingClientRect();
  const computeGeometry = () => { rect = overlay.getBoundingClientRect(); };
  computeGeometry();
  const ro = new ResizeObserver(computeGeometry);
  ro.observe(overlay);
  addEventListener("scroll", computeGeometry, { passive:true });

  // GSAP hot-swap if present
  const hasGSAP = () => !!(window.gsap && gsap.quickSetter && gsap.ticker);
  let useGsap = false, setX, setY;

  function useFallback() {
    useGsap = false;
    setX = (px) => { box.style.transform = `translate(${px}px, ${y}px)`; };
    setY = (py) => { box.style.transform = `translate(${x}px, ${py}px)`; };
    box.style.transform = `translate(${x}px, ${y}px)`;
  }
  function useGsapSetters() {
    useGsap = true;
    setX = gsap.quickSetter(box, "x", "px");
    setY = gsap.quickSetter(box, "y", "px");
    setX(x); setY(y);
  }

  const ease = 0.18;
  let targetX = rect.width / 2, targetY = rect.height / 2;
  let x = targetX,          y = targetY;

  function onMove(e) {
    if (!rect.width || !rect.height) computeGeometry();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
  }
  addEventListener("pointermove", onMove, { passive:true });
  addEventListener("pointerenter", onMove, { passive:true });

  function onHardLeave(e) {
    if (e.pointerType === "touch") return;
    const leftViewport = (e.relatedTarget == null);
    const atEdge = (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= innerWidth || e.clientY >= innerHeight);
    if (leftViewport || atEdge) {
      computeGeometry();
      targetX = rect.width / 2;
      targetY = rect.height / 2;
    }
  }
  document.addEventListener("mouseleave", onHardLeave, true);
  document.addEventListener("mouseout",   onHardLeave, true);
  document.addEventListener("pointerout", onHardLeave, true);

  let rafId = null;
  const tick = () => {
    x += (targetX - x) * ease;
    y += (targetY - y) * ease;
    setX(x); setY(y);
  };

  function start() {
    if (hasGSAP()) {
      if (!useGsap) useGsapSetters();
      gsap.ticker.add(tick);
    } else if (!rafId) {
      const loop = () => { tick(); rafId = requestAnimationFrame(loop); };
      useFallback();
      rafId = requestAnimationFrame(loop);
    }
  }
  function stop() {
    if (useGsap && window.gsap) gsap.ticker.remove(tick);
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }
  start();

  addEventListener("load", () => {
    if (!useGsap && hasGSAP()) { stop(); useGsapSetters(); gsap.ticker.add(tick); useGsap = true; }
  }, { once:true });

  const onVis = () => { if (document.hidden) { stop(); } else { start(); } };
  document.addEventListener("visibilitychange", onVis);

  // Cleanup if overlay ever removed
  const mo = new MutationObserver(() => {
    if (!document.body.contains(overlay)) {
      stop(); document.removeEventListener("visibilitychange", onVis);
      ro.disconnect(); mo.disconnect();
    }
  });
  mo.observe(document.body, { childList:true, subtree:true });
}

/* =========================
   SPLIT CHARS (per container)
========================= */
function initSplitChars(container) {
  const originals = new Map();
  const incDefault = 0.01;

  function splitChars(hostEl) {
    const targetSel = hostEl.getAttribute("data-animate-chars-target");
    const targets = targetSel ? hostEl.querySelectorAll(targetSel) : [hostEl];
    if (!targets || !targets.length) return;

    const inc = parseFloat(hostEl.getAttribute("data-animate-delay") || incDefault);

    targets.forEach((target) => {
      if (!target || target.dataset.charsInit === "1") return;

      const text = target.textContent || "";
      originals.set(target, text);
      target.textContent = "";

      const inner = document.createElement("span");
      inner.setAttribute("data-animate-chars-inner","");

      const frag = document.createDocumentFragment();
      for (let i = 0; i < text.length; i++){
        const ch = text[i];
        const s = document.createElement("span");
        s.textContent = ch;
        if (ch === " ") s.style.whiteSpace = "pre";
        s.style.transitionDelay = (i * inc) + "s";
        frag.appendChild(s);
      }
      inner.appendChild(frag);
      target.appendChild(inner);
      target.dataset.charsInit = "1";
    });

    // Touch pulse feedback
    const pulse = () => {
      hostEl.setAttribute("data-animate-pulse","1");
      clearTimeout(hostEl.__pulseTO);
      hostEl.__pulseTO = setTimeout(()=> hostEl.removeAttribute("data-animate-pulse"), 700);
    };
    if (!hostEl.__pulseBound) {
      hostEl.__pulseBound = true;
      hostEl.addEventListener("touchstart", pulse, { passive:true });
    }
  }

  function ensureOptIn(el){
    if (!el.hasAttribute("data-animate-chars")) el.setAttribute("data-animate-chars","");
    splitChars(el);
  }

  function initList(listEl){
    if (!listEl || listEl.__charsListInit) return;
    listEl.__charsListInit = true;

    const sel       = listEl.getAttribute("data-animate-chars-selector") || "a";
    const targetSel = listEl.getAttribute("data-animate-chars-target") || null;
    const listDelay = listEl.getAttribute("data-animate-delay");

    listEl.querySelectorAll(sel).forEach((link) => {
      if (!link.hasAttribute("data-animate-chars")) link.setAttribute("data-animate-chars","");
      if (targetSel && !link.hasAttribute("data-animate-chars-target")) link.setAttribute("data-animate-chars-target", targetSel);
      if (listDelay && !link.hasAttribute("data-animate-delay")) link.setAttribute("data-animate-delay", listDelay);
      splitChars(link);
    });
  }

  function scan(root){
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll("[data-animate-chars]").forEach(ensureOptIn);
    if (root.nodeType === 1 && root.hasAttribute?.("data-animate-chars")) ensureOptIn(root);
    root.querySelectorAll("[data-animate-chars-list]").forEach(initList);
    if (root.nodeType === 1 && root.hasAttribute?.("data-animate-chars-list")) initList(root);
  }

  scan(container);

  // Batched observer (scoped to container)
  let scheduled = false;
  const queue = new Set();
  const scheduleScan = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      for (const n of queue) scan(n);
      queue.clear();
    });
  };

  const mo = new MutationObserver((muts)=>{
    for (let i=0;i<muts.length;i++) {
      const m = muts[i];
      if (m.type === "childList") {
        m.addedNodes && m.addedNodes.forEach?.(n => { if (n.nodeType === 1) { queue.add(n); } });
      } else if (m.type === "attributes") {
        const t = m.target;
        if (t && t.nodeType === 1) queue.add(t);
      }
    }
    scheduleScan();
  });

  mo.observe(container, {
    subtree:true, childList:true, attributes:true,
    attributeFilter:["data-animate-chars","data-animate-chars-list","data-animate-chars-target","data-animate-delay"]
  });

  // Cleanup restores originals and disconnects
  return () => {
    mo.disconnect();
    originals.forEach((text, el) => {
      el.textContent = text;
      delete el.dataset.charsInit;
    });
  };
}

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

  // Helpers
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

  // Ghost exit layer (singleton)
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

    // BEFORE
    const visibleBefore = items.filter(it => it.style.display !== "none");
    const rectBefore = new Map();
    for (let i = 0; i < visibleBefore.length; i++) {
      rectBefore.set(visibleBefore[i], visibleBefore[i].getBoundingClientRect());
    }

    // Decide
    const toStayOrEnter = [];
    const toExit = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const match = (key === "all") ? true : (it.dataset.cats || "").split("|").includes(key);
      if (match) toStayOrEnter.push(it);
      else if (it.style.display !== "none") toExit.push(it);
    }

    // Build ghosts for exits
    const ghosts = [];
    for (let i = 0; i < toExit.length; i++) {
      const el = toExit[i];
      const r = rectBefore.get(el);
      if (!r) continue;
      const g = makeGhost(el, r);
      ghosts.push(g);
      el.style.display = "none";
    }

    // MUTATE
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

    // Re-hide “Selected”
    section.querySelectorAll(".home-category_ref_text").forEach(n => {
      if (normalize(n.textContent) === "selected") n.setAttribute("hidden", "");
    });

    listParent.style.pointerEvents = "none";

    // AFTER
    requestAnimationFrame(() => {
      const visibleAfter = toStayOrEnter.filter(el => el.style.display !== "none");
      const rectAfter = new Map();
      for (let i = 0; i < visibleAfter.length; i++) {
        rectAfter.set(visibleAfter[i], visibleAfter[i].getBoundingClientRect());
      }

      // Timings
      const MOVE_DUR = prefersReducedMotion ? 0 : 0.36;
      const ENTER_DUR = prefersReducedMotion ? 0 : 0.32;
      const EXIT_DUR = prefersReducedMotion ? 0 : 0.30;
      const EASE_MOVE = "cubic-bezier(.16,.84,.28,1)";
      const EASE_ENTER = "cubic-bezier(.22,1,.36,1)";
      const EASE_EXIT = "cubic-bezier(.36,0,.1,1)";
      const STAGGER = 12;
      const anims = [];

      // MOVE / ENTER
      for (let i = 0; i < visibleAfter.length; i++) {
        const el = visibleAfter[i];
        const before = rectBefore.get(el);
        const after  = rectAfter.get(el);

        // ENTER
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

        // STAY — FLIP
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

      // EXIT ghosts
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

        // If active item got filtered out, pick first visible
        if (activeLink &&
            activeLink.closest(".home-hero_list")?.style.display === "none") {
          if (firstVisibleLink) {
            const src = firstVisibleLink.dataset.video;
            if (src) setActive(src, firstVisibleLink);
          }
        }
        // Focus repair
        if (document.activeElement &&
            document.activeElement.closest(".home-hero_list")?.style.display === "none" &&
            firstVisibleLink) {
          firstVisibleLink.focus({ preventScroll: true });
        }
      });
    });
  }

  // Categories UI (nav is the control)
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

    // cleanup hook
    section.__catCleanup = () => catWrap.removeEventListener("click", onClick);
  })();

  // Default active = first link + preload the first active video
  if (links.length) {
    const first = links[0];
    const src = first.dataset.video;
    const v = createVideo(src);
    if (v) v.__keepAlive = true;
    setActive(src, first);

    // Preload first hero video src
    const preloadSrc = v?.src;
    if (preloadSrc) {
      const t = document.createElement("link");
      t.rel = "preload"; t.as = "video"; t.href = preloadSrc; t.type = "video/mp4"; t.crossOrigin = "anonymous";
      document.head.appendChild(t);
    }
  }

  // Hover / focus / touch activates project
  function onPointerOver(e) {
    const a = e.target.closest?.(".home-hero_link");
    if (!a || !listParent.contains(a) || a === activeLink) return;
    const src = a.dataset.video;
    if (src) setActive(src, a);
  }
  listParent.addEventListener("pointerover", onPointerOver, { passive:true });
  listParent.addEventListener("focusin", onPointerOver);
  listParent.addEventListener("touchstart", onPointerOver, { passive:true });

  // Pause all hero videos when tab hidden
  const visHandler = () => {
    if (document.hidden) {
      stage.querySelectorAll(".home-hero_video_el").forEach(v => { try { v.pause(); } catch(_){}} );
    }
  };
  document.addEventListener("visibilitychange", visHandler);

  // Cleanup
  return () => {
    listParent.removeEventListener("pointerover", onPointerOver);
    listParent.removeEventListener("focusin", onPointerOver);
    listParent.removeEventListener("touchstart", onPointerOver);
    document.removeEventListener("visibilitychange", visHandler);
    section.__catCleanup?.();
    delete section.dataset.scriptInitialized;
  };
}

/* =========================
   PROJECT PLAYER (full legacy, per container)
========================= */
function initProjectPlayer(container) {
  const wrap = container.querySelector(".project-player_wrap");
  if (!wrap) return () => {};

  if (wrap.dataset.scriptInitialized) return () => {};
  wrap.dataset.scriptInitialized = "true";

  const stage  = wrap.querySelector('.project-player_stage') || wrap;
  const slug   = stage.getAttribute('data-project-slug') || wrap.getAttribute('data-project-slug') || '';
  const url    = stage.getAttribute('data-video')        || wrap.getAttribute('data-video')        || '';
  const vtt    = stage.getAttribute('data-captions')     || wrap.getAttribute('data-captions')     || '';
  const poster = stage.getAttribute('data-poster')       || wrap.getAttribute('data-poster')       || '';
  const host   = stage.querySelector('.project-player_video-host') || wrap.querySelector('.project-player_video-host');

  // Controls
  const btnPlay   = wrap.querySelector('[data-role="play"]');
  const btnMute   = wrap.querySelector('[data-role="mute"]');
  const muteLabel = wrap.querySelector('[data-role="mute-label"]');
  const btnFS     = wrap.querySelector('[data-role="fs"]');
  const tl        = wrap.querySelector('[data-role="timeline"]');
  const tlBuf     = wrap.querySelector('.project-player_timeline-buffer');
  const tlHandle  = wrap.querySelector('.project-player_timeline-handle');

  // Pause overlay (ensure exists)
  let pauseFx = wrap.querySelector('.project-player_pausefx');
  if (!pauseFx) {
    pauseFx = document.createElement('div');
    pauseFx.className = 'project-player_pausefx u-cover-absolute u-inset-0';
    const afterTarget = (wrap.querySelector('.project-player_stage') || wrap).querySelector('.project-player_video-host');
    const target = wrap.querySelector('.project-player_stage') || wrap;
    afterTarget?.nextSibling ? target.insertBefore(pauseFx, afterTarget.nextSibling) : target.appendChild(pauseFx);
  }

  // Center overlay (unmute first, then play/pause)
  let centerBtn = wrap.querySelector('.project-player_center-toggle');
  if (!centerBtn) {
    centerBtn = document.createElement('button');
    centerBtn.className = 'project-player_center-toggle project-player_btn project-player_btn--play';
    centerBtn.type = 'button';
    centerBtn.setAttribute('aria-pressed', 'false');
    centerBtn.setAttribute('aria-label', 'Unmute');
    centerBtn.style.color = '#fff';
    centerBtn.innerHTML = `
      <svg viewBox="0 0 24 24" class="pp-icon" aria-hidden="true" fill="none">
        <g class="pp-icon--group pp-icon--sound">
          <path d="M12 5V19L7 16H2V8H7L12 5Z"></path>
          <path d="M19.3 19.3C21.0459 17.2685 22.0059 14.6786 22.0059 12C22.0059 9.3214 21.0459 6.73148 19.3 4.70001"></path>
          <path d="M16.4 16.4C17.4429 15.1711 18.0154 13.6118 18.0154 12C18.0154 10.3882 17.4429 8.82888 16.4 7.60001"></path>
        </g>
        <g class="pp-icon--group pp-icon--play">
          <g class="pp-icon__part pp-icon__play"><path d="M5.2 12V3L13 7.5L20.8 12L13 16.5L5.2 21V12Z"></path></g>
          <g class="pp-icon__part pp-icon__pause"><path d="M9.5 5.5H6.5V18.5H9.5V5.5Z"></path><path d="M17.5 5.5H14.5V18.5H17.5V5.5Z"></path></g>
        </g>
      </svg>
      <span class="u-sr-only">Unmute</span>
    `.trim();
    (wrap.querySelector('.project-player_stage') || wrap).appendChild(centerBtn);
  }

  // Video element
  let video = host?.querySelector('video');
  if (!video && host && url) {
    video = document.createElement('video');
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.src = url;
  }
  if (!video) return () => {};

  if (vtt && !video.querySelector('track[kind="subtitles"], track[kind="captions"]')) {
    const tr = document.createElement('track');
    tr.kind='subtitles'; tr.label='English'; tr.srclang='en'; tr.src=vtt; tr.default=false;
    video.appendChild(tr);
  }
  video.className = 'project-player_video';
  video.controls = false;
  if (poster) video.poster = poster;
  if (!video.isConnected && host) host.appendChild(video);

  // Autoplay muted
  video.muted = true; video.setAttribute('muted','');
  video.volume = 0;

  // Helpers & state
  let raf = 0, dragging = false, hidingTO = 0;
  let didFirstSoundRestart = false;
  const handlers = [];

  const setPlayUI = (isPlaying) => {
    const pressed = isPlaying ? 'true' : 'false';
    if (btnPlay) {
      btnPlay.setAttribute('aria-pressed', pressed);
      btnPlay.classList.toggle('is-playing', isPlaying);
    }
    if (centerBtn && centerBtn.classList.contains('is-mode-play')) {
      centerBtn.setAttribute('aria-pressed', pressed);
      centerBtn.classList.toggle('is-playing', isPlaying);
    }
  };
  const setMuteUI = (muted) => {
    if (btnMute) {
      btnMute.setAttribute('aria-pressed', muted ? 'true' : 'false');
      if (muteLabel) muteLabel.textContent = muted ? 'Sound' : 'Mute';
      else btnMute.textContent = muted ? 'Sound' : 'Mute';
    }
  };
  const setPausedUI = (paused) => { wrap.classList.toggle('is-paused', !!paused); };
  const setIdle = (on)=> { wrap.dataset.idle = on ? '1' : '0'; };
  const kickHide = ()=> { clearTimeout(hidingTO); setIdle(false); hidingTO = setTimeout(()=> setIdle(true), 1800); };

  async function ensureFirstFramePainted(v){
    if (v.readyState < 2) {
      await new Promise((res)=>{
        const done = ()=> res();
        v.addEventListener('loadeddata', done, { once:true });
        v.addEventListener('canplay',    done, { once:true });
        setTimeout(done, 3000);
      });
    }
    try { ('fastSeek' in v) ? v.fastSeek(0) : (v.currentTime = Math.max(0.00001, v.currentTime)); } catch(_){}
    try { v.muted = true; v.setAttribute('muted',''); const p=v.play?.(); if (p?.then) await p.catch(()=>{}); } catch(_){}
    await new Promise((res)=>{
      let done=false, cap=setTimeout(()=>{ if(!done){done=true;res();} }, 800);
      const onTU=()=>{ if(!done){done=true; clearTimeout(cap); v.removeEventListener('timeupdate', onTU); requestAnimationFrame(res);} };
      v.addEventListener('timeupdate', onTU, { once:true });
    });
    try { v.pause(); } catch(_){}
  }

  function updateTimeUI(){
    if (!isFinite(video.duration)) return;
    const pct = (video.currentTime / video.duration) * 100;
    if (tlHandle) tlHandle.style.left = pct + '%';
    if (tl) tl.setAttribute('aria-valuenow', String(Math.round(pct)));
    if (video.buffered && video.buffered.length && tlBuf) {
      const end = video.buffered.end(video.buffered.length - 1);
      tlBuf.style.width = Math.min(100, (end / video.duration) * 100) + '%';
    }
  }
  function loop(){ updateTimeUI(); raf = requestAnimationFrame(loop); }

  function seekPct(p){
    if (!isFinite(video.duration)) return;
    p = Math.max(0, Math.min(100, p));
    video.currentTime = (p / 100) * video.duration;
    updateTimeUI();
  }

  function switchCenterToPlayMode(){
    centerBtn.classList.add('is-mode-play');
    centerBtn.setAttribute('aria-label', 'Play/Pause');
    const isPlaying = !video.paused;
    centerBtn.classList.toggle('is-playing', isPlaying);
    centerBtn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
  }

  // Play/Pause from controls
  async function togglePlayFromUser(){
    try{
      if (video.paused) {
        if (video.muted || video.volume === 0) {
          video.muted = false; video.removeAttribute('muted');
          const vol = Number(localStorage.getItem('pp:vol') || 1) || 1;
          video.volume = vol;
          setMuteUI(false);
          didFirstSoundRestart = true;
        }
        await video.play();
      } else {
        await video.pause();
      }
    } catch(_){}
    setPlayUI(!video.paused);
    setPausedUI(video.paused);
    kickHide();
  }
  btnPlay?.addEventListener('click', togglePlayFromUser);
  handlers.push(()=>btnPlay?.removeEventListener('click', togglePlayFromUser));

  // Center button behaviour
  const centerHandler = async ()=>{
    const inPlayMode = centerBtn.classList.contains('is-mode-play');
    if (!inPlayMode) {
      try {
        video.muted = false; video.removeAttribute('muted');
        const vol = Number(localStorage.getItem('pp:vol') || 1) || 1;
        video.volume = vol;
        try { ('fastSeek' in video) ? video.fastSeek(0) : (video.currentTime = 0); } catch(_){ try{ video.currentTime = 0; }catch(__){} }
        await video.play?.();
        switchCenterToPlayMode();
        setMuteUI(false);
        setPlayUI(true);
        setPausedUI(false);
        didFirstSoundRestart = true;
      } catch(_){}
      kickHide();
      return;
    }
    await togglePlayFromUser();
  };
  centerBtn.addEventListener('click', centerHandler);
  handlers.push(()=>centerBtn.removeEventListener('click', centerHandler));

  // Sound button (first unmute restarts)
  const muteHandler = async ()=>{
    const wasMuted = video.muted;
    video.muted = !video.muted;
    if (video.muted) {
      video.setAttribute('muted','');
    } else {
      video.removeAttribute('muted');
      if (video.volume === 0) {
        const vol = Number(localStorage.getItem('pp:vol') || 1) || 1;
        video.volume = vol;
      }
      if (wasMuted && !didFirstSoundRestart) {
        didFirstSoundRestart = true;
        try { ('fastSeek' in video) ? video.fastSeek(0) : (video.currentTime = 0); } catch(_){ try{ video.currentTime = 0; }catch(__){} }
        try { await video.play?.(); } catch(_){}
        setPlayUI(true);
        setPausedUI(false);
      }
      switchCenterToPlayMode();
    }
    localStorage.setItem('pp:muted', video.muted ? '1' : '0');
    setMuteUI(video.muted);
    kickHide();
  };
  btnMute?.addEventListener('click', muteHandler);
  handlers.push(()=>btnMute?.removeEventListener('click', muteHandler));

  // Fullscreen
  function updateFSLabel(){
    if (!btnFS) return;
    const inFS = !!document.fullscreenElement && (document.fullscreenElement === wrap || wrap.contains(document.fullscreenElement));
    btnFS.textContent = inFS ? 'Minimise' : 'Fullscreen';
    btnFS.setAttribute('aria-label', inFS ? 'Exit fullscreen' : 'Toggle fullscreen');
  }
  const fsChange = () => updateFSLabel();
  document.addEventListener('fullscreenchange', fsChange);
  handlers.push(()=>document.removeEventListener('fullscreenchange', fsChange));

  const fsHandler = async ()=>{
    try{
      if (!document.fullscreenElement) { await wrap.requestFullscreen?.(); }
      else { await document.exitFullscreen?.(); }
    } catch(_){}
    kickHide();
  };
  btnFS?.addEventListener('click', fsHandler);
  handlers.push(()=>btnFS?.removeEventListener('click', fsHandler));

  // Timeline (drag + keyboard)
  if (tl) {
    const onDown = (e)=>{
      dragging = true; tl.setPointerCapture?.(e.pointerId);
      const r = tl.getBoundingClientRect();
      seekPct(((e.clientX - r.left) / r.width) * 100);
      kickHide();
    };
    const onMove = (e)=>{
      if (!dragging) return;
      const r = tl.getBoundingClientRect();
      seekPct(((e.clientX - r.left) / r.width) * 100);
    };
    const endDrag = ()=> { dragging = false; };
    const onKey = (e)=>{
      const step = (e.shiftKey ? 10 : 5);
      const now = Number(tl.getAttribute('aria-valuenow') || 0);
      if (e.key === 'ArrowRight'){ seekPct(now + step); e.preventDefault(); }
      if (e.key === 'ArrowLeft'){  seekPct(now - step); e.preventDefault(); }
    };
    tl.addEventListener('pointerdown', onDown);
    tl.addEventListener('pointermove', onMove);
    tl.addEventListener('pointerup', endDrag);
    tl.addEventListener('pointercancel', endDrag);
    tl.addEventListener('keydown', onKey);
    handlers.push(()=>{ tl.removeEventListener('pointerdown', onDown); tl.removeEventListener('pointermove', onMove);
                        tl.removeEventListener('pointerup', endDrag); tl.removeEventListener('pointercancel', endDrag);
                        tl.removeEventListener('keydown', onKey); });
  }

  // Idle show/hide
  ['mousemove','pointermove','touchstart','keydown'].forEach((evt)=>{
    const fn = ()=> kickHide();
    wrap.addEventListener(evt, fn, { passive:true });
    handlers.push(()=>wrap.removeEventListener(evt, fn));
  });
  kickHide();

  // Start pipeline
  (async function(){
    await ensureFirstFramePainted(video);
    try { await video.play(); } catch(_){}
    setPlayUI(!video.paused);
    setPausedUI(video.paused);

    // Start in "unmute first" mode
    centerBtn.classList.remove('is-mode-play');
    centerBtn.setAttribute('aria-label', 'Unmute');
    setMuteUI(true);

    requestAnimationFrame(()=> requestAnimationFrame(()=> updateTimeUI()));
    raf = requestAnimationFrame(loop);
    updateFSLabel();
  })();

  // Keep UI in sync
  const onPlay    = ()=>{ setPlayUI(true);  setPausedUI(false); };
  const onPlaying = ()=>{                   setPausedUI(false); };
  const onPause   = ()=>{ setPlayUI(false); setPausedUI(true);  };
  const onEnded   = ()=>{ setPlayUI(false); setPausedUI(true);  };
  const onTU      = ()=> { if (!dragging) updateTimeUI(); };

  video.addEventListener('play',    onPlay);
  video.addEventListener('playing', onPlaying);
  video.addEventListener('pause',   onPause);
  video.addEventListener('ended',   onEnded);
  video.addEventListener('timeupdate', onTU);

  handlers.push(()=>{ video.removeEventListener('play', onPlay);
                      video.removeEventListener('playing', onPlaying);
                      video.removeEventListener('pause', onPause);
                      video.removeEventListener('ended', onEnded);
                      video.removeEventListener('timeupdate', onTU); });

  // Cleanup when container is torn down
  return () => {
    try { cancelAnimationFrame(raf); video.pause(); video.muted = true; } catch(_){}
    handlers.forEach(fn=>fn());
    clearTimeout(hidingTO);
    delete wrap.dataset.scriptInitialized;
  };
}

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
