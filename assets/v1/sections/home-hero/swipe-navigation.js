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
  let touchEndY = 0;
  let touchEndX = 0;
  let isSwiping = false;

  // Swipe threshold (minimum distance in pixels)
  const SWIPE_THRESHOLD = 50;
  const HORIZONTAL_TOLERANCE = 30;

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
    
    // Don't interfere with navigation links
    if (e.target.closest('.nav_wrap a, .nav_wrap button')) {
      return;
    }

    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    isSwiping = true;
  }

  /**
   * Handle touch move
   */
  function handleTouchMove(e) {
    if (!isSwiping || !isHomePage()) return;
    
    // Calculate movement
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const deltaY = Math.abs(touchStartY - currentY);
    const deltaX = Math.abs(touchStartX - currentX);
    
    // Prevent page scroll if this looks like a vertical swipe
    if (deltaY > deltaX && deltaY > 10) {
      e.preventDefault();
    }
  }

  /**
   * Handle touch end
   */
  function handleTouchEnd(e) {
    if (!isSwiping || !isHomePage()) return;

    touchEndY = e.changedTouches[0].clientY;
    touchEndX = e.changedTouches[0].clientX;

    const deltaY = touchStartY - touchEndY;
    const deltaX = Math.abs(touchStartX - touchEndX);

    const isVerticalSwipe = Math.abs(deltaY) > SWIPE_THRESHOLD && deltaX < HORIZONTAL_TOLERANCE;

    if (isVerticalSwipe) {
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

  // Add event listeners to DOCUMENT BODY for full page coverage
  document.body.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.body.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.body.addEventListener('touchend', handleTouchEnd, { passive: true });
  document.body.addEventListener('touchcancel', handleTouchCancel, { passive: true });

  console.log('[SwipeNav] Initialized - listening on entire page');

  // Return cleanup function
  return () => {
    document.body.removeEventListener('touchstart', handleTouchStart);
    document.body.removeEventListener('touchmove', handleTouchMove);
    document.body.removeEventListener('touchend', handleTouchEnd);
    document.body.removeEventListener('touchcancel', handleTouchCancel);
    console.log('[SwipeNav] Cleaned up');
  };
}