// video-manager.js - Simplified without loader wrapper fade handling
export function createVideoManager(stage) {
  const MAX_VIDEOS = 8;
  const videoBySrc = new Map();
  const cleanupTimeouts = new Set();
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const prefersReducedData = navigator.connection?.saveData;
  
  let activeVideo = null;
  let activeLink = null;
  let transitionInProgress = false;

  function cleanupOldestVideo() {
    let oldest = null;
    let oldestTime = Infinity;
    videoBySrc.forEach((v, src) => {
      if (v !== activeVideo && !v.__keepAlive && v.__lastUsed < oldestTime) {
        oldest = v;
        oldestTime = v.__lastUsed;
      }
    });
    if (oldest) {
      const src = Array.from(videoBySrc.entries()).find(([_, v]) => v === oldest)?.[0];
      if (src) {
        oldest.pause();
        oldest.src = "";
        oldest.remove();
        videoBySrc.delete(src);
      }
    }
  }

  function createVideo(src, syncTime = 0) {
    let v = videoBySrc.get(src);
    if (v) {
      v.__lastUsed = Date.now();
      return v;
    }

    if (videoBySrc.size >= MAX_VIDEOS) {
      cleanupOldestVideo();
    }

    v = document.createElement("video");
    v.className = "home-hero_video_el";
    v.src = src;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = "auto";
    v.crossOrigin = "anonymous";
    v.autoplay = true; // Add autoplay attribute
    v.__lastUsed = Date.now();
    
    // Set initial time if syncing with loader
    if (syncTime > 0) {
      v.currentTime = syncTime;
    }
    
    if (window.gsap) {
      gsap.set(v, { 
        opacity: 0, 
        transformOrigin: "50% 50%",
        position: 'absolute',
        width: '100%',
        height: '100%',
        left: 0,
        top: 0,
        objectFit: 'cover'
      });
    } else {
      v.style.opacity = "0";
      v.style.width = "100%";
      v.style.height = "100%";
      v.style.objectFit = "cover";
    }
    
    stage.appendChild(v);
    videoBySrc.set(src, v);
    
    // Force play with multiple attempts
    const attemptPlay = (attempts = 0) => {
      if (attempts > 5) return;
      
      v.play().then(() => {
        console.log("[VideoManager] Video started playing successfully");
        v.__playing = true;
      }).catch(err => {
        console.warn(`[VideoManager] Play attempt ${attempts + 1} failed:`, err);
        setTimeout(() => attemptPlay(attempts + 1), 100 * (attempts + 1));
      });
    };
    
    // Start playing immediately
    attemptPlay();
    
    return v;
  }
  
  function getVideo(src) {
    return videoBySrc.get(src);
  }

  function warmVideo(v) {
    if (!v || v.__warmed || prefersReducedData) return;
    v.__warmed = true;
    
    const start = () => {
      v.play().then(() => {
        const timeout = setTimeout(() => { 
          if (!v.__keepAlive) {
            v.pause();
          }
        }, 2000);
        cleanupTimeouts.add(timeout);
      }).catch(() => {});
    };
    
    if (v.readyState >= 2) {
      start();
    } else {
      v.addEventListener("canplaythrough", start, { once: true });
    }
  }

  const fadeTargetsFor = (link) => {
    const defaultFadeSel = ".home-category_ref_text, .home-hero_title, .home-hero_name, .home-hero_heading";
    return (link?.querySelectorAll(link.getAttribute("data-fade-target") || defaultFadeSel) || []);
  };

  function updateLinkState(prev, next) {
    if (prev && prev !== next) {
      prev.setAttribute("aria-current", "false");
      fadeTargetsFor(prev).forEach(n => n.classList.add("u-color-faded"));
    }
    if (next) {
      next.setAttribute("aria-current", "true");
      fadeTargetsFor(next).forEach(n => n.classList.remove("u-color-faded"));
    }
  }

  function restart(v) {
    try { 
      if ("fastSeek" in v) {
        v.fastSeek(0);
      } else {
        v.currentTime = 0;
      }
      v.play().catch(() => {});
    } catch (err) {
      console.warn("[VideoManager] Restart failed:", err);
    }
  }

  function setActive(src, linkEl, opts = {}) {
    if (transitionInProgress) return;

    // Handle loader handoff - create fresh video synced to loader time
    if (opts.useHandoff && opts.handoff) {
      const { loaderVideo, currentTime } = opts.handoff;
      // Note: We no longer receive loaderWrapper here
      
      console.log("[VideoManager] Handoff from loader, creating synced video");
      
      // Create a new video starting at the loader's current time
      let next = videoBySrc.get(src);
      if (!next) {
        const syncTime = currentTime || loaderVideo?.currentTime || 0;
        next = createVideo(src, syncTime);
      }
      
      if (next) {
        activeVideo = next;
        next.__keepAlive = true;
        next.__lastUsed = Date.now();
        next.classList.add("is-active");
        
        // Fade in the new video immediately
        if (window.gsap) {
          gsap.to(next, {
            opacity: 1,
            duration: 0.6,
            ease: "power2.inOut",
            delay: 0.6, // Start fading in halfway through morph
            onStart: () => {
              // Ensure it's playing
              if (next.paused) {
                next.play().catch(() => {});
              }
            }
          });
        } else {
          next.style.opacity = "1";
        }
        
        // Note: Loader wrapper fade is now handled in timeline.js
        
        if (linkEl && linkEl !== activeLink) {
          updateLinkState(activeLink, linkEl);
          activeLink = linkEl;
        }
        
        opts.onVisible?.();
        return;
      }
    }

    // Normal video switching logic
    const next = videoBySrc.get(src) || createVideo(src);
    if (!next) return;

    next.__keepAlive = true;
    next.__lastUsed = Date.now();
    
    if (activeVideo && activeVideo !== next) {
      activeVideo.__keepAlive = false;
    }

    // Same video, just update link
    if (next === activeVideo) {
      if (linkEl && linkEl !== activeLink) {
        updateLinkState(activeLink, linkEl);
        activeLink = linkEl;
      }
      return;
    }

    transitionInProgress = true;
    const previousVideo = activeVideo;
    activeVideo = next;

    // Hide old video
    if (previousVideo) {
      previousVideo.classList.remove("is-active");
      if (window.gsap) {
        gsap.to(previousVideo, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.inOut",
          onComplete: () => {
            if (!previousVideo.__keepAlive) {
              previousVideo.pause();
            }
          }
        });
      } else {
        previousVideo.style.opacity = "0";
        if (!previousVideo.__keepAlive) {
          previousVideo.pause();
        }
      }
    }
    
    // Show new video
    next.classList.add("is-active");
    
    // Ensure video starts playing
    if (next.paused) {
      next.play().catch(() => {});
    }
    
    if (window.gsap) {
      gsap.to(next, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out"
      });
    } else {
      next.style.opacity = "1";
    }
    
    opts.onVisible?.();
    transitionInProgress = false;

    if (linkEl && linkEl !== activeLink) {
      updateLinkState(activeLink, linkEl);
      activeLink = linkEl;
    }
  }

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

  function cleanup() {
    cleanupTimeouts.forEach(timeout => clearTimeout(timeout));
    cleanupTimeouts.clear();
    
    videoBySrc.forEach((video, src) => {
      try {
        video.pause();
        video.src = "";
        video.load();
        video.remove();
      } catch (err) {
        console.warn("[VideoManager] Cleanup error:", err);
      }
    });
    videoBySrc.clear();
    
    activeVideo = null;
    activeLink = null;
  }

  return {
    createVideo,
    warmVideo,
    getVideo,
    setActive: (src, linkEl, opts) => {
      setActive(src, linkEl, opts);
      preloadNext(src);
    },
    cleanup,
    get activeLink() { return activeLink; },
    get activeVideo() { return activeVideo; }
  };
}