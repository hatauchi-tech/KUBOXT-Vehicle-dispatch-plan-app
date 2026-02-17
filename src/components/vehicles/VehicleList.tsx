import React from 'react';
import { Vehicle } from '../../types';

interface VehicleListProps {
  vehicles: Vehicle[];
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicleNumber: string) => void;
}

export const VehicleList: React.FC<VehicleListProps> = ({ vehicles, onEdit, onDelete }) => {
  const handleDelete = (vehicle: Vehicle) => {
    if (window.confirm(`車両 ${vehicle.vehicleNumber} を削除してもよろしいですか？`)) {
      onDelete(vehicle.vehicleNumber);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">ナンバー</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">無線番号</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">車種</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">対応可能依頼</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">運転手</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">電話番号</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vehicles.map(vehicle => (
              <tr key={vehicle.vehicleNumber} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{vehicle.vehicleNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{vehicle.radioNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{vehicle.vehicleType}</td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{vehicle.supportedRequestTypes.join(', ')}</td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{vehicle.driverName}</td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{vehicle.phone}</td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(vehicle)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md px-2.5 py-1.5 min-h-[44px] text-xs font-medium transition-colors"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(vehicle)}
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
      {vehicles.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <svg className="mx-auto h-10 w-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
          <p className="text-sm">車両データがありません</p>
        </div>
      )}
    </div>
  );
};
