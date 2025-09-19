// site-timelines/category-filter-timeline.js
export function createCategoryFilterTimeline({
  visibleAfter,
  ghosts,
  rectBefore,
  rectAfter,
  prefersReducedMotion,
  onComplete
}) {
  const MOVE_DUR = prefersReducedMotion ? 0 : 0.36;
  const ENTER_DUR = prefersReducedMotion ? 0 : 0.32;
  const EXIT_DUR = prefersReducedMotion ? 0 : 0.3;
  const EASE_MOVE = "cubic-bezier(.16,.84,.28,1)";
  const EASE_ENTER = "cubic-bezier(.22,1,.36,1)";
  const EASE_EXIT = "cubic-bezier(.36,0,.1,1)";
  const STAGGER = 12;

  const anims = [];

  // Animate visible items
  visibleAfter.forEach((el, i) => {
    const before = rectBefore.get(el);
    const after = rectAfter.get(el);
    
    if (!before) {
      // Enter animation
      if (ENTER_DUR) {
        anims.push(
          el.animate([
            { opacity: 0, transform: "translateY(12px) translateZ(0)" },
            { opacity: 1, transform: "translateY(0px) translateZ(0)" }
          ], {
            duration: ENTER_DUR * 1000,
            easing: EASE_ENTER,
            delay: i * STAGGER,
            fill: "both"
          }).finished.catch(() => {})
        );
      } else {
        el.style.opacity = "";
        el.style.transform = "";
      }
    } else {
      // Move animation
      const dx = before.left - after.left;
      const dy = before.top - after.top;
      if (dx || dy) {
        anims.push(
          el.animate([
            { transform: `translate(${dx}px, ${dy}px) translateZ(0)` },
            { transform: "translate(0,0) translateZ(0)" }
          ], {
            duration: MOVE_DUR * 1000,
            easing: EASE_MOVE,
            delay: i * STAGGER,
            fill: "both"
          }).finished.catch(() => {})
        );
      } else {
        el.style.opacity = "";
      }
    }
  });

  // Animate ghosts (exit)
  ghosts.forEach((g, i) => {
    anims.push(
      g.animate([
        { opacity: 1, transform: "translateY(0px) translateZ(0)" },
        { opacity: 0, transform: "translateY(-10px) translateZ(0)" }
      ], {
        duration: EXIT_DUR * 1000,
        easing: EASE_EXIT,
        delay: i * STAGGER,
        fill: "both"
      }).finished.then(() => g.remove()).catch(() => g.remove())
    );
  });

  // Return cleanup promise
  return Promise.allSettled(anims).finally(onComplete);
}