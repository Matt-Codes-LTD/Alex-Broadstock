// category-filter.js - Fixed with proper navigation flag management
import { getGhostLayer, makeGhost } from "./ghost-layer.js";

export function initCategoryFilter(section, videoManager, setActiveCallback) {
  // Correct selectors - note inconsistent naming in HTML
  const catWrap = section.querySelector(".home_hero_categories"); // UNDERSCORES
  const listParent = section.querySelector(".home-hero_list_parent"); // HYPHENS
  
  if (!catWrap || !listParent) {
    console.warn("[CategoryFilter] Missing categories or list parent");
    console.warn("[CategoryFilter] catWrap:", !!catWrap, "listParent:", !!listParent);
    return () => {};
  }

  // CRITICAL FIX: Clear any stuck navigation flag on initialization
  delete section.dataset.navigating;

  cacheCats(section);
  const allBtn = ensureAllButton(catWrap);
  if (!allBtn) {
    console.warn("[CategoryFilter] Failed to create All button");
    return () => {};
  }

  // Initialize category button states on load
  initializeCategoryStates(catWrap);

  const handleClick = (e) => {
    const btn = e.target.closest(".home-category_text");
    if (!btn) return;
    
    // Check navigation flag but with debugging
    if (section.dataset.navigating) {
      console.log("[CategoryFilter] Click blocked - navigation in progress");
      return;
    }
    
    e.preventDefault();

    const prevActive = catWrap.querySelector('[aria-current="true"]');
    if (prevActive === btn) {
      console.log("[CategoryFilter] Already active, ignoring");
      return;
    }

    // Set navigation flag during filter animation
    section.dataset.navigating = "true";
    console.log("[CategoryFilter] Filter animation starting:", btn.textContent.trim());

    // Update category button states
    updateCategoryStates(catWrap, prevActive, btn);

    // Run filter animation
    filterItems(section, listParent, btn, setActiveCallback);
    
    // Clear navigation flag after animation completes
    // Timeout matches FLIP animation duration (MOVE_DUR + EXIT_DUR + buffer)
    setTimeout(() => {
      delete section.dataset.navigating;
      console.log("[CategoryFilter] Filter animation complete, flag cleared");
    }, 800); // 0.4s move + 0.3s exit + 0.1s buffer
  };

  catWrap.addEventListener("click", handleClick);

  return () => {
    catWrap.removeEventListener("click", handleClick);
    delete section.dataset.navigating;
  };
}

// Initialize all category button states on load
function initializeCategoryStates(catWrap) {
  const buttons = Array.from(catWrap.querySelectorAll(".home-category_text"));
  
  buttons.forEach(btn => {
    const isActive = btn.getAttribute("aria-current") === "true";
    
    if (isActive) {
      btn.classList.remove("u-color-faded");
    } else {
      btn.classList.add("u-color-faded");
    }
  });
}

// Update category button states when switching
function updateCategoryStates(catWrap, prevActive, newActive) {
  // Remove active from previous
  if (prevActive) {
    prevActive.setAttribute("aria-current", "false");
    prevActive.classList.add("u-color-faded");
  }
  
  // Set new active
  if (newActive) {
    newActive.setAttribute("aria-current", "true");
    newActive.classList.remove("u-color-faded");
  }
}

function filterItems(section, listParent, btn, setActiveCallback) {
  const cat = normalize(btn.textContent);
  const allItems = Array.from(section.querySelectorAll(".home-hero_list"));
  const visibleBefore = allItems.filter((it) => it.offsetParent);

  const matcher = cat === "all" 
    ? () => true 
    : (item) => {
        const cats = item.dataset.cats || "";
        return cats.split("|").includes(cat);
      };

  // Determine which items will be visible after filter
  const visibleAfter = allItems.filter(matcher);
  
  if (visibleAfter.length === 0) {
    console.warn("[CategoryFilter] No items match filter:", cat);
    return;
  }

  const firstVisibleItem = visibleAfter[0];

  requestAnimationFrame(() => {
    // Create ghost layer
    const layer = getGhostLayer();
    const ghosts = visibleBefore.map((el) => makeGhost(el, layer));

    // Update visibility
    allItems.forEach((item) => {
      if (matcher(item)) {
        item.style.display = "";
      } else {
        item.style.display = "none";
      }
    });

    // Force layout
    listParent.offsetHeight;

    // Lock pointer events during animation
    listParent.style.pointerEvents = "none";

    // Animation constants
    const MOVE_DUR = 0.4;
    const EXIT_DUR = 0.3;
    const STAGGER = 20;
    const EASE_MOVE = "cubic-bezier(0.65, 0, 0.35, 1)";
    const EASE_EXIT = "cubic-bezier(0.4, 0, 1, 1)";

    const anims = [];

    // Animate visible items
    visibleAfter.forEach((el, i) => {
      const ghost = ghosts.find((g) => g.dataset.originalId === el.dataset.itemId);
      
      if (ghost) {
        const before = ghost.getBoundingClientRect();
        const after = el.getBoundingClientRect();
        const dx = before.left - after.left;
        const dy = before.top - after.top;

        if (dx !== 0 || dy !== 0) {
          el.style.willChange = "transform, opacity";
          el.style.backfaceVisibility = "hidden";
          
          anims.push(
            el.animate(
              [
                { transform: `translate(${dx}px, ${dy}px) translateZ(0)`, opacity: 0 },
                { transform: "translate(0px, 0px) translateZ(0)", opacity: 1 },
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

    // Animate ghosts out
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

    // Cleanup after animations
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
    console.log("[CategoryFilter] Creating 'All' button");
    
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
  } else {
    console.log("[CategoryFilter] 'All' button already exists");
  }
  
  return allBtn;
}

function normalize(str) {
  return (str || "").toLowerCase().trim();
}