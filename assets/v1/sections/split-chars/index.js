// index.js
import { splitChars, resetOriginals } from "./splitter.js";
import { initList } from "./list-init.js";
import { attachPulse } from "./pulse.js";
import { observe } from "./observer.js";

export default function initSplitChars(container) {
  // Initial scan
  container.querySelectorAll("[data-animate-chars]").forEach((el) => {
    splitChars(el);
    attachPulse(el);
  });
  container.querySelectorAll("[data-animate-chars-list]").forEach(initList);

  // Observe mutations
  const disconnect = observe(container);

  // Cleanup
  return () => {
    disconnect();
    resetOriginals();
  };
}
