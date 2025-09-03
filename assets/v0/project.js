/*! project.js — module (init/destroy only) */
(function(){if(window.Pages?.project)return;window.Pages=window.Pages||{};
function createInstance(root){
  const wrap=root.querySelector(".project-player_wrap"); if(!wrap) return null;
  const stage=wrap.querySelector(".project-player_stage")||wrap, host=stage.querySelector(".project-player_video-host")||wrap.querySelector(".project-player_video-host");
  const url=stage.getAttribute("data-video")||wrap.getAttribute("data-video")||""; if(!host||!url) return null;
  const vtt=stage.getAttribute("data-captions")||wrap.getAttribute("data-captions")||"", poster=stage.getAttribute("data-poster")||wrap.getAttribute("data-poster")||"";
  const btnPlay=wrap.querySelector('[data-role="play"]'), btnMute=wrap.querySelector('[data-role="mute"]'), muteLabel=wrap.querySelector('[data-role="mute-label"]'), btnFS=wrap.querySelector('[data-role="fs"]');
  const tl=wrap.querySelector('[data-role="timeline"]'), tlBuf=wrap.querySelector('.project-player_timeline-buffer'), tlHandle=wrap.querySelector('.project-player_timeline-handle');

  let pauseFx=wrap.querySelector('.project-player_pausefx'); if(!pauseFx){ pauseFx=document.createElement('div'); pauseFx.className='project-player_pausefx u-cover-absolute u-inset-0'; (wrap.querySelector('.project-player_stage')||wrap).appendChild(pauseFx); }
  let centerBtn=wrap.querySelector('.project-player_center-toggle'); if(!centerBtn){ centerBtn=document.createElement('button'); centerBtn.className='project-player_center-toggle project-player_btn project-player_btn--play'; centerBtn.type='button'; centerBtn.setAttribute('aria-pressed','false'); centerBtn.setAttribute('aria-label','Unmute'); centerBtn.style.color='#fff';
    centerBtn.innerHTML=`<svg viewBox="0 0 24 24" class="pp-icon" aria-hidden="true" fill="none"><g class="pp-icon--group pp-icon--sound"><path d="M12 5V19L7 16H2V8H7L12 5Z"></path><path d="M19.3 19.3C21.0459 17.2685 22.0059 14.6786 22.0059 12C22.0059 9.3214 21.0459 6.73148 19.3 4.70001"></path><path d="M16.4 16.4C17.4429 15.1711 18.0154 13.6118 18.0154 12C18.0154 10.3882 17.4429 8.82888 16.4 7.60001"></path></g><g class="pp-icon--group pp-icon--play"><g class="pp-icon__part pp-icon__play"><path d="M5.2 12V3L13 7.5L20.8 12L13 16.5L5.2 21V12Z"></path></g><g class="pp-icon__part pp-icon__pause"><path d="M9.5 5.5H6.5V18.5H9.5V5.5Z"></path><path d="M17.5 5.5H14.5V18.5H17.5V5.5Z"></path></g></g></svg><span class="u-sr-only">Unmute</span>`; (wrap.querySelector('.project-player_stage')||wrap).appendChild(centerBtn); }

  let created=false, video=host.querySelector("video"); if(!video){ video=document.createElement("video"); created=true; }
  video.className="project-player_video"; video.playsInline=true; video.crossOrigin="anonymous"; video.preload="auto"; video.controls=false; video.src=url; if(poster) video.poster=poster;
  if(vtt && !video.querySelector('track[kind="subtitles"], track[kind="captions"]')){ const tr=document.createElement('track'); tr.kind='subtitles'; tr.label='English'; tr.srclang='en'; tr.src=vtt; tr.default=false; video.appendChild(tr); }
  if(!video.isConnected) host.appendChild(video);
  video.muted=true; video.setAttribute('muted',''); video.volume=0;

  let raf=0, dragging=false, hidingTO=0, didFirstSoundRestart=false; const disposers=[];
  const setPlayUI=(p)=>{const pr=p?'true':'false'; if(btnPlay){btnPlay.setAttribute('aria-pressed',pr); btnPlay.classList.toggle('is-playing',p);} if(centerBtn && centerBtn.classList.contains('is-mode-play')){ centerBtn.setAttribute('aria-pressed',pr); centerBtn.classList.toggle('is-playing',p); }};
  const setMuteUI=(m)=>{ if(btnMute){ btnMute.setAttribute('aria-pressed',m?'true':'false'); if(muteLabel) muteLabel.textContent=m?'Sound':'Mute'; else btnMute.textContent=m?'Sound':'Mute'; } };
  const setPausedUI=(q)=>{ wrap.classList.toggle('is-paused',!!q); };
  const setIdle=(on)=>{ wrap.dataset.idle=on?'1':'0'; };
  const kickHide=()=>{ clearTimeout(hidingTO); setIdle(false); hidingTO=setTimeout(()=>setIdle(true),1800); };

  async function paintFirst(v){
    if(v.readyState<2){ await new Promise(res=>{ const done=()=>res(); v.addEventListener('loadeddata',done,{once:true}); v.addEventListener('canplay',done,{once:true}); setTimeout(done,3000); }); }
    try{ ('fastSeek'in v)?v.fastSeek(0):(v.currentTime=Math.max(0.00001,v.currentTime)); }catch(_){}
    try{ v.muted=true; v.setAttribute('muted',''); const p=v.play?.(); if(p?.then) await p.catch(()=>{});}catch(_){}
    await new Promise(res=>{ let d=false, cap=setTimeout(()=>{if(!d){d=true;res();}},800); const onTU=()=>{ if(!d){d=true;clearTimeout(cap); v.removeEventListener('timeupdate',onTU); requestAnimationFrame(res);} }; v.addEventListener('timeupdate',onTU,{once:true}); });
    try{ v.pause(); }catch(_){}
  }
  function updateTime(){ if(!isFinite(video.duration)) return; const pct=(video.currentTime/video.duration)*100; if(tlHandle) tlHandle.style.left=pct+"%"; if(tl) tl.setAttribute('aria-valuenow',String(Math.round(pct)));
    if(video.buffered && video.buffered.length && tlBuf){ const end=video.buffered.end(video.buffered.length-1); tlBuf.style.width=Math.min(100,(end/video.duration)*100)+'%'; } }
  function loop(){ updateTime(); raf=requestAnimationFrame(loop); }
  function seekPct(p){ if(!isFinite(video.duration)) return; p=Math.max(0,Math.min(100,p)); video.currentTime=(p/100)*video.duration; updateTime(); }
  function switchCenterToPlay(){ centerBtn.classList.add('is-mode-play'); centerBtn.setAttribute('aria-label','Play/Pause'); const playing=!video.paused; centerBtn.classList.toggle('is-playing',playing); centerBtn.setAttribute('aria-pressed',playing?'true':'false'); }

  async function togglePlayFromUser(){ try{ if(video.paused){ if(video.muted||video.volume===0){ video.muted=false; video.removeAttribute('muted'); const vol=Number(localStorage.getItem('pp:vol')||1)||1; video.volume=vol; setMuteUI(false); didFirstSoundRestart=true; } await video.play(); } else { await video.pause(); } }catch(_){}
    setPlayUI(!video.paused); setPausedUI(video.paused); kickHide(); }
  const onPlayClick=()=>togglePlayFromUser(); btnPlay?.addEventListener('click', onPlayClick); disposers.push(()=>btnPlay?.removeEventListener('click',onPlayClick));

  const onCenter=async()=>{ const inPlay=centerBtn.classList.contains('is-mode-play'); if(!inPlay){ try{ video.muted=false; video.removeAttribute('muted'); const vol=Number(localStorage.getItem('pp:vol')||1)||1; video.volume=vol; try{('fastSeek'in video)?video.fastSeek(0):(video.currentTime=0);}catch(_){}
        await video.play?.(); switchCenterToPlay(); setMuteUI(false); setPlayUI(true); setPausedUI(false); didFirstSoundRestart=true; }catch(_){}
      kickHide(); return; } await togglePlayFromUser(); };
  centerBtn.addEventListener('click', onCenter); disposers.push(()=>centerBtn.removeEventListener('click', onCenter));

  const onMute=async()=>{ const was=video.muted; video.muted=!video.muted; if(video.muted){ video.setAttribute('muted',''); } else { video.removeAttribute('muted'); if(video.volume===0){ const vol=Number(localStorage.getItem('pp:vol')||1)||1; video.volume=vol; }
      if(was && !didFirstSoundRestart){ didFirstSoundRestart=true; try{('fastSeek'in video)?video.fastSeek(0):(video.currentTime=0);}catch(_){}
        try{ await video.play?.(); }catch(_){}
        setPlayUI(true); setPausedUI(false); } switchCenterToPlay(); }
    localStorage.setItem('pp:muted', video.muted?'1':'0'); setMuteUI(video.muted); kickHide(); };
  btnMute?.addEventListener('click', onMute); disposers.push(()=>btnMute?.removeEventListener('click', onMute));

  function updateFSLabel(){ if(!btnFS) return; const inFS=!!document.fullscreenElement && (document.fullscreenElement===wrap || wrap.contains(document.fullscreenElement)); btnFS.textContent=inFS?'Minimise':'Fullscreen'; btnFS.setAttribute('aria-label',inFS?'Exit fullscreen':'Toggle fullscreen'); }
  const onFSChange=()=>updateFSLabel(); document.addEventListener('fullscreenchange', onFSChange); disposers.push(()=>document.removeEventListener('fullscreenchange', onFSChange));
  const onFS=async()=>{ try{ if(!document.fullscreenElement){ await wrap.requestFullscreen?.(); } else { await document.exitFullscreen?.(); } }catch(_){}
    kickHide(); }; btnFS?.addEventListener('click', onFS); disposers.push(()=>btnFS?.removeEventListener('click', onFS));

  if(tl){ const onDown=e=>{ dragging=true; tl.setPointerCapture?.(e.pointerId); const r=tl.getBoundingClientRect(); seekPct(((e.clientX-r.left)/r.width)*100); kickHide(); };
    const onMove=e=>{ if(!dragging) return; const r=tl.getBoundingClientRect(); seekPct(((e.clientX-r.left)/r.width)*100); };
    const onEnd=()=>{ dragging=false; }; const onKey=e=>{ const step=(e.shiftKey?10:5), now=Number(tl.getAttribute('aria-valuenow')||0); if(e.key==='ArrowRight'){seekPct(now+step); e.preventDefault();} if(e.key==='ArrowLeft'){seekPct(now-step); e.preventDefault();} };
    tl.addEventListener('pointerdown', onDown, {passive:true}); tl.addEventListener('pointermove', onMove, {passive:true}); tl.addEventListener('pointerup', onEnd); tl.addEventListener('pointercancel', onEnd); tl.addEventListener('keydown', onKey);
    disposers.push(()=>{ tl.removeEventListener('pointerdown', onDown); tl.removeEventListener('pointermove', onMove); tl.removeEventListener('pointerup', onEnd); tl.removeEventListener('pointercancel', onEnd); tl.removeEventListener('keydown', onKey); });
  }

  ['mousemove','pointermove','touchstart','keydown'].forEach(evt=>{ wrap.addEventListener(evt, kickHide, {passive:true}); disposers.push(()=>wrap.removeEventListener(evt, kickHide)); }); kickHide();

  (async function(){ await paintFirst(video); try{ await video.play(); }catch(_){}
    setPlayUI(!video.paused); setPausedUI(video.paused);
    centerBtn.classList.remove('is-mode-play'); centerBtn.setAttribute('aria-label','Unmute'); setMuteUI(true);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ if(!dragging) updateTime(); })); raf=requestAnimationFrame(()=>{ function L(){updateTime(); raf=requestAnimationFrame(L);} L(); }); updateFSLabel();
  })();

  const onPlay=()=>{setPlayUI(true); setPausedUI(false);}, onPlaying=()=>{setPausedUI(false);}, onPause=()=>{setPlayUI(false); setPausedUI(true);}, onEnded=()=>{setPlayUI(false); setPausedUI(true);}, onTU=()=>{ if(!dragging) updateTime(); };
  video.addEventListener('play',onPlay); video.addEventListener('playing',onPlaying); video.addEventListener('pause',onPause); video.addEventListener('ended',onEnded); video.addEventListener('timeupdate',onTU);
  disposers.push(()=>{ video.removeEventListener('play',onPlay); video.removeEventListener('playing',onPlaying); video.removeEventListener('pause',onPause); video.removeEventListener('ended',onEnded); video.removeEventListener('timeupdate',onTU); });

  return { destroy(){ try{cancelAnimationFrame(raf)}catch(_){ } try{video.pause()}catch(_){ } while(disposers.length){ try{disposers.pop()()}catch(_){}} if(created && video.isConnected){ try{ video.remove(); }catch(_){}} } };
}
window.Pages.project={
  init(container){ this._inst && this._inst.destroy?.(); this._inst=createInstance(container||document); },
  destroy(){ this._inst && this._inst.destroy?.(); this._inst=null; }
};})();
