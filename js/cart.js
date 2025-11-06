
document.addEventListener('DOMContentLoaded', () => {
  const CART_KEY = 'sopopped_cart_v1';
  const cartList = document.getElementById('cart-items');
  const emptyCard = document.querySelector('.emptyCart');
  const cartSummaryBlock = document.getElementById('cart-summary');
  const cartSummaryCol = document.getElementById('cart-summary-col');
  const billingFormCol = document.getElementById('billing-col');
  const hasCartDom = Boolean(cartList);

  function readCart(){
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch(e){ return []; }
  }

  function writeCart(items){
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }

  function findItem(items, id){
    return items.find(i => String(i.id) === String(id));
  }

  function render(){
    const items = readCart();
    if (hasCartDom) cartList.innerHTML = '';
    if (!items.length){
      // show empty message
      if (emptyCard) emptyCard.classList.remove('d-none');
      if (cartSummaryBlock) cartSummaryBlock.classList.add('d-none');
      if (cartSummaryCol) cartSummaryCol.classList.add('d-none');
      if (billingFormCol) billingFormCol.classList.add('d-none');
      const countEl = document.querySelector('.flavorCoutCart'); if (countEl) countEl.textContent = '0';
      // dispatch event so other UI can react
      try{ document.dispatchEvent(new CustomEvent('cart-changed', { detail: { count: 0, total: 0 } })); }catch(e){}
      return;
    }

  if (emptyCard) emptyCard.classList.add('d-none');
  if (cartSummaryBlock) cartSummaryBlock.classList.remove('d-none');
  if (cartSummaryCol) cartSummaryCol.classList.remove('d-none');
  if (billingFormCol) billingFormCol.classList.remove('d-none');

    let total = 0;
    items.forEach(prod => {
      const li = document.createElement('li');
  
  li.className = 'list-group-item lh-sm py-3';
      li.dataset.productId = prod.id;
      li.dataset.price = prod.price;
      li.innerHTML = `
      <div class="row align-items-center gx-3">
            <div class="col-12 col-md-7">
                <h6 class="my-0 cart-prod-name" title="${escapeHtml(prod.name)}">${escapeHtml(prod.name)}</h6>
                <small class="text-body-secondary d-block cart-prod-desc text-truncate" style="max-width: 100%; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(prod.description || '')}</small>
            </div>
            <div class="col-12 col-md-5">
                <div class="d-flex justify-content-md-end align-items-center gap-3 mt-2 mt-md-0">
                <div class="input-group input-group-sm cart-qty-group flex-shrink-0" style="width: fit-content; max-width: 120px;">
                    <button class="btn btn-outline-secondary btn-decrease" type="button">-</button>
                    <input type="number" class="form-control text-center item-qty" value="${prod.qty}" min="1" style="width: 50px;" />
                    <button class="btn btn-outline-secondary btn-increase" type="button">+</button>
                </div>
                <div class="text-end flex-shrink-0">
                    <div class="small text-muted">Subtotal</div>
                    <div class="fw-bold item-subtotal">$${(prod.price * prod.qty).toFixed(2)}</div>
                </div>
                <button class="btn btn-sm btn-link text-danger btn-remove flex-shrink-0" type="button">Remove</button>
                </div>
            </div>
        </div>
      `;
      if (hasCartDom) cartList.appendChild(li);
      total += prod.price * prod.qty;
    });

    const totalEl = document.getElementById('cart-total');
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    const countEl = document.querySelector('.flavorCoutCart'); if (countEl) countEl.textContent = String(items.length);
    
    try{ document.dispatchEvent(new CustomEvent('cart-changed', { detail: { count: items.length, total } })); }catch(e){}
  }

  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, (c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  
  window.sopoppedCart = {
    add(product){
      // Enforce UI-level stock sanity: consult loaded products if available
      const all = window.__sopopped_products || [];
      const prodMeta = all.find(p => String(p.id) === String(product.id));
      const requested = Math.max(1, Number(product.qty || 1));
      const items = readCart();
      const existing = findItem(items, product.id);

      const available = prodMeta ? Number(prodMeta.quantity || 0) : Infinity;

      if (existing) {
        const newQty = Math.min(available, existing.qty + requested);
        if (newQty === existing.qty) {
          // nothing changed — show message
          const msgEl = document.querySelector('#validate-msg');
          if (msgEl) { msgEl.classList.remove('d-none'); msgEl.textContent = 'Cannot add more items than available in stock.'; }
          else alert('Cannot add more items than available in stock.');
        } else {
          existing.qty = newQty;
        }
      } else {
        const initial = Math.min(available, requested);
        if (initial <= 0) {
          const msgEl = document.querySelector('#validate-msg');
          if (msgEl) { msgEl.classList.remove('d-none'); msgEl.textContent = 'This product is out of stock.'; }
          else alert('This product is out of stock.');
          return;
        }
        items.push({ id: product.id, name: product.name, description: product.description||'', price: Number(product.price||0), qty: initial });
      }
      writeCart(items); render();
    },
    remove(id){
      let items = readCart(); items = items.filter(i => String(i.id) !== String(id)); writeCart(items); render();
    },
    setQty(id, qty){
      const items = readCart(); const it = findItem(items, id);
      if (!it) return;
      const desired = Math.max(1, Number(qty) || 1);
      const all = window.__sopopped_products || [];
      const prodMeta = all.find(p => String(p.id) === String(id));
      const available = prodMeta ? Number(prodMeta.quantity || 0) : Infinity;
      it.qty = Math.min(desired, available);
      writeCart(items); render();
    },
    clear(){ localStorage.removeItem(CART_KEY); render(); },
    getCount(){ return readCart().length; }
  };

  // Delegate clicks on cart list (only attach if cart DOM exists)
  if (hasCartDom) {
    cartList.addEventListener('click', (e)=>{
      const inc = e.target.closest('.btn-increase');
      const dec = e.target.closest('.btn-decrease');
      const rem = e.target.closest('.btn-remove');
      if (inc){ const li = inc.closest('li'); const id = li.dataset.productId; const items = readCart(); const it = findItem(items,id); if (it){ it.qty++; writeCart(items); render(); } }
      if (dec){ const li = dec.closest('li'); const id = li.dataset.productId; const items = readCart(); const it = findItem(items,id); if (it){ it.qty = Math.max(1,it.qty-1); writeCart(items); render(); } }
      if (rem){ const li = rem.closest('li'); const id = li.dataset.productId; window.sopoppedCart.remove(id); }
    });

    // manual qty change
    cartList.addEventListener('change', (e)=>{
      if (e.target.classList.contains('item-qty')){
        const li = e.target.closest('li'); const id = li.dataset.productId; window.sopoppedCart.setQty(id, e.target.value);
      }
    });
  }

  // initialize
  render();

  
class CartManager {
    constructor() {
        this.init();

         $(document).ready(() => {
        this.loadCart();
    });
    }

   
    init() {
        this.loadCart();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add to cart buttons
        $(document).on('click', '.add-to-cart-btn', (e) => {
            e.preventDefault();
            this.addToCart(e.target);
        });

        // Product modal add to cart
        $(document).on('click', '#pm-add-cart', () => {
            this.addFromModal();
        });

        // Update cart quantities
        $(document).on('change', '.cart-item-quantity', (e) => {
            this.updateQuantity(e.target);
        });

        // Remove cart items
        $(document).on('click', '.remove-cart-item', (e) => {
            this.removeItem(e.target);
        });

        // Clear cart
        $(document).on('click', '#clear-cart', () => {
            this.clearCart();
        });
    }

    async addToCart(button) {
        const productId = $(button).data('product-id');
        const quantity = 1;

        await this.performCartAction('add', {
            product_id: productId,
            quantity: quantity
        });
    }

    async addFromModal() {
        const productId = $('#pm-add-cart').data('product-id');
        const quantity = parseInt($('#pm-qty').val()) || 1;

        await this.performCartAction('add', {
            product_id: productId,
            quantity: quantity
        });
        
        // Close modal after adding
        $('#productModal').modal('hide');
    }

    async updateQuantity(input) {
        const productId = $(input).data('product-id');
        const quantity = parseInt($(input).val()) || 0;

        await this.performCartAction('update', {
            product_id: productId,
            quantity: quantity
        });
    }

    async removeItem(button) {
        const productId = $(button).data('product-id');
        
        await this.performCartAction('remove', {
            product_id: productId
        });
    }

    async clearCart() {
        if (confirm('Are you sure you want to clear your cart?')) {
            await this.performCartAction('clear', {});
        }
    }

    async performCartAction(action, data) {
        try {
            const formData = new FormData();
            formData.append('action', action);
            
            for (const key in data) {
                formData.append(key, data[key]);
            }

            const response = await fetch('api/cart_operations.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                await this.loadCart();
                this.showMessage(result.message, 'success');
                
                // Update cart badge
                this.updateCartBadge();
            } else {
                this.showMessage(result.error, 'error');
                
                // If not logged in, show login dialog
                if (response.status === 401) {
                    $('#loginDialog').dialog('open');
                }
            }
        } catch (error) {
            console.error('Cart operation failed:', error);
            this.showMessage('An error occurred. Please try again.', 'error');
        }
    }

    async loadCart() {
        try {
            const formData = new FormData();
            formData.append('action', 'get');

            const response = await fetch('api/cart_operations.php', {
                method: 'POST',
                body: formData
            });

            if (response.status === 401) {
                // User not logged in
                this.displayEmptyCart();
                return;
            }

            const result = await response.json();

            if (result.success) {
                this.displayCart(result.cart_items, result.total, result.item_count);
            } else {
                this.displayEmptyCart();
            }
        } catch (error) {
            console.error('Failed to load cart:', error);
            this.displayEmptyCart();
        }
    }

    
displayCart(items, total, itemCount) {
    const cartContent = $('#cart-content');
    const emptyCartMessage = $('#empty-cart-message');
    const cartItemsContainer = $('#cart-items-container');

    if (items.length === 0) {
        this.displayEmptyCart();
        return;
    }

    // Show cart content, hide empty message
    cartContent.removeClass('d-none');
    emptyCartMessage.addClass('d-none');

    let html = '';

    items.forEach(item => {
        html += `
            <div class="cart-item mb-3 pb-3 border-bottom">
                <div class="row align-items-center">
                    <div class="col-3 col-md-2">
                        <img src="${item.image}" alt="${item.name}" class="img-fluid rounded">
                    </div>
                    <div class="col-5 col-md-6">
                        <h6 class="mb-1">${item.name}</h6>
                        <p class="mb-1 text-muted">$${parseFloat(item.price).toFixed(2)}</p>
                        <small class="text-muted">Stock: ${item.stock}</small>
                    </div>
                    <div class="col-4 col-md-4">
                        <div class="input-group input-group-sm">
                            <input type="number" 
                                   class="form-control cart-item-quantity" 
                                   value="${item.quantity}" 
                                   min="1" 
                                   max="${item.stock}"
                                   data-product-id="${item.product_id}">
                            <button class="btn btn-outline-danger remove-cart-item" 
                                    type="button"
                                    data-product-id="${item.product_id}">
                                ×
                            </button>
                        </div>
                        <div class="mt-1 text-end">
                            <strong>$${parseFloat(item.subtotal).toFixed(2)}</strong>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    // Add cart summary
    html += `
        <div class="row mt-4">
            <div class="col-12">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4>Total: $${total}</h4>
                  
                </div>
                <div class="text-center">
                    <button id="clear-cart" class="btn btn-outline-danger btn-sm">Clear Cart</button>
                </div>
            </div>
        </div>
    `;

    cartItemsContainer.html(html);
    
    // Update cart badge
    $('.flavorCoutCart').text(itemCount);
    
    // Set cart items for checkout form
    $('#cart_items_input').val(JSON.stringify(items));
}

displayEmptyCart() {
    const cartContent = $('#cart-content');
    const emptyCartMessage = $('#empty-cart-message');
    
    // Hide cart content, show empty message
    cartContent.addClass('d-none');
    emptyCartMessage.removeClass('d-none');
    
    // Update cart badge
    $('.flavorCoutCart').text('0');
}

    updateCartBadge() {
        // This will be handled by cart-badge.js
        if (typeof updateCartBadgeCount === 'function') {
            updateCartBadgeCount();
        }
    }

    showMessage(message, type) {
        const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
        const alert = $(`<div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>`);
        
        $('#cart-messages').html(alert);
        
        setTimeout(() => {
            alert.alert('close');
        }, 5000);
    }
}

// Initialize cart manager when document is ready
$(document).ready(function() {
    window.cartManager = new CartManager();
});

// Checkout function
function checkout() {
    window.location.href = 'checkout.php';
}

});
