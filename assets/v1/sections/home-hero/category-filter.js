// assets/v1/sections/home-hero/category-filter.js
import { normalize, prefersReducedMotion } from "./utils.js";
import { createCategoryFilterTimeline } from "../../site-timelines/category-filter-timeline.js";

/**
 * Initialize and bind category filtering
 */
export function initCategoryFilter(section, videoManager, setActiveCallback) {
  const catWrap = document.querySelector(".home_hero_categories");
  if (!catWrap) return () => {};

  // ✅ Ensure "All" button exists
  ensureAllButton(catWrap);

  // Build data-cats for each project list
  cacheCats(section);

  function setActiveCat(label) {
    const key = normalize(label);
    catWrap.querySelectorAll(".home-category_text").forEach((b) => {
      const isActive = normalize(b.textContent) === key;
      b.setAttribute("aria-current", isActive ? "true" : "false");
      b.classList.toggle("u-color-faded", !isActive);
    });
  }

  function onClick(e) {
    const btn = e.target.closest(".home-category_text");
    if (!btn || !catWrap.contains(btn)) return;
    e.preventDefault();
    const label = btn.textContent || "All";
    setActiveCat(label);
    applyFilterFLIP(section, label, videoManager, setActiveCallback);
  }

  // Default state = "All"
  setActiveCat("All");
  applyFilterFLIP(section, "All", videoManager, setActiveCallback);

  catWrap.addEventListener("click", onClick, { passive: false });

  return () => catWrap.removeEventListener("click", onClick);
}

/**
 * Apply FLIP filtering animation
 */
export function applyFilterFLIP(section, label, videoManager, setActiveCallback) {
  // SKIP animation if navigating to a project page
  if (section.dataset.navigating === "true") return;
  
  const items = Array.from(section.querySelectorAll(".home-hero_list"));
  const listParent = section.querySelector(".home-hero_list_parent");
  const key = normalize(label) || "all";

  const visibleBefore = items.filter((it) => it.style.display !== "none");
  const rectBefore = new Map(
    visibleBefore.map((it) => [it, it.getBoundingClientRect()])
  );

  const toStayOrEnter = [];
  const toExit = [];
  items.forEach((it) => {
    const match =
      key === "all"
        ? true
        : (it.dataset.cats || "").split("|").includes(key);
    if (match) toStayOrEnter.push(it);
    else if (it.style.display !== "none") toExit.push(it);
  });

  // Exit items → ghosts
  const ghosts = [];
  toExit.forEach((el) => {
    const r = rectBefore.get(el);
    if (r) {
      const g = makeGhost(el, r);
      ghosts.push(g);
      el.style.display = "none";
    }
  });

  let firstVisibleItem = null;
  items.forEach((it) => {
    const shouldShow = toStayOrEnter.includes(it);
    if (shouldShow) {
      if (it.style.display === "none") {
        it.style.display = "";
        it.style.opacity = "0";
      }
      if (!firstVisibleItem) {
        firstVisibleItem = it;
      }
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

  // Always hide "Selected"
  section.querySelectorAll(".home-category_ref_text").forEach((n) => {
    if (normalize(n.textContent) === "selected") n.setAttribute("hidden", "");
  });

  listParent.style.pointerEvents = "none";

  requestAnimationFrame(() => {
    const visibleAfter = toStayOrEnter.filter(
      (el) => el.style.display !== "none"
    );
    const rectAfter = new Map(
      visibleAfter.map((el) => [el, el.getBoundingClientRect()])
    );

    // Use the timeline
    createCategoryFilterTimeline({
      visibleAfter,
      ghosts,
      rectBefore,
      rectAfter,
      prefersReducedMotion,
      onComplete: () => {
        visibleAfter.forEach((el) => {
          el.style.willChange = "";
          el.style.opacity = "";
          el.style.transform = "";
          el.style.backfaceVisibility = "";
        });
        listParent.style.pointerEvents = "";

        // Call the setActive callback from home-hero/index.js
        if (setActiveCallback && firstVisibleItem) {
          setActiveCallback(firstVisibleItem);
        }
      }
    });
  });
}

/* Helpers */
function cacheCats(section) {
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
}

function stripArtifacts(root) {
  root
    .querySelectorAll("[data-animate-chars],[data-animate-chars-inner]")
    .forEach((n) => {
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
  (document.body.querySelector(".ghost-exit-layer") || document.body).appendChild(g);
  return g;
}

function ensureAllButton(catWrap) {
  const BTN_SEL = ".home-category_text";
  const buttons = Array.from(catWrap.querySelectorAll(BTN_SEL));
  let allBtn = buttons.find((b) => normalize(b.textContent) === "all") || null;
  
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
    a.setAttribute(
      "data-animate-delay",
      catWrap.getAttribute("data-animate-delay") || "0.012"
    );

    item.appendChild(a);
    catWrap.insertBefore(item, catWrap.firstChild);
    allBtn = a;
  }
  return allBtn;
}