/**
 * Client Name Display Handler
 * Replaces category tags with client names when available
 * Fixed: Prevents FOUC by starting with opacity: 0
 */

export function initClientNames(section) {
  const items = section.querySelectorAll('.home-hero_list');
  const createdElements = [];
  
  items.forEach(item => {
    const clientNameEl = item.querySelector('.project-client_name');
    const categoryRef = item.querySelector('.home-category_ref');
    
    if (!clientNameEl || !categoryRef) return;
    
    const clientName = clientNameEl.textContent.trim();
    
    // If client name exists and isn't empty
    if (clientName && !clientNameEl.classList.contains('w-dyn-bind-empty')) {
      // Hide the category tags
      categoryRef.style.display = 'none';
      
      // Create client name display element
      const clientDisplay = document.createElement('div');
      clientDisplay.className = 'home-category_ref u-column-start-3 u-column-1';
      
      // Create the inner structure
      const listDiv = document.createElement('div');
      listDiv.className = 'home-category_ref_list u-flex-horizontal-nowrap u-gap-2 u-justify-content-end';
      
      const itemDiv = document.createElement('div');
      itemDiv.className = 'home-category_ref_item u-alignment-end';
      
      const textDiv = document.createElement('div');
      textDiv.className = 'home-category_ref_text u-text-style-main u-color-faded';
      textDiv.setAttribute('data-client-name', 'true');
      textDiv.textContent = clientName;
      
      // CRITICAL: Start with opacity 0 to prevent FOUC
      // The existing animation system will handle revealing it
      textDiv.style.opacity = '0';
      
      // Build the structure
      itemDiv.appendChild(textDiv);
      listDiv.appendChild(itemDiv);
      clientDisplay.appendChild(listDiv);
      
      // Insert after the hidden category ref
      categoryRef.parentNode.insertBefore(clientDisplay, categoryRef.nextSibling);
      
      // Store reference for cleanup
      createdElements.push(clientDisplay);
      
      // Log for debugging
      console.log(`[ClientNames] Created display for: ${clientName}`);
    }
  });
  
  console.log(`[ClientNames] Initialized ${createdElements.length} client name displays`);
  
  // Return cleanup function
  return () => {
    createdElements.forEach(el => el.remove());
    console.log('[ClientNames] Cleaned up client name displays');
  };
}