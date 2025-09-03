(function(){
  function initHome(root){
    (root || document).querySelectorAll(".home-hero_wrap").forEach(function(section){
      if (section.dataset.scriptInitialized) return;
      section.dataset.scriptInitialized = "true";

      var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
      var reduceData   = matchMedia("(prefers-reduced-data: reduce)").matches;
      var normalize = function(s){ return (s || "").replace(/\s+/g," ").trim().toLowerCase(); };

      var stage = section.querySelector(".home-hero_video");
      var listParent = section.querySelector(".home-hero_list_parent");
      if (!stage || !listParent) return;

      var links = Array.prototype.slice.call(section.querySelectorAll(".home-hero_link"));

      // Preconnect video origins
      (function(){
        var head = document.head, seen = new Set();
        function addOrigin(val){
          try{
            var u = new URL(val || "", location.href);
            if (!u.origin || seen.has(u.origin)) return; seen.add(u.origin);
            var exists = Array.prototype.slice.call(head.querySelectorAll('link[rel="preconnect"],link[rel="dns-prefetch"]')).some(function(l){ return (l.href || "").startsWith(u.origin); });
            if (exists) return;
            var l1 = document.createElement("link"); l1.rel = "preconnect"; l1.href = u.origin; l1.crossOrigin = "anonymous"; head.appendChild(l1);
            var l2 = document.createElement("link"); l2.rel = "dns-prefetch"; l2.href = u.origin; head.appendChild(l2);
          }catch(_){}
        }
        for (var i=0;i<links.length;i++){ addOrigin(links[i].dataset.video); addOrigin(links[i].dataset.videoMain); }
      })();

      // Video pool
      var videoBySrc = new Map();
      var MAX_EAGER = Number(section.getAttribute("data-warm-eager") || 3);

      function createVideo(src){
        if (!src) return null;
        var v = videoBySrc.get(src);
        if (v) return v;
        v = document.createElement("video");
        v.className = "home-hero_video_el";
        v.src = src; v.muted = true; v.loop = true; v.playsInline = true; v.preload = "auto"; v.crossOrigin = "anonymous";
        stage.appendChild(v);
        videoBySrc.set(src, v);
        return v;
      }
      function warmVideo(v){
        if (!v || v.__warmed || reduceData) return;
        v.__warmed = true;
        var start = function(){
          v.play().then(function(){ setTimeout(function(){ if (!v.__keepAlive) { try{ v.pause(); }catch(_){}} }, 250); }).catch(function(){});
        };
        (v.readyState >= 2) ? start() : v.addEventListener("canplaythrough", start, { once:true });
      }
      for (var i=0;i<links.length;i++){
        var v = createVideo(links[i].dataset.video);
        if (!v) continue;
        if (i < MAX_EAGER) warmVideo(v);
        else (window.requestIdleCallback || function(fn){ setTimeout(fn,400); })(function(){ warmVideo(v); });
      }

      // Helpers
      var defaultFadeSel = ".home-category_ref_text, .home-hero_title, .home-hero_name, .home-hero_heading";
      var fadeTargetsFor = function(link){ return link.querySelectorAll(link.getAttribute("data-fade-target") || defaultFadeSel); };
      var activeVideo = null, activeLink = null;

      function updateLinkState(prev, next){
        if (prev && prev !== next){ prev.setAttribute("aria-current","false"); fadeTargetsFor(prev).forEach(function(n){ n.classList.add("u-color-faded"); }); }
        if (next){ next.setAttribute("aria-current","true"); fadeTargetsFor(next).forEach(function(n){ n.classList.remove("u-color-faded"); }); }
      }
      function restart(v){
        if (!v) return;
        try{ ("fastSeek" in v) ? v.fastSeek(0) : (v.currentTime = 0); }catch(_){}
        v.play().catch(function(){});
      }
      function setActive(src, linkEl){
        var next = videoBySrc.get(src) || createVideo(src);
        if (!next) return;
        next.__keepAlive = true;
        if (activeVideo && activeVideo !== next) activeVideo.__keepAlive = false;
        if (next !== activeVideo){
          if (activeVideo) activeVideo.classList.remove("is-active");
          next.classList.add("is-active");
          activeVideo = next;
        }
        if (linkEl && linkEl !== activeLink){ updateLinkState(activeLink, linkEl); activeLink = linkEl; }
        if (!reduceMotion) restart(next);
      }

      // Cache cats + hide Selected
      (function(){
        var items = Array.prototype.slice.call(section.querySelectorAll(".home-hero_list"));
        for (var i=0;i<items.length;i++){
          var it = items[i], cats = new Set();
          it.querySelectorAll(".home-category_ref_text").forEach(function(n){
            var t = normalize(n.textContent);
            if (t === "selected") n.setAttribute("hidden","");
            if (t) cats.add(t);
          });
          it.dataset.cats = Array.from(cats).join("|");
        }
      })();

      // Ghost layer (shared)
      var ghostLayer = (function(){
        var gl = document.__ghostExitLayer;
        if (gl && document.body.contains(gl)) return gl;
        gl = document.createElement("div");
        gl.style.position="fixed"; gl.style.left="0"; gl.style.top="0"; gl.style.width="100vw"; gl.style.height="100vh";
        gl.style.pointerEvents="none"; gl.style.zIndex="999"; gl.style.background="transparent"; gl.style.contain="layout paint"; gl.style.isolation="isolate";
        document.body.appendChild(gl); document.__ghostExitLayer = gl; return gl;
      })();
      function stripArtifacts(root){
        root.querySelectorAll('[data-animate-chars],[data-animate-chars-inner]').forEach(function(n){ n.removeAttribute('data-animate-chars'); n.removeAttribute('data-animate-chars-inner'); });
        var nodes = [root].concat(Array.prototype.slice.call(root.querySelectorAll('*')));
        for (var i=0;i<nodes.length;i++){
          var n = nodes[i];
          n.style.background="transparent"; n.style.boxShadow="none"; n.style.textShadow="none"; n.style.mixBlendMode="normal"; n.style.webkitTextFillColor="currentColor";
        }
      }
      function makeGhost(el, rect){
        var g = el.cloneNode(true); g.setAttribute('aria-hidden','true');
        var cs = getComputedStyle(el);
        g.style.color = cs.color; g.style.position="fixed"; g.style.margin="0";
        g.style.left = rect.left+"px"; g.style.top = rect.top+"px"; g.style.width = rect.width+"px"; g.style.height = rect.height+"px";
        g.style.pointerEvents="none"; g.style.willChange="transform,opacity"; g.style.backfaceVisibility="hidden"; g.style.transform="translateZ(0)"; g.style.background="transparent";
        stripArtifacts(g); ghostLayer.appendChild(g); return g;
      }

      // FLIP filter with ghost exits
      function applyFilterFLIP(label){
        var items = Array.prototype.slice.call(section.querySelectorAll(".home-hero_list"));
        var key = normalize(label) || "all";

        // BEFORE
        var visibleBefore = items.filter(function(it){ return it.style.display !== "none"; });
        var rectBefore = new Map();
        for (var i=0;i<visibleBefore.length;i++){ rectBefore.set(visibleBefore[i], visibleBefore[i].getBoundingClientRect()); }

        // Decide
        var toStayOrEnter=[], toExit=[];
        for (var i=0;i<items.length;i++){
          var it = items[i];
          var match = (key === "all") ? true : (it.dataset.cats || "").split("|").includes(key);
          if (match) toStayOrEnter.push(it); else if (it.style.display !== "none") toExit.push(it);
        }

        // Ghosts for exits
        var ghosts=[];
        for (var i=0;i<toExit.length;i++){
          var el = toExit[i], r = rectBefore.get(el);
          if (!r) continue;
          var g = makeGhost(el, r); ghosts.push(g); el.style.display="none";
        }

        // MUTATE
        var firstVisibleLink = null;
        for (var i=0;i<items.length;i++){
          var it = items[i]; var shouldShow = toStayOrEnter.indexOf(it) > -1;
          if (shouldShow){
            if (it.style.display === "none"){ it.style.display=""; it.style.opacity="0"; }
            if (!firstVisibleLink) firstVisibleLink = it.querySelector(".home-hero_link");
          } else {
            if (toExit.indexOf(it) === -1) it.style.display="none";
          }
          it.style.transform="none"; it.style.willChange="transform, opacity"; it.style.backfaceVisibility="hidden"; it.style.transformOrigin="50% 50% 0";
        }

        // Re-hide Selected pills
        section.querySelectorAll(".home-category_ref_text").forEach(function(n){ if (normalize(n.textContent) === "selected") n.setAttribute("hidden",""); });

        listParent.style.pointerEvents = "none";

        // AFTER
        requestAnimationFrame(function(){
          var visibleAfter = toStayOrEnter.filter(function(el){ return el.style.display !== "none"; });
          var rectAfter = new Map();
          for (var i=0;i<visibleAfter.length;i++){ rectAfter.set(visibleAfter[i], visibleAfter[i].getBoundingClientRect()); }

          var MOVE_DUR = reduceMotion ? 0 : 0.36;
          var ENTER_DUR= reduceMotion ? 0 : 0.32;
          var EXIT_DUR = reduceMotion ? 0 : 0.30;
          var EASE_MOVE="cubic-bezier(.16,.84,.28,1)";
          var EASE_ENTER="cubic-bezier(.22,1,.36,1)";
          var EASE_EXIT="cubic-bezier(.36,0,.1,1)";
          var STAGGER=12;
          var anims=[];

          // MOVE / ENTER
          for (var i=0;i<visibleAfter.length;i++){
            var el = visibleAfter[i];
            var before = rectBefore.get(el);
            var after  = rectAfter.get(el);

            if (!before){
              if (ENTER_DUR){
                anims.push(el.animate(
                  [{opacity:0, transform:"translateY(12px) translateZ(0)"},{opacity:1, transform:"translateY(0px) translateZ(0)"}],
                  {duration:ENTER_DUR*1000, easing:EASE_ENTER, delay:i*STAGGER, fill:"both"}
                ).finished.catch(function(){}));
              } else { el.style.opacity=""; el.style.transform=""; }
              continue;
            }

            var dx = (before.left - after.left), dy = (before.top - after.top);
            if (dx || dy){
              anims.push(el.animate(
                [{transform:"translate("+dx+"px,"+dy+"px) translateZ(0)"},{transform:"translate(0,0) translateZ(0)"}],
                {duration:MOVE_DUR*1000, easing:EASE_MOVE, delay:i*STAGGER, fill:"both"}
              ).finished.catch(function(){}));
            } else { el.style.opacity=""; }
          }

          // EXIT ghosts
          for (var i=0;i<ghosts.length;i++){
            var g = ghosts[i];
            anims.push(g.animate(
              [{opacity:1, transform:"translateY(0px) translateZ(0)"},{opacity:0, transform:"translateY(-10px) translateZ(0)"}],
              {duration:EXIT_DUR*1000, easing:EASE_EXIT, delay:i*STAGGER, fill:"both"}
            ).finished.then(function(){ try{ g.remove(); }catch(_){}}).catch(function(){ try{ g.remove(); }catch(_){}}));
          }

          Promise.allSettled(anims).finally(function(){
            visibleAfter.forEach(function(el){ el.style.willChange=""; el.style.opacity=""; el.style.transform=""; el.style.backfaceVisibility=""; });
            listParent.style.pointerEvents = "";

            // If active item got filtered out, pick first visible
            if (activeLink && activeLink.closest(".home-hero_list") && activeLink.closest(".home-hero_list").style.display === "none" && firstVisibleLink){
              var src = firstVisibleLink.dataset.video; if (src) setActive(src, firstVisibleLink);
            }
            // Focus repair
            if (document.activeElement && document.activeElement.closest(".home-hero_list") && document.activeElement.closest(".home-hero_list").style.display === "none" && firstVisibleLink){
              firstVisibleLink.focus({ preventScroll:true });
            }
          });
        });
      }

      // Categories UI (nav is the control)
      (function(){
        var BTN_SEL = ".home-category_text";
        var catWrap = document.querySelector(".home_hero_categories");
        if (!catWrap) return;

        function ensureAllButton(){
          var buttons = Array.prototype.slice.call(catWrap.querySelectorAll(BTN_SEL));
          var allBtn = buttons.find(function(b){ return normalize(b.textContent) === "all"; }) || null;
          if (!allBtn){
            var item = document.createElement("div");
            item.setAttribute("role","listitem");
            item.className = "home-hero_category u-text-style-main w-dyn-item";
            var a = document.createElement("a");
            a.href="#"; a.className="home-category_text u-text-style-main"; a.textContent="All";
            a.setAttribute("data-animate-chars",""); a.setAttribute("aria-current","true");
            a.setAttribute("data-animate-delay", catWrap.getAttribute("data-animate-delay") || "0.012");
            item.appendChild(a); catWrap.insertBefore(item, catWrap.firstChild); allBtn = a;
          }
          return allBtn;
        }
        function setActive(label){
          var key = normalize(label);
          catWrap.querySelectorAll(BTN_SEL).forEach(function(b){
            var isActive = normalize(b.textContent) === key;
            b.setAttribute("aria-current", isActive ? "true" : "false");
            b.classList.toggle("u-color-faded", !isActive);
          });
        }
        function onClick(e){
          var btn = e.target.closest && e.target.closest(BTN_SEL);
          if (!btn || !catWrap.contains(btn)) return;
          e.preventDefault();
          var label = btn.textContent || "All";
          setActive(label); applyFilterFLIP(label);
        }

        ensureAllButton(); setActive("All"); applyFilterFLIP("All");
        catWrap.addEventListener("click", onClick, { passive:false });
      })();

      // Default active = first link
      if (links.length){
        var first = links[0], src = first.dataset.video, v = createVideo(src);
        if (v) v.__keepAlive = true; setActive(src, first);
      }

      // Hover / focus / touch activates project
      function onPointerOver(e){
        var a = e.target.closest && e.target.closest(".home-hero_link");
        if (!a || !listParent.contains(a) || a === activeLink) return;
        var src = a.dataset.video; if (src) setActive(src, a);
      }
      listParent.addEventListener("pointerover", onPointerOver, { passive:true });
      listParent.addEventListener("focusin", onPointerOver);
      listParent.addEventListener("touchstart", onPointerOver, { passive:true });

      // Pause all hero videos when tab hidden
      document.addEventListener("visibilitychange", function(){
        if (document.hidden){
          stage.querySelectorAll(".home-hero_video_el").forEach(function(v){ try{ v.pause(); }catch(_){}} );
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function(){ initHome(document); });
  // Barba hook
  document.addEventListener("page:enter", function(ev){ initHome((ev && ev.detail && ev.detail.container) || document); });
})();
