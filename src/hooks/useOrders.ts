import { useState, useEffect, useCallback } from 'react';
import { Order } from '../types';
import { orderService } from '../services/orderService';

type OrderFilter = 'all' | 'unassigned' | 'assigned';

export const useOrders = (initialFilter: OrderFilter = 'all') => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderFilter>(initialFilter);

  const fetchOrders = useCallback(async (filterOverride?: OrderFilter) => {
    const activeFilter = filterOverride ?? filter;
    try {
      setLoading(true);
      let data: Order[];
      switch (activeFilter) {
        case 'unassigned':
          data = await orderService.getUnassigned();
          break;
        case 'assigned':
          data = await orderService.getAssigned();
          break;
        default:
          data = await orderService.getAll();
          break;
      }
      setOrders(data);
      setError(null);
    } catch (err) {
      setError('受注データの取得に失敗しました');
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const createOrder = async (order: Omit<Order, 'createdAt' | 'updatedAt'>) => {
    try {
      await orderService.create(order);
      await fetchOrders();
    } catch (err) {
      console.error('Failed to create order:', err);
      throw new Error(`受注の追加に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    }
  };

  const updateOrder = async (orderId: string, updates: Partial<Order>) => {
    try {
      await orderService.update(orderId, updates);
      await fetchOrders();
    } catch (err) {
      console.error('Failed to update order:', err);
      throw new Error(`受注の更新に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      await orderService.delete(orderId);
      await fetchOrders();
    } catch (err) {
      console.error('Failed to delete order:', err);
      throw new Error(`受注の削除に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    }
  };

  const assignVehicle = async (
    orderId: string,
    vehicleNumber: string,
    vehicleType: string,
    driverName: string,
  ) => {
    try {
      await orderService.assignVehicle(orderId, vehicleNumber, vehicleType, driverName);
      await fetchOrders();
    } catch (err) {
      console.error('Failed to assign vehicle:', err);
      throw new Error(`配車の割当に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    }
  };

  const unassignVehicle = async (orderId: string) => {
    try {
      await orderService.unassignVehicle(orderId);
      await fetchOrders();
    } catch (err) {
      console.error('Failed to unassign vehicle:', err);
      throw new Error(`配車の取消に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    }
  };

  return {
    orders,
    loading,
    error,
    filter,
    setFilter,
    createOrder,
    updateOrder,
    deleteOrder,
    assignVehicle,
    unassignVehicle,
    refetch: fetchOrders,
  };
};
