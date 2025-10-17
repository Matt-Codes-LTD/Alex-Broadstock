// video-manager.js - UPDATED: Adjusted timing for smoother handoff with new morph duration
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
      if (syncTime > 0) {
        try {
          v.currentTime = syncTime;
        } catch {}
      }
      return v;
    }

    if (videoBySrc.size >= MAX_VIDEOS) {
      cleanupOldestVideo();
    }

    const item = document.querySelector(`[data-video="${src}"]`);
    const ratio = item?.dataset.ratio || 'cover';

    v = document.createElement("video");
    v.className = "home-hero_video_el";
    v.src = src;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = "auto";
    v.crossOrigin = "anonymous";
    v.autoplay = true;
    v.__lastUsed = Date.now();
    
    if (syncTime > 0) {
      v.currentTime = syncTime;
      
      v.addEventListener('loadedmetadata', () => {
        if (Math.abs(v.currentTime - syncTime) > 0.1) {
          v.currentTime = syncTime;
        }
      }, { once: true });
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
        objectFit: ratio.toLowerCase()
      });
    } else {
      v.style.opacity = "0";
      v.style.width = "100%";
      v.style.height = "100%";
      v.style.objectFit = ratio.toLowerCase();
      v.style.position = "absolute";
      v.style.left = "0";
      v.style.top = "0";
    }
    
    stage.appendChild(v);
    videoBySrc.set(src, v);
    
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

    // Handle loader handoff - UPDATED TIMING
    if (opts.useHandoff && opts.handoff) {
      const { loaderVideo, currentTime } = opts.handoff;
      
      console.log("[VideoManager] Handoff from loader, creating synced video");
      
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
        
        const item = document.querySelector(`[data-video="${src}"]`);
        const ratio = item?.dataset.ratio || 'cover';
        next.style.objectFit = ratio.toLowerCase();
        
        // UPDATED: Adjusted timing to match new morph duration
        if (window.gsap) {
          gsap.to(next, {
            opacity: 1,
            duration: 0.4,  // Slightly longer for smoother transition with new morph
            ease: "power2.out",
            delay: 1.0,  // Adjusted delay to sync with 1.6s morph
            onStart: () => {
              if (next.paused) {
                next.play().catch(() => {});
              }
              if (loaderVideo && !loaderVideo.paused) {
                try {
                  next.currentTime = loaderVideo.currentTime;
                } catch {}
              }
            }
          });
        } else {
          next.style.opacity = "1";
        }
        
        if (linkEl && linkEl !== activeLink) {
          updateLinkState(activeLink, linkEl);
          activeLink = linkEl;
        }
        
        opts.onVisible?.();
        return;
      }
    }

    // Normal video switching
    const next = videoBySrc.get(src) || createVideo(src);
    if (!next) return;

    const item = document.querySelector(`[data-video="${src}"]`);
    const ratio = item?.dataset.ratio || 'cover';
    next.style.objectFit = ratio.toLowerCase();

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

    // UPDATED: Faster fade out
    if (previousVideo) {
      previousVideo.classList.remove("is-active");
      if (window.gsap) {
        gsap.to(previousVideo, {
          opacity: 0,
          duration: 0.2,  // Fast crossfade
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
    
    // Ensure video starts playing BEFORE fade
    if (next.paused) {
      next.play().catch(() => {});
    }
    
    // UPDATED: Faster fade in with snappier easing
    if (window.gsap) {
      gsap.to(next, {
        opacity: 1,
        duration: 0.2,  // Fast crossfade
        ease: "power2.out"  // Snappier easing
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