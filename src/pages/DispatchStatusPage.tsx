import React, { useState, useMemo } from 'react';
import { useOrders } from '../hooks/useOrders';
import { useCustomers } from '../hooks/useCustomers';
import { useVehicles } from '../hooks/useVehicles';
import { Order } from '../types';

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

export const DispatchStatusPage: React.FC = () => {
  const { orders, loading, error, unassignVehicle } = useOrders();
  const { customers } = useCustomers();
  const { vehicles } = useVehicles();

  // Filter states
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterVehicleNumber, setFilterVehicleNumber] = useState('');
  const [filterCustomerId, setFilterCustomerId] = useState('');

  // Statistics
  const totalCount = orders.length;
  const assignedOrders = useMemo(() => orders.filter(o => o.status === 'assigned'), [orders]);
  const unassignedOrders = useMemo(() => orders.filter(o => o.status === 'unassigned'), [orders]);
  const assignedCount = assignedOrders.length;
  const unassignedCount = unassignedOrders.length;
  const assignRate = totalCount > 0 ? Math.round((assignedCount / totalCount) * 100) : 0;

  // Apply filters to assigned orders
  const filteredAssigned = useMemo(() => {
    return assignedOrders.filter(order => {
      if (filterDateFrom) {
        const from = new Date(filterDateFrom);
        if (order.loadDate < from) return false;
      }
      if (filterDateTo) {
        const to = new Date(filterDateTo);
        to.setHours(23, 59, 59, 999);
        if (order.loadDate > to) return false;
      }
      if (filterVehicleNumber && order.assignedVehicleNumber !== filterVehicleNumber) return false;
      if (filterCustomerId && order.customerId !== filterCustomerId) return false;
      return true;
    });
  }, [assignedOrders, filterDateFrom, filterDateTo, filterVehicleNumber, filterCustomerId]);

  const getCustomerName = (customerId: string): string => {
    const customer = customers.find(c => c.customerId === customerId);
    return customer?.customerName || customerId;
  };

  const handleUnassign = async (order: Order) => {
    if (window.confirm(`受注 ${order.orderId} の配車を取消してもよろしいですか？`)) {
      try {
        await unassignVehicle(order.orderId);
      } catch (err) {
        console.error('Failed to unassign vehicle:', err);
        alert(err instanceof Error ? err.message : '配車取消に失敗しました');
      }
    }
  };

  const clearFilters = () => {
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterVehicleNumber('');
    setFilterCustomerId('');
  };

  // Get unique assigned vehicle numbers for filter dropdown
  const assignedVehicleNumbers = useMemo(() => {
    const numbers = new Set(assignedOrders.map(o => o.assignedVehicleNumber).filter(Boolean));
    return Array.from(numbers).sort() as string[];
  }, [assignedOrders]);

  if (loading) {
    return <div className="p-4">読み込み中...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">配車状況確認</h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-500">全件数</div>
          <div className="text-2xl font-bold">{totalCount}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-500">配車済み</div>
          <div className="text-2xl font-bold text-green-500">{assignedCount}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-500">未配車</div>
          <div className="text-2xl font-bold text-orange-500">{unassignedCount}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-500">配車率</div>
          <div className="text-2xl font-bold text-blue-500">{assignRate}%</div>
        </div>
      </div>

      {/* Filter Area */}
      <div className="bg-white p-4 rounded-lg border mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">積込日（開始）</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">積込日（終了）</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">車両</label>
            <select
              value={filterVehicleNumber}
              onChange={(e) => setFilterVehicleNumber(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="">すべて</option>
              {assignedVehicleNumbers.length > 0 ? (
                assignedVehicleNumbers.map(num => (
                  <option key={num} value={num}>{num}</option>
                ))
              ) : (
                vehicles.map(v => (
                  <option key={v.vehicleNumber} value={v.vehicleNumber}>{v.vehicleNumber}</option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">荷主</label>
            <select
              value={filterCustomerId}
              onChange={(e) => setFilterCustomerId(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="">すべて</option>
              {customers.map(c => (
                <option key={c.customerId} value={c.customerId}>{c.customerName}</option>
              ))}
            </select>
          </div>
          <button
            onClick={clearFilters}
            className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            クリア
          </button>
        </div>
      </div>

      {/* Assigned Orders Table */}
      <div>
        <h2 className="text-lg font-semibold mb-3">配車済み一覧（{filteredAssigned.length}件）</h2>
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
              {filteredAssigned.map(order => (
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
                      className="px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
                    >
                      取消
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAssigned.length === 0 && (
            <div className="text-center py-8 text-gray-500">配車済みの受注データがありません</div>
          )}
        </div>
      </div>
    </div>
  );
};
