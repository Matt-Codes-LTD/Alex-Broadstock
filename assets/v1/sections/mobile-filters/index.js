// index.js - FIXED - Proper transform to preserve centering
export default function initMobileFilters(container) {
  console.log('[MobileFilters] Starting init...');
  console.log('[MobileFilters] Window width:', window.innerWidth);
  console.log('[MobileFilters] __initialPageLoad:', window.__initialPageLoad);
  
  const wrap = container.querySelector('.home-hero_wrap');
  console.log('[MobileFilters] Found wrap:', !!wrap);
  
  if (!wrap || wrap.dataset.mobileFiltersInit) {
    console.log('[MobileFilters] Exiting - no wrap or already initialized');
    return () => {};
  }
  wrap.dataset.mobileFiltersInit = "true";
  
  // Only initialize on mobile/tablet
  if (window.innerWidth > 991) {
    console.log('[MobileFilters] Exiting - desktop viewport');
    return () => {};
  }
  
  console.log('[MobileFilters] Creating UI elements...');
  // Create mobile UI elements
  const { button, panel, backdrop } = createMobileUI();
  
  // Ensure button starts fully hidden (prevents FOUC)
  button.style.opacity = '0';
  button.style.visibility = 'hidden';
  button.style.transform = 'translateX(-50%) translateY(10px)';
  button.style.pointerEvents = 'none';
  
  // Add to DOM after setting initial styles
  document.body.appendChild(backdrop);
  document.body.appendChild(panel);
  document.body.appendChild(button);
  
  console.log('[MobileFilters] Button added to DOM');
  console.log('[MobileFilters] Button styles:', {
    opacity: button.style.opacity,
    visibility: button.style.visibility,
    position: button.style.position,
    bottom: button.style.bottom,
    zIndex: button.style.zIndex
  });
  
  // Force reflow to ensure styles are applied
  button.offsetHeight;
  
  // Clone categories to panel
  const categories = container.querySelector('.home_hero_categories');
  console.log('[MobileFilters] Found categories:', !!categories);
  
  if (!categories) {
    console.warn('[MobileFilters] No categories found - cleaning up');
    button.remove();
    panel.remove();
    backdrop.remove();
    delete wrap.dataset.mobileFiltersInit;
    return () => {};
  }
  
  const clone = categories.cloneNode(true);
  clone.classList.add('mobile-categories-list');
  
  // Remove any "All" buttons from the clone
  const allButtons = clone.querySelectorAll('.home-category_text');
  allButtons.forEach(btn => {
    if (btn.textContent.trim().toLowerCase() === 'all') {
      const listItem = btn.closest('[role="listitem"]');
      if (listItem) {
        listItem.remove();
      } else {
        btn.remove();
      }
    }
  });
  
  panel.querySelector('.mobile-filters-content').appendChild(clone);
  console.log('[MobileFilters] Categories cloned to panel');
  
  let isOpen = false;
  let scrollPos = 0;
  let fallbackTimeout = null;
  
  // Make button globally accessible for reveal timeline
  window.__mobileFiltersButton = button;
  console.log('[MobileFilters] Button set to window.__mobileFiltersButton');
  
  // Reveal function - called AFTER site loader completes
  const revealButton = () => {
    console.log('[MobileFilters] revealButton() called');
    console.log('[MobileFilters] Current button state:', {
      visibility: button.style.visibility,
      opacity: button.style.opacity,
      transform: button.style.transform,
      pointerEvents: button.style.pointerEvents
    });
    
    if (window.gsap) {
      console.log('[MobileFilters] Using GSAP animation');
      gsap.set(button, { visibility: 'visible' });
      gsap.to(button, {
        opacity: 1,
        // Use transform instead of y to preserve translateX(-50%)
        transform: 'translateX(-50%) translateY(0)',
        duration: 0.6,
        ease: "power3.out",
        onComplete: () => {
          button.style.pointerEvents = 'auto';
          console.log('[MobileFilters] GSAP animation complete');
          console.log('[MobileFilters] Final button state:', {
            visibility: button.style.visibility,
            opacity: button.style.opacity,
            transform: button.style.transform
          });
        }
      });
    } else {
      console.log('[MobileFilters] Using CSS animation (no GSAP)');
      button.style.visibility = 'visible';
      button.style.opacity = '1';
      button.style.transform = 'translateX(-50%) translateY(0)';
      button.style.pointerEvents = 'auto';
    }
  };
  
  // Determine when to show button
  if (!window.__initialPageLoad) {
    console.log('[MobileFilters] Not initial load - revealing immediately');
    // Not initial load, reveal immediately
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        revealButton();
      });
    });
  } else {
    console.log('[MobileFilters] Initial load - waiting for site loader');
    // Initial load - wait for site loader to complete
    fallbackTimeout = setTimeout(() => {
      console.warn('[MobileFilters] FALLBACK TIMEOUT - Revealing button now');
      revealButton();
    }, 5000); // Fallback after 5 seconds
    
    const onLoaderComplete = () => {
      console.log('[MobileFilters] siteLoaderComplete event fired');
      console.log('[MobileFilters] Button state before reveal:', {
        visibility: button.style.visibility,
        opacity: button.style.opacity,
        inDOM: document.body.contains(button)
      });
      
      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout);
        fallbackTimeout = null;
      }
      
      // Always reveal after 100ms delay to ensure timeline is done
      setTimeout(() => {
        console.log('[MobileFilters] Revealing button after loader complete');
        revealButton();
      }, 100);
    };
    
    window.addEventListener('siteLoaderComplete', onLoaderComplete, { once: true });
  }
  
  function open() {
    if (isOpen) return;
    isOpen = true;
    console.log('[MobileFilters] Opening panel');
    
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
    console.log('[MobileFilters] Closing panel');
    
    // Restore scroll position
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollPos);
    
    backdrop.classList.remove('is-visible');
    panel.classList.remove('is-visible');
    button.setAttribute('aria-expanded', 'false');
  }
  
  // Sync active states between desktop and mobile (excluding "All")
  function syncActiveStates() {
    const activeDesktop = categories?.querySelector('.home-category_text[aria-current="true"]');
    let activeLabel = activeDesktop?.textContent?.trim() || '';
    
    // Skip "All" and find the first real category if needed
    if (activeLabel.toLowerCase() === 'all' || !activeLabel) {
      const firstValidCategory = categories?.querySelector('.home-category_text:not([aria-current="false"])');
      if (firstValidCategory) {
        const text = firstValidCategory.textContent?.trim();
        if (text && text.toLowerCase() !== 'all') {
          activeLabel = text;
        }
      }
    }
    
    // If still no valid label, use the first non-"All" category
    if (!activeLabel || activeLabel.toLowerCase() === 'all') {
      const allCats = categories?.querySelectorAll('.home-category_text') || [];
      for (const cat of allCats) {
        const text = cat.textContent?.trim();
        if (text && text.toLowerCase() !== 'all') {
          activeLabel = text;
          break;
        }
      }
    }
    
    panel.querySelectorAll('.home-category_text').forEach(btn => {
      const btnText = btn.textContent.trim();
      
      // Skip "All" buttons
      if (btnText.toLowerCase() === 'all') {
        btn.setAttribute('aria-current', 'false');
        btn.classList.add('u-color-faded');
        return;
      }
      
      const isActive = btnText === activeLabel;
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
    
    // Skip "All" buttons
    if (label.toLowerCase() === 'all') return;
    
    const match = Array.from(categories?.querySelectorAll('.home-category_text') || [])
      .find(el => el.textContent.trim() === label && !panel.contains(el));
    
    if (match) {
      match.click();
      
      // Update mobile active states immediately
      panel.querySelectorAll('.home-category_text').forEach(btn => {
        const btnText = btn.textContent.trim();
        
        // Skip "All" buttons
        if (btnText.toLowerCase() === 'all') {
          btn.setAttribute('aria-current', 'false');
          btn.classList.add('u-color-faded');
          return;
        }
        
        const isActive = btnText === label;
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
  
  console.log('[MobileFilters] Init complete - waiting for reveal');
  
  // Cleanup
  return () => {
    console.log('[MobileFilters] Cleanup called');
    if (fallbackTimeout) {
      clearTimeout(fallbackTimeout);
    }
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
  
  // Styles for button - UPDATED COLORS
  Object.assign(button.style, {
    position: 'fixed',
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '0.75rem 1.5rem',
    backgroundColor: 'var(--swatch--brand-paper)',
    color: 'var(--swatch--brand-ink)',
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
  
  // Visible states and center alignment styles
  const style = document.createElement('style');
  style.textContent = `
    .mobile-filters-backdrop.is-visible {
      opacity: 1 !important;
      visibility: visible !important;
    }
    .mobile-filters-panel.is-visible {
      transform: translateY(0) !important;
    }
    /* Center align categories horizontally with gaps */
    .mobile-filters-content {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .mobile-filters-content .mobile-categories-list {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      width: 100%;
    }
    .mobile-filters-content .home-category_text {
      text-align: center;
    }
  `;
  document.head.appendChild(style);
  
  return { button, panel, backdrop };
}