// assets/v1/sections/home-hero/category-filter.js
import { normalize, prefersReducedMotion } from "./utils.js";

export function applyFilterFLIP(section, label, videoManager) {
  const items = Array.from(section.querySelectorAll(".home-hero_list"));
  const listParent = section.querySelector(".home-hero_list_parent");
  const key = normalize(label) || "all";

  const visibleBefore = items.filter((it) => it.style.display !== "none");
  const rectBefore = new Map(visibleBefore.map((it) => [it, it.getBoundingClientRect()]));

  const toStayOrEnter = [], toExit = [];
  items.forEach((it) => {
    const match = key === "all" ? true : (it.dataset.cats || "").split("|").includes(key);
    if (match) toStayOrEnter.push(it);
    else if (it.style.display !== "none") toExit.push(it);
  });

  // Ghosts for exiting items
  const ghosts = [];
  toExit.forEach((el) => {
    const r = rectBefore.get(el);
    if (r) {
      const g = makeGhost(el, r);
      ghosts.push(g);
      el.style.display = "none";
    }
  });

  let firstVisibleLink = null;
  items.forEach((it) => {
    const shouldShow = toStayOrEnter.includes(it);
    if (shouldShow) {
      if (it.style.display === "none") {
        it.style.display = "";
        it.style.opacity = "0";
      }
      if (!firstVisibleLink) firstVisibleLink = it.querySelector(".home-hero_link");
    } else if (!toExit.includes(it)) {
      it.style.display = "none";
    }
    Object.assign(it.style, {
      transform: "none",
      willChange: "transform, opacity",
      backfaceVisibility: "hidden",
      transformOrigin: "50% 50% 0",
    });
  });

  // Hide the word "selected"
  section.querySelectorAll(".home-category_ref_text").forEach((n) => {
    if (normalize(n.textContent) === "selected") n.setAttribute("hidden", "");
  });

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
          anims.push(
            el.animate(
              [
                { opacity: 0, transform: "translateY(12px) translateZ(0)" },
                { opacity: 1, transform: "translateY(0px) translateZ(0)" },
              ],
              { duration: ENTER_DUR * 1000, easing: EASE_ENTER, delay: i * STAGGER, fill: "both" }
            ).finished.catch(() => {})
          );
        } else {
          el.style.opacity = "";
          el.style.transform = "";
        }
      } else {
        const dx = before.left - after.left;
        const dy = before.top - after.top;
        if (dx || dy) {
          anims.push(
            el.animate(
              [
                { transform: `translate(${dx}px, ${dy}px) translateZ(0)` },
                { transform: "translate(0,0) translateZ(0)" },
              ],
              { duration: MOVE_DUR * 1000, easing: EASE_MOVE, delay: i * STAGGER, fill: "both" }
            ).finished.catch(() => {})
          );
        } else {
          el.style.opacity = "";
        }
      }
    });

    ghosts.forEach((g, i) =>
      anims.push(
        g.animate(
          [
            { opacity: 1, transform: "translateY(0px) translateZ(0)" },
            { opacity: 0, transform: "translateY(-10px) translateZ(0)" },
          ],
          { duration: EXIT_DUR * 1000, easing: EASE_EXIT, delay: i * STAGGER, fill: "both" }
        ).finished.then(() => g.remove()).catch(() => g.remove())
      )
    );

    Promise.allSettled(anims).finally(() => {
      visibleAfter.forEach((el) => {
        el.style.willChange = "";
        el.style.opacity = "";
        el.style.transform = "";
        el.style.backfaceVisibility = "";
      });
      listParent.style.pointerEvents = "";

      // 🔑 Re-apply active link state (fix fade classes after filtering)
      const active = section.querySelector(".home-hero_link[aria-current='true']");
      if (active) {
        videoManager.setActive(active.dataset.video, active);
      }
    });
  });
}

// helper: makeGhost
function stripArtifacts(root) {
  root.querySelectorAll("[data-animate-chars],[data-animate-chars-inner]").forEach((n) => {
    n.removeAttribute("data-animate-chars");
    n.removeAttribute("data-animate-chars-inner");
  });
  [...[root], ...root.querySelectorAll("*")].forEach((n) => {
    Object.assign(n.style, {
      background: "transparent",
      boxShadow: "none",
      textShadow: "none",
      mixBlendMode: "normal",
      webkitTextFillColor: "currentColor",
    });
  });
}
function makeGhost(el, rect) {
  const g = el.cloneNode(true);
  g.setAttribute("aria-hidden", "true");
  const cs = getComputedStyle(el);
  Object.assign(g.style, {
    color: cs.color,
    position: "fixed",
    margin: "0",
    left: rect.left + "px",
    top: rect.top + "px",
    width: rect.width + "px",
    height: rect.height + "px",
    pointerEvents: "none",
    willChange: "transform,opacity",
    backfaceVisibility: "hidden",
    transform: "translateZ(0)",
    background: "transparent",
  });
  stripArtifacts(g);
  document.body.querySelector(".ghost-exit-layer")?.appendChild(g);
  return g;
}
