// assets/v1/sections/bts-overlay/grid.js

export function populateGrid(overlay, imageElements) {
  const container = overlay.querySelector('.bts-grid_container');
  if (!container) {
    console.warn('[BTSGrid] Grid container not found');
    return;
  }

  // Get valid image URLs (filter out placeholders and empty images)
  const validImages = Array.from(imageElements)
    .map(img => img.src)
    .filter(src => src && !src.includes('placeholder') && !src.includes('w-dyn-bind-empty'));

  if (validImages.length === 0) {
    console.warn('[BTSGrid] No valid images found');
    return;
  }

  console.log('[BTSGrid] Found', validImages.length, 'valid images');

  // Create 4 duplicate rows for seamless wrapping
  for (let row = 0; row < 4; row++) {
    const contentRow = document.createElement('div');
    contentRow.className = 'bts-grid_content';
    if (row > 0) {
      contentRow.setAttribute('aria-hidden', 'true');
    }

    // Add images to this row
    validImages.forEach(imageSrc => {
      const mediaDiv = document.createElement('div');
      mediaDiv.className = 'bts-grid_media';

      const img = document.createElement('img');
      img.src = imageSrc;
      img.alt = '';
      img.className = 'bts-grid_img';
      img.draggable = false;

      mediaDiv.appendChild(img);
      contentRow.appendChild(mediaDiv);
    });

    container.appendChild(contentRow);
  }

  console.log('[BTSGrid] Grid populated with 4 rows');
}

export function cleanupGrid(overlay) {
  const container = overlay.querySelector('.bts-grid_container');
  if (container) {
    container.innerHTML = '';
  }
}