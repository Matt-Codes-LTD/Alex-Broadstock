function initProjectPlayer(e){
  const t=e.querySelector(".project-player_wrap");
  if(!t)return()=>{};
  if(t.dataset.scriptInitialized)return()=>{};
  t.dataset.scriptInitialized="true";

  const n=t.querySelector(".project-player_stage")||t,
        a=n.getAttribute("data-project-slug")||t.getAttribute("data-project-slug")||"",
        r=n.getAttribute("data-video")||t.getAttribute("data-video")||"",
        i=n.getAttribute("data-captions")||t.getAttribute("data-captions")||"",
        o=n.getAttribute("data-poster")||t.getAttribute("data-poster")||"",
        c=n.querySelector(".project-player_video-host")||t.querySelector(".project-player_video-host"),
        l=t.querySelector('[data-role="play"]'),
        s=t.querySelector('[data-role="mute"]'),
        u=t.querySelector('[data-role="mute-label"]'),
        d=t.querySelector('[data-role="fs"]'),
        p=t.querySelector('[data-role="timeline"]'),
        y=t.querySelector(".project-player_timeline-buffer"),
        m=t.querySelector(".project-player_timeline-handle");

  // Pause FX overlay
  let f=t.querySelector(".project-player_pausefx");
  if(!f){
    f=document.createElement("div"),
    f.className="project-player_pausefx u-cover-absolute u-inset-0";
    const host=(t.querySelector(".project-player_stage")||t).querySelector(".project-player_video-host"),
          stage=t.querySelector(".project-player_stage")||t;
    host?.nextSibling?stage.insertBefore(f,host.nextSibling):stage.appendChild(f)
  }

  // Center toggle button
  let v=t.querySelector(".project-player_center-toggle");
  if(!v){
    v=document.createElement("button"),
    v.className="project-player_center-toggle project-player_btn project-player_btn--play",
    v.type="button",
    v.setAttribute("aria-pressed","false"),
    v.setAttribute("aria-label","Unmute"),
    v.style.color="#fff",
    v.innerHTML=`<svg viewBox="0 0 24 24" class="pp-icon" aria-hidden="true" fill="none"><g class="pp-icon--group pp-icon--sound"><path d="M12 5V19L7 16H2V8H7L12 5Z"></path><path d="M19.3 19.3C21.0459 17.2685 22.0059 14.6786 22.0059 12C22.0059 9.3214 21.0459 6.73148 19.3 4.70001"></path><path d="M16.4 16.4C17.4429 15.1711 18.0154 13.6118 18.0154 12C18.0154 10.3882 17.4429 8.82888 16.4 7.60001"></path></g><g class="pp-icon--group pp-icon--play"><g class="pp-icon__part pp-icon__play"><path d="M5.2 12V3L13 7.5L20.8 12L13 16.5L5.2 21V12Z"></path></g><g class="pp-icon__part pp-icon__pause"><path d="M9.5 5.5H6.5V18.5H9.5V5.5Z"></path><path d="M17.5 5.5H14.5V18.5H17.5V5.5Z"></path></g></g></svg><span class="u-sr-only">Unmute</span>`.trim(),
    (t.querySelector(".project-player_stage")||t).appendChild(v)
  }

  // Video setup
  let h=c?.querySelector("video");
  if(!h&&c&&r){
    h=document.createElement("video"),
    h.playsInline=!0,
    h.crossOrigin="anonymous",
    h.preload="auto",
    h.src=r
  }
  if(!h)return()=>{};
  if(i&&!h.querySelector('track[kind="subtitles"], track[kind="captions"]')){
    const e=document.createElement("track");
    e.kind="subtitles",e.label="English",e.srclang="en",e.src=i,e.default=!1,h.appendChild(e)
  }
  h.className="project-player_video",
  h.controls=!1,
  o&&(h.poster=o),
  h.isConnected||c?.appendChild(h),
  h.muted=!0,
  h.setAttribute("muted",""),
  h.volume=0;

  let g=0,b=!1,w=0,E=!1;
  const L=[];

  const k=e=>{
    const t=e?"true":"false";
    l&&(l.setAttribute("aria-pressed",t),l.classList.toggle("is-playing",e)),
    v&&v.classList.contains("is-mode-play")&&(v.setAttribute("aria-pressed",t),v.classList.toggle("is-playing",e))
  },
  C=e=>{
    s&&(s.setAttribute("aria-pressed",e?"true":"false"),
    u?u.textContent=e?"Sound":"Mute":s.textContent=e?"Sound":"Mute")
  },
  S=e=>{t.classList.toggle("is-paused",!!e)},
  q=e=>{t.dataset.idle=e?"1":"0"},
  T=()=>{clearTimeout(w),q(!1),w=setTimeout((()=>q(!0)),1800)};

  async function A(e){
    if(e.readyState<2&&await new Promise((t=>{const n=()=>t();e.addEventListener("loadeddata",n,{once:!0}),e.addEventListener("canplay",n,{once:!0}),setTimeout(n,3e3)})),("fastSeek"in e)?e.fastSeek(0):e.currentTime=Math.max(1e-5,e.currentTime),e.muted=!0,e.setAttribute("muted",""),await e.play?.().catch((()=>{})),await new Promise((t=>{let n=!1,a=setTimeout((()=>{n||(n=!0,t())}),800);const r=()=>{n||(n=!0,clearTimeout(a),e.removeEventListener("timeupdate",r),requestAnimationFrame(t))};e.addEventListener("timeupdate",r,{once:!0})}));try{e.pause()}catch(e){}}

  function U(){if(isFinite(h.duration)){const e=h.currentTime/h.duration*100;m&&(m.style.left=e+"%"),p&&p.setAttribute("aria-valuenow",String(Math.round(e))),h.buffered&&h.buffered.length&&y&&(y.style.width=Math.min(100,h.buffered.end(h.buffered.length-1)/h.duration*100)+"%")}}
  function M(){U(),g=requestAnimationFrame(M)}
  function O(e){isFinite(h.duration)&&(e=Math.max(0,Math.min(100,e)),h.currentTime=e/100*h.duration,U())}
  function P(){v.classList.add("is-mode-play"),v.setAttribute("aria-label","Play/Pause");const e=!h.paused;v.classList.toggle("is-playing",e),v.setAttribute("aria-pressed",e?"true":"false")}

  async function R(){
    try{
      if(h.paused){
        if(h.muted||0===h.volume){
          h.muted=!1,h.removeAttribute("muted");
          const e=Number(localStorage.getItem("pp:vol")||1)||1;
          h.volume=e,C(!1),E=!0
        }
        await h.play()
      } else await h.pause()
    }catch(e){}
    k(!h.paused),S(h.paused),T()
  }

  l?.addEventListener("click",R),L.push((()=>l?.removeEventListener("click",R)));

  const N=async()=>{
    if(v.classList.contains("is-mode-play"))await R();
    else try{
      h.muted=!1,h.removeAttribute("muted");
      const e=Number(localStorage.getItem("pp:vol")||1)||1;
      h.volume=e,("fastSeek"in h)?h.fastSeek(0):h.currentTime=0,
      await h.play?.(),P(),C(!1),k(!0),S(!1),E=!0
    }catch(e){}
    T()
  };
  v.addEventListener("click",N),L.push((()=>v.removeEventListener("click",N)));

  const V=async()=>{
    const e=h.muted;
    if(h.muted=!h.muted,h.muted?h.setAttribute("muted",""): (h.removeAttribute("muted"),0===h.volume&&(h.volume=Number(localStorage.getItem("pp:vol")||1)||1),e&&!E&&(E=!0,("fastSeek"in h)?h.fastSeek(0):h.currentTime=0,await h.play?.().catch((()=>{})),k(!0),S(!1),P())),
    localStorage.setItem("pp:muted",h.muted?"1":"0"),C(h.muted),T()){}
  };
  s?.addEventListener("click",V),L.push((()=>s?.removeEventListener("click",V)));

  function F(){if(d){const e=!!document.fullscreenElement&&(document.fullscreenElement===t||t.contains(document.fullscreenElement));d.textContent=e?"Minimise":"Fullscreen",d.setAttribute("aria-label",e?"Exit fullscreen":"Toggle fullscreen")}}
  const H=()=>F();document.addEventListener("fullscreenchange",H),L.push((()=>document.removeEventListener("fullscreenchange",H)));
  const B=async()=>{try{document.fullscreenElement?await document.exitFullscreen?.():await t.requestFullscreen?.()}catch(e){}T()};
  d?.addEventListener("click",B),L.push((()=>d?.removeEventListener("click",B)));

  if(p){
    const e=e=>{b=!0,p.setPointerCapture?.(e.pointerId);const t=p.getBoundingClientRect();O((e.clientX-t.left)/t.width*100),T()},
          t=e=>{if(b){const t=p.getBoundingClientRect();O((e.clientX-t.left)/t.width*100)}},
          n=()=>{b=!1},
          a=e=>{const t=e.shiftKey?10:5,n=Number(p.getAttribute("aria-valuenow")||0);"ArrowRight"===e.key&&(O(n+t),e.preventDefault()),"ArrowLeft"===e.key&&(O(n-t),e.preventDefault())};
    p.addEventListener("pointerdown",e),
    p.addEventListener("pointermove",t),
    p.addEventListener("pointerup",n),
    p.addEventListener("pointercancel",n),
    p.addEventListener("keydown",a),
    L.push((()=>{p.removeEventListener("pointerdown",e),p.removeEventListener("pointermove",t),p.removeEventListener("pointerup",n),p.removeEventListener("pointercancel",n),p.removeEventListener("keydown",a)}))
  }

  ["mousemove","pointermove","touchstart","keydown"].forEach((e=>{
    const n=()=>T();
    t.addEventListener(e,n,{passive:!0}),
    L.push((()=>t.removeEventListener(e,n)))
  })),T();

  (async function(){
    await A(h);try{await h.play()}catch(e){}
    k(!h.paused),S(h.paused),v.classList.remove("is-mode-play"),v.setAttribute("aria-label","Unmute"),C(!0),requestAnimationFrame((()=>requestAnimationFrame((()=>U())))),g=requestAnimationFrame(M),F()
  })();

  const j=()=>{k(!0),S(!1)},z=()=>{S(!1)},G=()=>{k(!1),S(!0)},J=()=>{k(!1),S(!0)},K=()=>{b||U()};
  h.addEventListener("play",j),h.addEventListener("playing",z),h.addEventListener("pause",G),h.addEventListener("ended",J),h.addEventListener("timeupdate",K),
  L.push((()=>{h.removeEventListener("play",j),h.removeEventListener("playing",z),h.removeEventListener("pause",G),h.removeEventListener("ended",J),h.removeEventListener("timeupdate",K)}));

  return ()=>{try{cancelAnimationFrame(g),h.pause(),h.muted=!0}catch(e){}L.forEach((e=>e())),clearTimeout(w),delete t.dataset.scriptInitialized}
}
