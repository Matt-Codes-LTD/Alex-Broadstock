// index.js - Fixed with better visibility logic and cleanup
export default function initMobileFilters(container) {
  const wrap = container.querySelector('.home-hero_wrap');
  if (!wrap || wrap.dataset.mobileFiltersInit) return () => {};
  wrap.dataset.mobileFiltersInit = "true";
  
  // Only initialize on mobile/tablet
  if (window.innerWidth > 991) return () => {};
  
  // Create mobile UI elements
  const { button, panel, backdrop } = createMobileUI();
  
  // Ensure button starts fully hidden
  button.style.opacity = '0';
  button.style.visibility = 'hidden';
  button.style.transform = 'translateX(-50%) translateY(10px)';
  
  // Add to DOM after setting initial styles
  document.body.appendChild(backdrop);
  document.body.appendChild(panel);
  document.body.appendChild(button);
  
  // Force reflow to ensure styles are applied
  button.offsetHeight;
  
  // Clone categories to panel
  const categories = container.querySelector('.home_hero_categories');
  if (!categories) {
    // Clean up if no categories found
    button.remove();
    panel.remove();
    backdrop.remove();
    delete wrap.dataset.mobileFiltersInit;
    return () => {};
  }
  
  const clone = categories.cloneNode(true);
  clone.classList.add('mobile-categories-list');
  panel.querySelector('.mobile-filters-content').appendChild(clone);
  
  let isOpen = false;
  let scrollPos = 0;
  
  // Make button globally accessible for reveal timeline
  window.__mobileFiltersButton = button;
  
  // Reveal function
  const revealButton = () => {
    if (window.gsap) {
      gsap.set(button, { visibility: 'visible' });
      gsap.to(button, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out"
      });
    } else {
      button.style.visibility = 'visible';
      button.style.opacity = '1';
      button.style.transform = 'translateX(-50%) translateY(0)';
    }
  };
  
  // Determine when to show button
  const siteLoader = document.querySelector('.site-loader_wrap[data-script-initialized="true"]');
  if (!siteLoader || !window.__initialPageLoad) {
    // No loader or not initial load, show after DOM settles
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        revealButton();
      });
    });
  }
  // Otherwise, the site loader timeline will handle reveal
  
  function open() {
    if (isOpen) return;
    isOpen = true;
    
    // Save scroll position and lock body
    scrollPos = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPos}px`;
    document.body.style.width = '100%';
    
    backdrop.classList.add('is-visible');
    panel.classList.add('is-visible');
    button.setAttribute('aria-expanded', 'true');
    
    // Sync active state when opening
    syncActiveStates();
  }
  
  function close() {
    if (!isOpen) return;
    isOpen = false;
    
    // Restore scroll position
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollPos);
    
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
      btn.classList.toggle('u-color-faded', !isActive);
    });
  }
  
  // Events with better touch handling
  button.addEventListener('click', (e) => {
    e.preventDefault();
    open();
  });
  
  backdrop.addEventListener('click', (e) => {
    e.preventDefault();
    close();
  });
  
  // ESC key to close
  const keyHandler = (e) => {
    if (e.key === 'Escape' && isOpen) {
      close();
    }
  };
  document.addEventListener('keydown', keyHandler);
  
  // Sync category clicks with main filter system
  panel.addEventListener('click', (e) => {
    const catBtn = e.target.closest('.home-category_text');
    if (!catBtn) return;
    
    e.preventDefault();
    
    const label = catBtn.textContent.trim();
    const match = Array.from(categories?.querySelectorAll('.home-category_text') || [])
      .find(el => el.textContent.trim() === label && !panel.contains(el));
    
    if (match) {
      match.click();
      
      // Update mobile active states immediately
      panel.querySelectorAll('.home-category_text').forEach(btn => {
        const isActive = btn.textContent.trim() === label;
        btn.setAttribute('aria-current', isActive ? 'true' : 'false');
        btn.classList.toggle('u-color-faded', !isActive);
      });
    }
    
    // Close after selection
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
    if (isOpen) close();
    button.remove();
    panel.remove();
    backdrop.remove();
    observer.disconnect();
    document.removeEventListener('keydown', keyHandler);
    delete wrap.dataset.mobileFiltersInit;
    delete window.__mobileFiltersButton;
  };
}

function createMobileUI() {
  // Button
  const button = document.createElement('button');
  button.className = 'mobile-filters-button u-text-style-main';
  button.setAttribute('aria-label', 'Open filters');
  button.setAttribute('aria-expanded', 'false');
  button.innerHTML = `<span class="mobile-filters-button-text">Filters</span>`;
  
  // Styles for button
  Object.assign(button.style, {
    position: 'fixed',
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '0.75rem 1.5rem',
    backgroundColor: 'var(--_theme---button-primary--background)',
    color: 'var(--_theme---button-primary--text)',
    border: '1px solid var(--_theme---button-primary--border)',
    borderRadius: 'var(--radius--main)',
    cursor: 'pointer',
    zIndex: '100',
    transition: 'all 0.3s ease'
  });
  
  // Backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'mobile-filters-backdrop';
  Object.assign(backdrop.style, {
    position: 'fixed',
    inset: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    opacity: '0',
    visibility: 'hidden',
    transition: 'all 0.3s ease',
    zIndex: '998'
  });
  
  // Panel
  const panel = document.createElement('div');
  panel.className = 'mobile-filters-panel';
  panel.innerHTML = `<div class="mobile-filters-content"></div>`;
  Object.assign(panel.style, {
    position: 'fixed',
    bottom: '0',
    left: '0',
    right: '0',
    backgroundColor: 'var(--_theme---background)',
    borderTopLeftRadius: 'var(--radius--main)',
    borderTopRightRadius: 'var(--radius--main)',
    padding: '2rem',
    transform: 'translateY(100%)',
    transition: 'transform 0.3s ease',
    zIndex: '999',
    maxHeight: '50vh',
    overflowY: 'auto'
  });
  
  // Visible states
  const style = document.createElement('style');
  style.textContent = `
    .mobile-filters-backdrop.is-visible {
      opacity: 1 !important;
      visibility: visible !important;
    }
    .mobile-filters-panel.is-visible {
      transform: translateY(0) !important;
    }
  `;
  document.head.appendChild(style);
  
  return { button, panel, backdrop };
}