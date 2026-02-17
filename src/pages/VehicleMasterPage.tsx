import { useState } from 'react';
import { Plus, Upload, Truck } from 'lucide-react';
import { useVehicles } from '../hooks/useVehicles';
import { VehicleList } from '../components/vehicles/VehicleList';
import { VehicleForm } from '../components/vehicles/VehicleForm';
import { CsvImportModal } from '../components/csv/CsvImportModal';
import { parseVehicleCsv } from '../utils/csvParser';
import { bulkImportVehicles } from '../services/importService';
import { Vehicle } from '../types';

const VEHICLE_CSV_COLUMNS = ['ナンバー', '無線番号', '積載量', '車種', '対応可能依頼', '運転手', '電話番号', 'メール', '備考'];
const VEHICLE_CSV_SAMPLE = [
  ['品川100あ1234', 'R-001', '4', '4t', '4t,2t', '山田太郎', '090-1234-5678', 'yamada@example.com', ''],
];

export const VehicleMasterPage: React.FC = () => {
  const { vehicles, loading, error, createVehicle, updateVehicle, deleteVehicle, refetch } = useVehicles();
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [showCsvImport, setShowCsvImport] = useState(false);

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

  const handleCsvImport = async (file: File) => {
    const parseResult = await parseVehicleCsv(file);
    if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
      return { success: 0, failed: 0, errors: parseResult.errors };
    }
    const result = await bulkImportVehicles(parseResult.data);
    result.errors = [...parseResult.errors, ...result.errors];
    await refetch();
    return result;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-gray-400 text-sm">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">車両マスタ</h1>
            <span className="inline-flex items-center gap-1 mt-0.5 text-xs text-gray-500">
              登録台数
              <span className="inline-flex items-center justify-center bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 text-xs font-medium">
                {vehicles.length}台
              </span>
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCsvImport(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            <Upload className="w-4 h-4" />
            CSVインポート
          </button>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            車両追加
          </button>
        </div>
      </div>
      <VehicleList vehicles={vehicles} onEdit={handleEdit} onDelete={deleteVehicle} />
      {showForm && (
        <VehicleForm
          vehicle={editingVehicle}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
      <CsvImportModal
        isOpen={showCsvImport}
        onClose={() => setShowCsvImport(false)}
        title="車両マスタCSVインポート"
        onImport={handleCsvImport}
        templateColumns={VEHICLE_CSV_COLUMNS}
        sampleData={VEHICLE_CSV_SAMPLE}
      />
    </div>
  );
};
