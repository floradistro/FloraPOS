import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Creating missing magic2 database tables via WordPress API...');

    // Make a direct call to WordPress to trigger table creation
    const wpResponse = await fetch('https://api.floradistro.com/wp-json/magic2/v1/create-tables', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.WP_API_TOKEN || '',
        'X-API-Key': process.env.WP_API_KEY || ''
      },
      body: JSON.stringify({
        force_create: true,
        tables: ['cost_history', 'locations', 'purchase_orders', 'suppliers']
      })
    });

    if (!wpResponse.ok) {
      // Fallback: Return SQL for manual execution
      const sql = `-- Magic2 Database Tables Creation SQL
-- Execute this in your WordPress database

-- 1. Create cost history table
CREATE TABLE IF NOT EXISTS \`avu_flora_im_cost_history\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`product_id\` int(11) NOT NULL,
  \`variation_id\` int(11) DEFAULT 0,
  \`location_id\` int(11) NOT NULL DEFAULT 21,
  \`cost_price\` decimal(10,2) NOT NULL DEFAULT 0.00,
  \`previous_cost\` decimal(10,2) DEFAULT NULL,
  \`cost_method\` varchar(50) DEFAULT 'manual',
  \`po_id\` int(11) DEFAULT NULL,
  \`supplier_id\` int(11) DEFAULT NULL,
  \`created_by\` int(11) DEFAULT NULL,
  \`effective_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`notes\` text DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`product_id\` (\`product_id\`),
  KEY \`location_id\` (\`location_id\`),
  KEY \`effective_date\` (\`effective_date\`),
  KEY \`product_location\` (\`product_id\`, \`location_id\`),
  KEY \`variation_id\` (\`variation_id\`),
  KEY \`supplier_id\` (\`supplier_id\`),
  KEY \`po_id\` (\`po_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create locations table
CREATE TABLE IF NOT EXISTS \`avu_flora_im_locations\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(255) NOT NULL,
  \`address\` text DEFAULT NULL,
  \`city\` varchar(100) DEFAULT NULL,
  \`state\` varchar(50) DEFAULT NULL,
  \`zip\` varchar(20) DEFAULT NULL,
  \`country\` varchar(50) DEFAULT 'US',
  \`phone\` varchar(50) DEFAULT NULL,
  \`email\` varchar(255) DEFAULT NULL,
  \`is_active\` tinyint(1) DEFAULT 1,
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`is_active\` (\`is_active\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create purchase orders table
CREATE TABLE IF NOT EXISTS \`avu_flora_im_purchase_orders\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`po_number\` varchar(100) NOT NULL,
  \`supplier_id\` int(11) DEFAULT NULL,
  \`location_id\` int(11) DEFAULT NULL,
  \`status\` varchar(50) DEFAULT 'draft',
  \`order_date\` date DEFAULT NULL,
  \`expected_date\` date DEFAULT NULL,
  \`received_date\` date DEFAULT NULL,
  \`total_amount\` decimal(10,2) DEFAULT NULL,
  \`notes\` text DEFAULT NULL,
  \`created_by\` int(11) DEFAULT NULL,
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`po_number\` (\`po_number\`),
  KEY \`supplier_id\` (\`supplier_id\`),
  KEY \`location_id\` (\`location_id\`),
  KEY \`status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create suppliers table
CREATE TABLE IF NOT EXISTS \`avu_flora_im_suppliers\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(255) NOT NULL,
  \`company\` varchar(255) DEFAULT NULL,
  \`email\` varchar(255) DEFAULT NULL,
  \`phone\` varchar(50) DEFAULT NULL,
  \`address\` text DEFAULT NULL,
  \`city\` varchar(100) DEFAULT NULL,
  \`state\` varchar(50) DEFAULT NULL,
  \`zip\` varchar(20) DEFAULT NULL,
  \`country\` varchar(50) DEFAULT 'US',
  \`tax_id\` varchar(50) DEFAULT NULL,
  \`payment_terms\` varchar(100) DEFAULT NULL,
  \`is_active\` tinyint(1) DEFAULT 1,
  \`notes\` text DEFAULT NULL,
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`is_active\` (\`is_active\`),
  KEY \`name\` (\`name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Insert default location (ID 21 that the error is looking for)
INSERT IGNORE INTO \`avu_flora_im_locations\` (\`id\`, \`name\`, \`is_active\`, \`created_at\`, \`updated_at\`) 
VALUES (21, 'Default Location', 1, NOW(), NOW());

-- 6. Insert default suppliers
INSERT IGNORE INTO \`avu_flora_im_suppliers\` (\`id\`, \`name\`, \`company\`, \`is_active\`, \`created_at\`, \`updated_at\`) VALUES 
(1, 'Supplier A', 'Company A Ltd', 1, NOW(), NOW()),
(2, 'Supplier B', 'Company B Inc', 1, NOW(), NOW()),
(3, 'Supplier C', 'Company C Corp', 1, NOW(), NOW()),
(4, 'Test Supplier', 'Test Company', 1, NOW(), NOW());`;

      return NextResponse.json({
        success: false,
        message: 'WordPress API not available. Use manual SQL execution.',
        sql: sql,
        instructions: [
          '1. Copy the SQL above',
          '2. Open phpMyAdmin or your database management tool',
          '3. Select your WordPress database (dbpm1080lhrpq2)',
          '4. Go to SQL tab and paste the SQL',
          '5. Execute the SQL to create all required tables',
          '6. The magic2 cost history should work after this'
        ],
        wp_error: 'Could not connect to WordPress API'
      });
    }

    const wpResult = await wpResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Magic2 database tables created successfully via WordPress API',
      wp_response: wpResult,
      tables_created: [
        'avu_flora_im_cost_history',
        'avu_flora_im_locations', 
        'avu_flora_im_purchase_orders',
        'avu_flora_im_suppliers'
      ]
    });

  } catch (error) {
    console.error('Error creating magic2 tables:', error);
    
    // Return SQL for manual execution as fallback
    const sql = `-- Emergency Magic2 Tables Creation
-- Run this SQL in your WordPress database to fix the cost history error

CREATE TABLE IF NOT EXISTS \`avu_flora_im_cost_history\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`product_id\` int(11) NOT NULL,
  \`variation_id\` int(11) DEFAULT 0,
  \`location_id\` int(11) NOT NULL DEFAULT 21,
  \`cost_price\` decimal(10,2) NOT NULL DEFAULT 0.00,
  \`previous_cost\` decimal(10,2) DEFAULT NULL,
  \`cost_method\` varchar(50) DEFAULT 'manual',
  \`po_id\` int(11) DEFAULT NULL,
  \`supplier_id\` int(11) DEFAULT NULL,
  \`created_by\` int(11) DEFAULT NULL,
  \`effective_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`notes\` text DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`product_id\` (\`product_id\`),
  KEY \`location_id\` (\`location_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`avu_flora_im_locations\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(255) NOT NULL,
  \`is_active\` tinyint(1) DEFAULT 1,
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO \`avu_flora_im_locations\` (\`id\`, \`name\`) VALUES (21, 'Default Location');`;

    return NextResponse.json({
      success: false,
      error: 'Failed to create tables via API',
      details: error instanceof Error ? error.message : 'Unknown error',
      fallback_sql: sql,
      instructions: [
        'EMERGENCY FIX:',
        '1. Copy the fallback_sql above',
        '2. Run it directly in your database',
        '3. This will create the minimum required tables'
      ]
    }, { status: 500 });
  }
}
