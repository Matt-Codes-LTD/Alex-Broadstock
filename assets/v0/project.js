window.projectInit = () => {
  const wrap = document.querySelector(".project-player_wrap");
  if (!wrap || wrap.dataset.projectInit) return;
  wrap.dataset.projectInit = "1";

  const video = wrap.querySelector("video");
  if (video) {
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.crossOrigin = "anonymous";
    video.autoplay = true;
    video.play?.().catch(() => {});
  }

  let idleT;
  function setActive() {
    wrap.dataset.idle = "0";
    clearTimeout(idleT);
    idleT = setTimeout(() => (wrap.dataset.idle = "1"), 3000);
  }

  ["mousemove", "keydown", "click", "touchstart"].forEach(evt => {
    wrap.addEventListener(evt, setActive, { passive: true });
  });

  setActive();
};
