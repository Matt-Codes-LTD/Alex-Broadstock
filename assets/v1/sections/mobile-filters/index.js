// assets/v1/sections/mobile-filters/index.js
export default function initMobileFilters(container) {
  const wrap = container.querySelector('.home-hero_wrap');
  if (!wrap || wrap.dataset.mobileFiltersInit) return () => {};
  wrap.dataset.mobileFiltersInit = "true";
  
  // Only initialize on mobile/tablet
  if (window.innerWidth > 991) return () => {};
  
  // Create mobile UI elements
  const { button, panel, backdrop } = createMobileUI();
  
  // Force button to be completely hidden initially
  button.style.cssText = `
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
    z-index: -1 !important;
  `;
  
  // Add to DOM
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
  
  // Reveal function - removes inline styles and animates
  const revealButton = () => {
    // First remove the hiding styles
    button.style.cssText = '';
    
    // Then animate in
    if (window.gsap) {
      gsap.fromTo(button, 
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
      );
    } else {
      button.style.opacity = '1';
    }
  };
  
  // Only reveal after site loader completes or if no loader
  const siteLoader = document.querySelector('.site-loader_wrap[data-script-initialized="true"]');
  if (!siteLoader || !window.__initialPageLoad) {
    // No loader, show after short delay
    setTimeout(revealButton, 500);
  } else {
    // Wait for site loader to complete
    window.addEventListener('siteLoaderComplete', () => {
      // Delay to ensure it appears after project names
      setTimeout(revealButton, 1200);
    }, { once: true });
  }
  
  function open() {
    isOpen = true;
    document.body.style.overflow = 'hidden';
    backdrop.classList.add('is-visible');
    panel.classList.add('is-visible');
    button.setAttribute('aria-expanded', 'true');
    
    // Sync active state when opening
    syncActiveStates();
  }
  
  function close() {
    isOpen = false;
    document.body.style.overflow = '';
    backdrop.classList.remove('is-visible');
    panel.classList.remove('is-visible');
    button.setAttribute('aria-expanded', 'false');
  }
  
  // Sync active states between desktop and mobile
  function syncActiveStates() {
    const activeDesktop = categories?.querySelector('.home-category_text[aria-current="true"]');
    const activeLabel = activeDesktop?.textContent?.trim() || 'All';
    
    panel.querySelectorAll('.home-category_text').forEach(btn => {
      const isActive = btn.textContent.trim() === activeLabel;
      btn.setAttribute('aria-current', isActive ? 'true' : 'false');
      
      if (isActive) {
        btn.classList.remove('u-color-faded');
      } else {
        btn.classList.add('u-color-faded');
      }
    });
  }
  
  // Events
  button.addEventListener('click', open);
  button.addEventListener('touchstart', (e) => {
    e.preventDefault();
    open();
  }, { passive: false });
  
  backdrop.addEventListener('click', close);
  backdrop.addEventListener('touchstart', (e) => {
    e.preventDefault();
    close();
  }, { passive: false });
  
  // Sync category clicks with main filter system
  panel.addEventListener('click', (e) => {
    const catBtn = e.target.closest('.home-category_text');
    if (!catBtn) return;
    
    const label = catBtn.textContent;
    const match = Array.from(categories?.querySelectorAll('.home-category_text') || [])
      .find(el => el.textContent.trim() === label.trim() && !panel.contains(el));
    
    if (match) {
      match.click();
      
      panel.querySelectorAll('.home-category_text').forEach(btn => {
        const isActive = btn.textContent.trim() === label.trim();
        btn.setAttribute('aria-current', isActive ? 'true' : 'false');
        
        if (isActive) {
          btn.classList.remove('u-color-faded');
        } else {
          btn.classList.add('u-color-faded');
        }
      });
    }
    
    setTimeout(close, 300);
  });
  
  // Watch for changes in desktop categories
  const observer = new MutationObserver(() => {
    if (isOpen) syncActiveStates();
  });
  
  if (categories) {
    observer.observe(categories, { 
      attributes: true, 
      subtree: true, 
      attributeFilter: ['aria-current', 'class'] 
    });
  }
  
  // Cleanup
  return () => {
    button.remove();
    panel.remove();
    backdrop.remove();
    observer.disconnect();
    delete wrap.dataset.mobileFiltersInit;
  };
}

function createMobileUI() {
  const button = document.createElement('button');
  button.className = 'mobile-filters-button u-text-style-main';
  button.setAttribute('aria-label', 'Open filters');
  button.setAttribute('aria-expanded', 'false');
  button.innerHTML = `<span class="mobile-filters-button-text">Filters</span>`;
  
  const backdrop = document.createElement('div');
  backdrop.className = 'mobile-filters-backdrop';
  
  const panel = document.createElement('div');
  panel.className = 'mobile-filters-panel';
  panel.innerHTML = `<div class="mobile-filters-content"></div>`;
  
  return { button, panel, backdrop };
}