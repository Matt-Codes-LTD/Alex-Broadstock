// ghost-layer.js
export function getGhostLayer() {
  let gl = document.__ghostExitLayer;
  if (gl && document.body.contains(gl)) return gl;
  gl = document.createElement("div");
  gl.className = "ghost-exit-layer";
  document.body.appendChild(gl);
  document.__ghostExitLayer = gl;
  return gl;
}

export function stripArtifacts(root) {
  [...[root], ...root.querySelectorAll("*")].forEach((n) => {
    Object.assign(n.style, {
      background: "transparent",
      boxShadow: "none",
      textShadow: "none",
      mixBlendMode: "normal",
      webkitTextFillColor: "currentColor",
    });
  });
}

export function makeGhost(el, rect) {
  const g = el.cloneNode(true);
  g.setAttribute("aria-hidden", "true");
  const cs = getComputedStyle(el);
  Object.assign(g.style, {
    color: cs.color,
    position: "fixed",
    margin: "0",
    left: rect.left + "px",
    top: rect.top + "px",
    width: rect.width + "px",
    height: rect.height + "px",
    pointerEvents: "none",
    willChange: "transform,opacity",
    backfaceVisibility: "hidden",
    transform: "translateZ(0)",
    background: "transparent",
  });
  stripArtifacts(g);
  getGhostLayer().appendChild(g);
  return g;
}