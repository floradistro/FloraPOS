'use client';

import { useQuery } from '@tanstack/react-query';
import { usersService } from '@/services/users-service';

export default function TestCustomersPage() {
  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['test-customers'],
    queryFn: () => usersService.getUsers(),
  });

  return (
    <div className="p-8 bg-neutral-900 min-h-screen text-white">
      <h1 className="text-2xl mb-4">Customer API Test</h1>
      
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error.message}</p>}
      
      {customers && (
        <div>
          <p className="text-green-500 mb-4">✅ Loaded {customers.length} customers</p>
          <div className="space-y-2">
            {customers.slice(0, 10).map(customer => (
              <div key={customer.id} className="bg-neutral-800 p-3 rounded">
                <p className="font-bold">{customer.display_name}</p>
                <p className="text-sm text-neutral-400">{customer.email}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

