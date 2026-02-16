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
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">ナンバー</th>
            <th className="px-4 py-2 border">無線番号</th>
            <th className="px-4 py-2 border">車種</th>
            <th className="px-4 py-2 border">対応可能依頼</th>
            <th className="px-4 py-2 border">運転手</th>
            <th className="px-4 py-2 border">電話番号</th>
            <th className="px-4 py-2 border">操作</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map(vehicle => (
            <tr key={vehicle.vehicleNumber} className="hover:bg-gray-50">
              <td className="px-4 py-2 border">{vehicle.vehicleNumber}</td>
              <td className="px-4 py-2 border">{vehicle.radioNumber}</td>
              <td className="px-4 py-2 border">{vehicle.vehicleType}</td>
              <td className="px-4 py-2 border">{vehicle.supportedRequestTypes.join(', ')}</td>
              <td className="px-4 py-2 border">{vehicle.driverName}</td>
              <td className="px-4 py-2 border">{vehicle.phone}</td>
              <td className="px-4 py-2 border">
                <button
                  onClick={() => onEdit(vehicle)}
                  className="px-2 py-1 bg-blue-500 text-white rounded mr-2 hover:bg-blue-600"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(vehicle)}
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {vehicles.length === 0 && (
        <div className="text-center py-8 text-gray-500">車両データがありません</div>
      )}
    </div>
  );
};
