import { useState } from 'react';
import { Plus, Upload, Building2 } from 'lucide-react';
import { useCustomers } from '../hooks/useCustomers';
import { CustomerList } from '../components/customers/CustomerList';
import { CustomerForm } from '../components/customers/CustomerForm';
import { CsvImportModal } from '../components/csv/CsvImportModal';
import { parseCustomerCsv } from '../utils/csvParser';
import { bulkImportCustomers } from '../services/importService';
import { Customer } from '../types';

const CUSTOMER_CSV_COLUMNS = ['荷主ID', '荷主名', '電話番号', '住所', '特記事項'];
const CUSTOMER_CSV_SAMPLE = [
  ['C001', '株式会社テスト', '03-1234-5678', '東京都千代田区1-1-1', ''],
];

export const CustomerMasterPage: React.FC = () => {
  const { customers, loading, error, createCustomer, updateCustomer, deleteCustomer, refetch } = useCustomers();
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showCsvImport, setShowCsvImport] = useState(false);

  const handleAdd = () => {
    setEditingCustomer(null);
    setShowForm(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleSubmit = async (customer: Omit<Customer, 'createdAt' | 'updatedAt'>) => {
    if (editingCustomer) {
      await updateCustomer(editingCustomer.customerId, customer);
    } else {
      await createCustomer(customer);
    }
    setShowForm(false);
    setEditingCustomer(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCustomer(null);
  };

  const handleCsvImport = async (file: File) => {
    const parseResult = await parseCustomerCsv(file);
    if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
      return { success: 0, failed: 0, errors: parseResult.errors };
    }
    const result = await bulkImportCustomers(parseResult.data);
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
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">荷主マスタ</h1>
            <span className="inline-flex items-center gap-1 mt-0.5 text-xs text-gray-500">
              登録件数
              <span className="inline-flex items-center justify-center bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 text-xs font-medium">
                {customers.length}件
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
            荷主追加
          </button>
        </div>
      </div>
      <CustomerList customers={customers} onEdit={handleEdit} onDelete={deleteCustomer} />
      {showForm && (
        <CustomerForm
          customer={editingCustomer}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
      <CsvImportModal
        isOpen={showCsvImport}
        onClose={() => setShowCsvImport(false)}
        title="荷主マスタCSVインポート"
        onImport={handleCsvImport}
        templateColumns={CUSTOMER_CSV_COLUMNS}
        sampleData={CUSTOMER_CSV_SAMPLE}
      />
    </div>
  );
};
