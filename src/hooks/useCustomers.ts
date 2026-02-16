import { useState, useEffect } from 'react';
import { Customer } from '../types';
import { customerService } from '../services/customerService';

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getAll();
      // Sort by customerId (alphabetical)
      const sortedData = data.sort((a, b) => a.customerId.localeCompare(b.customerId));
      setCustomers(sortedData);
      setError(null);
    } catch (err) {
      setError('荷主データの取得に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const createCustomer = async (customer: Omit<Customer, 'createdAt' | 'updatedAt'>) => {
    try {
      await customerService.create(customer);
      await fetchCustomers();
    } catch (err: any) {
      console.error('Failed to create customer:', err);
      throw new Error(`荷主の追加に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    }
  };

  const updateCustomer = async (customerId: string, updates: Partial<Customer>) => {
    try {
      await customerService.update(customerId, updates);
      await fetchCustomers();
    } catch (err: any) {
      console.error('Failed to update customer:', err);
      throw new Error(`荷主の更新に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    }
  };

  const deleteCustomer = async (customerId: string) => {
    try {
      await customerService.delete(customerId);
      await fetchCustomers();
    } catch (err: any) {
      console.error('Failed to delete customer:', err);
      throw new Error(`荷主の削除に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    }
  };

  return {
    customers,
    loading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refetch: fetchCustomers,
  };
};
