import React, { useState } from 'react';
import { useVehicles } from '../hooks/useVehicles';
import { VehicleList } from '../components/vehicles/VehicleList';
import { VehicleForm } from '../components/vehicles/VehicleForm';
import { Vehicle } from '../types';

export const VehicleMasterPage: React.FC = () => {
  const { vehicles, loading, error, createVehicle, updateVehicle, deleteVehicle } = useVehicles();
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const handleAdd = () => {
    setEditingVehicle(null);
    setShowForm(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowForm(true);
  };

  const handleSubmit = async (vehicle: Omit<Vehicle, 'createdAt' | 'updatedAt'>) => {
    if (editingVehicle) {
      await updateVehicle(editingVehicle.vehicleNumber, vehicle);
    } else {
      await createVehicle(vehicle);
    }
    setShowForm(false);
    setEditingVehicle(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingVehicle(null);
  };

  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">車両マスタ</h1>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          車両追加
        </button>
      </div>
      <VehicleList vehicles={vehicles} onEdit={handleEdit} onDelete={deleteVehicle} />
      {showForm && (
        <VehicleForm
          vehicle={editingVehicle}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};
