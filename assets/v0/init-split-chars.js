function initSplitChars(t) {
  const e = new Map;
  const a = .01;

  function n(t) {
    const n = t.getAttribute("data-animate-chars-target"),
          r = n ? t.querySelectorAll(n) : [t];
    if (!r || !r.length) return;

    const i = parseFloat(t.getAttribute("data-animate-delay") || a);

    r.forEach((el) => {
      if (!el || el.dataset.charsInit === "1") return;

      const txt = el.textContent || "";
      e.set(el, txt);
      el.textContent = "";

      const wrapper = document.createElement("span");
      wrapper.setAttribute("data-animate-chars-inner", "");

      const frag = document.createDocumentFragment();
      for (let j = 0; j < txt.length; j++) {
        const ch = txt[j], span = document.createElement("span");
        span.textContent = ch;
        if (ch === " ") span.style.whiteSpace = "pre";
        span.style.transitionDelay = j * i + "s";
        frag.appendChild(span);
      }
      wrapper.appendChild(frag);
      el.appendChild(wrapper);
      el.dataset.charsInit = "1";
    });

    const pulse = () => {
      t.setAttribute("data-animate-pulse", "1");
      clearTimeout(t.__pulseTO);
      t.__pulseTO = setTimeout(() => t.removeAttribute("data-animate-pulse"), 700);
    };
    if (!t.__pulseBound) {
      t.__pulseBound = true;
      t.addEventListener("touchstart", pulse, { passive: true });
    }
  }

  function r(t) {
    if (!t.hasAttribute("data-animate-chars"))
      t.setAttribute("data-animate-chars", "");
    n(t);
  }

  function i(t) {
    if (!t || t.__charsListInit) return;
    t.__charsListInit = true;
    const eSel = t.getAttribute("data-animate-chars-selector") || "a",
          aSel = t.getAttribute("data-animate-chars-target") || null,
          iDelay = t.getAttribute("data-animate-delay");
    t.querySelectorAll(eSel).forEach((el) => {
      if (!el.hasAttribute("data-animate-chars"))
        el.setAttribute("data-animate-chars", "");
      if (aSel && !el.hasAttribute("data-animate-chars-target"))
        el.setAttribute("data-animate-chars-target", aSel);
      if (iDelay && !el.hasAttribute("data-animate-delay"))
        el.setAttribute("data-animate-delay", iDelay);
      n(el);
    });
  }

  function s(t) {
    if (!t || !t.querySelectorAll) return;
    t.querySelectorAll("[data-animate-chars]").forEach(r);
    if (t.nodeType === 1 && t.hasAttribute?.("data-animate-chars")) r(t);

    t.querySelectorAll("[data-animate-chars-list]").forEach(i);
    if (t.nodeType === 1 && t.hasAttribute?.("data-animate-chars-list")) i(t);
  }

  s(t);

  let o = false;
  const c = new Set,
        u = () => {
          if (o) return;
          o = true;
          requestAnimationFrame(() => {
            o = false;
            for (const el of c) s(el);
            c.clear();
          });
        };

  const l = new MutationObserver((muts) => {
    for (let k = 0; k < muts.length; k++) {
      const mut = muts[k];
      if (mut.type === "childList" && mut.addedNodes) {
        mut.addedNodes.forEach?.((node) => {
          if (node.nodeType === 1) c.add(node);
        });
      } else if (mut.type === "attributes" && mut.target && mut.target.nodeType === 1) {
        c.add(mut.target);
      }
    }
    u();
  });

  l.observe(t, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [
      "data-animate-chars",
      "data-animate-chars-list",
      "data-animate-chars-target",
      "data-animate-delay"
    ]
  });

  return () => {
    l.disconnect();
    e.forEach((txt, el) => {
      el.textContent = txt;
      delete el.dataset.charsInit;
    });
  };
}
