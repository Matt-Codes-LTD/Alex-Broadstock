// index.js - With solid fallback colors
export default function initMobileFilters(container) {
  const wrap = container.querySelector('.home-hero_wrap');
  if (!wrap || wrap.dataset.mobileFiltersInit) return () => {};
  wrap.dataset.mobileFiltersInit = "true";
  
  // Only initialize on mobile/tablet
  if (window.innerWidth > 991) return () => {};
  
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
  
  // Force reflow to ensure styles are applied
  button.offsetHeight;
  
  // Clone categories to panel
  const categories = container.querySelector('.home_hero_categories');
  if (!categories) {
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
  
  let isOpen = false;
  let scrollPos = 0;
  let fallbackTimeout = null;
  
  // Make button globally accessible for reveal timeline
  window.__mobileFiltersButton = button;
  
  // Reveal function - called AFTER site loader completes
  const revealButton = () => {
    if (window.gsap) {
      gsap.set(button, { visibility: 'visible' });
      gsap.to(button, {
        opacity: 1,
        transform: 'translateX(-50%) translateY(0)',
        duration: 0.6,
        ease: "power3.out",
        onComplete: () => {
          button.style.pointerEvents = 'auto';
        }
      });
    } else {
      button.style.visibility = 'visible';
      button.style.opacity = '1';
      button.style.transform = 'translateX(-50%) translateY(0)';
      button.style.pointerEvents = 'auto';
    }
  };
  
  // Determine when to show button
  if (!window.__initialPageLoad) {
    // Not initial load, reveal immediately
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        revealButton();
      });
    });
  } else {
    // Initial load - wait for site loader to complete
    fallbackTimeout = setTimeout(() => {
      revealButton();
    }, 5000); // Fallback after 5 seconds
    
    const onLoaderComplete = () => {
      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout);
        fallbackTimeout = null;
      }
      
      // Reveal after 100ms delay to ensure timeline is done
      setTimeout(() => {
        revealButton();
      }, 100);
    };
    
    window.addEventListener('siteLoaderComplete', onLoaderComplete, { once: true });
  }
  
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
  
  // Cleanup
  return () => {
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
  
  // Styles for button - Solid colors with higher z-index
  Object.assign(button.style, {
    position: 'fixed',
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#FFFFFF',  // Solid white
    color: '#000000',             // Solid black
    border: '1px solid #E5E5E5',  // Light gray border
    borderRadius: '8px',
    cursor: 'pointer',
    zIndex: '9999',               // Very high to ensure visibility
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'  // Add subtle shadow
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
    zIndex: '9998'
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
    backgroundColor: '#FFFFFF',  // Solid white
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    padding: '2rem',
    transform: 'translateY(100%)',
    transition: 'transform 0.3s ease',
    zIndex: '9999',
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