// blend-effect.js
export function initBlendEffect(section) {
  const items = section.querySelectorAll('.home-hero_list');
  
  items.forEach(item => {
    // Create blend bars container
    const barsContainer = document.createElement('div');
    barsContainer.className = 'home-hero_blend-bars';
    
    // Create staggered bars
    [3, 4, 5, 6, 7, 8, 10, 14, 18, 24].forEach(i => {
      const bar = document.createElement('div');
      bar.className = 'home-hero_blend-bar';
      bar.style.setProperty('--i', i);
      barsContainer.appendChild(bar);
    });
    
    // Insert after the link element
    const link = item.querySelector('.home-hero_link');
    if (link) {
      link.parentNode.insertBefore(barsContainer, link.nextSibling);
    }
    
    // Handle hover direction
    item.addEventListener('mouseenter', (e) => {
      const rect = item.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const direction = mouseX < rect.width / 2 ? 'left' : 'right';
      item.style.setProperty('--blend-direction', direction);
    });
    
    item.addEventListener('mouseleave', () => {
      item.style.setProperty('--blend-direction', 'right');
    });
  });
}