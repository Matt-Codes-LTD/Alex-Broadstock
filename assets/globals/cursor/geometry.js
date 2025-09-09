// geometry.js
export function initGeometry(overlay) {
  let rect = overlay.getBoundingClientRect();

  const computeGeometry = () => {
    rect = overlay.getBoundingClientRect();
  };

  const ro = new ResizeObserver(computeGeometry);
  ro.observe(overlay);
  addEventListener("scroll", computeGeometry, { passive: true });

  return {
    get rect() {
      return rect;
    },
    disconnect() {
      ro.disconnect();
      removeEventListener("scroll", computeGeometry);
    },
    computeGeometry,
  };
}
