// preload.js
export async function ensureFirstFramePainted(video) {
  if (video.readyState < 2) {
    await new Promise((res) => {
      const done = () => res();
      video.addEventListener("loadeddata", done, { once: true });
      video.addEventListener("canplay", done, { once: true });
      setTimeout(done, 3000);
    });
  }

  try {
    "fastSeek" in video
      ? video.fastSeek(0)
      : (video.currentTime = 0.00001);
    video.play?.().catch(() => {});
  } catch {}

  await new Promise((res) => {
    let done = false;
    const cap = setTimeout(() => {
      if (!done) { done = true; res(); }
    }, 800);

    video.addEventListener("timeupdate", () => {
      if (!done) {
        done = true;
        clearTimeout(cap);
        requestAnimationFrame(res);
      }
    }, { once: true });
  });

  try { video.pause(); } catch {}
}
