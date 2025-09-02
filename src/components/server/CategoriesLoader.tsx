/**
 * Server Component for loading categories
 * This runs on the server and provides static category data
 */

import { CategoriesService } from '../../services/categories-service';
import { Category } from '../../types';

interface CategoriesLoaderProps {
  children: (categories: Category[]) => React.ReactNode;
  fallback?: React.ReactNode;
}

// Server component for categories - runs at build time and on server
export async function CategoriesLoader({ children, fallback }: CategoriesLoaderProps) {
  try {
    // This runs on the server, providing static data
    const categories = await CategoriesService.getCategories();
    return <>{children(categories)}</>;
  } catch (error) {
    console.error('Failed to load categories on server:', error);
    
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Return empty categories if no fallback provided
    return <>{children([])}</>;
  }
}

// Client-side wrapper for hydration
export function CategoriesProvider({ 
  initialCategories, 
  children 
}: { 
  initialCategories: Category[];
  children: (categories: Category[]) => React.ReactNode;
}) {
  // On the client, we use the initial server-provided data
  // React Query can then take over for updates
  return <>{children(initialCategories)}</>;
}
