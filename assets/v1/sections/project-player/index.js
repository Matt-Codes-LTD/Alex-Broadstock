// index.js - Fixed with proper state management and error handling
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
  const url = stage.getAttribute("data-video") || wrap.getAttribute("data-video") || "";
  const vtt = stage.getAttribute("data-captions") || wrap.getAttribute("data-captions") || "";
  const poster = stage.getAttribute("data-poster") || wrap.getAttribute("data-poster") || "";
  const host = stage.querySelector(".project-player_video-host") || 
                wrap.querySelector(".project-player_video-host");

  // Create overlays if they don't exist
  let pauseFx = wrap.querySelector(".project-player_pausefx");
  if (!pauseFx) {
    pauseFx = document.createElement("div");
    pauseFx.className = "project-player_pausefx u-cover-absolute u-inset-0";
    const afterTarget = (wrap.querySelector(".project-player_stage") || wrap)
      .querySelector(".project-player_video-host");
    const target = wrap.querySelector(".project-player_stage") || wrap;
    
    if (afterTarget?.nextSibling) {
      target.insertBefore(pauseFx, afterTarget.nextSibling);
    } else {
      target.appendChild(pauseFx);
    }
  }

  let centerBtn = wrap.querySelector(".project-player_center-toggle");
  if (!centerBtn) {
    centerBtn = document.createElement("button");
    centerBtn.className = "project-player_center-toggle project-player_btn project-player_btn--play";
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
    video.crossOrigin = "anonymous";
    video.preload = "auto";
    video.src = url;
  }
  
  if (!video) {
    console.error("[ProjectPlayer] No video element found");
    return () => {};
  }

  // Add captions if provided
  if (vtt && !video.querySelector('track[kind="subtitles"], track[kind="captions"]')) {
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

  // Initial muted state
  video.muted = true;
  video.setAttribute("muted", "");
  video.volume = 0;

  // Create state
  const state = createState(video, wrap, centerBtn);

  // Init modules
  const tl = wrap.querySelector('[data-role="timeline"]');
  const tlBuf = wrap.querySelector(".project-player_timeline-buffer");
  const tlHandle = wrap.querySelector(".project-player_timeline-handle");
  const btnPlay = wrap.querySelector('[data-role="play"]');
  const btnMute = wrap.querySelector('[data-role="mute"]');
  const muteLabel = wrap.querySelector('[data-role="mute-label"]');

  const cleanupControls = initControls(video, wrap, centerBtn, state);
  const cleanupTimeline = initTimeline(video, tl, tlBuf, tlHandle, state);
  const cleanupSync = initSync(video, wrap, state);
  
  state.handlers.push(cleanupControls, cleanupTimeline, cleanupSync);

  // Start pipeline with error handling
  let initComplete = false;
  
  const startPlayback = async () => {
    try {
      await ensureFirstFramePainted(video);
      
      // Try to start playback
      try {
        await video.play();
      } catch (playErr) {
        console.warn("[ProjectPlayer] Autoplay failed:", playErr);
        // Autoplay might be blocked, that's ok
      }
      
      setPlayUI(video, btnPlay, centerBtn, !video.paused);
      setPausedUI(wrap, video.paused);
      centerBtn.classList.remove("is-mode-play");
      centerBtn.setAttribute("aria-label", "Unmute");
      setMuteUI(btnMute, muteLabel, true);
      
      initComplete = true;
    } catch (err) {
      console.error("[ProjectPlayer] Init failed:", err);
    }
  };

  startPlayback();

  // Handle visibility changes
  const handleVisibility = () => {
    if (document.hidden) {
      state.stopLoop();
      if (!video.paused) {
        video.pause();
      }
    } else if (initComplete) {
      state.startLoop(() => {}); // Restart loop if needed
    }
  };
  document.addEventListener("visibilitychange", handleVisibility);
  state.handlers.push(() => document.removeEventListener("visibilitychange", handleVisibility));

  // Cleanup
  return () => {
    try {
      state.cleanup();
      video.pause();
      video.muted = true;
    } catch (err) {
      console.warn("[ProjectPlayer] Cleanup error:", err);
    }
    delete wrap.dataset.scriptInitialized;
  };
}