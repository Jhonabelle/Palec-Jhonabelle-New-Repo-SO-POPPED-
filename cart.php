
<?php

session_start();
echo "<!-- DEBUG INFO -->";
echo "<!-- Logged in: " . (isset($_SESSION['logged_in']) ? 'YES' : 'NO') . " -->";
echo "<!-- User ID: " . (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 'NONE') . " -->";
echo "<!-- User Email: " . (isset($_SESSION['user_email']) ? $_SESSION['user_email'] : 'NONE') . " -->";
echo "<!-- Debug: logged_in = " . (isset($_SESSION['logged_in']) ? 'true' : 'false') . " -->";
echo "<!-- Debug: user_id = " . (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 'none') . " -->";
include_once 'components/navbar.php';
?>


<meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cart</title>
    <link rel="stylesheet" href="./node_modules/bootstrap/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="./styles.css" />

<!-- HTML FILE -->
<main>
        
        
    <div class="container mt-5 pt-5"> 
        <div class="text-center cart border-bottom pb-5">
            <img
                src="images/cart.png"
                alt="So Popped Logo"
                width="80"
                height="80"
                class="d-inline-block align-text-center"
            />
            <h1 class="display-4 mt-2">Your Cart</h1>
        </div>

        <!-- Cart Messages -->
        <div id="cart-messages" class="mt-3"></div>

        <!-- Cart Content (initially hidden) -->
        <div id="cart-content" class="d-none">
            <div class="row g-5 mt-1 d-flex justify-content-center">
                <!-- Cart Items Column -->
                <div class="col-lg-7">
                    <h2 class="d-flex justify-content-between align-items-center mb-3">
                        <span class="text-warning">Flavors</span>
                        <span class="flavorCoutCart badge bg-warning rounded-pill">0</span>
                    </h2>
                    <div id="cart-items-container">
                        <!-- Cart items will be loaded here -->
                    </div>
                </div>

                <!-- Billing Form Column -->
                <div class="col-lg-5">
                    <h4 class="mb-3 text-warning">Billing address</h4>
                    <form method="POST" action="./api/checkout_submit.php" id="checkoutForm" class="needs-validation" novalidate>
                        <div class="row g-3">
                            <div class="col-sm-6">
                                <label for="firstName" class="form-label">First name</label>
                                <input type="text" class="form-control" id="firstName" name="firstName" required/>
                            </div>
                            <div class="col-sm-6">
                                <label for="lastName" class="form-label">Last name</label>
                                <input type="text" class="form-control" id="lastName" name="lastName" required/>
                            </div>
                            <div class="col-12">
                                <label for="email" class="form-label">Email</label>
                                <input type="email" class="form-control" id="email" name="email" placeholder="sopopped@example.com" required/>
                            </div>
                            <div class="col-12">
                                <label for="address" class="form-label">Address</label>
                                <input type="text" class="form-control" id="address" name="address" placeholder="1234 Main St" required/>
                            </div>
                            <div class="col-md-5">
                                <label for="province" class="form-label">Province</label>
                                <select class="form-select" id="province" name="province" required>
                                    <option value="">Choose...</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label for="city" class="form-label">City / Municipality</label>
                                <select class="form-select" id="city" name="city" required disabled>
                                    <option value="">Choose...</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label for="barangay" class="form-label">Barangay</label>
                                <select class="form-select" id="barangay" name="barangay" required disabled>
                                    <option value="">Choose...</option>
                                </select>
                            </div>
                        </div>
                        
                        <h4 class="mb-3 mt-3">Payment</h4>
                        <div class="my-3">
                            <div class="form-check">
                                <input id="cod" name="paymentMethod" type="radio" value="cod" class="form-check-input" checked required />
                                <label class="form-check-label" for="cod">COD</label>
                            </div>
                        </div>
                        
                        <hr class="my-4"/>
                        <input type="hidden" name="cart_items" id="cart_items_input" value="" />
                        <button class="w-100 btn btn-primary btn-lg" type="submit">Checkout</button>
                    </form>
                </div>
            </div>
        </div>

        <!-- Empty Cart Message (shown by default) -->
        <div id="empty-cart-message" class="row mt-4">
            <div class="col-12 d-flex justify-content-center">
                <div class="emptyCart p-4 text-center border-secondary-subtle border rounded-3 col-12 col-md-8 col-lg-6">
                    <h2 class="pt-3 text-primary">Cart's Empty</h2>
                    <p class="lead text-body-secondary">
                        Looks like you haven't added any flavors to your cart yet.
                        Explore our products and find your next favorite flavor!
                    </p>
                    <div class="d-grid gap-2 col-6 mx-auto">
                        <a class="btn btn-warning" href="products.php" role="button">Shop Now</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>


<script>
$(document).ready(function() {
    console.log('Cart page loaded');
    
    // Check if cart manager is working
    if (window.cartManager) {
        console.log('Cart manager found');
    } else {
        console.error('Cart manager not found');
    }
    
    // Force reload cart after 1 second
    setTimeout(() => {
        if (window.cartManager && window.cartManager.loadCart) {
            console.log('Forcing cart reload...');
            window.cartManager.loadCart();
        }
    }, 1000);
});
</script>

<!-- In cart.php footer section -->
<script src="./node_modules/jquery/dist/jquery.min.js"></script>
<script src="./node_modules/jquery-validation/dist/jquery.validate.min.js"></script>
<script src="./node_modules/jquery-validation/dist/additional-methods.min.js"></script>
<script src="./node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"></script>
<script src="./js/loadComponents.js"></script>
<script src="./js/countryState.js"></script>
<script src="./js/cart-badge.js"></script> <!-- Load before cart.js -->
<script src="./js/cart.js"></script> <!-- Main cart functionality -->
<script src="./js/cartPrefetch.js"></script>
<script src="./js/authDialogs.js"></script>
<link rel="stylesheet" href="dist/styles.css" />