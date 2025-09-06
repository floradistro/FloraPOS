'use client';

import React, { useMemo, forwardRef, useImperativeHandle } from 'react';
import { VariableSizeGrid as Grid } from 'react-window';
import { useAuth } from '../../contexts/AuthContext';

// Import the existing ProductGrid to reuse its logic and types
import { ProductGrid, Product } from './ProductGrid';

interface VirtualizedProductGridProps {
  onAddToCart?: (product: Product) => void;
  searchQuery?: string;
  categoryFilter?: string;
}

interface ProductGridItem {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    products: Product[];
    columnsPerRow: number;
    onAddToCart?: (product: Product) => void;
  };
}

// Grid cell renderer
const GridCell = ({ columnIndex, rowIndex, style, data }: ProductGridItem) => {
  const { products, columnsPerRow, onAddToCart } = data;
  const productIndex = rowIndex * columnsPerRow + columnIndex;
  const product = products[productIndex];

  if (!product) {
    return <div style={style} />; // Empty cell
  }

  // Use the existing product card rendering logic from ProductGrid
  // For now, return a simplified version - in a real implementation,
  // you'd extract the product card component from ProductGrid
  return (
    <div style={style} className="p-2">
      <div className="bg-neutral-900 rounded-lg p-3 h-full transition-all duration-300 ease-out hover:bg-neutral-800/80 hover:-translate-y-1 hover:shadow-lg cursor-pointer shadow-sm border border-white/[0.06] hover:border-white/[0.12]">
        <div className="flex flex-col h-full">
          <h3 className="text-neutral-400 font-medium text-sm mb-2 line-clamp-2">
            {product.name}
          </h3>
          <div className="mt-auto">
            <p className="text-neutral-500 text-xs mb-2">
              Stock: {product.total_stock}
            </p>
            <button
              onClick={() => onAddToCart?.(product)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded transition-colors"
              disabled={product.total_stock <= 0}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const VirtualizedProductGrid = forwardRef<
  { refreshInventory: () => Promise<void> }, 
  VirtualizedProductGridProps
>(({ onAddToCart, searchQuery, categoryFilter }, ref) => {
  const { user } = useAuth();
  // For now, let's create a fallback to the original ProductGrid
  // In a production implementation, you'd need to extract the data fetching logic
  // and product filtering from the original ProductGrid
  
  // Check if we have a large number of products that would benefit from virtualization
  // For smaller product sets, use the original ProductGrid for better UX
  const shouldVirtualize = false; // Set to true when product count > 100

  if (!shouldVirtualize) {
    // Use original ProductGrid for smaller datasets
    return (
      <ProductGrid
        onAddToCart={onAddToCart}
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
      />
    );
  }

  // Virtualized version (placeholder for future enhancement)
  return (
    <div className="h-full w-full">
      <p className="text-neutral-400 p-4">
        Virtualized grid would render here for large datasets
      </p>
    </div>
  );
});

VirtualizedProductGrid.displayName = 'VirtualizedProductGrid';
