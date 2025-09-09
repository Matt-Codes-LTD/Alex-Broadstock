// follow-loop.js
export function createFollowLoop(box, ease = 0.18) {
  let useGsap = false, setX, setY;
  let targetX = 0, targetY = 0;
  let x = 0, y = 0;
  let rafId = null;

  const hasGSAP = () => !!(window.gsap && gsap.quickSetter && gsap.ticker);

  function useFallback() {
    useGsap = false;
    setX = (px) => { box.style.transform = `translate(${px}px, ${y}px)`; };
    setY = (py) => { box.style.transform = `translate(${x}px, ${py}px)`; };
    box.style.transform = `translate(${x}px, ${y}px)`;
  }

  function useGsapSetters() {
    useGsap = true;
    setX = gsap.quickSetter(box, "x", "px");
    setY = gsap.quickSetter(box, "y", "px");
    setX(x); setY(y);
  }

  function tick() {
    x += (targetX - x) * ease;
    y += (targetY - y) * ease;
    setX(x); setY(y);
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
