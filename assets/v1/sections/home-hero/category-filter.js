// category-filter.js
import { getGhostLayer, makeGhost } from "./ghost-layer.js";

export function initCategoryFilter(section, state) {
  const catWrap = section.querySelector(".home-hero_categories");
  const listParent = section.querySelector(".home-hero_list-wrapper");
  if (!catWrap || !listParent) return;

  cacheCats(section);
  const allBtn = ensureAllButton(catWrap);
  if (!allBtn) return;

  catWrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".home-category_text");
    if (!btn || section.dataset.navigating) return;
    e.preventDefault();

    const prevActive = catWrap.querySelector('[aria-current="true"]');
    if (prevActive === btn) return;

    if (prevActive) prevActive.removeAttribute("aria-current");
    btn.setAttribute("aria-current", "true");

    filterItems(section, listParent, btn, state.setActive);
  });
}

function filterItems(section, listParent, btn, setActiveCallback) {
  const cat = normalize(btn.textContent);
  const allItems = Array.from(section.querySelectorAll(".home-hero_list"));
  const visibleBefore = allItems.filter((it) => it.offsetParent);

  const matcher = cat === "all" ? () => true : (it) => {
    const cats = (it.dataset.cats || "").split("|");
    return cats.some((c) => normalize(c) === cat);
  };

  const visibleAfter = allItems.filter(matcher);
  const firstVisibleItem = visibleAfter[0] || null;

  const rectBefore = new Map(visibleBefore.map((el) => [el, el.getBoundingClientRect()]));

  requestAnimationFrame(() => {
    allItems.forEach((it) => {
      it.hidden = !matcher(it);
    });

    const ghosts = [];
    visibleBefore.forEach((el) => {
      if (!visibleAfter.includes(el)) {
        const rect = rectBefore.get(el);
        if (rect) ghosts.push(makeGhost(el, rect));
      }
    });

    const rectAfter = new Map(visibleAfter.map((el) => [el, el.getBoundingClientRect()]));

    listParent.style.pointerEvents = "none";
    visibleAfter.forEach((el) => {
      el.style.willChange = "transform,opacity";
      el.style.backfaceVisibility = "hidden";
    });

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const MOVE_DUR = prefersReducedMotion ? 0 : 0.36;
    const ENTER_DUR = prefersReducedMotion ? 0 : 0.32;
    const EXIT_DUR = prefersReducedMotion ? 0 : 0.3;
    const EASE_MOVE = "cubic-bezier(.16,.84,.28,1)";
    const EASE_ENTER = "cubic-bezier(.22,1,.36,1)";
    const EASE_EXIT = "cubic-bezier(.36,0,.1,1)";
    const STAGGER = 12;

    const anims = [];

    visibleAfter.forEach((el, i) => {
      const before = rectBefore.get(el),
        after = rectAfter.get(el);
      if (!before) {
        if (ENTER_DUR) {
          anims.push(
            el.animate(
              [
                { opacity: 0, transform: "translateY(12px) translateZ(0)" },
                { opacity: 1, transform: "translateY(0px) translateZ(0)" },
              ],
              {
                duration: ENTER_DUR * 1000,
                easing: EASE_ENTER,
                delay: i * STAGGER,
                fill: "both",
              }
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
                {
                  transform: `translate(${dx}px, ${dy}px) translateZ(0)`,
                },
                { transform: "translate(0,0) translateZ(0)" },
              ],
              {
                duration: MOVE_DUR * 1000,
                easing: EASE_MOVE,
                delay: i * STAGGER,
                fill: "both",
              }
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
            {
              duration: EXIT_DUR * 1000,
              easing: EASE_EXIT,
              delay: i * STAGGER,
              fill: "both",
            }
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

      // Call the setActive callback from home-hero/index.js
      if (setActiveCallback && firstVisibleItem) {
        setActiveCallback(firstVisibleItem);
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
    a.setAttribute("aria-current", "true");

    item.appendChild(a);
    catWrap.insertBefore(item, catWrap.firstChild);
    allBtn = a;
  }
  return allBtn;
}

function normalize(str) {
  return (str || "").toLowerCase().trim();
}