import React from 'react';
import { Order, Customer } from '../../types';

interface OrderListProps {
  orders: Order[];
  customers: Customer[];
  mode: 'unassigned' | 'assigned';
  onEdit?: (order: Order) => void;
  onDelete?: (orderId: string) => void;
  onAssign?: (order: Order) => void;
  onUnassign?: (orderId: string) => void;
}

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  customers,
  mode,
  onEdit,
  onDelete,
  onAssign,
  onUnassign,
}) => {
  const getCustomerName = (customerId: string): string => {
    const customer = customers.find(c => c.customerId === customerId);
    return customer?.customerName || customerId;
  };

  const handleDelete = (order: Order) => {
    if (window.confirm(`受注 ${order.orderId} を削除してもよろしいですか？`)) {
      onDelete?.(order.orderId);
    }
  };

  const handleUnassign = (order: Order) => {
    if (window.confirm(`受注 ${order.orderId} の配車を取消してもよろしいですか？`)) {
      onUnassign?.(order.orderId);
    }
  };

  if (mode === 'unassigned') {
    return (
      <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">受注ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">荷主</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">品名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">積込日</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">荷卸日</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">依頼車種</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map(order => (
                <tr key={order.orderId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{order.orderId}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{getCustomerName(order.customerId)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{order.itemName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {formatDate(order.loadDate)}
                    {order.loadTime && <span className="text-gray-500 ml-1">{order.loadTime}</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {formatDate(order.unloadDate)}
                    {order.unloadTime && <span className="text-gray-500 ml-1">{order.unloadTime}</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{order.requestVehicleType}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onAssign?.(order)}
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md px-2.5 py-1.5 min-h-[44px] text-xs font-medium transition-colors"
                      >
                        配車
                      </button>
                      <button
                        onClick={() => onEdit?.(order)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md px-2.5 py-1.5 min-h-[44px] text-xs font-medium transition-colors"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(order)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md px-2.5 py-1.5 min-h-[44px] text-xs font-medium transition-colors"
                      >
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <svg className="mx-auto h-10 w-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            <p className="text-sm">未配車の受注データがありません</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">受注ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">荷主</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">品名</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">積込日</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">荷卸日</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">車両</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">運転手</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map(order => (
              <tr key={order.orderId} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{order.orderId}</td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{getCustomerName(order.customerId)}</td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{order.itemName}</td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                  {formatDate(order.loadDate)}
                  {order.loadTime && <span className="text-gray-500 ml-1">{order.loadTime}</span>}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                  {formatDate(order.unloadDate)}
                  {order.unloadTime && <span className="text-gray-500 ml-1">{order.unloadTime}</span>}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                  {order.assignedVehicleNumber}
                  {order.assignedVehicleType && (
                    <span className="text-gray-500 ml-1">({order.assignedVehicleType})</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{order.assignedDriverName}</td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleUnassign(order)}
                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-md px-2.5 py-1.5 min-h-[44px] text-xs font-medium transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => onEdit?.(order)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md px-2.5 py-1.5 min-h-[44px] text-xs font-medium transition-colors"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(order)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md px-2.5 py-1.5 min-h-[44px] text-xs font-medium transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {orders.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <svg className="mx-auto h-10 w-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
          <p className="text-sm">配車済みの受注データがありません</p>
        </div>
      )}
    </div>
  );
};
