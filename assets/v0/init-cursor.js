function initCursor() {
  if (window.__cursorInit) return;
  window.__cursorInit = true;

  const wrap = document.querySelector(".cursor-crosshair_wrap");
  if (!wrap) return;

  // remove legacy elements
  wrap.querySelectorAll(".cursor-crosshair_line,.cursor-crosshair_dot,.cursor-crosshair_dot-top,.cursor-crosshair_pulse")
      .forEach(el => { try { el.remove(); } catch(e){} });

  // ensure follow box exists
  let box = wrap.querySelector(".cursor-follow_box");
  if (!box) {
    box = document.createElement("div");
    box.className = "cursor-follow_box";
    wrap.appendChild(box);
  }

  let rect = wrap.getBoundingClientRect();
  const updateRect = () => { rect = wrap.getBoundingClientRect(); };
  updateRect();

  const ro = new ResizeObserver(updateRect);
  ro.observe(wrap);
  addEventListener("scroll", updateRect, { passive: true });

  const gsapReady = () => !!(window.gsap && gsap.quickSetter && gsap.ticker);

  let posX, posY, setX, setY, usingGSAP = false;

  function useRAF() {
    usingGSAP = false;
    setX = (x) => { box.style.transform = `translate(${x}px, ${posY}px)`; };
    setY = (y) => { box.style.transform = `translate(${posX}px, ${y}px)`; };
    box.style.transform = `translate(${posX}px, ${posY}px)`;
  }

  function useGSAP() {
    usingGSAP = true;
    setX = gsap.quickSetter(box, "x", "px");
    setY = gsap.quickSetter(box, "y", "px");
    setX(posX);
    setY(posY);
  }

  const ease = 0.18;
  let targetX = rect.width / 2,
      targetY = rect.height / 2;
  posX = targetX;
  posY = targetY;

  function pointerMove(e) {
    if (!rect.width || !rect.height) updateRect();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
  }

  addEventListener("pointermove", pointerMove, { passive: true });
  addEventListener("pointerenter", pointerMove, { passive: true });
  document.addEventListener("mouseleave", reset, true);
  document.addEventListener("mouseout", reset, true);
  document.addEventListener("pointerout", reset, true);

  let rafId = null;

  const tick = () => {
    posX += (targetX - posX) * ease;
    posY += (targetY - posY) * ease;
    setX(posX);
    setY(posY);
  };

  function start() {
    if (gsapReady()) {
      if (!usingGSAP) {
        stop();
        useGSAP();
        gsap.ticker.add(tick);
      }
    } else if (!rafId) {
      useRAF();
      const loop = () => { tick(); rafId = requestAnimationFrame(loop); };
      rafId = requestAnimationFrame(loop);
    }
  }

  function stop() {
    if (usingGSAP && window.gsap) gsap.ticker.remove(tick);
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function reset(e) {
    if (e.pointerType === "touch") return;
    const leaving = e.relatedTarget == null,
          outOfBounds = e.clientX <= 0 || e.clientY <= 0 || e.clientX >= innerWidth || e.clientY >= innerHeight;
    if (leaving || outOfBounds) {
      updateRect();
      targetX = rect.width / 2;
      targetY = rect.height / 2;
    }
  }

  start();

  addEventListener("load", () => {
    if (!usingGSAP && gsapReady()) {
      stop();
      useGSAP();
      gsap.ticker.add(tick);
      usingGSAP = true;
    }
  }, { once: true });

  const visChange = () => { document.hidden ? stop() : start(); };
  document.addEventListener("visibilitychange", visChange);

  const mo = new MutationObserver(() => {
    if (!document.body.contains(wrap)) {
      stop();
      document.removeEventListener("visibilitychange", visChange);
      ro.disconnect();
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });
}
