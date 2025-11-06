// Updates navbar cart badge on load and when cart changes
(function(){
  function updateBadge(count){
    const els = document.querySelectorAll('.flavorCoutCart');
    els.forEach(el => el.textContent = String(count || 0));
  }

  
  function refresh(){
    if (window.sopoppedCart && typeof window.sopoppedCart.getCount === 'function'){
      updateBadge(window.sopoppedCart.getCount());
    } else {
      try{ const items = JSON.parse(localStorage.getItem('sopopped_cart_v1')||'[]'); updateBadge(items.length); }catch(e){ updateBadge(0); }
    }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    refresh();
    document.addEventListener('cart-changed', (e)=>{
      const c = (e && e.detail && typeof e.detail.count === 'number') ? e.detail.count : null;
      if (c !== null) updateBadge(c); else refresh();
    });
  });

// js/cart-badge.js - Updated for session-based cart
async function updateCartBadgeCount() {
    try {
        const formData = new FormData();
        formData.append('action', 'get');

        const response = await fetch('api/cart_operations.php', {
            method: 'POST',
            body: formData
        });

        if (response.status === 401) {
            // User not logged in
            $('.flavorCoutCart').text('0');
            return;
        }

        const result = await response.json();
        
        if (result.success) {
            $('.flavorCoutCart').text(result.item_count);
        } else {
            $('.flavorCoutCart').text('0');
        }
    } catch (error) {
        console.error('Failed to update cart badge:', error);
        $('.flavorCoutCart').text('0');
    }
}

// Update badge on page load and when cart changes
$(document).ready(function() {
    updateCartBadgeCount();
    
    // Listen for custom cart update events
    $(document).on('cartUpdated', function() {
        updateCartBadgeCount();
    });
});

})();
