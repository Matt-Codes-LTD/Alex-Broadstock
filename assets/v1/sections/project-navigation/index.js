// assets/v1/sections/project-navigation/index.js

export default function initProjectNavigation(container) {
  // Only run on project pages
  if (container.dataset.barbaNamespace !== "project") return () => {};
  
  const playerWrap = container.querySelector('.project-player_wrap');
  if (!playerWrap || playerWrap.dataset.navInitialized) return () => {};
  playerWrap.dataset.navInitialized = "true";

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
    name: link.textContent.trim() || link.dataset.slug // fallback to slug if no text
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

  // Calculate prev/next with wraparound
  const prevIndex = currentIndex === 0 ? projects.length - 1 : currentIndex - 1;
  const nextIndex = currentIndex === projects.length - 1 ? 0 : currentIndex + 1;
  
  const prevProject = projects[prevIndex];
  const nextProject = projects[nextIndex];

  // Only show navigation if there's more than one project
  if (projects.length <= 1) {
    console.log("[ProjectNav] Only one project, skipping navigation");
    return () => {};
  }

  // Create navigation UI
  const navContainer = createNavUI(prevProject, nextProject);
  playerWrap.appendChild(navContainer);

  // Event handlers
  const handlers = [];
  
  const onPrevClick = (e) => {
    e.preventDefault();
    if (window.barba) {
      barba.go(prevProject.url);
    } else {
      window.location.href = prevProject.url;
    }
  };

  const onNextClick = (e) => {
    e.preventDefault();
    if (window.barba) {
      barba.go(nextProject.url);
    } else {
      window.location.href = nextProject.url;
    }
  };

  const prevButton = navContainer.querySelector('[data-nav="prev"]');
  const nextButton = navContainer.querySelector('[data-nav="next"]');

  if (prevButton) {
    prevButton.addEventListener('click', onPrevClick);
    handlers.push(() => prevButton.removeEventListener('click', onPrevClick));
  }

  if (nextButton) {
    nextButton.addEventListener('click', onNextClick);
    handlers.push(() => nextButton.removeEventListener('click', onNextClick));
  }

  // Keyboard navigation
  const onKeyDown = (e) => {
    // Only listen when not in an input/textarea
    if (document.activeElement?.matches('input, textarea, select')) return;
    
    if (e.key === 'ArrowLeft' && prevButton) {
      e.preventDefault();
      prevButton.click();
    } else if (e.key === 'ArrowRight' && nextButton) {
      e.preventDefault();
      nextButton.click();
    }
  };

  document.addEventListener('keydown', onKeyDown);
  handlers.push(() => document.removeEventListener('keydown', onKeyDown));

  // Cleanup
  return () => {
    handlers.forEach(fn => fn());
    if (navContainer.parentNode) {
      navContainer.remove();
    }
    delete playerWrap.dataset.navInitialized;
  };
}

function createNavUI(prevProject, nextProject) {
  const container = document.createElement('div');
  container.className = 'project-navigation_overlay';
  
  // Inline styles for positioning (could move to your CSS file)
  Object.assign(container.style, {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
    zIndex: '2', // Above video, below controls
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 2rem'
  });

  // Previous button
  const prevButton = document.createElement('button');
  prevButton.className = 'project-nav_button project-nav_button--prev';
  prevButton.setAttribute('data-nav', 'prev');
  prevButton.setAttribute('aria-label', `Previous project: ${prevProject.name}`);
  prevButton.textContent = 'Previous';
  
  Object.assign(prevButton.style, {
    pointerEvents: 'auto',
    background: 'transparent',
    border: 'none',
    color: 'var(--swatch--brand-paper)',
    cursor: 'pointer',
    fontSize: 'inherit',
    fontFamily: 'inherit',
    padding: '0.5rem 1rem',
    opacity: '0.7',
    transition: 'opacity 0.3s ease, transform 0.3s ease'
  });

  // Next button
  const nextButton = document.createElement('button');
  nextButton.className = 'project-nav_button project-nav_button--next';
  nextButton.setAttribute('data-nav', 'next');
  nextButton.setAttribute('aria-label', `Next project: ${nextProject.name}`);
  nextButton.textContent = 'Next';
  
  Object.assign(nextButton.style, {
    pointerEvents: 'auto',
    background: 'transparent',
    border: 'none',
    color: 'var(--swatch--brand-paper)',
    cursor: 'pointer',
    fontSize: 'inherit',
    fontFamily: 'inherit',
    padding: '0.5rem 1rem',
    opacity: '0.7',
    transition: 'opacity 0.3s ease, transform 0.3s ease'
  });

  // Hover effects
  [prevButton, nextButton].forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      btn.style.opacity = '1';
      btn.style.transform = btn === prevButton ? 'translateX(-4px)' : 'translateX(4px)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.opacity = '0.7';
      btn.style.transform = 'translateX(0)';
    });
    
    // Focus styles
    btn.addEventListener('focus', () => {
      btn.style.outline = '2px solid var(--swatch--brand-paper)';
      btn.style.outlineOffset = '2px';
    });
    btn.addEventListener('blur', () => {
      btn.style.outline = 'none';
    });
  });

  container.appendChild(prevButton);
  container.appendChild(nextButton);

  // Hide on idle (matches your player idle behavior)
  const hideOnIdle = () => {
    const playerWrap = container.closest('.project-player_wrap');
    if (playerWrap?.dataset.idle === "1") {
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
    } else {
      container.style.opacity = '1';
      container.style.pointerEvents = 'none'; // Container stays non-interactive
      container.querySelectorAll('.project-nav_button').forEach(btn => {
        btn.style.pointerEvents = 'auto'; // But buttons are interactive
      });
    }
  };

  // Observe idle state changes
  const observer = new MutationObserver(hideOnIdle);
  const playerWrap = document.querySelector('.project-player_wrap');
  if (playerWrap) {
    observer.observe(playerWrap, {
      attributes: true,
      attributeFilter: ['data-idle']
    });
  }

  // Store observer for cleanup
  container.__observer = observer;

  return container;
}