const playerStates = new WeakMap();

export function initProject(root = document) {
  const wrap = root.querySelector(".project-player_wrap");
  if (!wrap || wrap.dataset.jsInit) return;
  wrap.dataset.jsInit = "1";

  const video = wrap.querySelector("video");
  if (video) {
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.crossOrigin = "anonymous";
    video.autoplay = true;
    video.play?.().catch(() => {});
  }

  // Idle logic
  let idleT;
  const makeActive = () => {
    wrap.dataset.idle = "0";
    clearTimeout(idleT);
    idleT = setTimeout(() => (wrap.dataset.idle = "1"), 3000);
  };
  const evs = ["mousemove", "keydown", "click", "touchstart"];
  evs.forEach(ev => wrap.addEventListener(ev, makeActive, { passive: true }));
  makeActive();

  playerStates.set(wrap, { idleT, evs, makeActive });
}

export function destroyProject(root = document) {
  const wrap = root.querySelector(".project-player_wrap");
  if (!wrap) return;
  const s = playerStates.get(wrap);
  if (s) {
    s.evs.forEach(ev => wrap.removeEventListener(ev, s.makeActive));
    clearTimeout(s.idleT);
    playerStates.delete(wrap);
  }
  delete wrap.dataset.jsInit;
}
