export async function ensureFirstFramePainted(v) {
  if (v.readyState < 2) {
    await new Promise((res) => {
      const done = () => res();
      v.addEventListener("loadeddata", done, { once: true });
      v.addEventListener("canplay", done, { once: true });
      setTimeout(done, 3000);
    });
  }
  try {
    "fastSeek" in v ? v.fastSeek(0) : (v.currentTime = 0.00001);
  } catch {}
  try {
    v.muted = true;
    v.setAttribute("muted", "");
    await v.play?.().catch(() => {});
  } catch {}
  await new Promise((res) => {
    let done = false,
      cap = setTimeout(() => {
        if (!done) {
          done = true;
          res();
        }
      }, 800);
    v.addEventListener(
      "timeupdate",
      () => {
        if (!done) {
          done = true;
          clearTimeout(cap);
          requestAnimationFrame(res);
        }
      },
      { once: true }
    );
  });
  try {
    v.pause();
  } catch {}
}
