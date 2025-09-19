// site-timelines/hero-reveal-timeline.js
export function createHeroRevealTimeline(container) {
  const tl = gsap.timeline();
  
  // Set visibility
  gsap.set([
    ".nav_wrap",
    ".home_hero_categories", 
    ".home-hero_menu",
    ".home-awards_list"
  ], {
    visibility: "visible",
    opacity: 1
  });
  
  gsap.set([
    ".brand_logo",
    ".nav_link",
    ".home-category_text"
  ], {
    visibility: "visible"
  });
  
  gsap.set([
    ".home_hero_text",
    ".home-category_ref_text:not([hidden])",
    ".home-awards_list"
  ], {
    opacity: 0
  });
  
  // Nav animation
  tl.fromTo(".nav_wrap", {
    opacity: 0, y: -20
  }, {
    opacity: 1, y: 0,
    duration: 0.8,
    ease: "power3.out"
  })
  
  // Brand logo
  .fromTo(".brand_logo", {
    opacity: 0, scale: 0.9
  }, {
    opacity: 1, scale: 1,
    duration: 0.6,
    ease: "back.out(1.2)"
  }, "-=0.5")
  
  // Nav links
  .fromTo(".nav_link", {
    opacity: 0, x: 20
  }, {
    opacity: 1, x: 0,
    duration: 0.5,
    stagger: 0.08,
    ease: "power2.out"
  }, "-=0.4")
  
  // Category filters
  .fromTo(".home-category_text", {
    opacity: 0, y: 15, rotateX: -45
  }, {
    opacity: 1, y: 0, rotateX: 0,
    duration: 0.6,
    stagger: 0.05,
    ease: "power3.out"
  }, "-=0.5")
  
  // Project rows
  .add(() => {
    const visibleRows = container.querySelectorAll(".home-hero_list:not([style*='display: none'])");
    visibleRows.forEach((row, index) => {
      const name = row.querySelector(".home_hero_text");
      const tags = row.querySelectorAll(".home-category_ref_text:not([hidden])");
      
      if (name) {
        gsap.fromTo(name, {
          opacity: 0, x: -30, filter: "blur(4px)"
        }, {
          opacity: 1, x: 0, filter: "blur(0px)",
          duration: 0.5,
          ease: "power2.out",
          delay: index * 0.05
        });
      }
      
      if (tags.length) {
        gsap.fromTo(tags, {
          opacity: 0, x: 20
        }, {
          opacity: 1, x: 0,
          duration: 0.5,
          ease: "power2.out",
          delay: index * 0.05,
          stagger: 0.02
        });
      }
    });
  }, "-=0.2")
  
  // Awards strip
  .fromTo(".home-awards_list", {
    opacity: 0, y: 20, scale: 0.95
  }, {
    opacity: 1, y: 0, scale: 1,
    duration: 0.6,
    ease: "power3.out",
    delay: 0.3,
    onComplete: () => {
      // Clean up
      gsap.set([
        ".nav_wrap",
        ".brand_logo",
        ".nav_link",
        ".home-category_text",
        ".home_hero_text",
        ".home-category_ref_text",
        ".home-awards_list"
      ], {
        clearProps: "transform,filter"
      });
    }
  });
  
  return {
    timeline: tl,
    play: () => tl.play(),
    pause: () => tl.pause(),
    kill: () => tl.kill()
  };
}