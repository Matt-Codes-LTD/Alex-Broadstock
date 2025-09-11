// gridTransition.js - Drop-in replacement for your current loader
export default function initGridTransition(container) {
  // Check if already initialized
  const existingGrid = container.querySelector('.grid-transition');
  if (existingGrid && existingGrid.dataset.scriptInitialized) return () => {};
  
  console.log("[GridTransition] init");

  // Create or get grid container
  let gridEl = existingGrid;
  if (!gridEl) {
    gridEl = document.createElement('div');
    gridEl.className = 'grid-transition';
    container.appendChild(gridEl);
  }
  gridEl.dataset.scriptInitialized = "true";

  // Create 110 grid tiles
  for (let i = 0; i < 110; i++) {
    const div = document.createElement('div');
    gridEl.appendChild(div);
  }

  const tiles = gridEl.querySelectorAll('div');
  const centerColumn = 5;

  // Lock scroll during preload
  document.documentElement.classList.add('is-preloading');
  const lock = document.createElement('style');
  lock.textContent = `html.is-preloading, html.is-preloading body { overflow:hidden!important }`;
  document.head.appendChild(lock);

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Minimum display time
  const minDisplayTime = 2000;
  const startTime = Date.now();

  // Show grid
  gsap.set(gridEl, { opacity: 1, pointerEvents: 'all' });
  document.body.style.cursor = 'wait';

  // Stagger function matching original
  const getStagger = (index) => {
    const row = Math.floor(index / 11);
    const col = index % 11;
    const distanceFromCenter = Math.abs(col - centerColumn);
    const baseDelay = (9 - row + distanceFromCenter) * 0.05;
    const randomOffset = 0.3 * (Math.random() - 0.5);
    return baseDelay + randomOffset;
  };

  const tl = gsap.timeline({
    delay: 0.5,
    onComplete: () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDisplayTime - elapsed);
      
      setTimeout(() => {
        gridEl.style.opacity = '0';
        gridEl.style.pointerEvents = 'none';
        document.body.style.cursor = 'default';
        document.documentElement.classList.remove('is-preloading');
        lock.remove();
        console.log("[GridTransition] done");
      }, remaining);
    }
  });

  if (prefersReducedMotion) {
    tl.timeScale(10);
  }

  // Phase 1: Tiles scale up (enter)
  tl.to(tiles, {
    scaleY: 1,
    transformOrigin: '0% 100%',
    duration: 0.5,
    ease: 'power4.inOut',
    stagger: getStagger,
  });

  // Phase 2: Hold briefly
  tl.set({}, {}, "+=0.3");

  // Phase 3: Tiles scale down (exit)
  tl.to(tiles, {
    scaleY: 0,
    transformOrigin: '0% 0%',
    duration: 0.5,
    ease: 'power4.inOut',
    stagger: getStagger,
  });

  // Cleanup
  return () => {
    console.log("[GridTransition] cleanup");
    gsap.killTweensOf(tiles);
    if (lock && lock.parentNode) {
      lock.remove();
    }
    delete gridEl.dataset.scriptInitialized;
  };
}

// For page-to-page transitions (if using client-side routing)
export class GridPageTransition {
  constructor(container = document.body) {
    this.container = container;
    this.gridEl = null;
    this.isTransitioning = false;
    this.centerColumn = 5;
    this.init();
  }

  init() {
    // Create grid container
    this.gridEl = document.createElement('div');
    this.gridEl.className = 'grid-transition';
    this.container.appendChild(this.gridEl);

    // Create 110 tiles
    for (let i = 0; i < 110; i++) {
      const div = document.createElement('div');
      this.gridEl.appendChild(div);
    }

    this.tiles = this.gridEl.querySelectorAll('div');
    gsap.set(this.gridEl, { opacity: 0, pointerEvents: 'none' });
  }

  getStagger(index) {
    const row = Math.floor(index / 11);
    const col = index % 11;
    const distanceFromCenter = Math.abs(col - this.centerColumn);
    const baseDelay = (9 - row + distanceFromCenter) * 0.05;
    const randomOffset = 0.3 * (Math.random() - 0.5);
    return baseDelay + randomOffset;
  }

  async transition(beforeSwitch, afterSwitch) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    // Show grid
    gsap.set(this.gridEl, { opacity: 1, pointerEvents: 'all' });
    document.body.style.cursor = 'wait';

    // Phase 1: Cover screen
    await gsap.to(this.tiles, {
      scaleY: 1,
      transformOrigin: '0% 100%',
      duration: 0.5,
      ease: 'power4.inOut',
      stagger: this.getStagger.bind(this),
    });

    // Execute page switch
    if (beforeSwitch) await beforeSwitch();
    window.scrollTo(0, 0);
    if (afterSwitch) await afterSwitch();

    // Phase 2: Reveal new content
    await gsap.to(this.tiles, {
      scaleY: 0,
      transformOrigin: '0% 0%',
      duration: 0.5,
      ease: 'power4.inOut',
      stagger: this.getStagger.bind(this),
    });

    // Hide grid
    gsap.set(this.gridEl, { opacity: 0, pointerEvents: 'none' });
    document.body.style.cursor = 'default';
    this.isTransitioning = false;
  }
}