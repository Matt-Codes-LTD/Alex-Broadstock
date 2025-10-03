// follow-loop.js - Updated to preserve scale
export function createFollowLoop(box, ease = 0.18) {
  let useGsap = false, setX, setY;
  let targetX = 0, targetY = 0;
  let x = 0, y = 0;
  let rafId = null;

  const hasGSAP = () => !!(window.gsap && gsap.quickSetter && gsap.ticker);

  function useFallback() {
    useGsap = false;
    // FIXED: Preserve scale in transform
    setX = (px) => { 
      const scale = box.style.getPropertyValue('--cursor-scale') || '1';
      box.style.transform = `translate(${px}px, ${y}px) translate(-50%, -50%) scale(${scale})`;
    };
    setY = (py) => { 
      const scale = box.style.getPropertyValue('--cursor-scale') || '1';
      box.style.transform = `translate(${x}px, ${py}px) translate(-50%, -50%) scale(${scale})`;
    };
    const scale = box.style.getPropertyValue('--cursor-scale') || '1';
    box.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`;
  }

  function useGsapSetters() {
    useGsap = true;
    setX = gsap.quickSetter(box, "x", "px");
    setY = gsap.quickSetter(box, "y", "px");
    setX(x); 
    setY(y);
    // Set transform origin for centering
    gsap.set(box, { 
      xPercent: -50, 
      yPercent: -50
    });
  }

  function tick() {
    x += (targetX - x) * ease;
    y += (targetY - y) * ease;
    setX(x); 
    setY(y);
  }

  function start() {
    if (hasGSAP()) {
      if (!useGsap) useGsapSetters();
      gsap.ticker.add(tick);
    } else if (!rafId) {
      const loop = () => { tick(); rafId = requestAnimationFrame(loop); };
      useFallback();
      rafId = requestAnimationFrame(loop);
    }
  }

  function stop() {
    if (useGsap && window.gsap) gsap.ticker.remove(tick);
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  function setTarget(px, py) {
    targetX = px;
    targetY = py;
  }

  return { start, stop, setTarget, hasGSAP };
}