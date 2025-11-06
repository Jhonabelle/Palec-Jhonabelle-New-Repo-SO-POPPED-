<?php

header('Content-Type: application/json; charset=utf-8');
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../db/sopoppedDB.php';

// Check if user is logged in
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Please log in to manage your cart']);
    exit;
}

$user_id = $_SESSION['user_id'];
$action = $_POST['action'] ?? '';

try {
    switch ($action) {
        case 'add':
            $product_id = (int)($_POST['product_id'] ?? 0);
            $quantity = (int)($_POST['quantity'] ?? 1);
            
            if ($product_id <= 0 || $quantity <= 0) {
                throw new Exception('Invalid product or quantity');
            }
            
            // Check if product exists and is in stock
            $stmt = $pdo->prepare('SELECT id, quantity FROM products WHERE id = ? AND is_active = 1');
            $stmt->execute([$product_id]);
            $product = $stmt->fetch();
            
            if (!$product) {
                throw new Exception('Product not found');
            }
            
            if ($product['quantity'] < $quantity) {
                throw new Exception('Insufficient stock');
            }
            
            // Check if item already exists in cart
            $stmt = $pdo->prepare('SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?');
            $stmt->execute([$user_id, $product_id]);
            $existing = $stmt->fetch();
            
            if ($existing) {
                // Update quantity
                $new_quantity = $existing['quantity'] + $quantity;
                $stmt = $pdo->prepare('UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?');
                $stmt->execute([$new_quantity, $user_id, $product_id]);
            } else {
                // Add new item
                $stmt = $pdo->prepare('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)');
                $stmt->execute([$user_id, $product_id, $quantity]);
            }
            
            echo json_encode(['success' => true, 'message' => 'Item added to cart']);
            break;
            
        case 'update':
            $product_id = (int)($_POST['product_id'] ?? 0);
            $quantity = (int)($_POST['quantity'] ?? 1);
            
            if ($product_id <= 0) {
                throw new Exception('Invalid product');
            }
            
            if ($quantity <= 0) {
                // Remove item if quantity is 0 or negative
                $stmt = $pdo->prepare('DELETE FROM cart WHERE user_id = ? AND product_id = ?');
                $stmt->execute([$user_id, $product_id]);
            } else {
              
                $stmt = $pdo->prepare('SELECT quantity FROM products WHERE id = ? AND is_active = 1');
                $stmt->execute([$product_id]);
                $product = $stmt->fetch();
                
                if (!$product) {
                    throw new Exception('Product not found');
                }
                
                if ($product['quantity'] < $quantity) {
                    throw new Exception('Insufficient stock');
                }
                
                // Update quantity
                $stmt = $pdo->prepare('UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?');
                $stmt->execute([$quantity, $user_id, $product_id]);
            }
            
            echo json_encode(['success' => true, 'message' => 'Cart updated']);
            break;
            
        case 'remove':
            $product_id = (int)($_POST['product_id'] ?? 0);
            
            if ($product_id <= 0) {
                throw new Exception('Invalid product');
            }
            
            $stmt = $pdo->prepare('DELETE FROM cart WHERE user_id = ? AND product_id = ?');
            $stmt->execute([$user_id, $product_id]);
            
            echo json_encode(['success' => true, 'message' => 'Item removed from cart']);
            break;
            
        case 'clear':
            $stmt = $pdo->prepare('DELETE FROM cart WHERE user_id = ?');
            $stmt->execute([$user_id]);
            
            echo json_encode(['success' => true, 'message' => 'Cart cleared']);
            break;
            
        case 'get':
            // Get cart contents with product details
            $stmt = $pdo->prepare('
                SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.image_path, p.quantity as stock 
                FROM cart c 
                JOIN products p ON c.product_id = p.id 
                WHERE c.user_id = ? AND p.is_active = 1
            ');
            $stmt->execute([$user_id]);
            $cart_items = $stmt->fetchAll();
            
            
            $total = 0;
            foreach ($cart_items as &$item) {
                $item['subtotal'] = $item['price'] * $item['quantity'];
                $total += $item['subtotal'];
                
                // Handle image path like in db_products.php
                $img = trim($item['image_path']);
                $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
                $origin = $scheme . '://' . $_SERVER['HTTP_HOST'];
                $projectBase = rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'])), '/\\');
                if ($projectBase === '' || $projectBase === '/') {
                    $projectBase = '/' . basename(dirname(__DIR__));
                }
                $projectBaseUrl = $origin . $projectBase . '/';
                
                if ($img !== '') {
                    if (preg_match('#^https?://#i', $img)) {
                        $item['image'] = $img;
                    } elseif (strpos($img, '/') === 0) {
                        $item['image'] = $origin . $projectBase . '/' . ltrim($img, '/\\');
                    } else {
                        $item['image'] = $projectBaseUrl . ltrim($img, '/\\');
                    }
                } else {
                    $item['image'] = $projectBaseUrl . 'images/image.png';
                }
            }
            
            echo json_encode([
                'success' => true, 
                'cart_items' => $cart_items, 
                'total' => number_format($total, 2),
                'item_count' => count($cart_items)
            ]);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>