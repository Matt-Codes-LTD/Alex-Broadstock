/*! home.js — module (init/destroy only) */
(function(){if(window.Pages?.home)return;window.Pages=window.Pages||{};
const qsa=(r,s)=>Array.from(r.querySelectorAll(s)),norm=s=>(s||"").replace(/\s+/g," ").trim().toLowerCase(),rIC=window.requestIdleCallback||(f=>setTimeout(f,250));
function createInstance(root){
  const section=root.querySelector(".home-hero_wrap"); if(!section) return null;
  const stage=section.querySelector(".home-hero_video"), listPar=section.querySelector(".home-hero_list_parent"); if(!stage||!listPar) return null;
  const reduceMotion=matchMedia("(prefers-reduced-motion: reduce)").matches, reduceData=matchMedia("(prefers-reduced-data: reduce)").matches;
  // preconnect teaser+main origins (once per origin)
  (function(){const head=document.head, seen=new Set(), links=qsa(section,".home-hero_link");
    function addOrigin(v){try{const u=new URL(v||"",location.href); if(!u.origin||seen.has(u.origin)) return; seen.add(u.origin);
      const exists=[...head.querySelectorAll('link[rel="preconnect"],link[rel="dns-prefetch"]')].some(l=>(l.href||"").startsWith(u.origin)); if(exists) return;
      const a=document.createElement("link"); a.rel="preconnect"; a.href=u.origin; a.crossOrigin="anonymous"; head.appendChild(a);
      const b=document.createElement("link"); b.rel="dns-prefetch"; b.href=u.origin; head.appendChild(b);
    }catch(_){}} links.forEach(l=>{addOrigin(l.getAttribute("data-video")); addOrigin(l.getAttribute("data-video-main"));});
  })();

  const disposers=[], videoBySrc=new Map(); let activeVideo=null, activeLink=null;
  const MAX_EAGER=Number(section.getAttribute("data-warm-eager")||3);
  function createVideo(src){ if(!src) return null; let v=videoBySrc.get(src); if(v) return v;
    v=document.createElement("video"); v.className="home-hero_video_el"; v.src=src; v.muted=true; v.loop=true; v.playsInline=true; v.preload="auto"; v.crossOrigin="anonymous"; stage.appendChild(v); videoBySrc.set(src,v); return v;
  }
  function warm(v){ if(!v||v.__w||reduceData) return; v.__w=1; const start=()=>{ v.play().then(()=>setTimeout(()=>{ if(!v.__keepAlive){ try{v.pause()}catch(_){}}},220)).catch(()=>{}); }; (v.readyState>=2)?start():v.addEventListener("canplaythrough",start,{once:true}); }
  const links=qsa(section,".home-hero_link"); links.forEach((a,i)=>{const v=createVideo(a.getAttribute("data-video")); if(!v) return; (i<MAX_EAGER)?warm(v):rIC(()=>warm(v));});
  const defaultFadeSel=".home-category_ref_text, .home-hero_title, .home-hero_name, .home-hero_heading", fadeTargetsFor=(link)=>link.querySelectorAll(link.getAttribute("data-fade-target")||defaultFadeSel);
  function updateLinkState(prev,next){ if(prev&&prev!==next){prev.setAttribute("aria-current","false"); fadeTargetsFor(prev).forEach(n=>n.classList.add("u-color-faded"));} if(next){next.setAttribute("aria-current","true"); fadeTargetsFor(next).forEach(n=>n.classList.remove("u-color-faded"));}}
  function restart(v){ try{("fastSeek"in v)?v.fastSeek(0):(v.currentTime=0);}catch(_){ } v.play().catch(()=>{}); }
  function setActive(src,linkEl){ const next=videoBySrc.get(src)||createVideo(src); if(!next) return; next.__keepAlive=true; if(activeVideo&&activeVideo!==next) activeVideo.__keepAlive=false;
    if(next!==activeVideo){ activeVideo?.classList.remove("is-active"); next.classList.add("is-active"); activeVideo=next; }
    if(linkEl&&linkEl!==activeLink){ updateLinkState(activeLink,linkEl); activeLink=linkEl; }
    if(!reduceMotion) restart(next);
  }
  // cache cats & hide "Selected"
  qsa(section,".home-hero_list").forEach(it=>{const cats=new Set(); qsa(it,".home-category_ref_text").forEach(n=>{const t=norm(n.textContent); if(t==="selected") n.setAttribute("hidden",""); if(t) cats.add(t);}); it.dataset.cats=Array.from(cats).join("|");});
  // FLIP filter (compact)
  function ghostLayer(){ let gl=document.__ghostExitLayer; if(gl&&document.body.contains(gl)) return gl; gl=document.createElement("div"); gl.style.cssText="position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:999;background:transparent;contain:layout paint;isolation:isolate;"; document.body.appendChild(gl); document.__ghostExitLayer=gl; return gl; }
  function stripArtifacts(root){ qsa(root,'[data-animate-chars],[data-animate-chars-inner]').forEach(n=>{n.removeAttribute('data-animate-chars'); n.removeAttribute('data-animate-chars-inner');}); [root,...qsa(root,"*")].forEach(n=>{n.style.background="transparent"; n.style.boxShadow="none"; n.style.textShadow="none"; n.style.mixBlendMode="normal"; n.style.webkitTextFillColor="currentColor";}); }
  function makeGhost(el,rect){ const g=el.cloneNode(true); g.setAttribute("aria-hidden","true"); const cs=getComputedStyle(el);
    Object.assign(g.style,{color:cs.color,position:"fixed",margin:"0",left:rect.left+"px",top:rect.top+"px",width:rect.width+"px",height:rect.height+"px",pointerEvents:"none",willChange:"transform,opacity",backfaceVisibility:"hidden",transform:"translateZ(0)",background:"transparent"}); stripArtifacts(g); ghostLayer().appendChild(g); return g; }
  function applyFilter(label){
    const key=norm(label)||"all", items=qsa(section,".home-hero_list");
    const visibleBefore=items.filter(it=>it.style.display!=="none"), rectBefore=new Map(); visibleBefore.forEach(el=>rectBefore.set(el,el.getBoundingClientRect()));
    const toStay=[], toExit=[]; items.forEach(it=>{ const match=(key==="all")?true:(it.dataset.cats||"").split("|").includes(key); if(match) toStay.push(it); else if(it.style.display!=="none") toExit.push(it);});
    const ghosts=[]; toExit.forEach(el=>{const r=rectBefore.get(el); if(!r) return; ghosts.push(makeGhost(el,r)); el.style.display="none";});
    let firstVisible=null; items.forEach(it=>{ const show=toStay.includes(it); if(show){ if(it.style.display==="none"){it.style.display=""; it.style.opacity="0";} if(!firstVisible) firstVisible=it.querySelector(".home-hero_link"); } else { if(!toExit.includes(it)) it.style.display="none"; }
      it.style.transform="none"; it.style.willChange="transform,opacity"; it.style.backfaceVisibility="hidden"; it.style.transformOrigin="50% 50% 0";
    });
    qsa(section,".home-category_ref_text").forEach(n=>{ if(norm(n.textContent)==="selected") n.setAttribute("hidden",""); });
    listPar.style.pointerEvents="none";
    requestAnimationFrame(()=>{
      const visibleAfter=toStay.filter(el=>el.style.display!=="none"), rectAfter=new Map(); visibleAfter.forEach(el=>rectAfter.set(el,el.getBoundingClientRect()));
      const MOVE=reduceMotion?0:0.36, ENTER=reduceMotion?0:0.32, EXIT=reduceMotion?0:0.30, E_MOVE="cubic-bezier(.16,.84,.28,1)", E_ENTER="cubic-bezier(.22,1,.36,1)", E_EXIT="cubic-bezier(.36,0,.1,1)", ST=12, anims=[];
      visibleAfter.forEach((el,i)=>{ const b=rectBefore.get(el), a=rectAfter.get(el);
        if(!b){ if(ENTER){anims.push(el.animate([{opacity:0,transform:"translateY(12px) translateZ(0)"},{opacity:1,transform:"translateY(0) translateZ(0)"}],{duration:ENTER*1e3,easing:E_ENTER,delay:i*ST,fill:"both"}).finished.catch(()=>{}));} else {el.style.opacity=""; el.style.transform="";} return; }
        const dx=b.left-a.left, dy=b.top-a.top;
        if(dx||dy){ anims.push(el.animate([{transform:`translate(${dx}px, ${dy}px) translateZ(0)`},{transform:"translate(0,0) translateZ(0)"}],{duration:MOVE*1e3,easing:E_MOVE,delay:i*ST,fill:"both"}).finished.catch(()=>{})); } else { el.style.opacity=""; }
      });
      ghosts.forEach((g,i)=>{ anims.push(g.animate([{opacity:1,transform:"translateY(0) translateZ(0)"},{opacity:0,transform:"translateY(-10px) translateZ(0)"}],{duration:EXIT*1e3,easing:E_EXIT,delay:i*ST,fill:"both"}).finished.then(()=>{try{g.remove()}catch(_){}}).catch(()=>{try{g.remove()}catch(_){}})); });
      Promise.allSettled(anims).finally(()=>{
        visibleAfter.forEach(el=>{el.style.willChange=""; el.style.opacity=""; el.style.transform=""; el.style.backfaceVisibility="";});
        listPar.style.pointerEvents="";
        if(activeLink && activeLink.closest(".home-hero_list")?.style.display==="none" && firstVisible){ const src=firstVisible.getAttribute("data-video"); if(src) setActive(src, firstVisible); }
        if(document.activeElement && document.activeElement.closest(".home-hero_list")?.style.display==="none" && firstVisible){ firstVisible.focus({preventScroll:true}); }
      });
    });
  }

  // Categories UI
  (function(){
    const BTN=".home-category_text", catWrap=document.querySelector(".home_hero_categories"); if(!catWrap) return;
    function ensureAll(){ const btns=qsa(catWrap,BTN); let all=btns.find(b=>norm(b.textContent)==="all"); if(all) return all;
      const item=document.createElement("div"); item.setAttribute("role","listitem"); item.className="home-hero_category u-text-style-main w-dyn-item";
      const a=document.createElement("a"); a.href="#"; a.className="home-category_text u-text-style-main"; a.textContent="All"; a.setAttribute("data-animate-chars",""); a.setAttribute("aria-current","true"); a.setAttribute("data-animate-delay",catWrap.getAttribute("data-animate-delay")||"0.012");
      item.appendChild(a); catWrap.insertBefore(item,catWrap.firstChild); return a;
    }
    function setActive(label){ const key=norm(label); qsa(catWrap,BTN).forEach(b=>{ const on=norm(b.textContent)===key; b.setAttribute("aria-current", on?"true":"false"); b.classList.toggle("u-color-faded",!on); }); }
    function onClick(e){ const btn=e.target.closest(BTN); if(!btn||!catWrap.contains(btn)) return; e.preventDefault(); const label=btn.textContent||"All"; setActive(label); applyFilter(label); }
    ensureAll(); setActive("All"); applyFilter("All"); catWrap.addEventListener("click", onClick, {passive:false}); disposers.push(()=>catWrap.removeEventListener("click", onClick));
  })();

  // pick first item
  (function(){ const first=links[0]; if(!first) return; const src=first.getAttribute("data-video"); const v=createVideo(src); if(v) v.__keepAlive=true; setActive(src, first); })();

  // hover/focus/touch activate
  function onOver(e){ const a=e.target.closest?.(".home-hero_link"); if(!a||!listPar.contains(a)||a===activeLink) return; const src=a.getAttribute("data-video"); if(src) setActive(src,a); }
  listPar.addEventListener("pointerover", onOver, {passive:true}); listPar.addEventListener("focusin", onOver); listPar.addEventListener("touchstart", onOver, {passive:true});
  disposers.push(()=>{ listPar.removeEventListener("pointerover", onOver); listPar.removeEventListener("focusin", onOver); listPar.removeEventListener("touchstart", onOver); });

  // pause all hero videos on tab hide
  function onVis(){ if(document.hidden){ qsa(stage,".home-hero_video_el").forEach(v=>{try{v.pause()}catch(_){}}); } }
  document.addEventListener("visibilitychange", onVis); disposers.push(()=>document.removeEventListener("visibilitychange", onVis));

  return { destroy(){ while(disposers.length){ try{disposers.pop()()}catch(_){}} videoBySrc.forEach(v=>{try{v.pause()}catch(_){}}); } };
}
window.Pages.home={
  init(container){ this._inst && this._inst.destroy?.(); this._inst=createInstance(container||document); },
  destroy(){ this._inst && this._inst.destroy?.(); this._inst=null; }
};})();
