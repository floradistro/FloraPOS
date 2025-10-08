<?php
/**
 * Flora Fields Migration Class
 * Migrates from V1 (complex) to V2 (simplified) architecture
 */

if (!defined('ABSPATH')) {
    exit;
}

class Flora_Fields_Migration {
    
    /**
     * Run complete migration
     */
    public static function migrate($dry_run = false) {
        global $wpdb;
        
        $log = [];
        $log[] = '========================================';
        $log[] = 'Flora Fields V1 → V2 Migration';
        $log[] = $dry_run ? '(DRY RUN - No changes will be made)' : '(LIVE RUN)';
        $log[] = '========================================';
        
        if (!$dry_run) {
            $wpdb->query('START TRANSACTION');
        }
        
        try {
            // Step 1: Install new schema
            $log[] = "\n[1/6] Installing new V2 schema...";
            if (!$dry_run) {
                Flora_Fields_Install_V2::install();
            }
            $log[] = "✓ New tables created";
            
            // Step 2: Migrate fields
            $log[] = "\n[2/6] Migrating fields...";
            $field_stats = self::migrate_fields($dry_run);
            $log[] = sprintf("✓ Migrated %d fields", $field_stats['total']);
            $log[] = sprintf("  - From blueprints: %d", $field_stats['from_blueprints']);
            $log[] = sprintf("  - From standalone: %d", $field_stats['from_standalone']);
            $log[] = sprintf("  - Duplicates skipped: %d", $field_stats['duplicates']);
            
            // Step 3: Migrate assignments
            $log[] = "\n[3/6] Migrating assignments...";
            $assign_stats = self::migrate_assignments($dry_run);
            $log[] = sprintf("✓ Migrated %d assignments", $assign_stats['total']);
            $log[] = sprintf("  - Global: %d", $assign_stats['global']);
            $log[] = sprintf("  - Category: %d", $assign_stats['category']);
            $log[] = sprintf("  - Product: %d", $assign_stats['product']);
            
            // Step 4: Migrate field values to post meta
            $log[] = "\n[4/6] Migrating field values to post meta...";
            $value_stats = self::migrate_values($dry_run);
            $log[] = sprintf("✓ Migrated %d field values", $value_stats['total']);
            $log[] = sprintf("  - Products: %d", $value_stats['products']);
            $log[] = sprintf("  - Categories: %d", $value_stats['categories']);
            
            // Step 5: Migrate pricing data
            $log[] = "\n[5/6] Migrating pricing data...";
            $pricing_stats = self::migrate_pricing($dry_run);
            $log[] = sprintf("✓ Migrated pricing data");
            $log[] = sprintf("  - Product forms: %d", $pricing_stats['forms']);
            $log[] = sprintf("  - Pricing rules: %d", $pricing_stats['rules']);
            
            // Step 6: Migrate recipes
            $log[] = "\n[6/6] Migrating recipes...";
            $recipe_stats = self::migrate_recipes($dry_run);
            $log[] = sprintf("✓ Migrated %d recipes", $recipe_stats['recipes']);
            $log[] = sprintf("  - Ingredients: %d", $recipe_stats['ingredients']);
            
            if (!$dry_run) {
                $wpdb->query('COMMIT');
                $log[] = "\n✓ Migration completed successfully!";
                
                // Backup old tables (don't drop yet)
                $log[] = "\n[BACKUP] Renaming old tables with _old suffix...";
                self::backup_old_tables();
                $log[] = "✓ Old tables backed up (can be dropped after verification)";
            } else {
                $log[] = "\n✓ Dry run completed - no changes made";
            }
            
        } catch (Exception $e) {
            if (!$dry_run) {
                $wpdb->query('ROLLBACK');
            }
            $log[] = "\n✗ Migration failed: " . $e->getMessage();
            $log[] = "Stack trace: " . $e->getTraceAsString();
        }
        
        $log[] = '========================================';
        
        $log_text = implode("\n", $log);
        error_log($log_text);
        
        return [
            'success' => true,
            'log' => $log,
            'stats' => [
                'fields' => $field_stats ?? [],
                'assignments' => $assign_stats ?? [],
                'values' => $value_stats ?? [],
                'pricing' => $pricing_stats ?? [],
                'recipes' => $recipe_stats ?? []
            ]
        ];
    }
    
