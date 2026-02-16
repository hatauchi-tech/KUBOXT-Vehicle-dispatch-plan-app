import React, { useState, useMemo } from 'react';
import { useOrders } from '../hooks/useOrders';
import { useVehicles } from '../hooks/useVehicles';
import { useCustomers } from '../hooks/useCustomers';
import { OrderForm } from '../components/orders/OrderForm';
import { OrderList } from '../components/orders/OrderList';
import { AssignVehicleModal } from '../components/orders/AssignVehicleModal';
import { Order } from '../types';

export const DispatchPlanPage: React.FC = () => {
  const { orders, loading, error, createOrder, updateOrder, deleteOrder, assignVehicle, unassignVehicle } = useOrders();
  const { vehicles } = useVehicles();
  const { customers } = useCustomers();

  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
  const [showAssigned, setShowAssigned] = useState(true);

  // Filter states
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [filterVehicleType, setFilterVehicleType] = useState('');

  // Separate orders by status
  const unassignedOrders = useMemo(() => orders.filter(o => o.status === 'unassigned'), [orders]);
  const assignedOrders = useMemo(() => orders.filter(o => o.status === 'assigned'), [orders]);

  // Apply filters
  const applyFilters = (orderList: Order[]): Order[] => {
    return orderList.filter(order => {
      if (filterDateFrom) {
        const from = new Date(filterDateFrom);
        if (order.loadDate < from) return false;
      }
      if (filterDateTo) {
        const to = new Date(filterDateTo);
        to.setHours(23, 59, 59, 999);
        if (order.loadDate > to) return false;
      }
      if (filterCustomerId && order.customerId !== filterCustomerId) return false;
      if (filterVehicleType && order.requestVehicleType !== filterVehicleType) return false;
      return true;
    });
  };

  const filteredUnassigned = useMemo(() => applyFilters(unassignedOrders), [unassignedOrders, filterDateFrom, filterDateTo, filterCustomerId, filterVehicleType]);
  const filteredAssigned = useMemo(() => applyFilters(assignedOrders), [assignedOrders, filterDateFrom, filterDateTo, filterCustomerId, filterVehicleType]);

  const handleAdd = () => {
    setEditingOrder(null);
    setShowForm(true);
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setShowForm(true);
  };

  const handleSubmit = async (order: Omit<Order, 'createdAt' | 'updatedAt'>) => {
    if (editingOrder) {
      await updateOrder(editingOrder.orderId, order);
    } else {
      await createOrder(order);
    }
    setShowForm(false);
    setEditingOrder(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingOrder(null);
  };

  const handleAssignClick = (order: Order) => {
    setAssigningOrder(order);
  };

  const handleAssignVehicle = async (
    orderId: string,
    vehicleNumber: string,
    vehicleType: string,
    driverName: string,
  ) => {
    await assignVehicle(orderId, vehicleNumber, vehicleType, driverName);
    setAssigningOrder(null);
  };

  const handleAssignCancel = () => {
    setAssigningOrder(null);
  };

  const clearFilters = () => {
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterCustomerId('');
    setFilterVehicleType('');
  };

  if (loading) {
    return <div className="p-4">読み込み中...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">配車計画</h1>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          新規受注追加
        </button>
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
          <div>
            <label className="block text-sm text-gray-600 mb-1">車種</label>
            <select
              value={filterVehicleType}
              onChange={(e) => setFilterVehicleType(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="">すべて</option>
              <option value="4t">4t</option>
              <option value="2t">2t</option>
              <option value="1t">1t</option>
              <option value="0.5t">0.5t</option>
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-500">全件数</div>
          <div className="text-2xl font-bold">{orders.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-500">未配車</div>
          <div className="text-2xl font-bold text-orange-500">{unassignedOrders.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-500">配車済み</div>
          <div className="text-2xl font-bold text-green-500">{assignedOrders.length}</div>
        </div>
      </div>

      {/* Unassigned Orders */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">未配車一覧（{filteredUnassigned.length}件）</h2>
        <OrderList
          orders={filteredUnassigned}
          customers={customers}
          mode="unassigned"
          onEdit={handleEdit}
          onDelete={deleteOrder}
          onAssign={handleAssignClick}
        />
      </div>

      {/* Assigned Orders (collapsible) */}
      <div className="mb-6">
        <button
          onClick={() => setShowAssigned(!showAssigned)}
          className="flex items-center text-lg font-semibold mb-3"
        >
          <span className="mr-2">{showAssigned ? '\u25BC' : '\u25B6'}</span>
          配車済み一覧（{filteredAssigned.length}件）
        </button>
        {showAssigned && (
          <OrderList
            orders={filteredAssigned}
            customers={customers}
            mode="assigned"
            onEdit={handleEdit}
            onDelete={deleteOrder}
            onUnassign={unassignVehicle}
          />
        )}
      </div>

      {/* Order Form Modal */}
      {showForm && (
        <OrderForm
          order={editingOrder}
          customers={customers}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      {/* Assign Vehicle Modal */}
      {assigningOrder && (
        <AssignVehicleModal
          order={assigningOrder}
          vehicles={vehicles}
          onAssign={handleAssignVehicle}
          onCancel={handleAssignCancel}
        />
      )}
    </div>
  );
};
