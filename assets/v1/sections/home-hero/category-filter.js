// category-filter.js
import { makeGhost } from "./ghost-layer.js";
import { getActiveLink } from "./state.js";

export function applyFilterFLIP(section, label, videoManager, prefersReducedMotion) {
  const items = Array.from(section.querySelectorAll(".home-hero_list"));
  const key = normalize(label) || "all";
  const visibleBefore = items.filter((it) => it.style.display !== "none");
  const rectBefore = new Map(visibleBefore.map((it) => [it, it.getBoundingClientRect()]));

  const toStayOrEnter = [], toExit = [];
  items.forEach((it) => {
    const match = key === "all" ? true : (it.dataset.cats || "").split("|").includes(key);
    if (match) toStayOrEnter.push(it);
    else if (it.style.display !== "none") toExit.push(it);
  });

  const ghosts = [];
  toExit.forEach((el) => {
    const r = rectBefore.get(el);
    if (r) { ghosts.push(makeGhost(el, r)); el.style.display = "none"; }
  });

  let firstVisibleLink = null;
  items.forEach((it) => {
    const shouldShow = toStayOrEnter.includes(it);
    if (shouldShow) {
      if (it.style.display === "none") { it.style.display = ""; it.style.opacity = "0"; }
      if (!firstVisibleLink) firstVisibleLink = it.querySelector(".home-hero_link");
    } else if (!toExit.includes(it)) it.style.display = "none";
  });

  const listParent = section.querySelector(".home-hero_list_parent");
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
          anims.push(el.animate(
            [{ opacity: 0, transform: "translateY(12px) translateZ(0)" },
             { opacity: 1, transform: "translateY(0px) translateZ(0)" }],
            { duration: ENTER_DUR * 1000, easing: EASE_ENTER, delay: i * STAGGER, fill: "both" }
          ).finished.catch(() => {}));
        } else { el.style.opacity = ""; el.style.transform = ""; }
      } else {
        const dx = before.left - after.left, dy = before.top - after.top;
        if (dx || dy) anims.push(el.animate(
          [{ transform: `translate(${dx}px, ${dy}px) translateZ(0)` },
           { transform: "translate(0,0) translateZ(0)" }],
          { duration: MOVE_DUR * 1000, easing: EASE_MOVE, delay: i * STAGGER, fill: "both" }
        ).finished.catch(() => {}));
        else el.style.opacity = "";
      }
    });
    ghosts.forEach((g, i) => anims.push(g.animate(
      [{ opacity: 1, transform: "translateY(0px) translateZ(0)" },
       { opacity: 0, transform: "translateY(-10px) translateZ(0)" }],
      { duration: EXIT_DUR * 1000, easing: EASE_EXIT, delay: i * STAGGER, fill: "both" }
    ).finished.then(() => g.remove()).catch(() => g.remove())));

    Promise.allSettled(anims).finally(() => {
      visibleAfter.forEach((el) => { el.style.willChange = ""; el.style.opacity = ""; el.style.transform = ""; el.style.backfaceVisibility = ""; });
      listParent.style.pointerEvents = "";
      if (getActiveLink()?.closest(".home-hero_list")?.style.display === "none" && firstVisibleLink) {
        videoManager.setActive(firstVisibleLink.dataset.video, firstVisibleLink);
      }
    });
  });
}

function normalize(t) { return (t || "").trim().toLowerCase(); }
