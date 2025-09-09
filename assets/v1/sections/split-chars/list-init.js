// list-init.js
import { splitChars } from "./splitter.js";

export function initList(listEl) {
  if (!listEl || listEl.__charsListInit) return;
  listEl.__charsListInit = true;

  const sel = listEl.getAttribute("data-animate-chars-selector") || "a";
  const targetSel = listEl.getAttribute("data-animate-chars-target") || null;
  const listDelay = listEl.getAttribute("data-animate-delay");

  listEl.querySelectorAll(sel).forEach((link) => {
    if (!link.hasAttribute("data-animate-chars")) {
      link.setAttribute("data-animate-chars", "");
    }
    if (targetSel && !link.hasAttribute("data-animate-chars-target")) {
      link.setAttribute("data-animate-chars-target", targetSel);
    }
    if (listDelay && !link.hasAttribute("data-animate-delay")) {
      link.setAttribute("data-animate-delay", listDelay);
    }
    splitChars(link);
  });
}
