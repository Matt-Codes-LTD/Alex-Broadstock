/**
 * Page Scripts Orchestrator
 * Initializes all page-specific modules
 */

// Section imports
import initSiteLoader from "../sections/site-loader/index.js";
import initHomeHero from "../sections/home-hero/index.js";
import initProjectPlayer from "../sections/project-player/index.js";
import initSplitChars from "../sections/split-chars/index.js";
import initNavResponsive from "../sections/nav-responsive/index.js";

/**
 * Initialize all page scripts
 * @param {HTMLElement} container - The container element (usually document or Barba container)
 * @returns {Function} Cleanup function
 */
export function initPageScripts(container) {
  const cleanups = [];
  
  // Site loader (only on initial load, not page transitions)
  if (!window.barbaTransition) {
    cleanups.push(initSiteLoader(container));
  }
  
  // Home page modules
  cleanups.push(initHomeHero(container));
  
  // Project page modules  
  cleanups.push(initProjectPlayer(container));
  
  // Global modules
  cleanups.push(initSplitChars(container));
  cleanups.push(initNavResponsive(container));
  
  // Return master cleanup function
  return () => {
    cleanups.forEach(fn => {
      if (typeof fn === 'function') {
        try {
          fn();
        } catch (err) {
          console.error('Cleanup error:', err);
        }
      }
    });
  };
}

/**
 * Initialize scripts based on Barba namespace
 * @param {string} namespace - The Barba namespace
 * @param {HTMLElement} container - The container element
 * @returns {Function} Cleanup function
 */
export function initNamespaceScripts(namespace, container) {
  const cleanups = [];
  
  switch(namespace) {
    case 'home':
      // Home-specific initializations
      cleanups.push(initHomeHero(container));
      cleanups.push(initSplitChars(container));
      break;
      
    case 'project':
      // Project-specific initializations
      cleanups.push(initProjectPlayer(container));
      cleanups.push(initSplitChars(container));
      break;
      
    default:
      // Default initializations for unknown namespaces
      cleanups.push(initSplitChars(container));
      break;
  }
  
  // Always initialize nav responsive on all pages
  cleanups.push(initNavResponsive(container));
  
  return () => {
    cleanups.forEach(fn => {
      if (typeof fn === 'function') {
        fn();
      }
    });
  };
}