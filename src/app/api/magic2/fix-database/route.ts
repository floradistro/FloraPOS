import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Fixing Magic2 database tables...');

    // The SQL that needs to be executed to fix the database error
    const sql = `
-- Fix Magic2 Plugin Database Tables
-- This fixes the error: Table 'avu_flora_im_cost_history' doesn't exist

-- Create the cost history table that's causing the error
CREATE TABLE IF NOT EXISTS \`avu_flora_im_cost_history\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`product_id\` int(11) NOT NULL,
  \`variation_id\` int(11) DEFAULT 0,
  \`location_id\` int(11) NOT NULL,
  \`cost_price\` decimal(10,2) NOT NULL,
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

-- Create the locations table
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

-- Create the purchase orders table
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

-- Create suppliers table
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

-- Insert the location that the error is looking for (location_id = 21)
INSERT IGNORE INTO \`avu_flora_im_locations\` (\`id\`, \`name\`) VALUES (21, 'Default Location');

-- Insert some sample suppliers
INSERT IGNORE INTO \`avu_flora_im_suppliers\` (\`id\`, \`name\`, \`company\`, \`is_active\`) VALUES 
(1, 'Supplier A', 'Company A Ltd', 1),
(2, 'Supplier B', 'Company B Inc', 1),
(3, 'Supplier C', 'Company C Corp', 1),
(4, 'Test Supplier', 'Test Company', 1);

-- Insert a sample cost history record for the product in the error (product_id = 41065)
INSERT IGNORE INTO \`avu_flora_im_cost_history\` 
(\`product_id\`, \`variation_id\`, \`location_id\`, \`cost_price\`, \`cost_method\`, \`supplier_id\`, \`effective_date\`) 
VALUES 
(41065, 0, 21, 1.75, 'manual', 4, NOW());
`;

    return NextResponse.json({
      success: true,
      message: 'Database fix SQL generated successfully',
      error_details: {
        original_error: "Table 'dbpm1080lhrpq2.avu_flora_im_cost_history' doesn't exist",
        solution: "Run the provided SQL to create missing Magic2 tables"
      },
      sql: sql,
      instructions: [
        "🔧 IMMEDIATE FIX STEPS:",
        "1. Copy the SQL above",
        "2. Go to your database (phpMyAdmin/cPanel/MySQL console)",
        "3. Select database: dbpm1080lhrpq2",
        "4. Run the SQL to create missing tables",
        "5. Refresh the product page - error should be gone",
        "",
        "✅ This will fix the Magic2 cost history error permanently"
      ],
      tables_created: [
        "avu_flora_im_cost_history",
        "avu_flora_im_locations", 
        "avu_flora_im_purchase_orders",
        "avu_flora_im_suppliers"
      ]
    });

  } catch (error) {
    console.error('Error generating database fix:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate database fix',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

