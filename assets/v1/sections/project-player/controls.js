import { setPlayUI, setMuteUI, setPausedUI, switchCenterToPlayMode } from "./utils.js";

export function initControls(video, wrap, centerBtn, state) {
  const btnPlay = wrap.querySelector('[data-role="play"]');
  const btnMute = wrap.querySelector('[data-role="mute"]');
  const muteLabel = wrap.querySelector('[data-role="mute-label"]');
  const btnFS = wrap.querySelector('[data-role="fs"]');

  // Play/Pause
  async function togglePlayFromUser() {
    try {
      if (video.paused) {
        // On mobile, ensure muted for first play
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile && !state.didFirstSoundRestart) {
          video.muted = true;
          video.setAttribute("muted", "");
        } else if (video.muted || video.volume === 0) {
          // Desktop or subsequent plays - allow unmute
          video.muted = false;
          video.removeAttribute("muted");
          video.volume = Number(localStorage.getItem("pp:vol") || 1) || 1;
          setMuteUI(btnMute, muteLabel, false);
          state.didFirstSoundRestart = true;
        }
        await video.play();
      } else {
        await video.pause();
      }
    } catch (err) {
      console.log("[Controls] Play toggle failed:", err.message);
      // Fallback for mobile - try muted play
      if (video.paused) {
        video.muted = true;
        video.setAttribute("muted", "");
        await video.play().catch(() => {});
      }
    }
    setPlayUI(video, btnPlay, centerBtn, !video.paused);
    setPausedUI(wrap, video.paused);
    state.kickHide();
  }

  btnPlay?.addEventListener("click", togglePlayFromUser);
  state.handlers.push(() => btnPlay?.removeEventListener("click", togglePlayFromUser));

  // Center button - mobile optimized
  const centerHandler = async () => {
    const inPlayMode = centerBtn.classList.contains("is-mode-play");
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (!inPlayMode) {
      try {
        // On mobile, keep muted for reliable playback
        if (isMobile) {
          video.muted = true;
          video.setAttribute("muted", "");
          setMuteUI(btnMute, muteLabel, true);
        } else {
          // Desktop - allow unmute
          video.muted = false;
          video.removeAttribute("muted");
          video.volume = Number(localStorage.getItem("pp:vol") || 1) || 1;
          setMuteUI(btnMute, muteLabel, false);
        }
        
        video.currentTime = 0;
        await video.play?.();
        switchCenterToPlayMode(centerBtn, video);
        setPlayUI(video, btnPlay, centerBtn, true);
        setPausedUI(wrap, false);
        state.didFirstSoundRestart = !isMobile; // Only mark as sound restart on desktop
      } catch (err) {
        console.log("[Controls] Center button play failed:", err.message);
        // Fallback to muted play
        video.muted = true;
        video.setAttribute("muted", "");
        video.currentTime = 0;
        await video.play?.().catch(() => {});
        switchCenterToPlayMode(centerBtn, video);
        setMuteUI(btnMute, muteLabel, true);
        setPlayUI(video, btnPlay, centerBtn, true);
        setPausedUI(wrap, false);
      }
      state.kickHide();
      return;
    }
    await togglePlayFromUser();
  };
  
  centerBtn.addEventListener("click", centerHandler);
  // Add touch support for mobile
  centerBtn.addEventListener("touchend", (e) => {
    e.preventDefault();
    centerHandler();
  }, { passive: false });
  
  state.handlers.push(() => {
    centerBtn.removeEventListener("click", centerHandler);
    centerBtn.removeEventListener("touchend", centerHandler);
  });

  // Mute - mobile aware
  const muteHandler = async () => {
    const wasMuted = video.muted;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Toggle mute state
    video.muted = !video.muted;
    
    if (video.muted) {
      video.setAttribute("muted", "");
    } else {
      // Check if unmute is allowed (mobile may require user gesture)
      video.removeAttribute("muted");
      if (video.volume === 0) video.volume = Number(localStorage.getItem("pp:vol") || 1) || 1;
      
      // On mobile, unmuting may fail if not from direct user gesture
      if (isMobile && video.paused) {
        try {
          // Try to play unmuted
          await video.play();
        } catch (err) {
          console.log("[Controls] Unmute play failed on mobile:", err.message);
          // Revert to muted
          video.muted = true;
          video.setAttribute("muted", "");
        }
      } else if (wasMuted && !state.didFirstSoundRestart && !isMobile) {
        // Desktop restart behavior
        state.didFirstSoundRestart = true;
        video.currentTime = 0;
        await video.play?.().catch(() => {});
        setPlayUI(video, btnPlay, centerBtn, true);
        setPausedUI(wrap, false);
        switchCenterToPlayMode(centerBtn, video);
      }
    }
    
    localStorage.setItem("pp:muted", video.muted ? "1" : "0");
    setMuteUI(btnMute, muteLabel, video.muted);
    state.kickHide();
  };
  
  btnMute?.addEventListener("click", muteHandler);
  // Add touch support
  btnMute?.addEventListener("touchend", (e) => {
    e.preventDefault();
    muteHandler();
  }, { passive: false });
  
  state.handlers.push(() => {
    btnMute?.removeEventListener("click", muteHandler);
    btnMute?.removeEventListener("touchend", muteHandler);
  });

  // Fullscreen - with mobile support
  function updateFSLabel() {
    if (!btnFS) return;
    const inFS =
      !!document.fullscreenElement &&
      (document.fullscreenElement === wrap || wrap.contains(document.fullscreenElement));
    btnFS.textContent = inFS ? "Minimise" : "Fullscreen";
    btnFS.setAttribute("aria-label", inFS ? "Exit fullscreen" : "Toggle fullscreen");
  }
  
  document.addEventListener("fullscreenchange", updateFSLabel);
  document.addEventListener("webkitfullscreenchange", updateFSLabel); // iOS Safari
  
  state.handlers.push(() => {
    document.removeEventListener("fullscreenchange", updateFSLabel);
    document.removeEventListener("webkitfullscreenchange", updateFSLabel);
  });

  const fsHandler = async () => {
    try {
      if (!document.fullscreenElement) {
        // Try standard fullscreen
        if (wrap.requestFullscreen) {
          await wrap.requestFullscreen();
        } else if (wrap.webkitRequestFullscreen) {
          // iOS Safari
          await wrap.webkitRequestFullscreen();
        } else if (video.webkitEnterFullscreen) {
          // iOS video fullscreen
          video.webkitEnterFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          // iOS Safari
          await document.webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.log("[Controls] Fullscreen toggle failed:", err.message);
    }
    state.kickHide();
  };
  
  btnFS?.addEventListener("click", fsHandler);
  btnFS?.addEventListener("touchend", (e) => {
    e.preventDefault();
    fsHandler();
  }, { passive: false });
  
  state.handlers.push(() => {
    btnFS?.removeEventListener("click", fsHandler);
    btnFS?.removeEventListener("touchend", fsHandler);
  });

  return () => {};
}