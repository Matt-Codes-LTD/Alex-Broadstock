/**
 * Nav Responsive Module
 * Handles responsive navigation adjustments based on content availability
 * Specifically removes padding when BTS button is not present
 */

export default function initNavResponsive(container) {
  // Guard clause
  const navWrap = container.querySelector('.nav-link_wrap.is-mobile');
  if (!navWrap || navWrap.dataset.navResponsiveInit) return () => {};
  navWrap.dataset.navResponsiveInit = "true";
  
  // State
  const state = {
    observer: null,
    handlers: []
  };
  
  // Check for BTS button and adjust padding
  function checkBTSVisibility() {
    const btsButton = navWrap.querySelector('.nav_link.is-bts');
    
    // Check if BTS doesn't exist or is hidden via Webflow conditional visibility
    const isBTSHidden = !btsButton || 
                        btsButton.classList.contains('w-condition-invisible') ||
                        btsButton.closest('.w-condition-invisible');
    
    navWrap.classList.toggle('no-bts', isBTSHidden);
  }
  
  // Initial check
  checkBTSVisibility();
  
  // Watch for DOM changes (in case Webflow dynamically updates visibility)
  state.observer = new MutationObserver(() => {
    checkBTSVisibility();
  });
  
  state.observer.observe(navWrap, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });
  
  // Also check on window resize in case responsive classes change
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
    navWrap.classList.remove('no-bts');
    delete navWrap.dataset.navResponsiveInit;
  };
}