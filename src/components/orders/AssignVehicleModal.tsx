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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-0 w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">車両選択 - 配車</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="mb-5 bg-gray-50/80 rounded-xl p-4 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-2.5">受注情報</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              <div><span className="text-gray-400">受注ID:</span> <span className="text-gray-700">{order.orderId}</span></div>
              <div><span className="text-gray-400">品名:</span> <span className="text-gray-700">{order.itemName}</span></div>
              <div><span className="text-gray-400">積込地:</span> <span className="text-gray-700">{order.loadAddress1}</span></div>
              <div><span className="text-gray-400">荷卸地:</span> <span className="text-gray-700">{order.unloadAddress1}</span></div>
              <div><span className="text-gray-400">依頼車種:</span> <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium ml-1">{order.requestVehicleType}</span></div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              車両を選択してください *
            </label>
            {compatibleVehicles.length > 0 ? (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {compatibleVehicles.map(vehicle => (
                  <label
                    key={vehicle.vehicleNumber}
                    className={`flex items-center p-3.5 rounded-xl cursor-pointer border transition-all ${
                      selectedVehicleNumber === vehicle.vehicleNumber
                        ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="vehicle"
                      value={vehicle.vehicleNumber}
                      checked={selectedVehicleNumber === vehicle.vehicleNumber}
                      onChange={(e) => setSelectedVehicleNumber(e.target.value)}
                      className="mr-3 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">{vehicle.vehicleNumber}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {vehicle.vehicleType} | 運転手: {vehicle.driverName || '未設定'} | 対応: {vehicle.supportedRequestTypes.join(', ')}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 bg-gray-50/50 rounded-xl border border-gray-100">
                <svg className="mx-auto h-8 w-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                <p className="text-sm">依頼車種「{order.requestVehicleType}」に対応可能な車両がありません</p>
              </div>
            )}
          </div>

          {error && <div className="mt-4 text-red-500 text-sm">{error}</div>}
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 min-h-[44px] text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleAssign}
            disabled={loading || !selectedVehicleNumber}
            className="px-4 py-2 min-h-[44px] text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
          >
            {loading ? '配車中...' : '配車実行'}
          </button>
        </div>
      </div>
    </div>
  );
};
