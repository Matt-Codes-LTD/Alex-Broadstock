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

  // Calculate how many images per row based on screen size
  const imagesPerRow = getImagesPerRow();
  
  // Ensure we have enough images to fill at least one complete row
  // If not enough, duplicate the images cyclically
  const minImagesNeeded = imagesPerRow;
  const filledImages = fillToMinimum(validImages, minImagesNeeded);
  
  console.log('[BTSGrid] Images per row:', imagesPerRow);
  console.log('[BTSGrid] Using', filledImages.length, 'images (duplicated if needed)');

  // Create 4 duplicate rows for seamless wrapping
  for (let row = 0; row < 4; row++) {
    const contentRow = document.createElement('div');
    contentRow.className = 'bts-grid_content';
    if (row > 0) {
      contentRow.setAttribute('aria-hidden', 'true');
    }

    // Add images to this row
    filledImages.forEach(imageSrc => {
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

  console.log('[BTSGrid] Grid populated with 4 complete rows');
}

/**
 * Determine how many images per row based on viewport
 */
function getImagesPerRow() {
  const width = window.innerWidth;
  
  if (width <= 767) {
    return 3; // Mobile: 3 items per row
  } else if (width <= 991) {
    return 4; // Tablet: 4 items per row
  } else {
    return 5; // Desktop: 5 items per row
  }
}

/**
 * Fill images array to minimum needed by duplicating cyclically
 * Ensures complete rows with no gaps
 */
function fillToMinimum(images, minNeeded) {
  if (images.length >= minNeeded) {
    return images;
  }
  
  // Duplicate images cyclically until we have enough
  const filled = [...images];
  let index = 0;
  
  while (filled.length < minNeeded) {
    filled.push(images[index % images.length]);
    index++;
  }
  
  return filled;
}

export function cleanupGrid(overlay) {
  const container = overlay.querySelector('.bts-grid_container');
  if (container) {
    container.innerHTML = '';
  }
}