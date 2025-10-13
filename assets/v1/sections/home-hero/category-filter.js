// category-filter.js - Fixed to respect transitions and prevent FOUC
import { getGhostLayer, makeGhost } from "./ghost-layer.js";

export function initCategoryFilter(section, videoManager, setActiveCallback) {
  // Search from document root - categories exist outside .home-hero_wrap
  const catWrap = document.querySelector(".home_hero_categories");
  const listParent = section.querySelector(".home-hero_list_parent");
  
  if (!catWrap || !listParent) {
    console.warn("[CategoryFilter] Missing categories or list parent");
    console.warn("[CategoryFilter] catWrap:", !!catWrap, "listParent:", !!listParent);
    return () => {};
  }

  console.log("[CategoryFilter] Initializing with wrapper:", catWrap.className);

  // Clear any stuck navigation flags
  delete section.dataset.navigating;

  cacheCats(section);
  
  // Remove any existing "All" button if it exists in the DOM
  removeAllButton(catWrap);
  
  // Initialize category button states on load
  initializeCategoryStates(catWrap);
  
  // Trigger initial filtering based on the active category
  setTimeout(() => {
    const activeBtn = catWrap.querySelector('[aria-current="true"]');
    
    if (activeBtn) {
      console.log("[CategoryFilter] Applying initial filter for:", activeBtn.textContent.trim());
      const cat = normalize(activeBtn.textContent);
      const allItems = Array.from(section.querySelectorAll(".home-hero_list"));
      
      console.log("[CategoryFilter] Filtering", allItems.length, "items for category:", cat);
      
      // Debug: log all items and their categories
      allItems.forEach(item => {
        const projectName = item.querySelector(".home_hero_text")?.textContent;
        console.log("[CategoryFilter] Item:", projectName, "cats:", item.dataset.cats);
      });
      
      // Apply the filter
      let visibleCount = 0;
      let firstVisible = null;
      
      allItems.forEach((item) => {
        const cats = item.dataset.cats || "";
        const catArray = cats.split("|").map(c => c.trim()).filter(c => c);
        const matches = catArray.includes(cat);
        
        const projectName = item.querySelector(".home_hero_text")?.textContent;
        console.log("[CategoryFilter] Checking:", projectName, "cats:", cats, "for:", cat, "matches:", matches);
        
        if (matches) {
          // Make visible
          item.style.display = "";
          if (item.style.removeProperty) {
            item.style.removeProperty("display");
          }
          
          // Only reset opacity if NOT coming from a page transition
          // Check if we're in a Barba transition or if grid animation is happening
          const isTransitioning = document.body.classList.contains('barba-navigating') || 
                                 document.querySelector('.transition-grid[style*="pointer-events: all"]');
          
          if (!isTransitioning) {
            // Reset opacity on text elements
            const text = item.querySelector(".home_hero_text");
            const pills = item.querySelectorAll(".home-category_ref_text:not([hidden])");
            
            if (text) {
              text.style.opacity = "1";
              text.style.filter = "blur(0px)";
              text.style.transform = "translate(0px, 0px)";
            }
            
            pills.forEach(pill => {
              pill.style.opacity = "1";
              pill.style.transform = "translate(0px, 0px)";
            });
          }
          
          visibleCount++;
          if (!firstVisible) {
            firstVisible = item;
          }
          console.log("[CategoryFilter] SHOWING:", projectName);
        } else {
          // Hide
          item.style.display = "none";
          console.log("[CategoryFilter] HIDING:", projectName);
        }
      });
      
      console.log("[CategoryFilter] After initial filtering:", visibleCount, "items visible");
      
      // Set first visible item as active
      if (firstVisible && setActiveCallback) {
        console.log("[CategoryFilter] Setting first visible item as active");
        setTimeout(() => {
          setActiveCallback(firstVisible);
        }, 100);
      }
    } else {
      console.warn("[CategoryFilter] No active category button found on init");
    }
  }, 100);

  const handleClick = (e) => {
    const btn = e.target.closest(".home-category_text");
    if (!btn) {
      console.log("[CategoryFilter] Click not on a category button");
      return;
    }
    
    // Skip if it's an "All" button (safety check)
    if (normalize(btn.textContent) === "all") {
      console.log("[CategoryFilter] Ignoring click on All button");
      return;
    }
    
    // Check navigation flag
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
    setTimeout(() => {
      delete section.dataset.navigating;
      console.log("[CategoryFilter] Filter animation complete, flag cleared");
    }, 800);
  };

  catWrap.addEventListener("click", handleClick);
  console.log("[CategoryFilter] Click handler attached");

  return () => {
    catWrap.removeEventListener("click", handleClick);
    delete section.dataset.navigating;
  };
}

