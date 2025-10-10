// video-manager.js - Enhanced with smooth loader handoff
export function createVideoManager(stage) {
  const MAX_VIDEOS = 8;
  const videoBySrc = new Map();
  const cleanupTimeouts = new Set();
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const prefersReducedData = navigator.connection?.saveData;
  
  let activeVideo = null;
  let activeLink = null;
  let transitionInProgress = false;
  let pendingTransition = null;
  let loaderVideo = null; // Track the loader's video element

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

  // NEW: Reuse loader video element for seamless handoff
  function adoptLoaderVideo(video, wrapper, src) {
    if (!video || !src) return null;
    
    console.log("[VideoManager] Adopting loader video for seamless transition");
    
    // Store reference
    loaderVideo = video;
    
    // Store playback state before DOM move
    const wasPlaying = !video.paused;
    const currentTime = video.currentTime;
    
    // Move the actual video element to our stage (not a clone!)
    video.className = "home-hero_video_el";
    video.__lastUsed = Date.now();
    video.__keepAlive = true;
    video.__warmed = true;
    video.__isHandoff = true;
    
    // Get current positions
    const wrapperRect = wrapper.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    
    // Calculate offset from stage
    const offsetX = wrapperRect.left - stageRect.left;
    const offsetY = wrapperRect.top - stageRect.top;
    
    // Move video to our stage, maintaining visual position
    stage.appendChild(video);
    videoBySrc.set(src, video);
    
    // CRITICAL: Force video to keep playing after DOM move
    if (wasPlaying) {
      video.currentTime = currentTime; // Restore playback position
      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch(err => {
          console.warn("[VideoManager] Play after move failed, retrying:", err);
          // Retry with a small delay
          setTimeout(() => {
            video.play().catch(() => {});
          }, 10);
        });
      }
    }
    
    if (window.gsap) {
      // Position video to match where it was in the loader
      gsap.set(video, {
        position: 'absolute',
        width: wrapperRect.width,
        height: wrapperRect.height,
        left: offsetX,
        top: offsetY,
        opacity: 1,
        transformOrigin: "50% 50%"
      });
      
      // Smoothly animate to fill the stage
      gsap.to(video, {
        width: '100%',
        height: '100%',
        left: 0,
        top: 0,
        duration: 0.8,
        ease: 'power3.inOut',
        delay: 0.1, // Small delay to sync with morph
        onUpdate: () => {
          // Keep trying to play during animation if it stops
          if (wasPlaying && video.paused) {
            video.play().catch(() => {});
          }
        },
        onComplete: () => {
          video.__isHandoff = false;
          // Ensure video is playing after animation
          if (wasPlaying && video.paused) {
            video.play().catch(() => {});
          }
          // Fade out the now-empty loader wrapper
          if (wrapper) {
            gsap.to(wrapper, {
              opacity: 0,
              duration: 0.3,
              ease: 'power2.out'
            });
          }
        }
      });
    } else {
      video.style.width = "100%";
      video.style.height = "100%";
      video.style.opacity = "1";
    }
    
    // Mark as active
    video.classList.add("is-active");
    
    return video;
  }

  function createVideo(src) {
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
    v.__lastUsed = Date.now();
    
    if (window.gsap) {
      gsap.set(v, { opacity: 0, transformOrigin: "50% 50%" });
    } else {
      v.style.opacity = "0";
      v.style.transformOrigin = "50% 50%";
    }
    
    stage.appendChild(v);
    videoBySrc.set(src, v);
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

    // Special handling for loader handoff
    if (opts.useHandoff && opts.handoff) {
      const { loaderVideo, loaderWrapper } = opts.handoff;
      
      if (loaderVideo && loaderWrapper) {
        console.log("[VideoManager] Processing loader handoff");
        
        // Check if we need to adopt the loader video
        let next = videoBySrc.get(src);
        if (!next) {
          // Adopt the actual loader video element (move it to our stage)
          next = adoptLoaderVideo(loaderVideo, loaderWrapper, src);
        }
        
        if (next) {
          activeVideo = next;
          next.__keepAlive = true;
          next.__lastUsed = Date.now();
          
          // Ensure video is playing after handoff
          if (next.paused) {
            console.log("[VideoManager] Video paused after handoff, restarting");
            next.play().catch(err => {
              console.warn("[VideoManager] Failed to restart after handoff:", err);
            });
          }
          
          if (linkEl && linkEl !== activeLink) {
            updateLinkState(activeLink, linkEl);
            activeLink = linkEl;
          }
          
          opts.onVisible?.();
          return;
        }
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

    // Smoother transition with subtle crossfade
    if (previousVideo) {
      previousVideo.classList.remove("is-active");
      
      if (window.gsap) {
        // Fade out old video
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
    
    // Fade in new video
    next.classList.add("is-active");
    
    if (window.gsap && !next.__isHandoff) {
      gsap.to(next, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
        onStart: () => {
          if (next.paused || next.currentTime === 0) {
            restart(next);
          }
        }
      });
    } else if (!next.__isHandoff) {
      next.style.opacity = "1";
      if (next.paused || next.currentTime === 0) {
        restart(next);
      }
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
    pendingTransition = null;
    loaderVideo = null;
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