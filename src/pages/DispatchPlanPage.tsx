import { useState, useMemo } from 'react';
import { useOrders } from '../hooks/useOrders';
import { useVehicles } from '../hooks/useVehicles';
import { useCustomers } from '../hooks/useCustomers';
import { OrderForm } from '../components/orders/OrderForm';
import { OrderList } from '../components/orders/OrderList';
import { AssignVehicleModal } from '../components/orders/AssignVehicleModal';
import { GanttChart } from '../components/gantt/GanttChart';
import { CsvImportModal } from '../components/csv/CsvImportModal';
import { parseOrderCsv } from '../utils/csvParser';
import { bulkImportOrders } from '../services/importService';
import { Order } from '../types';
import { cn } from '../utils/cn';
import { Plus, Upload, List, BarChart3, Filter, X } from 'lucide-react';

type ViewMode = 'list' | 'gantt';

const ORDER_CSV_COLUMNS = ['受付日', '荷主名', '積込日', '積込時間', '積込地1', '積込地2', '品名', '荷卸日', '荷卸時間', '荷卸地1', '荷卸地2', '依頼車種'];
const ORDER_CSV_SAMPLE = [
  ['2026/02/16', '株式会社テスト', '2026/02/17', '09:00', '東京都', '', '鋼材', '2026/02/17', '15:00', '横浜市', '', '4t'],
];

