'use client';

// DISABLED - Event bus completely disabled to prevent unwanted refreshes
type InventoryEventListener = () => void;

class InventoryEventBus {
  private listeners: InventoryEventListener[] = [];

  subscribe(listener: InventoryEventListener): () => void {
    console.warn('⚠️ inventoryEventBus.subscribe() called but event bus is DISABLED');
    // DO NOT ADD LISTENER - Return dummy unsubscribe
    return () => {};
  }

  emit(): void {
    console.warn('⚠️ inventoryEventBus.emit() called but event bus is DISABLED');
    // DO NOTHING - Event bus is disabled
  }

  // Emit with delay to ensure backend has processed changes
  emitAfterDelay(delay: number = 1000): void {
    console.warn('⚠️ inventoryEventBus.emitAfterDelay() called but event bus is DISABLED');
    // DO NOTHING - Event bus is disabled
  }
}

export const inventoryEventBus = new InventoryEventBus();

// Export React for the hook
import React from 'react';

// Helper hook for components to listen to inventory changes
export function useInventoryEvents(callback: () => void): void {
  React.useEffect(() => {
    const unsubscribe = inventoryEventBus.subscribe(callback);
    return unsubscribe;
  }, [callback]);
}
