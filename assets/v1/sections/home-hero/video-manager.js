// assets/v1/sections/home-hero/video-manager.js
import { prefersReducedMotion, prefersReducedData } from "./utils.js";

export function createVideoManager(stage) {
  const videoBySrc = new Map();
  let activeVideo = null, activeLink = null;
  let transitionInProgress = false;

  function createVideo(src) {
    if (!src) return null;
    let v = videoBySrc.get(src);
    if (v) return v;
    
    v = document.createElement('video');
    v.className = 'home-hero_video_el';
    v.src = src;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.crossOrigin = 'anonymous';
    
    // Initial state - hidden
    gsap.set(v, { opacity: 0 });
    
    stage.appendChild(v);
    videoBySrc.set(src, v);
    return v;
  }

  // NEW: Register an existing video element (from loader)
  function registerExistingVideo(src, videoElement) {
    if (!src || !videoElement) return;
    
    console.log('[VideoManager] Registering existing video:', src);
    
    // Store the video
    videoBySrc.set(src, videoElement);
    
    // Mark it as warmed and active
    videoElement.__warmed = true;
    videoElement.__keepAlive = true;
    
    // Ensure it has the right class
    if (!videoElement.classList.contains('home-hero_video_el')) {
      videoElement.classList.add('home-hero_video_el');
    }
    
    // Set as active
    activeVideo = videoElement;
    
    console.log('[VideoManager] Video registered successfully');
  }

  // NEW: Set active link without changing video
  function setActiveLink(linkEl) {
    if (linkEl && linkEl !== activeLink) {
      updateLinkState(activeLink, linkEl);
      activeLink = linkEl;
    }
  }

  function warmVideo(v) {
    if (!v || v.__warmed || prefersReducedData) return;
    v.__warmed = true;
    
    const start = () => {
      v.play()
        .then(() =>
          setTimeout(() => {
            if (!v.__keepAlive) v.pause?.();
          }, 250)
        )
        .catch(() => {});
    };
    
    v.readyState >= 2
      ? start()
      : v.addEventListener('canplaythrough', start, { once: true });
  }

  function fadeTargetsFor(link) {
    const defaultFadeSel =
      '.home-category_ref_text, .home-hero_title, .home-hero_name, .home-hero_heading';
    return (
      link?.querySelectorAll(
        link.getAttribute('data-fade-target') || defaultFadeSel
      ) || []
    );
  }

  function updateLinkState(prev, next) {
    if (prev && prev !== next) {
      prev.setAttribute('aria-current', 'false');
      fadeTargetsFor(prev).forEach((n) => n.classList.add('u-color-faded'));
    }
    if (next) {
      next.setAttribute('aria-current', 'true');
      fadeTargetsFor(next).forEach((n) => n.classList.remove('u-color-faded'));
    }
  }

  function restart(v) {
    try {
      'fastSeek' in v ? v.fastSeek(0) : (v.currentTime = 0);
      v.play?.();
    } catch {}
  }

  function setActive(src, linkEl) {
    if (transitionInProgress) return;
    
    const next = videoBySrc.get(src) || createVideo(src);
    if (!next) return;
    
    next.__keepAlive = true;
    if (activeVideo && activeVideo !== next) activeVideo.__keepAlive = false;

    // Same video, just update link state
    if (next === activeVideo) {
      if (linkEl && linkEl !== activeLink) {
        updateLinkState(activeLink, linkEl);
        activeLink = linkEl;
      }
      return;
    }

    // Start transition
    transitionInProgress = true;
    const previousVideo = activeVideo;
    activeVideo = next;

    // Create smooth crossfade timeline
    const tl = gsap.timeline({
      onComplete: () => {
        transitionInProgress = false;
        // Clean up previous video
        if (previousVideo) {
          previousVideo.classList.remove('is-active');
          // Pause previous video after fade
          setTimeout(() => {
            if (!previousVideo.__keepAlive) {
              previousVideo.pause?.();
            }
          }, 100);
        }
      }
    });

    // Prepare new video
    if (!prefersReducedMotion) {
      // Ensure new video is ready and playing
      const prepareNewVideo = () => {
        restart(next);
        next.classList.add('is-active');
        
        // If there's a previous video, crossfade
        if (previousVideo) {
          // Set initial states
          gsap.set(next, { opacity: 0, scale: 1 });
          gsap.set(previousVideo, { opacity: 1, scale: 1 });
          
          // Crossfade animation
          tl.to(previousVideo, {
            opacity: 0,
            scale: 1,
            duration: 0.6,
            ease: 'power2.out'
          }, 0)
          .to(next, {
            opacity: 1,
            scale: 1,
            duration: 0.7,
            ease: 'power2.out'
          }, 0.1); // Slight delay for overlap
        } else {
          // No previous video, just fade in
          gsap.set(next, { opacity: 0, scale: 1 });
          next.classList.add('is-active');
          
          tl.to(next, {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            ease: 'power2.out'
          });
        }
      };

      // Wait for video to be ready if needed
      if (next.readyState >= 2) {
        prepareNewVideo();
      } else {
        const onReady = () => {
          prepareNewVideo();
          next.removeEventListener('loadeddata', onReady);
          next.removeEventListener('canplay', onReady);
        };
        next.addEventListener('loadeddata', onReady, { once: true });
        next.addEventListener('canplay', onReady, { once: true });
        
        // Fallback timeout
        setTimeout(onReady, 1000);
      }
    } else {
      // Reduced motion: immediate switch
      if (previousVideo) {
        previousVideo.classList.remove('is-active');
        gsap.set(previousVideo, { opacity: 0 });
      }
      next.classList.add('is-active');
      gsap.set(next, { opacity: 1, scale: 1 });
      restart(next);
      transitionInProgress = false;
    }

    // Update link state
    if (linkEl && linkEl !== activeLink) {
      updateLinkState(activeLink, linkEl);
      activeLink = linkEl;
    }
  }

  // Enhanced preloading for smoother transitions
  function preloadNext(currentSrc) {
    const videos = Array.from(videoBySrc.keys());
    const currentIndex = videos.indexOf(currentSrc);
    const nextSrc = videos[currentIndex + 1] || videos[0];
    
    if (nextSrc) {
      const nextVideo = videoBySrc.get(nextSrc);
      if (nextVideo && !nextVideo.__warmed) {
        warmVideo(nextVideo);
      }
    }
  }

  return {
    createVideo,
    warmVideo,
    registerExistingVideo, // NEW
    setActiveLink, // NEW
    setActive: (src, linkEl) => {
      setActive(src, linkEl);
      preloadNext(src);
    },
    get activeLink() { return activeLink; },
    get activeVideo() { return activeVideo; }
  };
}