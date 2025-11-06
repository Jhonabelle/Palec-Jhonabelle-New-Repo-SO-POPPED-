
document.addEventListener('DOMContentLoaded', () => {
  const modalEl = document.getElementById('productModal');
  if (!modalEl) return;

  const bsModal = new bootstrap.Modal(modalEl);

  // Utility to resolve relative image paths safely
  function resolveImagePath(path) {
    if (!path) return '';
    try {
      // If path is already absolute, return it
      if (/^https?:\/\//i.test(path)) return path;
      // Root-relative: prefix origin
      if (path.startsWith('/')) return new URL(path, window.location.origin).href;
      // Project-relative: resolve against current page URL so '/SoPopped/images/..' is preserved
      return new URL(path, window.location.href).href;
    } catch (err) {
      console.warn('[productModal] Invalid image path:', path, err);
      return '';
    }
  }

  function formatPrice(value) {
    const num = Number(value) || 0;
    return `$${num.toFixed(2)}`;
  }

  function openProduct(product) {
    const stock = typeof product.quantity !== 'undefined' ? Number(product.quantity) : 0;
    const isAvailable = stock > 0;

    // Update image
    const img = document.getElementById('pm-image');
    const rawPath = product.image || product.image_path || 'images/image.png';
    const resolvedSrc = resolveImagePath(rawPath);
    if (img) {
      console.debug('[productModal] openProduct', { id: product.id, rawPath, resolvedSrc });
      img.src = resolvedSrc;
      img.alt = product.name || 'Product';

      img.onerror = () => {
        const placeholder = resolveImagePath('images/image.png');
        if (img.src !== placeholder) {
          console.warn('[productModal] Image failed to load, using placeholder:', resolvedSrc);
          img.src = placeholder;
        }
      };
    }

    // Update text content
    document.getElementById('pm-name').textContent = product.name || '';
    document.getElementById('pm-desc').textContent = product.description || '';
    document.getElementById('pm-price').textContent = formatPrice(product.price);

    // Update quantity input
    const qtyInput = document.getElementById('pm-qty');
    qtyInput.value = isAvailable ? 1 : 0;
    qtyInput.min = '1';
    qtyInput.max = String(Math.max(0, stock));
    qtyInput.setAttribute('data-stock', String(stock));

    // Update stock count
    const stockCountEl = document.getElementById('pm-stock-count');
    if (stockCountEl) stockCountEl.textContent = String(stock);

    // Toggle buttons
    const addBtn = document.getElementById('pm-add-cart');
    const buyBtn = document.getElementById('pm-buy-now');
    if (addBtn) addBtn.toggleAttribute('disabled', !isAvailable);
    if (buyBtn) buyBtn.toggleAttribute('disabled', !isAvailable);

    // Store ID for cart handlers - set data attribute on the button
    if (addBtn) addBtn.setAttribute('data-product-id', String(product.id));
    if (buyBtn) buyBtn.setAttribute('data-product-id', String(product.id));
    
    modalEl.dataset.productId = String(product.id);
    bsModal.show();
  }

  // Quantity controls
  const qtyInput = document.getElementById('pm-qty');
  const increaseBtn = document.getElementById('pm-qty-increase');
  const decreaseBtn = document.getElementById('pm-qty-decrease');

  if (increaseBtn) {
    increaseBtn.addEventListener('click', () => {
      const stock = Number(qtyInput.getAttribute('data-stock') || 0);
      if (stock <= 0) return;
      const current = Number(qtyInput.value) || 0;
      qtyInput.value = Math.min(current + 1, stock);
    });
  }

  if (decreaseBtn) {
    decreaseBtn.addEventListener('click', () => {
      const stock = Number(qtyInput.getAttribute('data-stock') || 0);
      if (stock <= 0) {
        qtyInput.value = 0;
        return;
      }
      const current = Number(qtyInput.value) || 1;
      qtyInput.value = Math.max(1, current - 1);
    });
  }

  if (qtyInput) {
    qtyInput.addEventListener('input', (e) => {
      let val = Number(e.target.value);
      const stock = Number(qtyInput.getAttribute('data-stock') || 0);

      if (stock <= 0) {
        e.target.value = 0;
        return;
      }

      if (isNaN(val) || val < 1) val = 1;
      if (val > stock) val = stock;
      e.target.value = val;
    });
  }

  // Cart actions using the new session-based cart system
  async function addToCart(productId, quantity) {
    try {
      const formData = new FormData();
      formData.append('action', 'add');
      formData.append('product_id', productId);
      formData.append('quantity', quantity);

      const response = await fetch('api/cart_operations.php', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Show success message
        showCartMessage(result.message, 'success');
        
        // Update cart badge
        if (typeof updateCartBadgeCount === 'function') {
          updateCartBadgeCount();
        }
        
        // Trigger cart update event
        $(document).trigger('cartUpdated');
      } else {
        showCartMessage(result.error, 'error');
        
        // If not logged in, show login dialog
        if (response.status === 401) {
          $('#loginDialog').dialog('open');
        }
      }
    } catch (error) {
      console.error('Add to cart failed:', error);
      showCartMessage('An error occurred. Please try again.', 'error');
    }
  }

  function showCartMessage(message, type) {
    // Create a temporary message display
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    const alert = $(`<div class="alert ${alertClass} alert-dismissible fade show position-fixed" style="top: 100px; right: 20px; z-index: 9999;" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`);
    
    $('body').append(alert);
    
    setTimeout(() => {
      alert.alert('close');
    }, 3000);
  }

  // Add to cart button handler
  const addCartBtn = document.getElementById('pm-add-cart');
  if (addCartBtn) {
    addCartBtn.addEventListener('click', () => {
      const productId = addCartBtn.getAttribute('data-product-id');
      const quantity = Number(qtyInput?.value) || 1;
      
      if (productId) {
        addToCart(productId, quantity);
        bsModal.hide();
      }
    });
  }

  // Buy now button handler
  const buyNowBtn = document.getElementById('pm-buy-now');
  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      const productId = buyNowBtn.getAttribute('data-product-id');
      const quantity = Number(qtyInput?.value) || 1;
      
      if (productId) {
        addToCart(productId, quantity).then(() => {
          // Redirect to cart page after adding
          window.location.href = 'cart.php';
        });
        bsModal.hide();
      }
    });
  }

  // Click delegation for product cards
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.product-card');
    if (!card) return;

    const productId = card.dataset.productId;
    if (!productId) {
      console.warn('[productModal] Product card missing data-product-id');
      return;
    }

    const allProducts = window.__sopopped_products || [];
    const product = allProducts.find(p => String(p.id) === productId);

    if (product) {
      openProduct(product);
    } else {
      console.error(`[productModal] Product not found with ID: ${productId}`);
    }
  });
});