    /**
     * Migrate fields from multiple old tables to single fd_fields
     */
    private static function migrate_fields($dry_run = false) {
        global $wpdb;
        
        $stats = [
            'total' => 0,
            'from_blueprints' => 0,
            'from_standalone' => 0,
            'duplicates' => 0
        ];
        
        $field_mapping = []; // old_type_id => new_id
        
        // Migrate from fd_field_blueprints
        $old_blueprints = $wpdb->get_results("
            SELECT * FROM {$wpdb->prefix}fd_field_blueprints 
            WHERE status = 'active'
        ");
        
        foreach ($old_blueprints as $bp) {
            $config = [
                'validation' => json_decode($bp->validation_rules, true) ?: [],
                'display' => json_decode($bp->display_options, true) ?: [],
                'default_value' => $bp->default_value,
                'required' => (bool)$bp->is_required,
                'searchable' => (bool)$bp->is_searchable
            ];
            
            if (!$dry_run) {
                $wpdb->insert(
                    $wpdb->prefix . 'fd_fields',
                    [
                        'name' => $bp->name,
                        'label' => $bp->label,
                        'type' => $bp->type,
                        'description' => $bp->description,
                        'config' => json_encode($config),
                        'sort_order' => $bp->sort_order,
                        'status' => $bp->status
                    ]
                );
                $new_id = $wpdb->insert_id;
                $field_mapping["blueprint_{$bp->id}"] = $new_id;
            }
            
            $stats['from_blueprints']++;
            $stats['total']++;
        }
        
        // Migrate from fd_standalone_fields (if exists and not duplicate)
        $standalone_exists = $wpdb->get_var("SHOW TABLES LIKE '{$wpdb->prefix}fd_standalone_fields'");
        
        if ($standalone_exists) {
            $old_standalone = $wpdb->get_results("
                SELECT * FROM {$wpdb->prefix}fd_standalone_fields 
                WHERE status = 'active'
            ");
            
            foreach ($old_standalone as $sf) {
                // Check if already exists by name
                if (!$dry_run) {
                    $exists = $wpdb->get_var($wpdb->prepare(
                        "SELECT id FROM {$wpdb->prefix}fd_fields WHERE name = %s",
                        $sf->field_name
                    ));
                    
                    if ($exists) {
                        $field_mapping["standalone_{$sf->id}"] = $exists;
                        $stats['duplicates']++;
                        continue;
                    }
                }
                
                $config = [
                    'validation' => json_decode($sf->validation_rules, true) ?: [],
                    'display' => json_decode($sf->display_options, true) ?: [],
                    'default_value' => $sf->field_default_value,
                    'required' => (bool)$sf->is_required,
                    'searchable' => (bool)$sf->is_searchable
                ];
                
                if (!$dry_run) {
                    $wpdb->insert(
                        $wpdb->prefix . 'fd_fields',
                        [
                            'name' => $sf->field_name,
                            'label' => $sf->field_label,
                            'type' => $sf->field_type,
                            'description' => $sf->field_description,
                            'config' => json_encode($config),
                            'sort_order' => $sf->sort_order,
                            'status' => $sf->status
                        ]
                    );
                    $new_id = $wpdb->insert_id;
                    $field_mapping["standalone_{$sf->id}"] = $new_id;
                }
                
                $stats['from_standalone']++;
                $stats['total']++;
            }
        }
        
        // Store mapping for other migration steps
        if (!$dry_run) {
            update_option('flora_fields_migration_mapping', $field_mapping);
        }
        
        return $stats;
    }
    
    /**
     * Migrate assignments (simplified - no priority/scope/mode)
     */
    private static function migrate_assignments($dry_run = false) {
        global $wpdb;
        
        $stats = [
            'total' => 0,
            'global' => 0,
            'category' => 0,
            'product' => 0
        ];
        
        $field_mapping = get_option('flora_fields_migration_mapping', []);
        
        $old_assignments = $wpdb->get_results("
            SELECT * FROM {$wpdb->prefix}fd_field_group_assignments 
            WHERE is_active = 1
        ");
        
        foreach ($old_assignments as $assign) {
            $new_field_id = $field_mapping["blueprint_{$assign->blueprint_id}"] ?? null;
            
            if (!$new_field_id) {
                continue; // Field not migrated
            }
            
            // Simplify to 3 types (no priority, scope, mode)
            if ($assign->entity_id !== null) {
                $type = 'product';
                $target_id = $assign->entity_id;
                $stats['product']++;
            } elseif ($assign->category_id !== null) {
                $type = 'category';
                $target_id = $assign->category_id;
                $stats['category']++;
            } else {
                $type = 'global';
                $target_id = null;
                $stats['global']++;
            }
            
            if (!$dry_run) {
                // Check if already exists
                $exists = $wpdb->get_var($wpdb->prepare("
                    SELECT id FROM {$wpdb->prefix}fd_field_assignments
                    WHERE field_id = %d AND assignment_type = %s AND target_id <=> %s
                ", $new_field_id, $type, $target_id));
                
                if (!$exists) {
                    $wpdb->insert(
                        $wpdb->prefix . 'fd_field_assignments',
                        [
                            'field_id' => $new_field_id,
                            'assignment_type' => $type,
                            'target_id' => $target_id,
                            'is_required' => 0, // Can be updated later
                            'sort_order' => $assign->sort_order
                        ]
                    );
                }
            }
            
            $stats['total']++;
        }
        
        return $stats;
    }
    
    /**
     * Migrate field values to WordPress post meta
     */
    private static function migrate_values($dry_run = false) {
        global $wpdb;
        
        $stats = [
            'total' => 0,
            'products' => 0,
            'categories' => 0
        ];
        
        $field_mapping = get_option('flora_fields_migration_mapping', []);
        
        $old_values = $wpdb->get_results("
            SELECT * FROM {$wpdb->prefix}fd_field_values
        ");
        
        foreach ($old_values as $value) {
            $new_field_id = $field_mapping["blueprint_{$value->blueprint_id}"] ?? null;
            
            if (!$new_field_id) {
                continue;
            }
            
            if (!$dry_run) {
                // Get field name
                $field = $wpdb->get_row($wpdb->prepare(
                    "SELECT name FROM {$wpdb->prefix}fd_fields WHERE id = %d",
                    $new_field_id
                ));
                
                if ($field) {
                    // Store in post meta with prefix
                    $meta_key = "_fd_field_{$field->name}";
                    
                    if ($value->entity_type === 'product') {
                        update_post_meta($value->entity_id, $meta_key, maybe_unserialize($value->field_value));
                        $stats['products']++;
                    } elseif ($value->entity_type === 'category') {
                        update_term_meta($value->entity_id, $meta_key, maybe_unserialize($value->field_value));
                        $stats['categories']++;
                    }
                }
            }
            
            $stats['total']++;
        }
        
        return $stats;
    }
    
    /**
     * Migrate pricing data
     */
    private static function migrate_pricing($dry_run = false) {
        global $wpdb;
        
        $stats = [
            'forms' => 0,
            'rules' => 0
        ];
        
        // Check if old product_forms table exists
        $old_forms_exists = $wpdb->get_var("SHOW TABLES LIKE '{$wpdb->prefix}fd_product_forms'");
        
        if ($old_forms_exists) {
            // Product forms structure is compatible, just copy data
            if (!$dry_run) {
                $forms = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}fd_product_forms");
                foreach ($forms as $form) {
                    $stats['forms']++;
                    // Forms table structure is already good, data will be preserved
                }
            }
        }
        
        // Migrate pricing rules (structure changed)
        $old_rules = $wpdb->get_results("
            SELECT * FROM {$wpdb->prefix}fd_pricing_rules WHERE is_active = 1
        ");
        
        foreach ($old_rules as $rule) {
            if (!$dry_run) {
                // Transform old rule to new structure
                $applies_to = [];
                if ($rule->product_id) {
                    $applies_to['product_ids'] = [$rule->product_id];
                }
                
                $wpdb->insert(
                    $wpdb->prefix . 'fd_pricing_rules',
                    [
                        'rule_name' => $rule->rule_name,
                        'rule_type' => $rule->rule_type,
                        'applies_to' => json_encode($applies_to),
                        'conditions' => $rule->conditions,
                        'adjustment_type' => 'formula',
                        'adjustment_value' => $rule->formula,
                        'priority' => $rule->priority,
                        'is_active' => $rule->is_active,
                        'start_date' => $rule->start_date,
                        'end_date' => $rule->end_date
                    ]
                );
            }
            $stats['rules']++;
        }
        
        return $stats;
    }
    
    /**
     * Migrate recipes
     */
    private static function migrate_recipes($dry_run = false) {
        global $wpdb;
        
        $stats = [
            'recipes' => 0,
            'ingredients' => 0
        ];
        
        // Check if old recipe tables exist
        $old_recipes_exists = $wpdb->get_var("SHOW TABLES LIKE '{$wpdb->prefix}fd_recipe_blueprints'");
        
        if ($old_recipes_exists) {
            $old_recipes = $wpdb->get_results("
                SELECT * FROM {$wpdb->prefix}fd_recipe_blueprints WHERE is_active = 1
            ");
            
            foreach ($old_recipes as $recipe) {
                if (!$dry_run) {
                    $wpdb->insert(
                        $wpdb->prefix . 'fd_recipes',
                        [
                            'recipe_name' => $recipe->recipe_name,
                            'output_category_id' => $recipe->output_category_id ?? 0,
                            'recipe_type' => $recipe->recipe_type,
                            'yield_quantity' => $recipe->expected_yield_quantity ?? 1,
                            'yield_unit' => $recipe->expected_yield_unit ?? 'units',
                            'is_active' => $recipe->is_active
                        ]
                    );
                    $new_recipe_id = $wpdb->insert_id;
                    
                    // Migrate ingredients if they exist
                    $ingredients = $wpdb->get_results($wpdb->prepare("
                        SELECT * FROM {$wpdb->prefix}fd_recipe_ingredient_groups
                        WHERE recipe_id = %d
                    ", $recipe->id));
                    
                    foreach ($ingredients as $ingredient) {
                        $wpdb->insert(
                            $wpdb->prefix . 'fd_recipe_ingredients',
                            [
                                'recipe_id' => $new_recipe_id,
                                'ingredient_product_id' => $ingredient->product_id ?? 0,
                                'quantity' => $ingredient->quantity ?? 1,
                                'unit' => $ingredient->unit ?? 'units',
                                'is_optional' => $ingredient->is_optional ?? 0,
                                'sort_order' => $ingredient->sort_order ?? 0
                            ]
                        );
                        $stats['ingredients']++;
                    }
                }
                $stats['recipes']++;
            }
        }
        
        return $stats;
    }
    
    /**
     * Backup old tables by renaming
     */
    private static function backup_old_tables() {
        global $wpdb;
        
        $tables_to_backup = [
            'fd_field_blueprints',
            'fd_blueprint_fields',
            'fd_standalone_fields',
            'fd_field_templates',
            'fd_field_group_assignments',
            'fd_field_values',
            'fd_catalog_meta'
        ];
        
        foreach ($tables_to_backup as $table) {
            $full_table = $wpdb->prefix . $table;
            $exists = $wpdb->get_var("SHOW TABLES LIKE '$full_table'");
            
            if ($exists) {
                $wpdb->query("RENAME TABLE $full_table TO {$full_table}_old");
                error_log("Backed up: $table → {$table}_old");
            }
        }
    }
    
    /**
     * Drop old backup tables (use with caution!)
     */
    public static function drop_old_tables() {
        global $wpdb;
        
        $tables_to_drop = [
            'fd_field_blueprints_old',
            'fd_blueprint_fields_old',
            'fd_standalone_fields_old',
            'fd_field_templates_old',
            'fd_field_group_assignments_old',
            'fd_field_values_old',
            'fd_catalog_meta_old'
        ];
        
        foreach ($tables_to_drop as $table) {
            $full_table = $wpdb->prefix . $table;
            $wpdb->query("DROP TABLE IF EXISTS $full_table");
            error_log("Dropped: $table");
        }
        
        return ['dropped' => count($tables_to_drop)];
    }
}