export const DispatchPlanPage: React.FC = () => {
  const { orders, loading, error, createOrder, updateOrder, deleteOrder, assignVehicle, unassignVehicle, refetch } = useOrders();
  const { vehicles } = useVehicles();
  const { customers } = useCustomers();

  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
  const [showAssigned, setShowAssigned] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [scrollToNowTrigger, setScrollToNowTrigger] = useState(0);

  // Filter states
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [filterVehicleType, setFilterVehicleType] = useState('');

  // Unique vehicle types from all orders for the filter dropdown
  const vehicleTypes = useMemo(() => {
    const types = new Set<string>();
    for (const o of orders) {
      if (o.requestVehicleType) types.add(o.requestVehicleType);
    }
    return Array.from(types).sort();
  }, [orders]);

  const hasActiveFilters = filterDateFrom || filterDateTo || filterCustomerId || filterVehicleType;

  // Apply filters to all orders (shared across list + gantt)
  const applyFilters = (orderList: Order[]): Order[] => {
    return orderList.filter(order => {
      if (filterDateFrom) {
        const from = new Date(filterDateFrom);
        if (order.loadDate < from) return false;
      }
      if (filterDateTo) {
        const to = new Date(filterDateTo);
        to.setHours(23, 59, 59, 999);
        if (order.loadDate > to) return false;
      }
      if (filterCustomerId && order.customerId !== filterCustomerId) return false;
      if (filterVehicleType && order.requestVehicleType !== filterVehicleType) return false;
      return true;
    });
  };

  const filteredOrders = useMemo(() => applyFilters(orders), [orders, filterDateFrom, filterDateTo, filterCustomerId, filterVehicleType]);
  const filteredUnassigned = useMemo(() => filteredOrders.filter(o => o.status === 'unassigned'), [filteredOrders]);
  const filteredAssigned = useMemo(() => filteredOrders.filter(o => o.status === 'assigned'), [filteredOrders]);

  const handleAdd = () => {
    setEditingOrder(null);
    setShowForm(true);
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setShowForm(true);
  };

  const handleSubmit = async (order: Omit<Order, 'createdAt' | 'updatedAt'>) => {
    if (editingOrder) {
      await updateOrder(editingOrder.orderId, order);
    } else {
      await createOrder(order);
    }
    setShowForm(false);
    setEditingOrder(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingOrder(null);
  };

  const handleAssignClick = (order: Order) => {
    setAssigningOrder(order);
  };

  const handleAssignVehicle = async (
    orderId: string,
    vehicleNumber: string,
    vehicleType: string,
    driverName: string,
  ) => {
    await assignVehicle(orderId, vehicleNumber, vehicleType, driverName);
    setAssigningOrder(null);
  };

  const handleAssignCancel = () => {
    setAssigningOrder(null);
  };

  const clearFilters = () => {
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterCustomerId('');
    setFilterVehicleType('');
  };

  const handleCsvImport = async (file: File) => {
    const parseResult = await parseOrderCsv(file, customers);
    if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
      return { success: 0, failed: 0, errors: parseResult.errors };
    }
    const result = await bulkImportOrders(parseResult.data);
    result.errors = [...parseResult.errors, ...result.errors];
    await refetch();
    return result;
  };

  const handleUpdateOrderTime = async (orderId: string, loadTime: string, unloadTime: string) => {
    await updateOrder(orderId, { loadTime, unloadTime });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full -m-5">
      {/* Top bar: title + view toggle + filters + actions */}
      <div className="shrink-0 bg-white border-b border-gray-200 px-5 pt-4 pb-3 space-y-3">
        {/* Row 1: Title + actions */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900">配車計画</h1>
            {/* Inline counts */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                未配車 {filteredUnassigned.length}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                配車済 {filteredAssigned.length}
              </span>
            </div>
            {/* "Today" button - only in Gantt mode */}
            {viewMode === 'gantt' && (
              <button
                onClick={() => setScrollToNowTrigger(prev => prev + 1)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium inline-flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <path strokeLinecap="round" strokeWidth="2" d="M12 6v6l4 2" />
                </svg>
                今日
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* View mode toggle */}
            <div className="inline-flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <List className="w-4 h-4" />
                リスト
              </button>
              <button
                onClick={() => setViewMode('gantt')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'gantt'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <BarChart3 className="w-4 h-4" />
                ガント
              </button>
            </div>
            <button
              onClick={() => setShowCsvImport(true)}
              className="px-3 py-1.5 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium inline-flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              新規追加
            </button>
          </div>
        </div>

        {/* Row 2: Filters (always visible) */}
        <div className="flex flex-wrap items-end gap-3">
          <Filter className="w-4 h-4 text-gray-400 mb-2 shrink-0" />
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">積込日（開始）</label>
            <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors w-[140px]" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">積込日（終了）</label>
            <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors w-[140px]" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">荷主</label>
            <select value={filterCustomerId} onChange={(e) => setFilterCustomerId(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors w-[160px]">
              <option value="">すべて</option>
              {customers.map(c => (
                <option key={c.customerId} value={c.customerId}>{c.customerName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">車種</label>
            <select value={filterVehicleType} onChange={(e) => setFilterVehicleType(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors w-[120px]">
              <option value="">すべて</option>
              {vehicleTypes.map(vt => (
                <option key={vt} value={vt}>{vt}</option>
              ))}
            </select>
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors inline-flex items-center gap-1 mb-px">
              <X className="w-3.5 h-3.5" />
              クリア
            </button>
          )}
        </div>
      </div>

      {/* Main content area */}
      {viewMode === 'gantt' ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <GanttChart
            vehicles={vehicles}
            orders={filteredOrders}
            customers={customers}
            onAssignVehicle={assignVehicle}
            onUnassignVehicle={unassignVehicle}
            onUpdateOrderTime={handleUpdateOrderTime}
            scrollToNowTrigger={scrollToNowTrigger}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Unassigned Orders */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">未配車一覧（{filteredUnassigned.length}件）</h2>
            <OrderList
              orders={filteredUnassigned}
              customers={customers}
              mode="unassigned"
              onEdit={handleEdit}
              onDelete={deleteOrder}
              onAssign={handleAssignClick}
            />
          </div>

          {/* Assigned Orders (collapsible) */}
          <div>
            <button onClick={() => setShowAssigned(!showAssigned)} className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 hover:text-gray-900 transition-colors">
              <span className="text-xs">{showAssigned ? '\u25BC' : '\u25B6'}</span>
              配車済み一覧（{filteredAssigned.length}件）
            </button>
            {showAssigned && (
              <OrderList
                orders={filteredAssigned}
                customers={customers}
                mode="assigned"
                onEdit={handleEdit}
                onDelete={deleteOrder}
                onUnassign={unassignVehicle}
              />
            )}
          </div>
        </div>
      )}

      {/* Order Form Modal */}
      {showForm && (
        <OrderForm
          order={editingOrder}
          customers={customers}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      {/* Assign Vehicle Modal */}
      {assigningOrder && (
        <AssignVehicleModal
          order={assigningOrder}
          vehicles={vehicles}
          onAssign={handleAssignVehicle}
          onCancel={handleAssignCancel}
        />
      )}

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={showCsvImport}
        onClose={() => setShowCsvImport(false)}
        title="受注データCSVインポート"
        onImport={handleCsvImport}
        templateColumns={ORDER_CSV_COLUMNS}
        sampleData={ORDER_CSV_SAMPLE}
      />
    </div>
  );
};
