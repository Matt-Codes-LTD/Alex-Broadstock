// transitions/stagger-calc.js - Stagger delay calculations with caching

// Cache for performance
const staggerCacheEnter = new Map();
const staggerCacheExit = new Map();

/**
 * Calculate stagger delay based on distance from center
 * @param {number} index - Cell index
 * @param {number} cols - Number of columns
 * @param {number} rows - Number of rows  
 * @param {boolean} reverse - Reverse animation (exit)
 * @returns {number} Delay in seconds
 */
export function calculateStaggerDelay(index, cols, rows, reverse = false) {
  const cache = reverse ? staggerCacheExit : staggerCacheEnter;
  
  // Return cached value if exists
  if (cache.has(index)) {
    return cache.get(index);
  }
  
  // Calculate position
  const row = Math.floor(index / cols);
  const col = index % cols;
  const centerCol = Math.floor(cols / 2);
  const centerRow = Math.floor(rows / 2);
  
  // Distance from center
  const distFromCenter = Math.sqrt(
    Math.pow(col - centerCol, 2) + 
    Math.pow(row - centerRow, 2)
  );
  
  // Max distance for normalization
  const maxDist = Math.sqrt(
    Math.pow(centerCol, 2) + 
    Math.pow(centerRow, 2)
  );
  
  // Calculate delay
  // Reverse: outer cells first (exit animation)
  // Normal: center cells first (enter animation)
  const delay = reverse 
    ? ((maxDist - distFromCenter) * 0.025) + (index * 0.0005)
    : (distFromCenter * 0.025) + (index * 0.0005);
  
  // Cache and return
  cache.set(index, delay);
  return delay;
}

/**
 * Clear stagger caches (useful for cleanup or recalculation)
 */
export function clearStaggerCache() {
  staggerCacheEnter.clear();
  staggerCacheExit.clear();
}

/**
 * Pre-calculate all delays for a grid
 * @param {number} cols - Number of columns
 * @param {number} rows - Number of rows
 */
export function precalculateStaggerDelays(cols, rows) {
  const total = cols * rows;
  for (let i = 0; i < total; i++) {
    calculateStaggerDelay(i, cols, rows, false); // Enter
    calculateStaggerDelay(i, cols, rows, true);  // Exit
  }
}