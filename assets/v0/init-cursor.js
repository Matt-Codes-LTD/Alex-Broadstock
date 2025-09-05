/* =========================
   SPLIT CHARS (per container)
========================= */
function initSplitChars(container) {
  const originals = new Map();
  const incDefault = 0.01;

  function splitChars(hostEl) {
    const targetSel = hostEl.getAttribute("data-animate-chars-target");
    const targets = targetSel ? hostEl.querySelectorAll(targetSel) : [hostEl];
    if (!targets || !targets.length) return;

    const inc = parseFloat(hostEl.getAttribute("data-animate-delay") || incDefault);

    targets.forEach((target) => {
      if (!target || target.dataset.charsInit === "1") return;

      const text = target.textContent || "";
      originals.set(target, text);
      target.textContent = "";

      const inner = document.createElement("span");
      inner.setAttribute("data-animate-chars-inner","");

      const frag = document.createDocumentFragment();
      for (let i = 0; i < text.length; i++){
        const ch = text[i];
        const s = document.createElement("span");
        s.textContent = ch;
        if (ch === " ") s.style.whiteSpace = "pre";
        s.style.transitionDelay = (i * inc) + "s";
        frag.appendChild(s);
      }
      inner.appendChild(frag);
      target.appendChild(inner);
      target.dataset.charsInit = "1";
    });

    // Touch pulse feedback
    const pulse = () => {
      hostEl.setAttribute("data-animate-pulse","1");
      clearTimeout(hostEl.__pulseTO);
      hostEl.__pulseTO = setTimeout(()=> hostEl.removeAttribute("data-animate-pulse"), 700);
    };
    if (!hostEl.__pulseBound) {
      hostEl.__pulseBound = true;
      hostEl.addEventListener("touchstart", pulse, { passive:true });
    }
  }

  function ensureOptIn(el){
    if (!el.hasAttribute("data-animate-chars")) el.setAttribute("data-animate-chars","");
    splitChars(el);
  }

  function initList(listEl){
    if (!listEl || listEl.__charsListInit) return;
    listEl.__charsListInit = true;

    const sel       = listEl.getAttribute("data-animate-chars-selector") || "a";
    const targetSel = listEl.getAttribute("data-animate-chars-target") || null;
    const listDelay = listEl.getAttribute("data-animate-delay");

    listEl.querySelectorAll(sel).forEach((link) => {
      if (!link.hasAttribute("data-animate-chars")) link.setAttribute("data-animate-chars","");
      if (targetSel && !link.hasAttribute("data-animate-chars-target")) link.setAttribute("data-animate-chars-target", targetSel);
      if (listDelay && !link.hasAttribute("data-animate-delay")) link.setAttribute("data-animate-delay", listDelay);
      splitChars(link);
    });
  }

  function scan(root){
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll("[data-animate-chars]").forEach(ensureOptIn);
    if (root.nodeType === 1 && root.hasAttribute?.("data-animate-chars")) ensureOptIn(root);
    root.querySelectorAll("[data-animate-chars-list]").forEach(initList);
    if (root.nodeType === 1 && root.hasAttribute?.("data-animate-chars-list")) initList(root);
  }

  scan(container);

  // Batched observer (scoped to container)
  let scheduled = false;
  const queue = new Set();
  const scheduleScan = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      for (const n of queue) scan(n);
      queue.clear();
    });
  };

  const mo = new MutationObserver((muts)=>{
    for (let i=0;i<muts.length;i++) {
      const m = muts[i];
      if (m.type === "childList") {
        m.addedNodes && m.addedNodes.forEach?.(n => { if (n.nodeType === 1) { queue.add(n); } });
      } else if (m.type === "attributes") {
        const t = m.target;
        if (t && t.nodeType === 1) queue.add(t);
      }
    }
    scheduleScan();
  });

  mo.observe(container, {
    subtree:true, childList:true, attributes:true,
    attributeFilter:["data-animate-chars","data-animate-chars-list","data-animate-chars-target","data-animate-delay"]
  });

  // Cleanup restores originals and disconnects
  return () => {
    mo.disconnect();
    originals.forEach((text, el) => {
      el.textContent = text;
      delete el.dataset.charsInit;
    });
  };
}