// Initialize all category button states on load
function initializeCategoryStates(catWrap) {
  const buttons = Array.from(catWrap.querySelectorAll(".home-category_text"));
  console.log("[CategoryFilter] Found", buttons.length, "category buttons");
  
  // Find the active button or set first valid one as active
  let hasActiveButton = false;
  let firstValidButton = null;
  
  buttons.forEach(btn => {
    const text = normalize(btn.textContent);
    
    // Only skip "All" buttons
    if (text === "all") {
      btn.setAttribute("aria-current", "false");
      btn.classList.add("u-color-faded");
      return;
    }
    
    // Track first valid button (including "selected")
    if (!firstValidButton) {
      firstValidButton = btn;
    }
    
    // Check if this button is already marked as active
    const isActive = btn.getAttribute("aria-current") === "true";
    
    if (isActive) {
      hasActiveButton = true;
      btn.classList.remove("u-color-faded");
    } else {
      btn.classList.add("u-color-faded");
    }
  });
  
  // If no button is active and we have a valid first button, activate it
  if (!hasActiveButton && firstValidButton) {
    firstValidButton.setAttribute("aria-current", "true");
    firstValidButton.classList.remove("u-color-faded");
    console.log("[CategoryFilter] Set first category as active:", firstValidButton.textContent.trim());
  }
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
  
  // Get currently visible items
  const visibleBefore = allItems.filter((it) => {
    return it.style.display !== "none";
  });

  console.log("[CategoryFilter] Filtering for category:", cat);
  console.log("[CategoryFilter] Total items:", allItems.length);
  console.log("[CategoryFilter] Currently visible:", visibleBefore.length);

  // Matcher function - check if item has the category
  const matcher = (item) => {
    const cats = item.dataset.cats || "";
    const catArray = cats.split("|").map(c => c.trim()).filter(c => c);
    const matches = catArray.includes(cat);
    const projectName = item.querySelector(".home_hero_text")?.textContent;
    console.log("[CategoryFilter] Checking:", projectName, "cats:", cats, "for:", cat, "matches:", matches);
    return matches;
  };

  // Determine which items will be visible after filter
  const visibleAfter = allItems.filter(matcher);
  
  console.log("[CategoryFilter] Items that will be visible:", visibleAfter.length);
  visibleAfter.forEach(item => {
    const projectName = item.querySelector(".home_hero_text")?.textContent;
    console.log("[CategoryFilter] Will show:", projectName, "cats:", item.dataset.cats);
  });
  
  if (visibleAfter.length === 0) {
    console.warn("[CategoryFilter] No items match filter:", cat);
    return;
  }

  const firstVisibleItem = visibleAfter[0];

  // CRITICAL: Capture bounding rects BEFORE any DOM changes
  const rectBefore = new Map(visibleBefore.map((el) => [el, el.getBoundingClientRect()]));

  requestAnimationFrame(() => {
    // Update visibility
    allItems.forEach((item) => {
      const shouldShow = matcher(item);
      const projectName = item.querySelector(".home_hero_text")?.textContent;
      
      if (shouldShow) {
        // Make visible
        item.style.display = "";
        if (item.style.removeProperty) {
          item.style.removeProperty("display");
        }
        
        // CRITICAL: Only force text elements visible if not in a page transition
        const isTransitioning = document.body.classList.contains('barba-navigating') || 
                               document.querySelector('.transition-grid[style*="pointer-events: all"]');
        
        if (!isTransitioning) {
          const text = item.querySelector(".home_hero_text");
          const pills = item.querySelectorAll(".home-category_ref_text:not([hidden])");
          
          if (text) {
            text.style.opacity = "1";
            text.style.filter = "blur(0px)";
            text.style.transform = "translate(0px, 0px)";
          }
          
          pills.forEach(pill => {
            pill.style.opacity = "1";
            pill.style.transform = "translate(0px, 0px)";
          });
        }
        
        console.log("[CategoryFilter] SHOWING:", projectName);
      } else {
        // Hide
        item.style.display = "none";
        console.log("[CategoryFilter] HIDING:", projectName);
      }
    });

    // Force browser to apply styles
    void listParent.offsetHeight;

    // Create ghosts for items that are disappearing
    const ghosts = [];
    visibleBefore.forEach((el) => {
      if (!visibleAfter.includes(el)) {
        const rect = rectBefore.get(el);
        if (rect) {
          ghosts.push(makeGhost(el, rect));
        }
      }
    });

    // Capture new positions AFTER DOM changes
    const rectAfter = new Map(visibleAfter.map((el) => [el, el.getBoundingClientRect()]));

    // Lock pointer events during animation
    listParent.style.pointerEvents = "none";
    
    // Prepare visible items for animation
    visibleAfter.forEach((el) => {
      el.style.willChange = "transform, opacity";
      el.style.backfaceVisibility = "hidden";
    });

    // Animation constants
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const MOVE_DUR = prefersReducedMotion ? 0 : 0.4;
    const ENTER_DUR = prefersReducedMotion ? 0 : 0.32;
    const EXIT_DUR = prefersReducedMotion ? 0 : 0.3;
    const EASE_MOVE = "cubic-bezier(0.65, 0, 0.35, 1)";
    const EASE_ENTER = "cubic-bezier(0.22, 1, 0.36, 1)";
    const EASE_EXIT = "cubic-bezier(0.4, 0, 1, 1)";
    const STAGGER = 20;

    const anims = [];

    // Animate visible items
    visibleAfter.forEach((el, i) => {
      const before = rectBefore.get(el);
      const after = rectAfter.get(el);
      
      if (!before) {
        // Item is entering (wasn't visible before)
        if (ENTER_DUR) {
          // Make sure text is visible before animation
          const text = el.querySelector(".home_hero_text");
          const pills = el.querySelectorAll(".home-category_ref_text:not([hidden])");
          
          if (text) {
            text.style.opacity = "1";
          }
          pills.forEach(pill => {
            pill.style.opacity = "1";
          });
          
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
        // Item is moving (was visible before)
        const dx = before.left - after.left;
        const dy = before.top - after.top;
        
        if (dx !== 0 || dy !== 0) {
          anims.push(
            el.animate(
              [
                { transform: `translate(${dx}px, ${dy}px) translateZ(0)` },
                { transform: "translate(0px, 0px) translateZ(0)" },
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
        
        // Ensure visible items start with proper fade state (but keep them visible!)
        const text = el.querySelector(".home_hero_text");
        const pills = el.querySelectorAll(".home-category_ref_text:not([hidden])");
        
        // Add faded class but ensure opacity is 1
        text?.classList.add("u-color-faded");
        if (text) text.style.opacity = "1";
        
        pills.forEach(p => {
          p.classList.add("u-color-faded");
          p.style.opacity = "1";
        });
      });
      listParent.style.pointerEvents = "";

      // Call the setActive callback which will unfade the first item only
      if (setActiveCallback && firstVisibleItem) {
        setActiveCallback(firstVisibleItem);
      }
    });
  });
}

/* Helpers */
function cacheCats(section) {
  const items = Array.from(section.querySelectorAll(".home-hero_list"));
  console.log("[CategoryFilter] Caching categories for", items.length, "items");
  
  for (const it of items) {
    // If data-cats already exists, preserve it
    if (it.dataset.cats) {
      console.log("[CategoryFilter] Keeping existing cats:", it.dataset.cats);
      const projectName = it.querySelector(".home_hero_text")?.textContent;
      console.log("[CategoryFilter] Project:", projectName, "has cats:", it.dataset.cats);
      
      // Still hide "selected" pills if they exist
      it.querySelectorAll(".home-category_ref_text").forEach((n) => {
        if (normalize(n.textContent) === "selected") {
          n.setAttribute("hidden", "");
        }
      });
      continue;
    }
    
    // Only build from children if no data-cats exists
    const cats = new Set();
    it.querySelectorAll(".home-category_ref_text").forEach((n) => {
      const t = normalize(n.textContent);
      if (t === "selected") {
        n.setAttribute("hidden", "");
        cats.add(t); // Add "selected" to the filter categories
      } else if (t) {
        cats.add(t);
      }
    });
    
    // Join the categories with | separator
    it.dataset.cats = Array.from(cats).join("|");
    const projectName = it.querySelector(".home_hero_text")?.textContent;
    console.log("[CategoryFilter] Built cats from children for:", projectName, "result:", it.dataset.cats);
  }
}

// Remove any "All" button if it exists
function removeAllButton(catWrap) {
  const buttons = Array.from(catWrap.querySelectorAll(".home-category_text"));
  const allBtn = buttons.find((b) => normalize(b.textContent) === "all");
  
  if (allBtn) {
    console.log("[CategoryFilter] Removing 'All' button");
    const listItem = allBtn.closest('[role="listitem"]');
    if (listItem) {
      listItem.remove();
    } else {
      allBtn.remove();
    }
  }
}

function normalize(str) {
  return (str || "").toLowerCase().trim();
}