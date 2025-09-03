/*! project.js — Barba-aware custom video player (init/destroy safe) */
(() => {
  if (window.__ProjectPlayerLoaded) return; window.__ProjectPlayerLoaded = true;

  let current = null;

  function createInstance(root) {
    const wrap  = root.querySelector(".project-player_wrap");
    const stage = wrap?.querySelector(".project-player_stage") || wrap || null;
    const host  = stage?.querySelector(".project-player_video-host") || wrap?.querySelector(".project-player_video-host");
    const url   = stage?.getAttribute("data-video") || wrap?.getAttribute("data-video") || "";
    const vtt   = stage?.getAttribute("data-captions") || wrap?.getAttribute("data-captions") || "";
    const poster= stage?.getAttribute("data-poster") || wrap?.getAttribute("data-poster") || "";
    if (!wrap || !host || !url) return null;

    // controls
    const btnPlay   = wrap.querySelector('[data-role="play"]');
    const btnMute   = wrap.querySelector('[data-role="mute"]');
    const muteLabel = wrap.querySelector('[data-role="mute-label"]');
    const btnFS     = wrap.querySelector('[data-role="fs"]');
    const tl        = wrap.querySelector('[data-role="timeline"]');
    const tlBuf     = wrap.querySelector('.project-player_timeline-buffer');
    const tlHandle  = wrap.querySelector('.project-player_timeline-handle');

    // ensure pause overlay
    let pauseFx = wrap.querySelector('.project-player_pausefx');
    if (!pauseFx) {
      pauseFx = document.createElement('div');
      pauseFx.className = 'project-player_pausefx u-cover-absolute u-inset-0';
      (wrap.querySelector('.project-player_stage') || wrap).appendChild(pauseFx);
    }

    // ensure center overlay
    let centerBtn = wrap.querySelector('.project-player_center-toggle');
    if (!centerBtn) {
      centerBtn = document.createElement('button');
      centerBtn.className = 'project-player_center-toggle project-player_btn project-player_btn--play';
      centerBtn.type = 'button';
      centerBtn.setAttribute('aria-pressed','false');
      centerBtn.setAttribute('aria-label','Unmute');
      centerBtn.style.color = '#fff';
      centerBtn.innerHTML = `
        <svg viewBox="0 0 24 24" class="pp-icon" aria-hidden="true" fill="none">
          <g class="pp-icon--group pp-icon--sound">
            <path d="M12 5V19L7 16H2V8H7L12 5Z"></path>
            <path d="M19.3 19.3C21.0459 17.2685 22.0059 14.6786 22.0059 12C22.0059 9.3214 21.0459 6.73148 19.3 4.70001"></path>
            <path d="M16.4 16.4C17.4429 15.1711 18.0154 13.6118 18.0154 12C18.0154 10.3882 17.4429 8.82888 16.4 7.60001"></path>
          </g>
          <g class="pp-icon--group pp-icon--play">
            <g class="pp-icon__part pp-icon__play"><path d="M5.2 12V3L13 7.5L20.8 12L13 16.5L5.2 21V12Z"></path></g>
            <g class="pp-icon__part pp-icon__pause"><path d="M9.5 5.5H6.5V18.5H9.5V5.5Z"></path><path d="M17.5 5.5H14.5V18.5H17.5V5.5Z"></path></g>
          </g>
        </svg>
        <span class="u-sr-only">Unmute</span>
      `.trim();
      (wrap.querySelector('.project-player_stage') || wrap).appendChild(centerBtn);
    }

    // video element (create if needed)
    let created = false;
    let video = host.querySelector("video");
    if (!video) {
      video = document.createElement("video");
      created = true;
    }
    video.className = "project-player_video";
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.preload = "auto";
    video.controls = false;
    video.src = url;
    if (poster) video.poster = poster;
    if (vtt && !video.querySelector('track[kind="subtitles"], track[kind="captions"]')) {
      const tr = document.createElement('track');
      tr.kind='subtitles'; tr.label='English'; tr.srclang='en'; tr.src=vtt; tr.default=false;
      video.appendChild(tr);
    }
    if (!video.isConnected) host.appendChild(video);

    // autoplay muted start
    video.muted = true; video.setAttribute('muted',''); video.volume = 0;

    // helpers/state
    let raf = 0, dragging = false, hidingTO = 0, didFirstSoundRestart = false;
    const disposers = [];

    const setPlayUI = (isPlaying) => {
      const pressed = isPlaying ? 'true' : 'false';
      if (btnPlay) { btnPlay.setAttribute('aria-pressed', pressed); btnPlay.classList.toggle('is-playing', isPlaying); }
      if (centerBtn && centerBtn.classList.contains('is-mode-play')) {
        centerBtn.setAttribute('aria-pressed', pressed);
        centerBtn.classList.toggle('is-playing', isPlaying);
      }
    };
    const setMuteUI = (muted) => {
      if (btnMute) {
        btnMute.setAttribute('aria-pressed', muted ? 'true' : 'false');
        if (muteLabel) muteLabel.textContent = muted ? 'Sound' : 'Mute';
        else btnMute.textContent = muted ? 'Sound' : 'Mute';
      }
    };
    const setPausedUI = (paused) => { wrap.classList.toggle('is-paused', !!paused); };
    const setIdle = (on) => { wrap.dataset.idle = on ? '1' : '0'; };
    const kickHide = () => { clearTimeout(hidingTO); setIdle(false); hidingTO = setTimeout(()=> setIdle(true), 1800); };

    async function ensureFirstFramePainted(v){
      if (v.readyState < 2) {
        await new Promise((res)=>{
          const done = ()=> res();
          v.addEventListener('loadeddata', done, { once:true });
          v.addEventListener('canplay',    done, { once:true });
          setTimeout(done, 3000);
        });
      }
      try { ('fastSeek' in v) ? v.fastSeek(0) : (v.currentTime = Math.max(0.00001, v.currentTime)); } catch(_){}
      try { v.muted = true; v.setAttribute('muted',''); const p=v.play?.(); if (p?.then) await p.catch(()=>{}); } catch(_){}
      await new Promise((res)=>{
        let done=false, cap=setTimeout(()=>{ if(!done){done=true;res();} }, 800);
        const onTU=()=>{ if(!done){done=true; clearTimeout(cap); v.removeEventListener('timeupdate', onTU); requestAnimationFrame(res);} };
        v.addEventListener('timeupdate', onTU, { once:true });
      });
      try { v.pause(); } catch(_) {}
    }

    function updateTimeUI(){
      if (!isFinite(video.duration)) return;
      const pct = (video.currentTime / video.duration) * 100;
      if (tlHandle) tlHandle.style.left = pct + '%';
      if (tl) tl.setAttribute('aria-valuenow', String(Math.round(pct)));
      if (video.buffered && video.buffered.length && tlBuf) {
        const end = video.buffered.end(video.buffered.length - 1);
        tlBuf.style.width = Math.min(100, (end / video.duration) * 100) + '%';
      }
    }
    function loop(){ updateTimeUI(); raf = requestAnimationFrame(loop); }

    function seekPct(p){
      if (!isFinite(video.duration)) return;
      p = Math.max(0, Math.min(100, p));
      video.currentTime = (p / 100) * video.duration;
      updateTimeUI();
    }

    function switchCenterToPlayMode(){
      centerBtn.classList.add('is-mode-play');
      centerBtn.setAttribute('aria-label', 'Play/Pause');
      const isPlaying = !video.paused;
      centerBtn.classList.toggle('is-playing', isPlaying);
      centerBtn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
    }

    // controls: play/pause
    async function togglePlayFromUser(){
      try{
        if (video.paused) {
          if (video.muted || video.volume === 0) {
            video.muted = false; video.removeAttribute('muted');
            const vol = Number(localStorage.getItem('pp:vol') || 1) || 1;
            video.volume = vol;
            setMuteUI(false);
            didFirstSoundRestart = true;
          }
          await video.play();
        } else {
          await video.pause();
        }
      } catch(_) {}
      setPlayUI(!video.paused);
      setPausedUI(video.paused);
      kickHide();
    }
    btnPlay?.addEventListener('click', togglePlayFromUser);
    disposers.push(()=> btnPlay?.removeEventListener('click', togglePlayFromUser));

    // center button
    const onCenter = async ()=>{
      const inPlayMode = centerBtn.classList.contains('is-mode-play');
      if (!inPlayMode) {
        try {
          video.muted = false; video.removeAttribute('muted');
          const vol = Number(localStorage.getItem('pp:vol') || 1) || 1;
          video.volume = vol;
          try { ('fastSeek' in video) ? video.fastSeek(0) : (video.currentTime = 0); } catch(_){}
          await video.play?.();
          switchCenterToPlayMode();
          setMuteUI(false); setPlayUI(true); setPausedUI(false);
          didFirstSoundRestart = true;
        } catch(_){}
        kickHide();
        return;
      }
      await togglePlayFromUser();
    };
    centerBtn.addEventListener('click', onCenter);
    disposers.push(()=> centerBtn.removeEventListener('click', onCenter));

    // mute btn
    const onMute = async ()=>{
      const wasMuted = video.muted;
      video.muted = !video.muted;
      if (video.muted) {
        video.setAttribute('muted','');
      } else {
        video.removeAttribute('muted');
        if (video.volume === 0) {
          const vol = Number(localStorage.getItem('pp:vol') || 1) || 1;
          video.volume = vol;
        }
        if (wasMuted && !didFirstSoundRestart) {
          didFirstSoundRestart = true;
          try { ('fastSeek' in video) ? video.fastSeek(0) : (video.currentTime = 0); } catch(_){}
          try { await video.play?.(); } catch(_){}
          setPlayUI(true); setPausedUI(false);
        }
        switchCenterToPlayMode();
      }
      localStorage.setItem('pp:muted', video.muted ? '1' : '0');
      setMuteUI(video.muted);
      kickHide();
    };
    btnMute?.addEventListener('click', onMute);
    disposers.push(()=> btnMute?.removeEventListener('click', onMute));

    // fullscreen
    function updateFSLabel(){
      if (!btnFS) return;
      const inFS = !!document.fullscreenElement && (document.fullscreenElement === wrap || wrap.contains(document.fullscreenElement));
      btnFS.textContent = inFS ? 'Minimise' : 'Fullscreen';
      btnFS.setAttribute('aria-label', inFS ? 'Exit fullscreen' : 'Toggle fullscreen');
    }
    const onFSChange = () => updateFSLabel();
    document.addEventListener('fullscreenchange', onFSChange);
    disposers.push(()=> document.removeEventListener('fullscreenchange', onFSChange));

    const onFS = async ()=>{
      try{
        if (!document.fullscreenElement) { await wrap.requestFullscreen?.(); }
        else { await document.exitFullscreen?.(); }
      } catch(_){}
      kickHide();
    };
    btnFS?.addEventListener('click', onFS);
    disposers.push(()=> btnFS?.removeEventListener('click', onFS));

    // timeline
    if (tl) {
      const onDown = (e)=>{
        dragging = true; tl.setPointerCapture?.(e.pointerId);
        const r = tl.getBoundingClientRect();
        seekPct(((e.clientX - r.left) / r.width) * 100);
        kickHide();
      };
      const onMove = (e)=>{
        if (!dragging) return;
        const r = tl.getBoundingClientRect();
        seekPct(((e.clientX - r.left) / r.width) * 100);
      };
      const endDrag = ()=> { dragging = false; };
      const onKey = (e)=>{
        const step = (e.shiftKey ? 10 : 5);
        const now = Number(tl.getAttribute('aria-valuenow') || 0);
        if (e.key === 'ArrowRight'){ seekPct(now + step); e.preventDefault(); }
        if (e.key === 'ArrowLeft'){  seekPct(now - step); e.preventDefault(); }
      };

      tl.addEventListener('pointerdown', onDown, { passive:true });
      tl.addEventListener('pointermove', onMove, { passive:true });
      tl.addEventListener('pointerup', endDrag);
      tl.addEventListener('pointercancel', endDrag);
      tl.addEventListener('keydown', onKey);

      disposers.push(()=>{
        tl.removeEventListener('pointerdown', onDown);
        tl.removeEventListener('pointermove', onMove);
        tl.removeEventListener('pointerup', endDrag);
        tl.removeEventListener('pointercancel', endDrag);
        tl.removeEventListener('keydown', onKey);
      });
    }

    // idle ui
    ['mousemove','pointermove','touchstart','keydown'].forEach((evt)=>{
      wrap.addEventListener(evt, kickHide, { passive:true });
      disposers.push(()=> wrap.removeEventListener(evt, kickHide));
    });
    kickHide();

    // start pipeline after enter
    (async function(){
      await ensureFirstFramePainted(video);
      try { await video.play(); } catch(_){}
      setPlayUI(!video.paused);
      setPausedUI(video.paused);

      // center button starts in "unmute" mode
      centerBtn.classList.remove('is-mode-play');
      centerBtn.setAttribute('aria-label', 'Unmute');
      setMuteUI(true);

      requestAnimationFrame(()=> requestAnimationFrame(()=> updateTimeUI()));
      raf = requestAnimationFrame(loop);
      updateFSLabel();
    })();

    // keep UI in sync
    const onPlay    = ()=>{ setPlayUI(true);  setPausedUI(false); };
    const onPlaying = ()=>{                  setPausedUI(false); };
    const onPause   = ()=>{ setPlayUI(false); setPausedUI(true);  };
    const onEnded   = ()=>{ setPlayUI(false); setPausedUI(true);  };
    const onTU      = ()=>{ if (!dragging) updateTimeUI(); };

    video.addEventListener('play', onPlay);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('timeupdate', onTU);

    disposers.push(()=>{
      video.removeEventListener('play', onPlay);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('timeupdate', onTU);
    });

    function destroy(){
      try { cancelAnimationFrame(raf); } catch(_){}
      try { video.pause(); } catch(_){}
      // do not remove DOM; Barba swaps container
      while (disposers.length) { try { disposers.pop()(); } catch(_){} }
      if (created && video.isConnected) { try { video.remove(); } catch(_){} }
    }

    return { destroy };
  }

  function boot(container) {
    if (current && current.destroy) { try { current.destroy(); } catch(_){} }
    current = createInstance(container || document) || null;
  }

  const getNs = () => document.querySelector('[data-barba="container"]')?.dataset.barbaNamespace || "";

  // hard load
  if (getNs() === "project") boot(document);

  // after every Barba swap
  document.addEventListener("page:enter", (e) => {
    const ns = (e?.detail?.namespace || "").toLowerCase();
    if (ns === "project") boot(e.detail.container || document);
  });
})();
