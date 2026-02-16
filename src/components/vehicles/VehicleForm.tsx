import React, { useState, useEffect } from 'react';
import { Vehicle } from '../../types';

interface VehicleFormProps {
  vehicle?: Vehicle | null;
  onSubmit: (vehicle: Omit<Vehicle, 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

const VEHICLE_TYPES = ['4t', '2t', '1t', '0.5t'];

export const VehicleForm: React.FC<VehicleFormProps> = ({ vehicle, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    radioNumber: '',
    capacity: '',
    vehicleType: '',
    supportedRequestTypes: [] as string[],
    driverName: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (vehicle) {
      setFormData({
        vehicleNumber: vehicle.vehicleNumber,
        radioNumber: vehicle.radioNumber || '',
        capacity: vehicle.capacity?.toString() || '',
        vehicleType: vehicle.vehicleType,
        supportedRequestTypes: vehicle.supportedRequestTypes,
        driverName: vehicle.driverName || '',
        phone: vehicle.phone || '',
        email: vehicle.email || '',
        notes: vehicle.notes || '',
      });
    }
  }, [vehicle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate required array field
    if (formData.supportedRequestTypes.length === 0) {
      setError('対応可能依頼を最低1つ選択してください');
      setLoading(false);
      return;
    }

    try {
      await onSubmit({
        vehicleNumber: formData.vehicleNumber,
        radioNumber: formData.radioNumber || undefined,
        capacity: formData.capacity ? parseFloat(formData.capacity) : undefined,
        vehicleType: formData.vehicleType,
        supportedRequestTypes: formData.supportedRequestTypes,
        driverName: formData.driverName || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        notes: formData.notes || undefined,
      } as Omit<Vehicle, 'createdAt' | 'updatedAt'>);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSupportedType = (type: string) => {
    if (formData.supportedRequestTypes.includes(type)) {
      setFormData({
        ...formData,
        supportedRequestTypes: formData.supportedRequestTypes.filter(t => t !== type),
      });
    } else {
      setFormData({
        ...formData,
        supportedRequestTypes: [...formData.supportedRequestTypes, type],
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{vehicle ? '車両編集' : '車両追加'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">ナンバー *</label>
              <input
                type="text"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
                disabled={!!vehicle}
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">無線番号</label>
              <input
                type="text"
                value={formData.radioNumber}
                onChange={(e) => setFormData({ ...formData, radioNumber: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">積載量 (t)</label>
              <input
                type="number"
                step="0.1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">車種 *</label>
              <select
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="">選択してください</option>
                {VEHICLE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-gray-700 mb-2">対応可能依頼 *</label>
              <div className="flex space-x-4">
                {VEHICLE_TYPES.map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.supportedRequestTypes.includes(type)}
                      onChange={() => toggleSupportedType(type)}
                      className="mr-2"
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">運転手</label>
              <input
                type="text"
                value={formData.driverName}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">電話番号</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-gray-700 mb-2">メールアドレス</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-gray-700 mb-2">備考</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                rows={3}
              />
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
