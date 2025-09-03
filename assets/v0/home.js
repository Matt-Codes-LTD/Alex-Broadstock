document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".home-hero_wrap").forEach((section) => {
    if (section.dataset.scriptInitialized) return;
    section.dataset.scriptInitialized = "true";

    const log  = (...a)=>console.log("[home-hero+intro]",...a);
    const warn = (...a)=>console.warn("[home-hero+intro]",...a);

    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reduceData   = matchMedia("(prefers-reduced-data: reduce)").matches;
    const normalize = (s) => (s || "").replace(/\s+/g, " ").trim().toLowerCase();

    const stage = section.querySelector(".home-hero_video");
    const listParent = section.querySelector(".home-hero_list_parent");
    if (!stage || !listParent) return;

    const links = Array.from(section.querySelectorAll(".home-hero_link"));

    /* -----------------------------
       0) INTRO helpers (markup/css)
       ----------------------------- */
    function ensureIntroStyleOnce(){
      if (document.getElementById("home-intro-css")) return;
      const style = document.createElement("style");
      style.id = "home-intro-css";
      style.textContent = `
      .home-intro_wrap{position:fixed;inset:0;background:#000;color:#fff;pointer-events:none;opacity:1;z-index:9999;isolation:isolate;contain:layout paint size;will-change:opacity,transform}
      .home-intro_layout{text-align:center}
      .home-intro_heading{line-height:1;white-space:nowrap;letter-spacing:.02em;will-change:transform,opacity}
      .home-intro_heading .intro-char{display:inline-block;transform:translateY(15px);opacity:0;will-change:transform,opacity}
      .home-intro_heading .intro-word{display:inline-block;will-change:transform}
      .home-intro_video{width:120px;height:120px;border-radius:8px;overflow:hidden;opacity:0;will-change:width,height,opacity,border-radius,transform;margin-inline:auto}
      .home-intro_video>video{width:100%;height:100%;object-fit:cover;display:block;transform:translateZ(0);pointer-events:none}`;
      document.head.appendChild(style);
    }
    function ensureIntroMarkupOnce(){
      let intro = document.querySelector(".home-intro_wrap");
      if (!intro) {
        intro = document.createElement("section");
        intro.className = "home-intro_wrap";
        intro.setAttribute("aria-hidden","true");
        intro.setAttribute("data-intro-enabled","1");
        intro.innerHTML = `
          <div class="home-intro_contain u-container-full u-width-full u-height-full">
            <div class="home-intro_layout u-cover-absolute u-flex-vertical u-align-items-center u-justify-content-center u-gap-6">
              <h1 class="home-intro_heading u-text-style-display" data-intro-title>Alex Broadstock</h1>
              <div class="home-intro_video" data-intro-video></div>
            </div>
          </div>`;
        document.body.prepend(intro);
      }
      return intro;
    }
    function splitTitle(el){
      const text = (el.textContent||"").trim().replace(/\s+/g," ");
      const parts = text.split(" ");
      const w1 = parts[0]||"", w2 = parts.slice(1).join(" ");
      const wrap = (t)=>{ const w=document.createElement("span"); w.className="intro-word"; t.split("").forEach(ch=>{const s=document.createElement("span"); s.className="intro-char"; s.textContent=ch; w.appendChild(s)}); return w; };
      el.textContent=""; el.appendChild(wrap(w1)); if (w2){ el.append(" ",wrap(w2)); }
      return { wordLeft: el.querySelectorAll(".intro-word")[0], wordRight: el.querySelectorAll(".intro-word")[1]||null, chars: el.querySelectorAll(".intro-char") };
    }
    function fallbackCover(intro, hold=900, fade=300){
      setTimeout(()=>{ intro.style.transition=`opacity ${fade}ms ease`; intro.style.opacity="0";
        setTimeout(()=> intro.remove(), fade+40);
      }, hold);
    }
    function loadScript(src){ return new Promise((res,rej)=>{ const s=document.createElement("script"); s.src=src; s.defer=true; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }
    async function ensureGSAPFlip(){
      if (!window.gsap) await loadScript("https://unpkg.com/gsap@3.12.5/dist/gsap.min.js").catch(()=>{});
      if (window.gsap && !gsap.Flip) await loadScript("https://unpkg.com/gsap@3.12.5/dist/Flip.min.js").catch(()=>{});
      return !!(window.gsap && gsap.Flip);
    }

    /* -----------------------------
       1) Preconnect video origins
       ----------------------------- */
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
          l1.rel = "preconnect"; l1.href = u.origin; l1.crossOrigin = "anonymous"; head.appendChild(l1);
          const l2 = document.createElement("link");
          l2.rel = "dns-prefetch"; l2.href = u.origin; head.appendChild(l2);
        } catch (_) {}
      }
      for (let i = 0; i < links.length; i++) {
        addOrigin(links[i].dataset.video);
        addOrigin(links[i].dataset.videoMain);
      }
    })();

    /* -----------------------------
       2) Video pool (create/warm)
       ----------------------------- */
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
      if (!v || v.__warmed || reduceData) return;
      v.__warmed = true;
      const start = () => {
        v.play().then(() => {
          setTimeout(() => { if (!v.__keepAlive) { try { v.pause(); } catch (_) {} } }, 250);
        }).catch(() => {});
      };
      (v.readyState >= 2) ? start() : v.addEventListener("canplaythrough", start, { once: true });
    }
    // create + warm teasers
    for (let i = 0; i < links.length; i++) {
      const v = createVideo(links[i].dataset.video);
      if (!v) continue;
      if (i < MAX_EAGER) warmVideo(v);
      else (window.requestIdleCallback || ((fn) => setTimeout(fn, 400)))(() => warmVideo(v));
    }

    /* -----------------------------
       3) INTRO (cover → split → FLIP)
       ----------------------------- */
    async function runIntro(){
      ensureIntroStyleOnce();
      const intro = ensureIntroMarkupOnce();
      const titleEl = intro.querySelector("[data-intro-title]");
      const videoHost = intro.querySelector("[data-intro-video]");
      if (!titleEl || !videoHost) return;

      if (reduceMotion) { log("Reduced motion → fallback"); return fallbackCover(intro); }

      const ok = await ensureGSAPFlip();
      if (!ok) { warn("GSAP Flip not available → fallback"); return fallbackCover(intro); }

      const { wordLeft, wordRight, chars } = splitTitle(titleEl);

      // pick a hero video: prefer active or first link's
      let heroV = stage.querySelector(".home-hero_video_el.is-active")
               || stage.querySelector(".home-hero_video_el");
      if (!heroV && links.length) heroV = createVideo(links[0].dataset.video);

      if (!heroV) { warn("No hero video for intro; fallback"); return fallbackCover(intro); }

      try { heroV.play?.(); } catch(_) {}

      // letters rise
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.addLabel("start")
        .to(chars, { duration:.5, y:0, opacity:1, stagger:{ each:.02 } }, "start+=0.2")
        .to(wordLeft,  { duration:.55, xPercent:-120, ease:"power3.inOut" }, "start+=0.7")
        .to(wordRight, { duration:.55, xPercent: 120, ease:"power3.inOut" }, "start+=0.7")
        .to(videoHost, { duration:.2, opacity:1, ease:"power1.out" }, "start+=0.85");

      // FLIP morph: capture end state (video in stage, full bleed) then animate from square
      const endState = gsap.Flip.getState(heroV, { props: "transform,opacity,width,height" });
      // move into square
      videoHost.appendChild(heroV);
      heroV.style.position = "absolute";
      heroV.style.inset = "0";
      heroV.style.width = "100%";
      heroV.style.height = "100%";
      heroV.style.opacity = "1";

      // schedule FLIP back to stage as the grow
      const doFlip = () => {
        stage.appendChild(heroV);
        heroV.style.position = ""; heroV.style.inset = ""; heroV.style.width = ""; heroV.style.height = "";
        stage.querySelectorAll(".home-hero_video_el.is-active").forEach(v => v.classList.remove("is-active"));
        heroV.classList.add("is-active");
        gsap.Flip.from(endState, {
          duration: .9,
          ease: "power4.inOut",
          absolute: true
        });
      };
      tl.add(doFlip, "start+=1.0")
        .to(titleEl, { duration:.35, opacity:0, ease:"power2.out" }, "start+=1.0")
        .to(intro,   { duration:.35, opacity:0, ease:"power2.out", onComplete: ()=> intro.remove() }, "start+=1.95");

      return new Promise((resolve)=> tl.eventCallback("onComplete", resolve));
    }

    /* Run the intro now (await), then continue hero setup */
    // We want the first active video ready before intro: mark first as keepAlive + active early.
    (function ensureInitialActive(){
      if (!links.length) return;
      const first = links[0];
      const src = first.dataset.video;
      const v = createVideo(src);
      if (v) { v.__keepAlive = true; v.classList.add("is-active"); try{v.play()}catch(_){}} 
    })();

    // Await intro (non-blocking UX; everything else starts right after anyway)
    // We don't hard block the rest; we just kick it and continue.
    runIntro().catch(()=>{});

    /* -----------------------------
       4) HERO logic (your code)
       ----------------------------- */
    const defaultFadeSel = ".home-category_ref_text, .home-hero_title, .home-hero_name, .home-hero_heading";
    const fadeTargetsFor = (link) => link.querySelectorAll(link.getAttribute("data-fade-target") || defaultFadeSel);

    let activeVideo = stage.querySelector(".home-hero_video_el.is-active") || null;
    let activeLink = null;

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
      if (!reduceMotion) restart(next);
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

    // Ghost layer
    const ghostLayer = (() => {
      let gl = document.__ghostExitLayer;
      if (gl && document.body.contains(gl)) return gl;
      gl = document.createElement("div");
      Object.assign(gl.style, {
        position: "fixed", left: "0", top: "0", width: "100vw", height: "100vh",
        pointerEvents: "none", zIndex: "999", background: "transparent",
        contain: "layout paint", isolation: "isolate"
      });
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

    // FLIP filter with ghost exits (Web Animations API)
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
        const MOVE_DUR = reduceMotion ? 0 : 0.36;
        const ENTER_DUR = reduceMotion ? 0 : 0.32;
        const EXIT_DUR = reduceMotion ? 0 : 0.30;
        const EASE_MOVE = "cubic-bezier(.16,.84,.28,1)";
        const EASE_ENTER = "cubic-bezier(.22,1,.36,1)";
        const EASE_EXIT = "cubic-bezier(.36,0,.1,1)";
        const STAGGER = 12;
        const anims = [];

        // MOVE / ENTER
        for (let i = 0; i < visibleAfter.length; i++) {
          const el = visibleAfter[i];
          const before = rectBefore.get(el);
          const after = rectAfter.get(el);

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
              activeLink.closest(".home-hero_list")?.style.display === "none" &&
              firstVisibleLink) {
            const src = firstVisibleLink.dataset.video;
            if (src) setActive(src, firstVisibleLink);
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

      function setActive(label) {
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
        setActive(label);
        applyFilterFLIP(label);
      }

      ensureAllButton();
      setActive("All");
      applyFilterFLIP("All");
      catWrap.addEventListener("click", onClick, { passive: false });
    })();

    // Default active = first link (if intro didn't already set it)
    if (links.length && !activeLink) {
      const first = links[0];
      const src = first.dataset.video;
      const v = videoBySrc.get(src) || createVideo(src);
      if (v) v.__keepAlive = true;
      setActive(src, first);
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
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stage.querySelectorAll(".home-hero_video_el").forEach(v => { try { v.pause(); } catch(_){}} );
      }
    });
  });
});
