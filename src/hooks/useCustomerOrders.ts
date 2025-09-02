import { useQuery } from '@tanstack/react-query';
import { customerOrdersService, CustomerOrdersResponse } from '../services/customer-orders-service';

const CUSTOMER_ORDERS_QUERY_KEYS = {
  orders: (customerId: number, page: number, perPage: number) => 
    ['customer-orders', customerId, page, perPage],
};

export const useCustomerOrders = (
  customerId: number,
  page: number = 1,
  perPage: number = 10
) => {
  return useQuery<CustomerOrdersResponse>({
    queryKey: CUSTOMER_ORDERS_QUERY_KEYS.orders(customerId, page, perPage),
    queryFn: () => customerOrdersService.getCustomerOrders(customerId, page, perPage),
    enabled: !!customerId,
    retry: 1,
  });
};


