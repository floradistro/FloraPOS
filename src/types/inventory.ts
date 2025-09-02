export interface InventoryItem {
  location_id: number | string;
  location_name?: string;
  quantity?: number;
  stock?: number | string;
}

export interface CategoryInfo {
  id: string | number;
  name: string;
  slug?: string;
}

export interface RawProductData {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  description?: string;
  short_description?: string;
  sku?: string;
  regular_price: string;
  sale_price?: string;
  stock_status: string;
  manage_stock: boolean;
  stock_quantity?: number;
  categories?: CategoryInfo[];
  inventory?: InventoryItem[];
  meta_data?: Array<{ key: string; value: any }>;
  images?: Array<{ id: number; src: string; alt?: string }>;
  image?: string;
  total_stock?: number;
}

export interface BlueprintPricingProducts {
  id: number;
  categoryIds: number[];
}
