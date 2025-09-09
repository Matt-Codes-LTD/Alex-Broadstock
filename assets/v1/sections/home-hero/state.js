// state.js
let activeLink = null;

export function setActiveLink(next) {
  if (activeLink && activeLink !== next) {
    activeLink.setAttribute("aria-current", "false");
    fadeTargetsFor(activeLink).forEach((n) => n.classList.add("u-color-faded"));
  }
  if (next) {
    next.setAttribute("aria-current", "true");
    fadeTargetsFor(next).forEach((n) => n.classList.remove("u-color-faded"));
  }
  activeLink = next;
}

function fadeTargetsFor(link) {
  const defaultFadeSel = ".home-category_ref_text, .home-hero_title, .home-hero_name, .home-hero_heading";
  return link.querySelectorAll(link.getAttribute("data-fade-target") || defaultFadeSel);
}

export function getActiveLink() {
  return activeLink;
}
