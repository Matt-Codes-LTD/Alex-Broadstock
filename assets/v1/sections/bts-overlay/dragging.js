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
    if (observer) {
      observer.kill();
    }
    gsap.set(container, { clearProps: 'x,y' });
  };
}