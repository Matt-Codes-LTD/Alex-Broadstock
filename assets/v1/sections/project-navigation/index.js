// assets/v1/sections/project-navigation/index.js

export default function initProjectNavigation(container) {
  // Only run on project pages
  if (container.dataset.barbaNamespace !== "project") return () => {};
  
  const playerWrap = container.querySelector('.project-player_wrap');
  if (!playerWrap || playerWrap.dataset.navInitialized) return () => {};
  playerWrap.dataset.navInitialized = "true";

  // Find UI elements
  const prevButton = container.querySelector('[data-nav="prev"]');
  const nextButton = container.querySelector('[data-nav="next"]');
  
  if (!prevButton || !nextButton) {
    console.warn("[ProjectNav] Navigation buttons not found");
    return () => {};
  }

  // Find the hidden navigation list
  const navWrapper = container.querySelector('.project_navigation_wrapper');
  if (!navWrapper) {
    console.warn("[ProjectNav] No navigation wrapper found");
    return () => {};
  }

  // Parse all projects from the list
  const links = Array.from(navWrapper.querySelectorAll('.project_navigation_links'));
  if (links.length === 0) {
    console.warn("[ProjectNav] No project links found");
    return () => {};
  }

  const projects = links.map(link => ({
    slug: link.dataset.slug,
    url: link.href,
    name: link.textContent.trim() || link.dataset.slug
  }));

  // Find current project
  const currentSlug = playerWrap.dataset.projectSlug;
  if (!currentSlug) {
    console.warn("[ProjectNav] No project slug on player wrap");
    return () => {};
  }

  const currentIndex = projects.findIndex(p => p.slug === currentSlug);
  if (currentIndex === -1) {
    console.warn("[ProjectNav] Current project not found in list");
    return () => {};
  }

  // Only show navigation if there's more than one project
  if (projects.length <= 1) {
    const navOverlay = container.querySelector('.project-navigation_overlay');
    if (navOverlay) navOverlay.style.display = 'none';
    return () => {};
  }

  // Calculate prev/next with wraparound
  const prevIndex = currentIndex === 0 ? projects.length - 1 : currentIndex - 1;
  const nextIndex = currentIndex === projects.length - 1 ? 0 : currentIndex + 1;
  
  const prevProject = projects[prevIndex];
  const nextProject = projects[nextIndex];

  // Update button labels
  prevButton.setAttribute('aria-label', `Previous project: ${prevProject.name}`);
  nextButton.setAttribute('aria-label', `Next project: ${nextProject.name}`);

  // Event handlers
  const handlers = [];
  
  const onPrevClick = (e) => {
    e.preventDefault();
    sessionStorage.setItem("pp:autoplay-sound", "1");
    
    if (window.barba) {
      barba.go(prevProject.url);
    } else {
      window.location.href = prevProject.url;
    }
  };

  const onNextClick = (e) => {
    e.preventDefault();
    sessionStorage.setItem("pp:autoplay-sound", "1");
    
    if (window.barba) {
      barba.go(nextProject.url);
    } else {
      window.location.href = nextProject.url;
    }
  };

  prevButton.addEventListener('click', onPrevClick);
  nextButton.addEventListener('click', onNextClick);
  
  handlers.push(() => prevButton.removeEventListener('click', onPrevClick));
  handlers.push(() => nextButton.removeEventListener('click', onNextClick));

  // Keyboard navigation
  const onKeyDown = (e) => {
    // Only listen when not in an input/textarea
    if (document.activeElement?.matches('input, textarea, select')) return;
    
    // Don't interfere with timeline scrubbing
    if (document.activeElement?.matches('[data-role="timeline"]')) return;
    
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      sessionStorage.setItem("pp:autoplay-sound", "1");
      prevButton.click();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      sessionStorage.setItem("pp:autoplay-sound", "1");
      nextButton.click();
    }
  };

  document.addEventListener('keydown', onKeyDown);
  handlers.push(() => document.removeEventListener('keydown', onKeyDown));

  // Cleanup
  return () => {
    handlers.forEach(fn => fn());
    delete playerWrap.dataset.navInitialized;
  };
}