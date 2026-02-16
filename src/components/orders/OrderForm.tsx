import React, { useState, useEffect } from 'react';
import { Order, Customer } from '../../types';

interface OrderFormProps {
  order?: Order | null;
  customers: Customer[];
  onSubmit: (order: Omit<Order, 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

const VEHICLE_TYPES = ['4t', '2t', '1t', '0.5t'];

const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const OrderForm: React.FC<OrderFormProps> = ({ order, customers, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    orderId: '',
    receivedDate: formatDateForInput(new Date()),
    customerId: '',
    loadDate: '',
    loadTime: '',
    loadAddress1: '',
    loadAddress2: '',
    itemName: '',
    unloadDate: '',
    unloadTime: '',
    unloadAddress1: '',
    unloadAddress2: '',
    requestVehicleType: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (order) {
      setFormData({
        orderId: order.orderId,
        receivedDate: formatDateForInput(order.receivedDate),
        customerId: order.customerId,
        loadDate: formatDateForInput(order.loadDate),
        loadTime: order.loadTime || '',
        loadAddress1: order.loadAddress1,
        loadAddress2: order.loadAddress2 || '',
        itemName: order.itemName,
        unloadDate: formatDateForInput(order.unloadDate),
        unloadTime: order.unloadTime || '',
        unloadAddress1: order.unloadAddress1,
        unloadAddress2: order.unloadAddress2 || '',
        requestVehicleType: order.requestVehicleType,
      });
    }
  }, [order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit({
        orderId: formData.orderId,
        receivedDate: new Date(formData.receivedDate),
        customerId: formData.customerId,
        loadDate: new Date(formData.loadDate),
        loadTime: formData.loadTime || undefined,
        loadAddress1: formData.loadAddress1,
        loadAddress2: formData.loadAddress2 || undefined,
        itemName: formData.itemName,
        unloadDate: new Date(formData.unloadDate),
        unloadTime: formData.unloadTime || undefined,
        unloadAddress1: formData.unloadAddress1,
        unloadAddress2: formData.unloadAddress2 || undefined,
        requestVehicleType: formData.requestVehicleType,
        status: order?.status || 'unassigned',
        assignedVehicleNumber: order?.assignedVehicleNumber,
        assignedVehicleCode: order?.assignedVehicleCode,
        assignedVehicleType: order?.assignedVehicleType,
        assignedDriverName: order?.assignedDriverName,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('保存に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-screen overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{order ? '受注編集' : '新規受注追加'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">受注ID *</label>
              <input
                type="text"
                value={formData.orderId}
                onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
                disabled={!!order}
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">受付日 *</label>
              <input
                type="date"
                value={formData.receivedDate}
                onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">荷主 *</label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="">選択してください</option>
                {customers.map(c => (
                  <option key={c.customerId} value={c.customerId}>{c.customerName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">品名 *</label>
              <input
                type="text"
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">積込日 *</label>
              <input
                type="date"
                value={formData.loadDate}
                onChange={(e) => setFormData({ ...formData, loadDate: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">積込時間</label>
              <input
                type="time"
                value={formData.loadTime}
                onChange={(e) => setFormData({ ...formData, loadTime: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">積込地1 *</label>
              <input
                type="text"
                value={formData.loadAddress1}
                onChange={(e) => setFormData({ ...formData, loadAddress1: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">積込地2</label>
              <input
                type="text"
                value={formData.loadAddress2}
                onChange={(e) => setFormData({ ...formData, loadAddress2: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">荷卸日 *</label>
              <input
                type="date"
                value={formData.unloadDate}
                onChange={(e) => setFormData({ ...formData, unloadDate: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">荷卸時間</label>
              <input
                type="time"
                value={formData.unloadTime}
                onChange={(e) => setFormData({ ...formData, unloadTime: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">荷卸地1 *</label>
              <input
                type="text"
                value={formData.unloadAddress1}
                onChange={(e) => setFormData({ ...formData, unloadAddress1: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">荷卸地2</label>
              <input
                type="text"
                value={formData.unloadAddress2}
                onChange={(e) => setFormData({ ...formData, unloadAddress2: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">依頼車種 *</label>
              <select
                value={formData.requestVehicleType}
                onChange={(e) => setFormData({ ...formData, requestVehicleType: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="">選択してください</option>
                {VEHICLE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <div className="mt-4 text-red-500 text-sm">{error}</div>}
          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
