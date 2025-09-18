
// assets/v1/sections/mobile-filters/index.js
export default function initMobileFilters(container) {
  const wrap = container.querySelector('.home-hero_wrap');
  if (!wrap || wrap.dataset.mobileFiltersInit) return () => {};
  wrap.dataset.mobileFiltersInit = "true";
  
  // Create mobile UI elements
  const { button, panel, backdrop } = createMobileUI();
  document.body.appendChild(backdrop);
  document.body.appendChild(panel);
  document.body.appendChild(button);
  
  // Clone categories to panel
  const categories = container.querySelector('.home_hero_categories');
  if (categories) {
    const clone = categories.cloneNode(true);
    clone.classList.add('mobile-categories-list');
    panel.querySelector('.mobile-filters-content').appendChild(clone);
  }
  
  let isOpen = false;
  
  function open() {
    isOpen = true;
    document.body.style.overflow = 'hidden';
    backdrop.classList.add('is-visible');
    panel.classList.add('is-visible');
    button.setAttribute('aria-expanded', 'true');
  }
  
  function close() {
    isOpen = false;
    document.body.style.overflow = '';
    backdrop.classList.remove('is-visible');
    panel.classList.remove('is-visible');
    button.setAttribute('aria-expanded', 'false');
  }
  
  // Events
  button.addEventListener('click', open);
  backdrop.addEventListener('click', close);
  
  const closeBtn = panel.querySelector('.mobile-filters-close');
  closeBtn.addEventListener('click', close);
  
  // Sync category clicks with main filter system
  panel.addEventListener('click', (e) => {
    const catBtn = e.target.closest('.home-category_text');
    if (!catBtn) return;
    
    // Trigger click on desktop equivalent
    const label = catBtn.textContent;
    const desktopCat = categories?.querySelector(
      `.home-category_text:not(.mobile-categories-list *)`
    );
    const match = Array.from(categories?.querySelectorAll('.home-category_text') || [])
      .find(el => el.textContent.trim() === label.trim() && !panel.contains(el));
    
    if (match) {
      match.click();
      // Update mobile active states
      panel.querySelectorAll('.home-category_text').forEach(btn => {
        const isActive = btn.textContent.trim() === label.trim();
        btn.setAttribute('aria-current', isActive ? 'true' : 'false');
        btn.classList.toggle('u-color-faded', !isActive);
      });
    }
    
    setTimeout(close, 300);
  });
  
  // Cleanup
  return () => {
    button.remove();
    panel.remove();
    backdrop.remove();
    delete wrap.dataset.mobileFiltersInit;
  };
}

function createMobileUI() {
  // Button
  const button = document.createElement('button');
  button.className = 'mobile-filters-button u-text-style-main';
  button.setAttribute('aria-label', 'Open filters');
  button.setAttribute('aria-expanded', 'false');
  button.innerHTML = `
    <span class="mobile-filters-button-text">Filters</span>
    <svg class="mobile-filters-button-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;
  
  // Backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'mobile-filters-backdrop';
  
  // Panel
  const panel = document.createElement('div');
  panel.className = 'mobile-filters-panel';
  panel.innerHTML = `
    <div class="mobile-filters-header">
      <h2 class="mobile-filters-title u-text-style-main">Filter Projects</h2>
      <button class="mobile-filters-close" aria-label="Close filters">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
    <div class="mobile-filters-content"></div>
  `;
  
  return { button, panel, backdrop };
}