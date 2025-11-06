-- db/schema.sql
-- Schema for SoPopped application (MySQL / MariaDB compatible)
-- Includes tables: users, products, orders, order_items, contact_messages, sessions, audit_logs
-- Use a migration tool or run directly in a safe environment.

SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `sopopped` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `sopopped`;

-- Users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(100) NOT NULL DEFAULT '',
  `last_name` VARCHAR(100) NOT NULL DEFAULT '',
  `phone` VARCHAR(30) NOT NULL DEFAULT '',
  `role` ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  `is_archived` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Products table
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sku` VARCHAR(64) DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL DEFAULT '',
  `description` TEXT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 0,
  `image_path` VARCHAR(512) NOT NULL DEFAULT '',
  `is_active` TINYINT NOT NULL DEFAULT 1 COMMENT '1 = active, 0 = inactive',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_products_name` (`name`),
  UNIQUE KEY `uq_products_sku` (`sku`),
  CONSTRAINT `chk_products_price_nonneg` CHECK (`price` >= 0),
  CONSTRAINT `chk_products_quantity_nonneg` CHECK (`quantity` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Orders table
CREATE TABLE IF NOT EXISTS `orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NULL,
  `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('pending','paid','shipped','cancelled') NOT NULL DEFAULT 'pending',
  `payment_method` ENUM('cod','other') NOT NULL DEFAULT 'cod',
  `shipping_address` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_orders_user_id` (`user_id`),
  KEY `idx_orders_status` (`status`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_orders_total_nonneg` CHECK (`total_amount` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Order items table
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `price_at_purchase` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order_id` (`order_id`),
  KEY `idx_order_items_product_id` (`product_id`),
  CONSTRAINT `chk_order_items_quantity_positive` CHECK (`quantity` >= 1),
  CONSTRAINT `chk_order_items_price_nonneg` CHECK (`price_at_purchase` >= 0),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Contact messages table
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL DEFAULT '',
  `email` VARCHAR(255) NOT NULL DEFAULT '',
  `message` TEXT NOT NULL,
  `is_archived` TINYINT(1) NOT NULL DEFAULT 0,
  `archived_by` INT UNSIGNED NULL,
  `archived_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contact_archived` (`is_archived`),
  CONSTRAINT `fk_contact_archived_by_user` FOREIGN KEY (`archived_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Sessions / tokens table (for server-side sessions or JWT revocation)
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `token` VARCHAR(512) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sessions_token` (`token`(191)),
  KEY `idx_sessions_user_id` (`user_id`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Audit log table for admin/critical actions
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `actor_user_id` INT UNSIGNED NULL,
  `action` VARCHAR(100) NOT NULL,
  `resource_type` VARCHAR(50) NULL,
  `resource_id` VARCHAR(100) NULL,
  `details` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_actor` (`actor_user_id`),
  CONSTRAINT `fk_audit_actor_user` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- Seed: admin user (replace password_hash with real hash in production)
INSERT INTO `users` (`email`, `password_hash`, `first_name`, `last_name`, `phone`, `role`) VALUES
('admin@example.com', '$2y$10$EXAMPLEPASSWORDHASHSHOULDBEREPLACED', 'Admin', 'User', '', 'admin')
ON DUPLICATE KEY UPDATE `email` = `email`;

-- Sample product seed
INSERT INTO `products` (`sku`, `name`, `description`, `price`, `quantity`, `image_path`) VALUES
('P001','Sample Flavor','A sample flavor description', 9.99, 100, 'images/p1.png')
ON DUPLICATE KEY UPDATE `sku` = `sku`;

SET FOREIGN_KEY_CHECKS = 1;


