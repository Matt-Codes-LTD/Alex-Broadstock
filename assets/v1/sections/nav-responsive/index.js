/**
 * Nav Responsive Modul
 * Handles responsive navigation adjustments based on content availability
 * Removes padding and adjusts margins when BTS button is not present
 */

export default function initNavResponsive(container) {
  // Guard clause - check for both elements
  const navLinkWrap = container.querySelector('.nav-link_wrap.is-mobile');
  const navWrap = container.querySelector('.nav_wrap.is-project');
  
  // Only proceed if we have at least one element to work with
  if ((!navLinkWrap && !navWrap) || container.dataset.navResponsiveInit) return () => {};
  container.dataset.navResponsiveInit = "true";
  
  // State
  const state = {
    observer: null,
    handlers: []
  };
  
  // Check for BTS button and adjust styles
  function checkBTSVisibility() {
    // Look for BTS button in either element
    const searchElement = navLinkWrap || navWrap;
    const btsButton = searchElement ? searchElement.querySelector('.nav_link.is-bts') : null;
    
    // Check if BTS doesn't exist or is hidden
    const isBTSHidden = !btsButton || 
                        btsButton.classList.contains('w-condition-invisible') ||
                        btsButton.closest('.w-condition-invisible');
    
    // Apply classes to both elements if they exist
    if (navLinkWrap) {
      navLinkWrap.classList.toggle('no-bts', isBTSHidden);
    }
    if (navWrap) {
      navWrap.classList.toggle('no-bts', isBTSHidden);
    }
  }
  
  // Initial check
  checkBTSVisibility();
  
  // Watch for DOM changes
  const observeElement = navLinkWrap || navWrap;
  if (observeElement) {
    state.observer = new MutationObserver(() => {
      checkBTSVisibility();
    });
    
    state.observer.observe(observeElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  }
  
  // Also check on window resize
  const handleResize = () => {
    checkBTSVisibility();
  };
  
  window.addEventListener('resize', handleResize);
  state.handlers.push(() => window.removeEventListener('resize', handleResize));
  
  // Cleanup function
  return () => {
    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }
    state.handlers.forEach(fn => fn());
    if (navLinkWrap) {
      navLinkWrap.classList.remove('no-bts');
    }
    if (navWrap) {
      navWrap.classList.remove('no-bts');
    }
    delete container.dataset.navResponsiveInit;
  };
}