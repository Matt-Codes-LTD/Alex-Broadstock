// site-timelines/grid-transition-timeline.js
import { calculateStaggerDelay } from "../core/transitions/stagger-calc.js";

export function createGridEnterTimeline({ divs, cols, rows }) {
  return gsap.timeline()
    .to(divs, {
      scaleY: 1,
      transformOrigin: '0% 100%',
      duration: 0.7,
      ease: 'o4',
      stagger: index => calculateStaggerDelay(index, cols, rows, false)
    });
}

export function createGridExitTimeline({ divs, cols, rows }) {
  return gsap.timeline()
    .to(divs, {
      scaleY: 0,
      transformOrigin: '0% 0%',
      duration: 0.7,
      ease: 'o4',
      stagger: index => calculateStaggerDelay(index, cols, rows, true)
    });
}

export function createGridTransitionSequence({ oldMain, newMain, grid, divs, cols, rows, onComplete }) {
  return new Promise(resolve => {
    // Phase 1: Grid scales up
    const enterTl = createGridEnterTimeline({ divs, cols, rows });
    
    enterTl.eventCallback('onComplete', () => {
      // Phase 2: Swap content
      oldMain.style.opacity = '0';
      newMain.style.opacity = '1';
      
      // Force paint
      newMain.offsetHeight;
      
      // Phase 3: Grid scales down
      const exitTl = createGridExitTimeline({ divs, cols, rows });
      
      exitTl.eventCallback('onComplete', () => {
        onComplete();
        resolve();
      });
    });
  });
}