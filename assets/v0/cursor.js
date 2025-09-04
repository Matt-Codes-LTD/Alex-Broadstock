window.cursorInit = () => {
  if (window.__cursorInit) return; // run once globally
  window.__cursorInit = true;

  const wrap = document.querySelector(".cursor-crosshair_wrap");
  if (!wrap) return;

  const box = wrap.querySelector(".cursor-follow_box");
  if (!box) return;

  let tx = 0, ty = 0, x = 0, y = 0;
  const lag = 0.15;

  function loop() {
    x += ((tx + x) / 2 - x) * lag;
    y += ((ty + y) / 2 - y) * lag;
    box.style.transform = `translate(${x}px, ${y}px)`;
    requestAnimationFrame(loop);
  }

  window.addEventListener("mousemove", (e) => {
    tx = e.clientX;
    ty = e.clientY;
  }, { passive: true });

  loop();
};
