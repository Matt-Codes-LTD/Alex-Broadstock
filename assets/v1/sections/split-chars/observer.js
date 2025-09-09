// observer.js
import { splitChars } from "./splitter.js";
import { initList } from "./list-init.js";

export function observe(container) {
  let scheduled = false;
  const queue = new Set();

  const scan = (root) => {
    if (!root?.querySelectorAll) return;
    root.querySelectorAll("[data-animate-chars]").forEach(splitChars);
    if (root.nodeType === 1 && root.hasAttribute?.("data-animate-chars")) {
      splitChars(root);
    }
    root.querySelectorAll("[data-animate-chars-list]").forEach(initList);
    if (root.nodeType === 1 && root.hasAttribute?.("data-animate-chars-list")) {
      initList(root);
    }
  };

  const scheduleScan = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      for (const n of queue) scan(n);
      queue.clear();
    });
  };

  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "childList") {
        m.addedNodes?.forEach((n) => {
          if (n.nodeType === 1) queue.add(n);
        });
      } else if (m.type === "attributes") {
        if (m.target?.nodeType === 1) queue.add(m.target);
      }
    }
    scheduleScan();
  });

  mo.observe(container, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [
      "data-animate-chars",
      "data-animate-chars-list",
      "data-animate-chars-target",
      "data-animate-delay",
    ],
  });

  return () => mo.disconnect();
}
