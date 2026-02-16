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
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">受注ID</th>
              <th className="px-4 py-2 border">荷主</th>
              <th className="px-4 py-2 border">品名</th>
              <th className="px-4 py-2 border">積込日</th>
              <th className="px-4 py-2 border">荷卸日</th>
              <th className="px-4 py-2 border">依頼車種</th>
              <th className="px-4 py-2 border">操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.orderId} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{order.orderId}</td>
                <td className="px-4 py-2 border">{getCustomerName(order.customerId)}</td>
                <td className="px-4 py-2 border">{order.itemName}</td>
                <td className="px-4 py-2 border">
                  {formatDate(order.loadDate)}
                  {order.loadTime && <span className="text-gray-500 ml-1">{order.loadTime}</span>}
                </td>
                <td className="px-4 py-2 border">
                  {formatDate(order.unloadDate)}
                  {order.unloadTime && <span className="text-gray-500 ml-1">{order.unloadTime}</span>}
                </td>
                <td className="px-4 py-2 border">{order.requestVehicleType}</td>
                <td className="px-4 py-2 border">
                  <button
                    onClick={() => onAssign?.(order)}
                    className="px-2 py-1 bg-green-500 text-white rounded mr-2 hover:bg-green-600"
                  >
                    配車
                  </button>
                  <button
                    onClick={() => onEdit?.(order)}
                    className="px-2 py-1 bg-blue-500 text-white rounded mr-2 hover:bg-blue-600"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(order)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="text-center py-8 text-gray-500">未配車の受注データがありません</div>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">受注ID</th>
            <th className="px-4 py-2 border">荷主</th>
            <th className="px-4 py-2 border">品名</th>
            <th className="px-4 py-2 border">積込日</th>
            <th className="px-4 py-2 border">荷卸日</th>
            <th className="px-4 py-2 border">車両</th>
            <th className="px-4 py-2 border">運転手</th>
            <th className="px-4 py-2 border">操作</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.orderId} className="hover:bg-gray-50">
              <td className="px-4 py-2 border">{order.orderId}</td>
              <td className="px-4 py-2 border">{getCustomerName(order.customerId)}</td>
              <td className="px-4 py-2 border">{order.itemName}</td>
              <td className="px-4 py-2 border">
                {formatDate(order.loadDate)}
                {order.loadTime && <span className="text-gray-500 ml-1">{order.loadTime}</span>}
              </td>
              <td className="px-4 py-2 border">
                {formatDate(order.unloadDate)}
                {order.unloadTime && <span className="text-gray-500 ml-1">{order.unloadTime}</span>}
              </td>
              <td className="px-4 py-2 border">
                {order.assignedVehicleNumber}
                {order.assignedVehicleType && (
                  <span className="text-gray-500 ml-1">({order.assignedVehicleType})</span>
                )}
              </td>
              <td className="px-4 py-2 border">{order.assignedDriverName}</td>
              <td className="px-4 py-2 border">
                <button
                  onClick={() => handleUnassign(order)}
                  className="px-2 py-1 bg-orange-500 text-white rounded mr-2 hover:bg-orange-600"
                >
                  取消
                </button>
                <button
                  onClick={() => onEdit?.(order)}
                  className="px-2 py-1 bg-blue-500 text-white rounded mr-2 hover:bg-blue-600"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(order)}
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && (
        <div className="text-center py-8 text-gray-500">配車済みの受注データがありません</div>
      )}
    </div>
  );
};
