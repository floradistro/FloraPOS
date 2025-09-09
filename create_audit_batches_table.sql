-- Create the audit_batches table for Flora IM
CREATE TABLE `avu_flora_im_audit_batches` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `audit_number` varchar(50) NOT NULL,
  `batch_name` varchar(255) NOT NULL,
  `batch_description` text,
  `location_id` int(11) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `status` enum('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  `total_products` int(11) DEFAULT 0,
  `total_adjustments` int(11) DEFAULT 0,
  `total_increased` int(11) DEFAULT 0,
  `total_decreased` int(11) DEFAULT 0,
  `net_change` decimal(10,4) DEFAULT 0,
  `started_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `audit_number` (`audit_number`),
  KEY `location_id` (`location_id`),
  KEY `user_id` (`user_id`),
  KEY `status` (`status`),
  KEY `created_at` (`created_at`),
  FOREIGN KEY (`location_id`) REFERENCES `avu_flora_im_locations`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add batch_id column to existing audit_log table
ALTER TABLE `avu_flora_im_audit_log` ADD COLUMN `batch_id` bigint(20) NULL AFTER `details`;
ALTER TABLE `avu_flora_im_audit_log` ADD INDEX `batch_id` (`batch_id`);
-- Note: Foreign key constraint will be added after both tables exist
