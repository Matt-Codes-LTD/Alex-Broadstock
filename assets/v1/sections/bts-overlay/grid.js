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
  
  // Fill images to next complete row (no gaps!)
  const filledImages = fillToCompleteRows(validImages, imagesPerRow);
  
  console.log('[BTSGrid] Images per row:', imagesPerRow);
  console.log('[BTSGrid] Total images after filling:', filledImages.length);
  console.log('[BTSGrid] Complete rows:', filledImages.length / imagesPerRow);

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

  console.log('[BTSGrid] Grid populated with 4 complete rows - NO GAPS!');
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
 * Fill images to ensure complete rows with NO GAPS
 * Duplicates images cyclically to reach next multiple of imagesPerRow
 */
function fillToCompleteRows(images, imagesPerRow) {
  const currentCount = images.length;
  
  // Calculate how many images needed for complete rows
  const remainder = currentCount % imagesPerRow;
  
  // If already complete rows, return as-is
  if (remainder === 0) {
    return images;
  }
  
  // Calculate how many more images we need to complete the last row
  const needed = imagesPerRow - remainder;
  
  console.log('[BTSGrid] Need', needed, 'more images to complete rows');
  
  // Duplicate images cyclically to fill the gap
  const filled = [...images];
  let index = 0;
  
  for (let i = 0; i < needed; i++) {
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