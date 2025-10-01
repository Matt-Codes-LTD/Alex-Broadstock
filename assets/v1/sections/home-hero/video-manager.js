// video-manager.js - Optimized for seamless video transitions
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

  function adoptVideo(videoEl, src) {
    if (!videoEl || !src) return null;
    
    // DON'T move the video - it needs to stay in wrapper for morph animation
    // Just store the reference and metadata
    videoEl.__keepAlive = true;
    videoEl.__warmed = true;
    videoEl.__lastUsed = Date.now();
    videoEl.__isAdopted = true;
    
    videoBySrc.set(src, videoEl);
    
    console.log("[VideoManager] Adopted video reference (stays in loader):", src);
    return videoEl;
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
        }, 250);
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

  const whenReady = (v) => new Promise((res, rej) => {
    if (v.readyState >= 2) return res();
    
    const timeout = setTimeout(() => {
      rej(new Error("Video ready timeout"));
    }, 3000);
    
    const on = () => { 
      clearTimeout(timeout);
      v.removeEventListener("loadeddata", on);
      v.removeEventListener("canplay", on);
      res();
    };
    v.addEventListener("loadeddata", on, { once: true });
    v.addEventListener("canplay", on, { once: true });
  });

  async function seekTo(v, t) {
    await new Promise((res, rej) => {
      if (v.readyState >= 1) return res();
      
      const timeout = setTimeout(() => {
        rej(new Error("Seek ready timeout"));
      }, 1000);
      
      v.addEventListener("loadedmetadata", () => {
        clearTimeout(timeout);
        res();
      }, { once: true });
    });
    
    try {
      const dur = v.duration || 0;
      let target = Math.max(0, Math.min(Number.isFinite(dur) && dur > 0 ? dur - 0.05 : t, t));
      v.currentTime = target;
    } catch (err) {
      console.warn("[VideoManager] Seek failed:", err);
    }
    return v;
  }

  // CRITICAL: Wait for actual frame rendering before showing video
  function waitForFrameRendered(v) {
    return new Promise((resolve) => {
      if ("requestVideoFrameCallback" in v) {
        // Modern browsers - wait for actual frame
        v.requestVideoFrameCallback(() => {
          // Wait one more frame to ensure smooth start
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
          });
        });
      } else {
        // Fallback - wait for timeupdate + RAF
        const handler = () => {
          v.removeEventListener("timeupdate", handler);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
          });
        };
        v.addEventListener("timeupdate", handler, { once: true });
        
        // Safety timeout
        const timeout = setTimeout(resolve, 200);
        cleanupTimeouts.add(timeout);
      }
    });
  }

  async function setActive(src, linkEl, opts = {}) {
    // Handle pending transitions - cancel or queue
    if (transitionInProgress) {
      pendingTransition = { src, linkEl, opts };
      return;
    }

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

    const mode = opts.mode || "tween";
    // IMPROVED: Longer, smoother transition
    const tweenDur = opts.tweenDuration ?? 0.5; // Increased from 0.25
    const tweenEase = opts.tweenEase ?? "power1.inOut"; // Gentler ease

    const playNew = async () => {
      try {
        await whenReady(next);
        if (opts.startAt != null) {
          await seekTo(next, Math.max(0, opts.startAt));
          await next.play();
        } else {
          restart(next);
        }
        // CRITICAL: Wait for actual frame before transitioning
        await waitForFrameRendered(next);
      } catch (err) {
        console.warn("[VideoManager] Play failed:", err);
      }
    };

    if (mode === "instant" || prefersReducedMotion || !window.gsap) {
      // Instant transition - used for handoff from loader
      if (previousVideo) {
        previousVideo.classList.remove("is-active");
        if (window.gsap) {
          gsap.set(previousVideo, { opacity: 0 });
        } else {
          previousVideo.style.opacity = "0";
        }
      }
      
      next.classList.add("is-active");
      
      // Start loading and playing BEFORE showing
      playNew().then(async () => {
        // Wait for video to actually be playing smoothly
        await waitForFrameRendered(next);
        
        // NOW show the video
        if (window.gsap) {
          gsap.set(next, { opacity: 1, transformOrigin: "50% 50%" });
        } else {
          next.style.opacity = "1";
        }
        
        // Call onVisible after video is visible and playing
        opts.onVisible?.();
      });
      
      transitionInProgress = false;
      if (previousVideo) {
        setTimeout(() => {
          if (!previousVideo.__keepAlive) {
            previousVideo.pause();
          }
        }, 100);
      }
    } else if (window.gsap) {
      // GSAP smooth crossfade transition
      const tl = gsap.timeline({
        onComplete: () => {
          transitionInProgress = false;
          if (previousVideo) {
            previousVideo.classList.remove("is-active");
            setTimeout(() => {
              if (!previousVideo.__keepAlive) {
                previousVideo.pause();
              }
            }, 100);
          }
          
          // Process pending transition if exists
          if (pendingTransition) {
            const pending = pendingTransition;
            pendingTransition = null;
            setTimeout(() => {
              setActive(pending.src, pending.linkEl, pending.opts);
            }, 16); // Small delay for smoothness
          }
        }
      });

      const prepare = async () => {
        // Start playing and wait for frame BEFORE animating
        await playNew();
        next.classList.add("is-active");
        
        // CRITICAL: Call onVisible as soon as video is ready and playing
        // Don't wait for animation to complete - morph can happen during transition
        opts.onVisible?.();

        if (previousVideo) {
          // Set initial states
          gsap.set(next, { opacity: 0, transformOrigin: "50% 50%" });
          gsap.set(previousVideo, { opacity: 1, transformOrigin: "50% 50%" });

          // IMPROVED: Longer crossfade overlap for seamless blend
          tl.to(previousVideo, { 
            opacity: 0, 
            duration: tweenDur * 0.7, // Fade out slightly faster
            ease: "power1.in" 
          }, 0)
          .to(next, {
            opacity: 1, 
            duration: tweenDur, // Full duration for fade in
            ease: tweenEase,
            onStart: () => {
              // Ensure video is playing
              if (next.paused) {
                next.play().catch(() => {});
              }
            }
          }, tweenDur * 0.15); // CRITICAL: 0.15 overlap (was 0.02) for smooth crossfade
        } else {
          // First video - simple fade in, no scale
          gsap.set(next, { opacity: 0, transformOrigin: "50% 50%" });
          tl.to(next, {
            opacity: 1, 
            duration: tweenDur * 0.8,
            ease: tweenEase
          });
        }
      };
      
      if (next.readyState >= 2) {
        prepare();
      } else {
        setTimeout(prepare, 0);
      }
    } else {
      // Fallback CSS transition
      transitionInProgress = false;
      opts.onVisible?.();
    }

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
  }

  return {
    createVideo,
    warmVideo,
    adoptVideo,
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