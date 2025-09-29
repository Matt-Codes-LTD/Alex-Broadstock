// video-manager.js - Fixed with proper cleanup and memory management
import { prefersReducedMotion, prefersReducedData } from "./utils.js";

export function createVideoManager(stage) {
  const videoBySrc = new Map();
  const MAX_VIDEOS = 10; // Limit video pool size
  let activeVideo = null;
  let activeLink = null;
  let transitionInProgress = false;
  let cleanupTimeouts = new Set();

  function adoptVideo(src, videoElement) {
    if (!src || !videoElement) return null;
    
    // Clean up if at max capacity
    if (videoBySrc.size >= MAX_VIDEOS) {
      cleanupOldestVideo();
    }
    
    videoElement.__keepAlive = true;
    videoElement.__warmed = true;
    videoElement.__lastUsed = Date.now();
    
    videoBySrc.set(src, videoElement);
    activeVideo = videoElement;
    
    console.log("[VideoManager] Adopted video:", src);
    return videoElement;
  }

  function cleanupOldestVideo() {
    let oldest = null;
    let oldestTime = Infinity;
    
    videoBySrc.forEach((video, src) => {
      if (!video.__keepAlive && video.__lastUsed < oldestTime) {
        oldest = src;
        oldestTime = video.__lastUsed;
      }
    });
    
    if (oldest) {
      const video = videoBySrc.get(oldest);
      if (video) {
        video.pause();
        video.src = "";
        video.load();
        video.remove();
        videoBySrc.delete(oldest);
      }
    }
  }

  function createVideo(src) {
    if (!src) return null;
    
    let v = videoBySrc.get(src);
    if (v) {
      v.__lastUsed = Date.now();
      return v;
    }

    // Clean up if at max capacity
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

  function onFirstRenderedFrame(v, cb) {
    if ("requestVideoFrameCallback" in v) {
      v.requestVideoFrameCallback(() => cb());
    } else {
      const h = () => { 
        v.removeEventListener("timeupdate", h);
        cb();
      };
      v.addEventListener("timeupdate", h, { once: true });
      
      const timeout = setTimeout(cb, 120);
      cleanupTimeouts.add(timeout);
    }
  }

  function setActive(src, linkEl, opts = {}) {
    if (transitionInProgress) return;

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
    const fromScale = opts.tweenFromScale ?? 1.01; // Very subtle scale (was 1.03)
    const tweenDur = opts.tweenDuration ?? 0.25; // Faster transition (was 0.4)
    const tweenEase = opts.tweenEase ?? "power2.inOut"; // Smoother ease

    const playNew = async () => {
      try {
        await whenReady(next);
        if (opts.startAt != null) {
          await seekTo(next, Math.max(0, opts.startAt));
          await next.play();
        } else {
          restart(next);
        }
      } catch (err) {
        console.warn("[VideoManager] Play failed:", err);
      }
    };

    if (mode === "instant" || prefersReducedMotion || !window.gsap) {
      // Instant transition
      if (previousVideo) {
        previousVideo.classList.remove("is-active");
        if (window.gsap) {
          gsap.set(previousVideo, { opacity: 0, scale: 1 });
        } else {
          previousVideo.style.opacity = "0";
        }
      }
      
      next.classList.add("is-active");
      if (window.gsap) {
        gsap.set(next, { opacity: 1, scale: 1, transformOrigin: "50% 50%" });
      } else {
        next.style.opacity = "1";
      }
      
      playNew().then(() => {
        onFirstRenderedFrame(next, () => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              opts.onVisible?.();
            });
          });
        });
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
      // GSAP transition
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
        }
      });

      const prepare = async () => {
        await playNew();
        next.classList.add("is-active");

        if (previousVideo) {
          gsap.set(next, { opacity: 0, scale: fromScale, transformOrigin: "50% 50%" });
          gsap.set(previousVideo, { opacity: 1, scale: 1, transformOrigin: "50% 50%" });

          tl.to(previousVideo, { 
            opacity: 0, 
            scale: 1, 
            duration: tweenDur * 0.9, // Quick fade out
            ease: "power1.in" 
          }, 0)
          .to(next, {
            opacity: 1, 
            scale: 1, 
            duration: tweenDur, 
            ease: tweenEase,
            onComplete: () => { 
              opts.onVisible?.();
            }
          }, 0.02); // Minimal overlap for subtle crossfade
        } else {
          gsap.set(next, { opacity: 0, scale: fromScale, transformOrigin: "50% 50%" });
          tl.to(next, {
            opacity: 1, 
            scale: 1, 
            duration: tweenDur * 0.8, // Adjusted for faster transition
            ease: tweenEase,
            onComplete: () => { 
              opts.onVisible?.();
            }
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
    // Clear all timeouts
    cleanupTimeouts.forEach(timeout => clearTimeout(timeout));
    cleanupTimeouts.clear();
    
    // Clean up all videos
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