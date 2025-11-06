<!-- Navbar session-->
<?php 

if (session_status() == PHP_SESSION_NONE) { session_start(); }

$current = basename($_SERVER['SCRIPT_NAME']);
$isLoggedIn = isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
$userName = $isLoggedIn ? $_SESSION['user_name'] : '';
?>


<nav class="navbar navbar-expand-md fixed-top border-bottom " style="z-index: 2000;">
  <div class="container">
    <a class="navbar-brand" id="<?= $current === 'home.php' ? 'navHome' : '' ?>" href="home.php">
      <img
        src="images/So Popped Logo.png"
        alt="So Popped Logo"
        width="50"
        height="50"
        class="d-inline-block align-text-center"
      />
    </a>

    <button
      class="navbar-toggler"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#navbarNavAltMarkup"
      aria-controls="navbarNavAltMarkup"
      aria-expanded="false"
      aria-label="Toggle navigation"
    >
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
      <div class="navbar-nav me-auto mb-2 mb-lg-0">
        <a class="nav-link <?= $current === 'home.php' ? 'active text-warning' : '' ?>" aria-current="page" href="home.php">Home</a>
        <a class="nav-link <?= $current === 'products.php' ? 'active text-warning' : '' ?>" href="products.php">Products</a>
  <a class="nav-link <?= $current === 'cart.php' ? 'active text-warning' : '' ?>" href="cart.php">Cart <span class="flavorCoutCart badge bg-warning rounded-pill ms-1">0</span></a>
        <a class="nav-link <?= $current === 'aboutUs.php' ? 'active text-warning' : '' ?>" href="aboutUs.php">About Us</a>
      </div>
      <form method="#" action="#" class="d-flex gap-2" role="search">
        <input
          class="form-control"
          type="search"
          placeholder="Search"
          aria-label="Search"
        />
        <button class="btn btn-outline-primary" type="submit">
          Search
        </button>
        <?php if ($isLoggedIn): ?>
          <div class="dropdown">
            <button
              class="btn btn-warning dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i class="bi bi-person-circle me-1"></i><?= htmlspecialchars($userName) ?>
            </button>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" href="#" onclick="logout()">Logout</a></li>
            </ul>
          </div>
        <?php else: ?>
          <button
            id="loginBtn"
            class="btn btn-warning"
            type="button"
          >
            <i class="bi bi-person-circle me-1"></i>Login
          </button>
        <?php endif; ?>
      </form>
    </div>
    
  </div>
</nav>

<!-- Navbar inline scripts moved to js/authDialogs.js -->
