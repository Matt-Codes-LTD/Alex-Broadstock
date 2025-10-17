// assets/v1/sections/bts-overlay/dragging.js

export function initDragging(overlay) {
  if (!window.gsap || !window.Observer) {
    console.warn('[BTSDragging] GSAP or Observer not available');
    return () => {};
  }

  const container = overlay.querySelector('.bts-grid_container');
  if (!container) {
    console.warn('[BTSDragging] Grid container not found');
    return () => {};
  }

  // Prevent pull-to-refresh and scrolling on touch devices
  const preventDefaultTouch = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  // Prevent context menu on long press
  const preventContextMenu = (e) => {
    e.preventDefault();
  };
  
  // Add listeners with passive: false to override Chrome's intervention
  overlay.addEventListener('touchstart', preventDefaultTouch, { passive: false });
  overlay.addEventListener('touchmove', preventDefaultTouch, { passive: false });
  overlay.addEventListener('touchend', preventDefaultTouch, { passive: false });
  overlay.addEventListener('contextmenu', preventContextMenu);
  
  // Also prevent on the container itself
  container.addEventListener('touchmove', preventDefaultTouch, { passive: false });

  // Calculate wrapping boundaries
  const halfX = container.clientWidth / 2;
  const wrapX = gsap.utils.wrap(-halfX, 0);
  const xTo = gsap.quickTo(container, 'x', {
    duration: 1.5,
    ease: "power4",
    modifiers: {
      x: gsap.utils.unitize(wrapX)
    }
  });

  const halfY = container.clientHeight / 2;
  const wrapY = gsap.utils.wrap(-halfY, 0);
  const yTo = gsap.quickTo(container, 'y', {
    duration: 1.5,
    ease: "power4",
    modifiers: {
      y: gsap.utils.unitize(wrapY)
    }
  });

  let incrX = 0, incrY = 0;

  // Create Observer for drag and wheel
  const observer = Observer.create({
    target: overlay,
    type: "wheel,touch,pointer",
    preventDefault: true, // Prevent default on all events
    dragMinimum: 3, // Minimum movement before drag starts
    tolerance: 10, // Helps prevent accidental drags
    onChangeX: (self) => {
      if (self.event.type === "wheel") {
        incrX -= self.deltaX;
      } else {
        incrX += self.deltaX * 2;
      }
      xTo(incrX);
    },
    onChangeY: (self) => {
      if (self.event.type === "wheel") {
        incrY -= self.deltaY;
      } else {
        incrY += self.deltaY * 2;
      }
      yTo(incrY);
    }
  });

  console.log('[BTSDragging] Dragging initialized');

  // Return cleanup function
  return () => {
    // Remove all event listeners
    overlay.removeEventListener('touchstart', preventDefaultTouch);
    overlay.removeEventListener('touchmove', preventDefaultTouch);
    overlay.removeEventListener('touchend', preventDefaultTouch);
    overlay.removeEventListener('contextmenu', preventContextMenu);
    container.removeEventListener('touchmove', preventDefaultTouch);
    
    if (observer) {
      observer.kill();
    }
    
    gsap.set(container, { clearProps: 'x,y' });
    
    console.log('[BTSDragging] Dragging cleaned up');
  };
}