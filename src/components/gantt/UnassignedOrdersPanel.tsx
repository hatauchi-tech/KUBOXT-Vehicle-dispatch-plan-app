import React, { useState, useMemo } from 'react';
import type { Order, Customer } from '../../types';
import { DraggableOrderCard } from './DraggableOrderCard';

interface UnassignedOrdersPanelProps {
  orders: Order[];
  customers: Customer[];
}

/**
 * Panel listing unassigned orders for the selected date.
 * Each card is draggable into the Gantt chart below / beside it.
 */
export const UnassignedOrdersPanel: React.FC<UnassignedOrdersPanelProps> = ({
  orders,
  customers,
}) => {
  const [searchText, setSearchText] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');

  /** Map for O(1) customer lookup */
  const customerMap = useMemo(() => {
    const map = new Map<string, Customer>();
    for (const c of customers) {
      map.set(c.customerId, c);
    }
    return map;
  }, [customers]);

  /** Unique vehicle types present among unassigned orders */
  const vehicleTypes = useMemo(() => {
    const types = new Set<string>();
    for (const o of orders) {
      if (o.requestVehicleType) {
        types.add(o.requestVehicleType);
      }
    }
    return Array.from(types).sort();
  }, [orders]);

  /** Filtered order list */
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Vehicle type filter
      if (vehicleTypeFilter && order.requestVehicleType !== vehicleTypeFilter) {
        return false;
      }

      // Free text search (customer name, orderId, itemName, addresses)
      if (searchText) {
        const lowerSearch = searchText.toLowerCase();
        const customer = customerMap.get(order.customerId);
        const searchableFields = [
          order.orderId,
          order.itemName,
          order.loadAddress1,
          order.unloadAddress1,
          customer?.customerName ?? '',
        ];
        const matches = searchableFields.some((field) =>
          field.toLowerCase().includes(lowerSearch),
        );
        if (!matches) return false;
      }

      return true;
    });
  }, [orders, searchText, vehicleTypeFilter, customerMap]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-800">
            未配車オーダー
          </h3>
          <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
            {filteredOrders.length} 件
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="荷主・品名・住所で検索..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-md
                       focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
        </div>

        {/* Vehicle type filter */}
        <select
          value={vehicleTypeFilter}
          onChange={(e) => setVehicleTypeFilter(e.target.value)}
          className="w-full text-xs border border-gray-300 rounded-md py-1.5 px-2
                     focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
        >
          <option value="">全ての車種</option>
          {vehicleTypes.map((vt) => (
            <option key={vt} value={vt}>
              {vt}
            </option>
          ))}
        </select>
      </div>

      {/* Scrollable order list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <svg
              className="w-10 h-10 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-xs">未配車オーダーはありません</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <DraggableOrderCard
              key={order.orderId}
              order={order}
              customer={customerMap.get(order.customerId)}
            />
          ))
        )}
      </div>
    </div>
  );
};
