<?php
// Bootstrap product modal component
?>
<div class="modal fade" id="productModal" tabindex="-1" aria-labelledby="productModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down modal-lg-7col">
    <div class="modal-content rounded-5">
      <div class="modal-header border-0">
        <h2 class="modal-title text-white" id="productModalLabel">Flavor</h2>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <div class="container-fluid">
          <div class="row g-3 align-items-center">
            <div class="col-12 col-md-6 d-flex align-items-center justify-content-center py-2">
              <img id="pm-image" src="" alt="Product image" class="img-fluid rounded-4" style="max-height:420px; object-fit:contain;  border: 1px solid #fff;" />
            </div>
            <div class="col-12 col-md-6 py-2">
              <h3 id="pm-name" class="fw-bold text-white"></h3>
              <p id="pm-desc" class=" small text-white"></p>
              <p id="pm-stock" class="small text-white mb-2">In stock: <span id="pm-stock-count">0</span></p>
              <div class="mb-3">
                <span class="h4 text-warning fw-bold" id="pm-price">$0.00</span>
              </div>

              <div class="d-flex align-items-center mb-3">
                <label class="me-3 mb-0 text-white">Quantity</label>
                <div class="input-group" style="width:140px;">
                  <button class="btn btn-primary" type="button" id="pm-qty-decrease" aria-label="Decrease quantity">-</button>
                  <input type="number" id="pm-qty" class="form-control text-center" value="1" min="1" />
                  <button class="btn btn-primary" type="button" id="pm-qty-increase" aria-label="Increase quantity">+</button>
                </div>
              </div>

              <div class="d-flex gap-2 flex-column flex-sm-row">
                <button id="pm-add-cart" class="btn btn-primary w-100 w-sm-auto" data-product-id="">Add to cart</button>
                <button id="pm-buy-now" class="btn btn-primary w-100 w-sm-auto" data-product-id="">Buy now</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer border-0"></div>
    </div>
  </div>
</div>
