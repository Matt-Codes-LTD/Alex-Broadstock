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
    // Don't interfere with clickable elements
    if (e.target.closest('a, button, [role="button"]')) {
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
    if (!isSwiping) return;
    
    // Only prevent default if we're actually swiping vertically
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const deltaY = Math.abs(touchStartY - currentY);
    const deltaX = Math.abs(touchStartX - currentX);
    
    if (deltaY > deltaX && deltaY > 10) {
      e.preventDefault();
    }
  }

  /**
   * Handle touch end
   */
  function handleTouchEnd(e) {
    if (!isSwiping) return;

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

  // CHANGED: Add event listeners to WINDOW instead of wrap
  // This ensures touch events work across the entire screen
  window.addEventListener('touchstart', handleTouchStart, { passive: true });
  window.addEventListener('touchmove', handleTouchMove, { passive: false });
  window.addEventListener('touchend', handleTouchEnd, { passive: true });
  window.addEventListener('touchcancel', handleTouchCancel, { passive: true });

  // Return cleanup function
  return () => {
    window.removeEventListener('touchstart', handleTouchStart);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
    window.removeEventListener('touchcancel', handleTouchCancel);
  };
}