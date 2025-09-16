// splitter.js
const incDefault = 0.02;
const originals = new Map();

export function splitChars(hostEl) {
  const targetSel = hostEl.getAttribute("data-animate-chars-target");
  const targets = targetSel ? hostEl.querySelectorAll(targetSel) : [hostEl];
  if (!targets?.length) return;

  const inc = parseFloat(hostEl.getAttribute("data-animate-delay") || incDefault);

  targets.forEach((target) => {
    if (!target || target.dataset.charsInit === "1") return;
    const text = target.textContent || "";
    originals.set(target, text);
    target.textContent = "";

    const inner = document.createElement("span");
    inner.setAttribute("data-animate-chars-inner", "");

    const frag = document.createDocumentFragment();
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const s = document.createElement("span");
      s.textContent = ch;
      if (ch === " ") s.style.whiteSpace = "pre";
      s.style.transitionDelay = i * inc + "s";
      frag.appendChild(s);
    }
    inner.appendChild(frag);
    target.appendChild(inner);
    target.dataset.charsInit = "1";
  });
}

export function resetOriginals() {
  originals.forEach((text, el) => {
    el.textContent = text;
    delete el.dataset.charsInit;
  });
  originals.clear();
}
