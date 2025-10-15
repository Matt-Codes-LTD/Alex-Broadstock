/**
 * Client Name Display Handler
 * Replaces category tags with client names when available
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
      clientDisplay.innerHTML = `
        <div class="home-category_ref_list u-flex-horizontal-nowrap u-gap-2 u-justify-content-end">
          <div class="home-category_ref_item u-alignment-end">
            <div class="home-category_ref_text u-text-style-main u-color-faded" data-client-name="true">
              ${clientName}
            </div>
          </div>
        </div>
      `;
      
      // Insert after the hidden category ref
      categoryRef.parentNode.insertBefore(clientDisplay, categoryRef.nextSibling);
      
      // Store reference for cleanup
      createdElements.push(clientDisplay);
    }
  });
  
  // Return cleanup function
  return () => {
    createdElements.forEach(el => el.remove());
  };
}