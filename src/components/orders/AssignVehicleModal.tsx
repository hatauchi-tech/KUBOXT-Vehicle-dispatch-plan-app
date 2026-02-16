import React, { useState } from 'react';
import { Order, Vehicle } from '../../types';

interface AssignVehicleModalProps {
  order: Order;
  vehicles: Vehicle[];
  onAssign: (orderId: string, vehicleNumber: string, vehicleType: string, driverName: string) => Promise<void>;
  onCancel: () => void;
}

export const AssignVehicleModal: React.FC<AssignVehicleModalProps> = ({
  order,
  vehicles,
  onAssign,
  onCancel,
}) => {
  const [selectedVehicleNumber, setSelectedVehicleNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter vehicles that support the requested vehicle type
  const compatibleVehicles = vehicles.filter(v =>
    v.supportedRequestTypes.includes(order.requestVehicleType)
  );

  const handleAssign = async () => {
    if (!selectedVehicleNumber) {
      setError('車両を選択してください');
      return;
    }

    const selectedVehicle = vehicles.find(v => v.vehicleNumber === selectedVehicleNumber);
    if (!selectedVehicle) {
      setError('選択された車両が見つかりません');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onAssign(
        order.orderId,
        selectedVehicle.vehicleNumber,
        selectedVehicle.vehicleType,
        selectedVehicle.driverName || '',
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('配車に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">車両選択 - 配車</h2>

        <div className="mb-4 bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-2">受注情報</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-500">受注ID:</span> {order.orderId}</div>
            <div><span className="text-gray-500">品名:</span> {order.itemName}</div>
            <div><span className="text-gray-500">積込地:</span> {order.loadAddress1}</div>
            <div><span className="text-gray-500">荷卸地:</span> {order.unloadAddress1}</div>
            <div><span className="text-gray-500">依頼車種:</span> {order.requestVehicleType}</div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2 font-semibold">
            車両を選択してください *
          </label>
          {compatibleVehicles.length > 0 ? (
            <div className="max-h-60 overflow-y-auto border rounded">
              {compatibleVehicles.map(vehicle => (
                <label
                  key={vehicle.vehicleNumber}
                  className={`flex items-center p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 ${
                    selectedVehicleNumber === vehicle.vehicleNumber ? 'bg-blue-100' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="vehicle"
                    value={vehicle.vehicleNumber}
                    checked={selectedVehicleNumber === vehicle.vehicleNumber}
                    onChange={(e) => setSelectedVehicleNumber(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{vehicle.vehicleNumber}</div>
                    <div className="text-sm text-gray-500">
                      {vehicle.vehicleType} | 運転手: {vehicle.driverName || '未設定'} | 対応: {vehicle.supportedRequestTypes.join(', ')}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 border rounded">
              依頼車種「{order.requestVehicleType}」に対応可能な車両がありません
            </div>
          )}
        </div>

        {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            キャンセル
          </button>
          <button
            onClick={handleAssign}
            disabled={loading || !selectedVehicleNumber}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {loading ? '配車中...' : '配車実行'}
          </button>
        </div>
      </div>
    </div>
  );
};
