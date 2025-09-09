// sync.js
export function initVideoSync(video, state) {
  const handlers = [];

  const onPlay = () => { state.setPlayUI(true); state.setPausedUI(false); };
  const onPlaying = () => state.setPausedUI(false);
  const onPause = () => { state.setPlayUI(false); state.setPausedUI(true); };
  const onEnded = () => { state.setPlayUI(false); state.setPausedUI(true); };
  const onTimeUpdate = () => { /* timeline loop handles visuals, so this can stay empty */ };

  video.addEventListener("play", onPlay);
  video.addEventListener("playing", onPlaying);
  video.addEventListener("pause", onPause);
  video.addEventListener("ended", onEnded);
  video.addEventListener("timeupdate", onTimeUpdate);

  handlers.push(() => {
    video.removeEventListener("play", onPlay);
    video.removeEventListener("playing", onPlaying);
    video.removeEventListener("pause", onPause);
    video.removeEventListener("ended", onEnded);
    video.removeEventListener("timeupdate", onTimeUpdate);
  });

  return handlers;
}
