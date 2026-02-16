import { useState, useEffect } from 'react';
import { Vehicle } from '../types';
import { vehicleService } from '../services/vehicleService';

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const data = await vehicleService.getAll();
      setVehicles(data);
      setError(null);
    } catch (err) {
      setError('車両データの取得に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const createVehicle = async (vehicle: Omit<Vehicle, 'createdAt' | 'updatedAt'>) => {
    try {
      await vehicleService.create(vehicle);
      await fetchVehicles();
    } catch (err) {
      console.error('Failed to create vehicle:', err);
      throw new Error(`車両の追加に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    }
  };

  const updateVehicle = async (vehicleNumber: string, updates: Partial<Vehicle>) => {
    try {
      await vehicleService.update(vehicleNumber, updates);
      await fetchVehicles();
    } catch (err) {
      console.error('Failed to update vehicle:', err);
      throw new Error(`車両の更新に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    }
  };

  const deleteVehicle = async (vehicleNumber: string) => {
    try {
      await vehicleService.delete(vehicleNumber);
      await fetchVehicles();
    } catch (err) {
      console.error('Failed to delete vehicle:', err);
      throw new Error(`車両の削除に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    }
  };

  return {
    vehicles,
    loading,
    error,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    refetch: fetchVehicles,
  };
};
