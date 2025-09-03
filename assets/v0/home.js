/*! home.js — Barba-aware hero list + video pool + filter (init/destroy safe) */
(() => {
  if (window.__HomeFeatureLoaded) return; window.__HomeFeatureLoaded = true;

  // --- tiny utils -----------------------------------------------------------
  const qsa = (r, sel) => Array.from(r.querySelectorAll(sel));
  const norm = s => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
  const rIC = window.requestIdleCallback || ((fn) => setTimeout(fn, 250));

  // keep one live instance across swaps
  let current = null;

  function createInstance(root) {
    const section = root.querySelector(".home-hero_wrap");
    const stage   = section?.querySelector(".home-hero_video");
    const listPar = section?.querySelector(".home-hero_list_parent");
    if (!section || !stage || !listPar) return null;

    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reduceData   = matchMedia("(prefers-reduced-data: reduce)").matches;

    // ---- preconnect all video origins (teaser + main) ----------------------
    (function preconnect() {
      const head = document.head;
      const seen = new Set();
      const links = qsa(section, ".home-hero_link");
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
        } catch(_) {}
      }
      for (let i = 0; i < links.length; i++) {
        addOrigin(links[i].getAttribute("data-video"));
        addOrigin(links[i].getAttribute("data-video-main"));
      }
    })();

    // ---- video pool ---------------------------------------------------------
    const videoBySrc = new Map();
    let activeVideo = null, activeLink = null;
    const MAX_EAGER = Number(section.getAttribute("data-warm-eager") || 3);
    const disposers = [];

    function createVideo(src) {
      if (!src) return null;
      let v = videoBySrc.get(src);
      if (v) return v;
      v = document.createElement("video");
      v.className = "home-hero_video_el";
      v.src = src; v.muted = true; v.loop = true; v.playsInline = true;
      v.preload = "auto"; v.crossOrigin = "anonymous";
      stage.appendChild(v);
      videoBySrc.set(src, v);
      return v;
    }

    function warmVideo(v) {
      if (!v || v.__warmed || reduceData) return;
      v.__warmed = true;
      const start = () => {
        v.play().then(() => {
          setTimeout(() => { if (!v.__keepAlive) { try { v.pause(); } catch(_){} } }, 220);
        }).catch(()=>{});
      };
      (v.readyState >= 2)
        ? start()
        : v.addEventListener("canplaythrough", start, { once: true });
    }

    const links = qsa(section, ".home-hero_link");
    for (let i = 0; i < links.length; i++) {
      const v = createVideo(links[i].getAttribute("data-video"));
      if (!v) continue;
      if (i < MAX_EAGER) warmVideo(v);
      else rIC(() => warmVideo(v));
    }

    const defaultFadeSel = ".home-category_ref_text, .home-hero_title, .home-hero_name, .home-hero_heading";
    const fadeTargetsFor = (link) => link.querySelectorAll(link.getAttribute("data-fade-target") || defaultFadeSel);

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
      try { ("fastSeek" in v) ? v.fastSeek(0) : (v.currentTime = 0); } catch(_) {}
      v.play().catch(()=>{});
    }

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
      if (linkEl && linkEl !== activeLink) {
        updateLinkState(activeLink, linkEl);
        activeLink = linkEl;
      }
      if (!reduceMotion) restart(next);
    }

    // ---- cache cats & hide "Selected" pill clones once ---------------------
    (function cacheCats() {
      const items = qsa(section, ".home-hero_list");
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const cats = new Set();
        qsa(it, ".home-category_ref_text").forEach(n => {
          const t = norm(n.textContent);
          if (t === "selected") n.setAttribute("hidden", "");
          if (t) cats.add(t);
        });
        it.dataset.cats = Array.from(cats).join("|");
      }
    })();

    // ---- ghost exit layer (1 per document) ---------------------------------
    function ghostLayer() {
      let gl = document.__ghostExitLayer;
      if (gl && document.body.contains(gl)) return gl;
      gl = document.createElement("div");
      gl.className = "ghost-exit-layer";
      document.body.appendChild(gl);
      document.__ghostExitLayer = gl;
      return gl;
    }
    function stripArtifacts(root) {
      qsa(root, '[data-animate-chars],[data-animate-chars-inner]').forEach(n=>{
        n.removeAttribute('data-animate-chars'); n.removeAttribute('data-animate-chars-inner');
      });
      const nodes = [root, ...qsa(root, "*")];
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
      g.setAttribute("aria-hidden", "true");
      const cs = getComputedStyle(el);
      Object.assign(g.style, {
        color: cs.color, position: "fixed", margin: "0",
        left: rect.left + "px", top: rect.top + "px",
        width: rect.width + "px", height: rect.height + "px",
        pointerEvents: "none", willChange: "transform,opacity",
        backfaceVisibility: "hidden", transform: "translateZ(0)", background: "transparent"
      });
      stripArtifacts(g);
      ghostLayer().appendChild(g);
      return g;
    }

    // ---- filter (FLIP + ghost exits, trimmed for reliability) --------------
    function applyFilterFLIP(label) {
      const key = norm(label) || "all";
      const items = qsa(section, ".home-hero_list");

      const visibleBefore = items.filter(it => it.style.display !== "none");
      const rectBefore = new Map();
      for (let i = 0; i < visibleBefore.length; i++) {
        rectBefore.set(visibleBefore[i], visibleBefore[i].getBoundingClientRect());
      }

      const toStay = [], toExit = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const match = (key === "all") ? true : (it.dataset.cats || "").split("|").includes(key);
        if (match) toStay.push(it);
        else if (it.style.display !== "none") toExit.push(it);
      }

      const ghosts = [];
      for (let i = 0; i < toExit.length; i++) {
        const el = toExit[i];
        const r = rectBefore.get(el);
        if (!r) continue;
        ghosts.push(makeGhost(el, r));
        el.style.display = "none";
      }

      let firstVisibleLink = null;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const show = toStay.includes(it);
        if (show) {
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

      // re-hide "Selected"
      qsa(section, ".home-category_ref_text").forEach(n => {
        if (norm(n.textContent) === "selected") n.setAttribute("hidden", "");
      });

      listPar.style.pointerEvents = "none";

      requestAnimationFrame(() => {
        const visibleAfter = toStay.filter(el => el.style.display !== "none");
        const rectAfter = new Map();
        for (let i = 0; i < visibleAfter.length; i++) {
          rectAfter.set(visibleAfter[i], visibleAfter[i].getBoundingClientRect());
        }

        const MOVE_DUR = reduceMotion ? 0 : 0.36;
        const ENTER_DUR = reduceMotion ? 0 : 0.32;
        const EXIT_DUR = reduceMotion ? 0 : 0.30;
        const EASE_MOVE = "cubic-bezier(.16,.84,.28,1)";
        const EASE_ENTER= "cubic-bezier(.22,1,.36,1)";
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
                  [{opacity:0, transform:"translateY(12px) translateZ(0)"},{opacity:1, transform:"translateY(0) translateZ(0)"}],
                  {duration:ENTER_DUR*1000, easing:EASE_ENTER, delay:i*STAGGER, fill:"both"}
                ).finished.catch(()=>{})
              );
            } else {
              el.style.opacity = "";
              el.style.transform = "";
            }
            continue;
          }

          const dx = before.left - after.left;
          const dy = before.top - after.top;
          if (dx || dy) {
            anims.push(
              el.animate(
                [{transform:`translate(${dx}px, ${dy}px) translateZ(0)`},{transform:"translate(0,0) translateZ(0)"}],
                {duration:MOVE_DUR*1000, easing:EASE_MOVE, delay:i*STAGGER, fill:"both"}
              ).finished.catch(()=>{})
            );
          } else {
            el.style.opacity = "";
          }
        }

        for (let i = 0; i < ghosts.length; i++) {
          const g = ghosts[i];
          anims.push(
            g.animate(
              [{opacity:1, transform:"translateY(0) translateZ(0)"},{opacity:0, transform:"translateY(-10px) translateZ(0)"}],
              {duration:EXIT_DUR*1000, easing:EASE_EXIT, delay:i*STAGGER, fill:"both"}
            ).finished.then(()=>{ try{ g.remove(); }catch(_){} }).catch(()=>{ try{ g.remove(); }catch(_){} })
          );
        }

        Promise.allSettled(anims).finally(() => {
          visibleAfter.forEach(el => {
            el.style.willChange = ""; el.style.opacity = ""; el.style.transform = ""; el.style.backfaceVisibility = "";
          });
          listPar.style.pointerEvents = "";

          // repair active selection if filtered out
          if (activeLink &&
              activeLink.closest(".home-hero_list")?.style.display === "none" &&
              firstVisibleLink) {
            const src = firstVisibleLink.getAttribute("data-video");
            if (src) setActive(src, firstVisibleLink);
          }
          // repair focus
          if (document.activeElement &&
              document.activeElement.closest(".home-hero_list")?.style.display === "none" &&
              firstVisibleLink) {
            firstVisibleLink.focus({ preventScroll: true });
          }
        });
      });
    }

    // ---- categories UI ------------------------------------------------------
    (function categoriesUI(){
      const BTN_SEL = ".home-category_text";
      const catWrap = document.querySelector(".home_hero_categories");
      if (!catWrap) return;

      function ensureAllButton() {
        const buttons = qsa(catWrap, BTN_SEL);
        let allBtn = buttons.find(b => norm(b.textContent) === "all") || null;
        if (!allBtn) {
          const item = document.createElement("div");
          item.setAttribute("role","listitem");
          item.className = "home-hero_category u-text-style-main w-dyn-item";
          const a = document.createElement("a");
          a.href = "#";
          a.className = "home-category_text u-text-style-main";
          a.textContent = "All";
          a.setAttribute("data-animate-chars","");
          a.setAttribute("aria-current","true");
          a.setAttribute("data-animate-delay", catWrap.getAttribute("data-animate-delay") || "0.012");
          item.appendChild(a);
          catWrap.insertBefore(item, catWrap.firstChild);
          allBtn = a;
        }
        return allBtn;
      }

      function setActive(label) {
        const key = norm(label);
        qsa(catWrap, BTN_SEL).forEach((b) => {
          const isActive = norm(b.textContent) === key;
          b.setAttribute("aria-current", isActive ? "true" : "false");
          b.classList.toggle("u-color-faded", !isActive);
        });
      }

      function onClick(e) {
        const btn = e.target.closest(BTN_SEL);
        if (!btn || !catWrap.contains(btn)) return;
        e.preventDefault();
        const label = btn.textContent || "All";
        setActive(label);
        applyFilterFLIP(label);
      }

      ensureAllButton();
      setActive("All");
      applyFilterFLIP("All");
      catWrap.addEventListener("click", onClick, { passive:false });
      disposers.push(() => catWrap.removeEventListener("click", onClick));
    })();

    // ---- default active = first link ---------------------------------------
    (function selectFirst(){
      const first = links[0];
      if (!first) return;
      const src = first.getAttribute("data-video");
      const v = createVideo(src);
      if (v) v.__keepAlive = true;
      setActive(src, first);
    })();

    // ---- hover / focus / touch activation ----------------------------------
    function onPointerOver(e) {
      const a = e.target.closest?.(".home-hero_link");
      if (!a || !listPar.contains(a) || a === activeLink) return;
      const src = a.getAttribute("data-video");
      if (src) setActive(src, a);
    }
    listPar.addEventListener("pointerover", onPointerOver, { passive:true });
    listPar.addEventListener("focusin", onPointerOver);
    listPar.addEventListener("touchstart", onPointerOver, { passive:true });
    disposers.push(() => {
      listPar.removeEventListener("pointerover", onPointerOver);
      listPar.removeEventListener("focusin", onPointerOver);
      listPar.removeEventListener("touchstart", onPointerOver);
    });

    // ---- pause when tab hidden ---------------------------------------------
    function onVis() {
      if (document.hidden) {
        qsa(stage, ".home-hero_video_el").forEach(v => { try { v.pause(); } catch(_){} });
      }
    }
    document.addEventListener("visibilitychange", onVis);
    disposers.push(() => document.removeEventListener("visibilitychange", onVis));

    // public destroy
    function destroy() {
      // listeners
      while (disposers.length) { try { disposers.pop()(); } catch(_){} }
      // videos
      videoBySrc.forEach(v => { try { v.pause(); } catch(_){} });
      // no DOM removals; Barba will swap container anyway
    }

    return { destroy };
  }

  // --- boot on hard load + every Barba swap ---------------------------------
  function boot(container) {
    // tear down prior
    if (current && current.destroy) { try { current.destroy(); } catch(_){} }
    current = createInstance(container || document) || null;
  }

  const getNs = () => document.querySelector('[data-barba="container"]')?.dataset.barbaNamespace || "";

  // hard load
  if (getNs() === "home") boot(document);

  // after every Barba swap
  document.addEventListener("page:enter", (e) => {
    const ns = (e?.detail?.namespace || "").toLowerCase();
    if (ns === "home") boot(e.detail.container || document);
  });
})();
