/**
 * Swipe Navigation for Home Hero
 * Enables vertical swipe gestures on touch devices to navigate between projects
 * 
 * @param {HTMLElement} wrap - The home-hero_wrap element
 * @param {Function} getItems - Function that returns array of all project items
 * @returns {Function} Cleanup function
 */
export function initSwipeNavigation(wrap, getItems) {
  // Only run on touch devices
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isTouchDevice) return () => {};

  // Swipe tracking state
  let touchStartY = 0;
  let touchStartX = 0;
  let isSwiping = false;
  let swipeDebounce = false;

  // Relaxed thresholds for easier swiping
  const SWIPE_THRESHOLD = 25; // Very low - 25px is easy to trigger
  const HORIZONTAL_TOLERANCE = 80; // Very high - allows diagonal swipes
  const DEBOUNCE_TIME = 300; // Prevent rapid re-triggering

  /**
   * Check if we're on the home page
   */
  function isHomePage() {
    const container = document.querySelector('[data-barba-namespace="home"]');
    return container && container.offsetParent !== null;
  }

  /**
   * Get all currently visible projects
   */
  function getVisibleProjects() {
    const allProjects = getItems();
    return allProjects.filter(project => {
      const style = window.getComputedStyle(project);
      return style.display !== 'none';
    });
  }

  /**
   * Get the currently active project index
   */
  function getActiveProjectIndex(visibleProjects) {
    const activeIndex = visibleProjects.findIndex(project => {
      const link = project.querySelector('.home-hero_link');
      return link && link.getAttribute('aria-current') === 'true';
    });
    return activeIndex >= 0 ? activeIndex : 0;
  }

  /**
   * Trigger project change (simulates hover behavior)
   */
  function activateProject(projectItem) {
    if (!projectItem) return;

    const clickableItem = projectItem.querySelector('.home-hero_item');
    if (!clickableItem) return;

    const mouseEnterEvent = new MouseEvent('mouseenter', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    clickableItem.dispatchEvent(mouseEnterEvent);
  }

  /**
   * Handle touch start
   */
  function handleTouchStart(e) {
    // Only work on home page
    if (!isHomePage()) return;
    
    // Don't interfere with navigation or category filters
    if (e.target.closest('.nav_wrap, .home-hero-category_wrap')) {
      return;
    }
    
    // Don't start new swipe if debounced
    if (swipeDebounce) return;

    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    isSwiping = true;
  }

  /**
   * Handle touch move
   */
  function handleTouchMove(e) {
    if (!isSwiping || !isHomePage()) return;
    
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const deltaY = Math.abs(touchStartY - currentY);
    const deltaX = Math.abs(touchStartX - currentX);
    
    // Prevent page scroll if moving more vertically than horizontally
    if (deltaY > deltaX) {
      e.preventDefault();
    }
  }

  /**
   * Handle touch end
   */
  function handleTouchEnd(e) {
    if (!isSwiping || !isHomePage()) {
      isSwiping = false;
      return;
    }

    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;

    const deltaY = touchStartY - touchEndY;
    const deltaX = Math.abs(touchStartX - touchEndX);
    const totalDistance = Math.abs(deltaY);

    const isVerticalSwipe = totalDistance > SWIPE_THRESHOLD && deltaX < HORIZONTAL_TOLERANCE;

    if (isVerticalSwipe && !swipeDebounce) {
      // Set debounce
      swipeDebounce = true;
      setTimeout(() => {
        swipeDebounce = false;
      }, DEBOUNCE_TIME);
      
      const visibleProjects = getVisibleProjects();
      
      if (visibleProjects.length === 0) {
        isSwiping = false;
        return;
      }

      const currentIndex = getActiveProjectIndex(visibleProjects);
      let nextIndex;

      if (deltaY > 0) {
        // Swiped up - next project
        nextIndex = (currentIndex + 1) % visibleProjects.length;
      } else {
        // Swiped down - previous project
        nextIndex = (currentIndex - 1 + visibleProjects.length) % visibleProjects.length;
      }

      activateProject(visibleProjects[nextIndex]);
    }

    isSwiping = false;
  }

  /**
   * Cancel swipe
   */
  function handleTouchCancel() {
    isSwiping = false;
  }

  // Add event listeners to document for full coverage
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });
  document.addEventListener('touchcancel', handleTouchCancel, { passive: true });

  // Return cleanup function
  return () => {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    document.removeEventListener('touchcancel', handleTouchCancel);
  };
}