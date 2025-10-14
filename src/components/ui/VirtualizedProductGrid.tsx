'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Product } from './ProductGrid';
import ProductCard from './ProductCard';

interface VirtualizedProductGridProps {
  products: Product[];
  onAddToCartWithVariant: (product: Product) => void;
  selectedVariants: Record<number, number>;
  onVariantSelect: (productId: number, variantId: number) => void;
  onQuantityChange: (productId: number, quantity: number, price: number, category?: string) => void;
  userLocationId?: number;
  showImages?: boolean;
  containerHeight?: number;
}

export const VirtualizedProductGrid: React.FC<VirtualizedProductGridProps> = ({
  products,
  onAddToCartWithVariant,
  selectedVariants,
  onVariantSelect,
  onQuantityChange,
  userLocationId,
  showImages = true,
  containerHeight = 800
}) => {
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      const width = window.innerWidth - 450; // Account for sidebar
      setContainerWidth(width);
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Calculate grid dimensions
  const COLUMN_COUNT = containerWidth < 1024 ? 2 : 3;
  const ITEM_WIDTH = Math.floor(containerWidth / COLUMN_COUNT) - 12;
  const ITEM_HEIGHT = 320; // Fixed height for each product card
  const ROW_COUNT = Math.ceil(products.length / COLUMN_COUNT);

  // Handle product selection
  const handleProductSelection = useCallback((product: Product) => {
    setSelectedProduct(prev => prev === product.id ? null : product.id);
  }, []);

  // Render a single row (contains multiple columns)
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const startIdx = index * COLUMN_COUNT;
    const rowProducts = products.slice(startIdx, startIdx + COLUMN_COUNT);

    return (
      <div style={style} className="flex gap-3 px-3">
        {rowProducts.map((product, colIdx) => (
          <div
            key={product.id}
            className="flex-1 bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.04] rounded-2xl overflow-hidden transition-all duration-300 card-hover"
            style={{
              width: ITEM_WIDTH,
              minWidth: ITEM_WIDTH,
              maxWidth: ITEM_WIDTH,
            }}
          >
            <ProductCard
              product={product}
              userLocationId={userLocationId}
              selectedVariants={selectedVariants}
              isAuditMode={false}
              isSalesView={false}
              onVariantSelect={onVariantSelect}
              onQuantityChange={onQuantityChange}
              onAddToCartWithVariant={onAddToCartWithVariant}
              onProductSelection={handleProductSelection}
              isSelected={selectedProduct === product.id}
              showImage={showImages}
            />
          </div>
        ))}
      </div>
    );
  }, [products, selectedVariants, selectedProduct, userLocationId, showImages, COLUMN_COUNT, ITEM_WIDTH, onVariantSelect, onQuantityChange, onAddToCartWithVariant, handleProductSelection]);

  return (
    <div className="w-full h-full">
      <List
        height={containerHeight}
        itemCount={ROW_COUNT}
        itemSize={ITEM_HEIGHT}
        width={containerWidth}
        className="scrollbar-thin scrollbar-thumb-neutral-600/50 scrollbar-track-transparent"
      >
        {Row}
      </List>
      
      <style jsx global>{`
        .card-hover {
          will-change: transform, opacity;
          backface-visibility: hidden;
          transform: translateZ(0);
        }
        
        .card-hover:hover {
          transform: translateY(-2px) translateZ(0);
          transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
      `}</style>
    </div>
  );
};

