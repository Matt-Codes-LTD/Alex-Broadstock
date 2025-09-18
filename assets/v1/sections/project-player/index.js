import { createState } from "./state.js";
import { initControls } from "./controls.js";
import { initTimeline } from "./timeline.js";
import { initSync } from "./sync.js";
import { ensureFirstFramePainted } from "./preload.js";
import { setMuteUI, setPlayUI, setPausedUI } from "./utils.js";

export default function initProjectPlayer(container) {
  const wrap = container.querySelector(".project-player_wrap");
  if (!wrap || wrap.dataset.scriptInitialized) return () => {};
  wrap.dataset.scriptInitialized = "true";
  
  // ENSURE IDLE IS FALSE ON INIT
  wrap.dataset.idle = "0";

  const stage = wrap.querySelector(".project-player_stage") || wrap;
  const url =
    stage.getAttribute("data-video") || wrap.getAttribute("data-video") || "";
  const vtt =
    stage.getAttribute("data-captions") ||
    wrap.getAttribute("data-captions") ||
    "";
  const poster =
    stage.getAttribute("data-poster") || wrap.getAttribute("data-poster") || "";
  const host =
    stage.querySelector(".project-player_video-host") ||
    wrap.querySelector(".project-player_video-host");

  // Create overlays
  let pauseFx = wrap.querySelector(".project-player_pausefx");
  if (!pauseFx) {
    pauseFx = document.createElement("div");
    pauseFx.className = "project-player_pausefx u-cover-absolute u-inset-0";
    const afterTarget =
      (wrap.querySelector(".project-player_stage") || wrap).querySelector(
        ".project-player_video-host"
      );
    const target = wrap.querySelector(".project-player_stage") || wrap;
    afterTarget?.nextSibling
      ? target.insertBefore(pauseFx, afterTarget.nextSibling)
      : target.appendChild(pauseFx);
  }

  let centerBtn = wrap.querySelector(".project-player_center-toggle");
  if (!centerBtn) {
    centerBtn = document.createElement("button");
    centerBtn.className =
      "project-player_center-toggle project-player_btn project-player_btn--play";
    centerBtn.type = "button";
    centerBtn.setAttribute("aria-pressed", "false");
    centerBtn.setAttribute("aria-label", "Unmute");
    centerBtn.style.color = "var(--swatch--brand-paper)";
    centerBtn.innerHTML = `
      <svg viewBox="0 0 24 24" class="pp-icon" aria-hidden="true" fill="none">
        <g class="pp-icon--group pp-icon--sound">
          <path d="M12 5V19L7 16H2V8H7L12 5Z"></path>
          <path d="M19.3 19.3C21.0459 17.2685 22.0059 14.6786 22.0059 12C22.0059 9.3214 21.0459 6.73148 19.3 4.70001"></path>
          <path d="M16.4 16.4C17.4429 15.1711 18.0154 13.6118 18.0154 12C18.0154 10.3882 17.4429 8.82888 16.4 7.60001"></path>
        </g>
        <g class="pp-icon--group pp-icon--play">
          <g class="pp-icon__part pp-icon__play">
            <path d="M5.2 12V3L13 7.5L20.8 12L13 16.5L5.2 21V12Z"></path>
          </g>
          <g class="pp-icon__part pp-icon__pause">
            <path d="M9.5 5.5H6.5V18.5H9.5V5.5Z"></path>
            <path d="M17.5 5.5H14.5V18.5H17.5V5.5Z"></path>
          </g>
        </g>
      </svg>
      <span class="u-sr-only">Unmute</span>
    `.trim();
    (wrap.querySelector(".project-player_stage") || wrap).appendChild(centerBtn);
  }

  // Video element
  let video = host?.querySelector("video");
  if (!video && host && url) {
    video = document.createElement("video");
    video.playsInline = true;
    video.setAttribute("playsinline", ""); // Critical for iOS
    video.crossOrigin = "anonymous";
    video.setAttribute("crossorigin", "anonymous");
    video.preload = "auto";
    video.src = url;
    video.setAttribute("muted", ""); // Critical for mobile autoplay
    video.muted = true;
  }
  if (!video) return () => {};

  if (
    vtt &&
    !video.querySelector('track[kind="subtitles"], track[kind="captions"]')
  ) {
    const tr = document.createElement("track");
    tr.kind = "subtitles";
    tr.label = "English";
    tr.srclang = "en";
    tr.src = vtt;
    tr.default = false;
    video.appendChild(tr);
  }

  video.className = "project-player_video";
  video.controls = false;
  if (poster) video.poster = poster;
  if (!video.isConnected && host) host.appendChild(video);

  // Ensure muted for autoplay
  video.muted = true;
  video.setAttribute("muted", "");
  video.volume = 0;

  // Create state
  const state = createState(video, wrap, centerBtn);

  // Mobile play trigger
  let mobilePlayTriggered = false;
  const triggerMobilePlay = async () => {
    if (mobilePlayTriggered) return;
    mobilePlayTriggered = true;
    console.log("[ProjectPlayer] Mobile play triggered");
    
    try {
      // Ensure video is muted
      video.muted = true;
      video.setAttribute("muted", "");
      
      // Try to play
      await video.play();
      setPlayUI(video, wrap.querySelector('[data-role="play"]'), centerBtn, true);
      setPausedUI(wrap, false);
    } catch (err) {
      console.log("[ProjectPlayer] Mobile play failed:", err.message);
    }
  };

  // Setup mobile triggers
  const setupMobilePlayTriggers = () => {
    const triggers = ['touchstart', 'click', 'touchend'];
    
    triggers.forEach(event => {
      document.addEventListener(event, triggerMobilePlay, { once: true, passive: true });
      wrap.addEventListener(event, triggerMobilePlay, { once: true, passive: true });
    });
    
    // Visibility trigger
    const handleVisibilityChange = () => {
      if (!document.hidden && !mobilePlayTriggered) {
        setTimeout(triggerMobilePlay, 100);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Intersection observer
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !mobilePlayTriggered) {
              triggerMobilePlay();
              observer.disconnect();
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(wrap);
    }
    
    // Return cleanup
    return () => {
      ['touchstart', 'click', 'touchend'].forEach(event => {
        document.removeEventListener(event, triggerMobilePlay);
        wrap.removeEventListener(event, triggerMobilePlay);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  };

  const mobileCleanup = setupMobilePlayTriggers();

  // Init modules
  const tl = wrap.querySelector('[data-role="timeline"]');
  const tlBuf = wrap.querySelector(".project-player_timeline-buffer");
  const tlHandle = wrap.querySelector(".project-player_timeline-handle");

  initControls(video, wrap, centerBtn, state);
  initTimeline(video, tl, tlBuf, tlHandle, state);
  initSync(video, wrap, state);

  // Start pipeline
  (async () => {
    await ensureFirstFramePainted(video);
    try {
      await video.play();
      // Trigger mobile play after initial attempt
      setTimeout(triggerMobilePlay, 500);
    } catch (err) {
      console.log("[ProjectPlayer] Initial play failed:", err.message);
      // Try mobile trigger immediately
      triggerMobilePlay();
    }
    setPlayUI(video, wrap.querySelector('[data-role="play"]'), centerBtn, !video.paused);
    setPausedUI(wrap, video.paused);
    centerBtn.classList.remove("is-mode-play");
    centerBtn.setAttribute("aria-label", "Unmute");
    setMuteUI(wrap.querySelector('[data-role="mute"]'), wrap.querySelector('[data-role="mute-label"]'), true);
  })();

  // Cleanup
  return () => {
    try {
      state.stopLoop();
      video.pause();
      video.muted = true;
    } catch {}
    state.cleanup();
    mobileCleanup();
    delete wrap.dataset.scriptInitialized;
  };
}