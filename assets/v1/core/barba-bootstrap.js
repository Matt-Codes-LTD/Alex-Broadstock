// barba-bootstrap.js - Replace your entire file with this

import { initPageScripts, initGlobal } from "./page-scripts.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("[Barba] init starting…");

  window.__barbaNavigated = false;
  initGlobal();

  // Create the split transition overlay
  const transitionOverlay = document.createElement('div');
  transitionOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #000;
    z-index: 9999;
    pointer-events: none;
    clip-path: polygon(50% 0, 50% 0, 50% 100%, 50% 100%);
    -webkit-clip-path: polygon(50% 0, 50% 0, 50% 100%, 50% 100%);
  `;
  document.body.appendChild(transitionOverlay);

  // Nav animation function for project pages
  function animateProjectNav(container) {
    if (container.dataset.barbaNamespace !== "project") return;
    
    gsap.set([
      ".nav_wrap",
      ".nav_link",
      ".project_name",
      ".project-player_center-toggle",
      ".project-player_controls"
    ], {
      visibility: "visible"
    });
    
    const tl = gsap.timeline();
    
    tl.fromTo(".nav_wrap", {
      opacity: 0,
      y: -20
    }, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out"
    })
    .fromTo(".nav_link", {
      opacity: 0,
      x: 20
    }, {
      opacity: 1,
      x: 0,
      duration: 0.5,
      stagger: 0.08,
      ease: "power2.out"
    }, "-=0.4")
    .fromTo(".project_name", {
      opacity: 0,
      x: -30,
      filter: "blur(4px)"
    }, {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      duration: 0.5,
      ease: "power2.out"
    }, "-=0.3")
    .fromTo(".project-player_controls", {
      opacity: 0,
      y: 20
    }, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power3.out"
    }, "-=0.4")
    .fromTo([".project-player_btn--play", ".project-player_timeline"], {
      opacity: 0
    }, {
      opacity: 1,
      duration: 0.4,
      ease: "power2.out"
    }, "-=0.3")
    .fromTo([".project-player_btn--mute", ".project-player_btn--fs"], {
      opacity: 0,
      y: 15
    }, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.08,
      ease: "power2.out"
    }, "-=0.3")
    .fromTo(".project-player_center-toggle", {
      opacity: 0,
      scale: 0.85
    }, {
      opacity: 1,
      scale: 1,
      duration: 0.6,
      ease: "back.out(1.7)"
    }, "-=0.4");
    
    return tl;
  }

  barba.init({
    transitions: [
      {
        name: "split-screen-transition",

        once({ next }) {
          const main = next.container;
          main.__cleanup = initPageScripts(main);
          gsap.set(main, { opacity: 1 });
          animateProjectNav(main);
        },

        async leave({ current }) {
          document.body.classList.add('barba-navigating');
          window.__barbaNavigated = true;
          
          if (current?.container?.__cleanup) {
            current.container.__cleanup();
            delete current.container.__cleanup;
          }

          // Expand overlay to cover screen
          await gsap.to(transitionOverlay, {
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
            duration: 0.6,
            ease: "cubic-bezier(0.5,0.25,0,1)"
          });
        },

        enter({ current, next }) {
          const oldMain = current.container;
          const newMain = next.container;
          
          // Initialize new page scripts
          newMain.__cleanup = initPageScripts(newMain);
          
          // Position new page behind overlay
          gsap.set(newMain, { 
            opacity: 1,
            visibility: 'visible'
          });
          
          // Hide old page
          if (oldMain) {
            gsap.set(oldMain, { display: 'none' });
          }

          // Contract overlay to reveal new page
          return gsap.to(transitionOverlay, {
            clipPath: 'polygon(50% 0, 50% 0, 50% 100%, 50% 100%)',
            duration: 0.6,
            ease: "cubic-bezier(0.5,0.25,0,1)",
            onComplete: () => {
              // Clean up old container
              if (oldMain && oldMain.parentNode) {
                oldMain.remove();
              }
              
              window.scrollTo(0, 0);
              document.body.classList.remove('barba-navigating');
              animateProjectNav(newMain);
            }
          });
        }
      }
    ]
  });
});