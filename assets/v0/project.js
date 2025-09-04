window.projectInit = () => {
  const player = document.querySelector(".project-player_wrap");
  if (!player || player.dataset.jsInit) return;
  player.dataset.jsInit = "1";

  const video = player.querySelector("video");
  if (!video) return;

  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.crossOrigin = "anonymous";
  video.autoplay = true;
  video.play?.().catch(() => {});

  let idleTimer;
  function resetIdle() {
    player.dataset.idle = "0";
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      player.dataset.idle = "1";
    }, 3000);
  }

  ["mousemove", "keydown", "click", "touchstart"].forEach(evt => {
    player.addEventListener(evt, resetIdle, { passive: true });
  });

  resetIdle();
};

// Run immediately if loaded on direct page hit
if (document.querySelector(".project-player_wrap")) window.projectInit();
