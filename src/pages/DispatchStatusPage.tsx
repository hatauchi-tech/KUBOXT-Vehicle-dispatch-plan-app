import { useState, useMemo } from 'react';
import { useOrders } from '../hooks/useOrders';
import { useCustomers } from '../hooks/useCustomers';
import { useVehicles } from '../hooks/useVehicles';
import { Order } from '../types';
import { Package, CheckCircle2, AlertTriangle, TrendingUp, ChevronDown, ChevronRight, ChevronsUpDown, X, Filter } from 'lucide-react';

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

type GroupBy = 'none' | 'vehicle' | 'customer' | 'date' | 'driver';
type StatusFilter = '' | 'assigned' | 'unassigned';

export const DispatchStatusPage: React.FC = () => {
  const { orders, loading, error, unassignVehicle } = useOrders();
  const { customers } = useCustomers();
  const { vehicles } = useVehicles();

  // Filter states
  const [filterLoadDateFrom, setFilterLoadDateFrom] = useState('');
  const [filterLoadDateTo, setFilterLoadDateTo] = useState('');
  const [filterUnloadDateFrom, setFilterUnloadDateFrom] = useState('');
  const [filterUnloadDateTo, setFilterUnloadDateTo] = useState('');
  const [filterVehicleNumber, setFilterVehicleNumber] = useState('');
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [filterDriverName, setFilterDriverName] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Statistics (from all orders, before filtering)
  const totalCount = orders.length;
  const assignedCount = useMemo(() => orders.filter(o => o.status === 'assigned').length, [orders]);
  const unassignedCount = useMemo(() => orders.filter(o => o.status === 'unassigned').length, [orders]);
  const assignRate = totalCount > 0 ? Math.round((assignedCount / totalCount) * 100) : 0;

  // Unique values for filter dropdowns
  const allVehicleNumbers = useMemo(() => {
    const nums = new Set<string>();
    for (const v of vehicles) nums.add(v.vehicleNumber);
    return Array.from(nums).sort();
  }, [vehicles]);

  const allDriverNames = useMemo(() => {
    const names = new Set<string>();
    for (const v of vehicles) {
      if (v.driverName) names.add(v.driverName);
    }
    return Array.from(names).sort();
  }, [vehicles]);

  const hasActiveFilters = filterLoadDateFrom || filterLoadDateTo || filterUnloadDateFrom || filterUnloadDateTo || filterVehicleNumber || filterCustomerId || filterDriverName || filterStatus;

  // Apply filters to ALL orders (not just assigned)
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (filterLoadDateFrom) {
        const from = new Date(filterLoadDateFrom);
        if (order.loadDate < from) return false;
      }
      if (filterLoadDateTo) {
        const to = new Date(filterLoadDateTo);
        to.setHours(23, 59, 59, 999);
        if (order.loadDate > to) return false;
      }
      if (filterUnloadDateFrom) {
        const from = new Date(filterUnloadDateFrom);
        if (order.unloadDate < from) return false;
      }
      if (filterUnloadDateTo) {
        const to = new Date(filterUnloadDateTo);
        to.setHours(23, 59, 59, 999);
        if (order.unloadDate > to) return false;
      }
      if (filterVehicleNumber && order.assignedVehicleNumber !== filterVehicleNumber) return false;
      if (filterCustomerId && order.customerId !== filterCustomerId) return false;
      if (filterDriverName && order.assignedDriverName !== filterDriverName) return false;
      if (filterStatus === 'assigned' && order.status !== 'assigned') return false;
      if (filterStatus === 'unassigned' && order.status !== 'unassigned') return false;
      return true;
    });
  }, [orders, filterLoadDateFrom, filterLoadDateTo, filterUnloadDateFrom, filterUnloadDateTo, filterVehicleNumber, filterCustomerId, filterDriverName, filterStatus]);

  // Grouping logic
  const groupedOrders = useMemo(() => {
    if (groupBy === 'none') return null;

    const groups = new Map<string, Order[]>();
    filteredOrders.forEach(order => {
      let key: string;
      switch (groupBy) {
        case 'vehicle':
          key = order.assignedVehicleNumber || '未割当';
          break;
        case 'customer':
          key = order.customerId;
          break;
        case 'date':
          key = formatDate(order.loadDate);
          break;
        case 'driver':
          key = order.assignedDriverName || '未割当';
          break;
        default:
          key = '';
      }
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(order);
    });
    return groups;
  }, [filteredOrders, groupBy]);

  const getCustomerName = (customerId: string): string => {
    const customer = customers.find(c => c.customerId === customerId);
    return customer?.customerName || customerId;
  };

  const getGroupLabel = (key: string): string => {
    switch (groupBy) {
      case 'vehicle': {
        const v = vehicles.find(v => v.vehicleNumber === key);
        return v ? `${key} (${v.driverName || '運転手未設定'})` : key;
      }
      case 'customer':
        return getCustomerName(key);
      case 'date':
        return key;
      case 'driver':
        return key;
      default:
        return key;
    }
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    if (groupedOrders) {
      setExpandedGroups(new Set(groupedOrders.keys()));
    }
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  const handleUnassign = async (order: Order) => {
    if (window.confirm(`受注 ${order.orderId} の配車を取消してもよろしいですか？`)) {
      try {
        await unassignVehicle(order.orderId);
      } catch (err) {
        alert(err instanceof Error ? err.message : '配車取消に失敗しました');
      }
    }
  };

  const clearFilters = () => {
    setFilterLoadDateFrom('');
    setFilterLoadDateTo('');
    setFilterUnloadDateFrom('');
    setFilterUnloadDateTo('');
    setFilterVehicleNumber('');
    setFilterCustomerId('');
    setFilterDriverName('');
    setFilterStatus('');
  };

  const renderStatusBadge = (status: string) => {
    if (status === 'assigned') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="w-3 h-3" />
          配車済
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">
        <AlertTriangle className="w-3 h-3" />
        未配車
      </span>
    );
  };

  const renderOrderRow = (order: Order) => (
    <tr key={order.orderId} className="hover:bg-gray-50/80 transition-colors">
      <td className="px-4 py-3 text-sm text-gray-900 font-medium whitespace-nowrap">{order.orderId}</td>
      <td className="px-4 py-3 text-sm whitespace-nowrap">{renderStatusBadge(order.status)}</td>
      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{getCustomerName(order.customerId)}</td>
      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{order.itemName}</td>
      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
        {formatDate(order.loadDate)}
        {order.loadTime && <span className="text-gray-400 ml-1">{order.loadTime}</span>}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
        {formatDate(order.unloadDate)}
        {order.unloadTime && <span className="text-gray-400 ml-1">{order.unloadTime}</span>}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
        {order.assignedVehicleNumber ? (
          <>
            <span className="font-medium text-gray-900">{order.assignedVehicleNumber}</span>
            {order.assignedVehicleType && (
              <span className="text-gray-400 ml-1">({order.assignedVehicleType})</span>
            )}
          </>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{order.assignedDriverName || <span className="text-gray-400">-</span>}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        {order.status === 'assigned' && (
          <button
            onClick={() => handleUnassign(order)}
            className="px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors inline-flex items-center gap-1 min-h-[44px]"
          >
            <X className="w-3 h-3" />
            取消
          </button>
        )}
      </td>
    </tr>
  );

  const renderTable = (orderList: Order[]) => (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50/80">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">受注ID</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">ステータス</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">荷主</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">品名</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">積込日</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">荷卸日</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">車両</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">運転手</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orderList.map(renderOrderRow)}
        </tbody>
      </table>
      {orderList.length === 0 && (
        <div className="text-center py-12 text-sm text-gray-400">該当する受注データがありません</div>
      )}
    </div>
  );

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900">配車状況確認</h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-4 flex items-center gap-4 border-l-4 border-l-blue-500">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">全件数</div>
            <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-4 flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">配車済み</div>
            <div className="text-2xl font-bold text-emerald-600">{assignedCount}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-4 flex items-center gap-4 border-l-4 border-l-amber-500">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">未配車</div>
            <div className="text-2xl font-bold text-amber-600">{unassignedCount}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-4 flex items-center gap-4 border-l-4 border-l-blue-500">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">配車率</div>
            <div className="text-2xl font-bold text-blue-600">{assignRate}%</div>
          </div>
        </div>
      </div>

      {/* Filter Area */}
      <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">絞り込み</span>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">積込日（開始）</label>
            <input type="date" value={filterLoadDateFrom} onChange={(e) => setFilterLoadDateFrom(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors w-[140px]" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">積込日（終了）</label>
            <input type="date" value={filterLoadDateTo} onChange={(e) => setFilterLoadDateTo(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors w-[140px]" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">荷卸日（開始）</label>
            <input type="date" value={filterUnloadDateFrom} onChange={(e) => setFilterUnloadDateFrom(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors w-[140px]" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">荷卸日（終了）</label>
            <input type="date" value={filterUnloadDateTo} onChange={(e) => setFilterUnloadDateTo(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors w-[140px]" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">車両</label>
            <select value={filterVehicleNumber} onChange={(e) => setFilterVehicleNumber(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors w-[140px]">
              <option value="">すべて</option>
              {allVehicleNumbers.map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
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
            <label className="block text-[11px] font-medium text-gray-500 mb-1">運転手</label>
            <select value={filterDriverName} onChange={(e) => setFilterDriverName(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors w-[140px]">
              <option value="">すべて</option>
              {allDriverNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">配車状況</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors w-[120px]">
              <option value="">すべて</option>
              <option value="assigned">配車済み</option>
              <option value="unassigned">未配車</option>
            </select>
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors inline-flex items-center gap-1">
              <X className="w-3.5 h-3.5" />
              クリア
            </button>
          )}
        </div>
      </div>

      {/* Grouping + Order list */}
      <div>
        <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
          <h2 className="text-sm font-semibold text-gray-700">全案件一覧（{filteredOrders.length}件）</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-500">グルーピング:</label>
              <select value={groupBy} onChange={(e) => { setGroupBy(e.target.value as GroupBy); setExpandedGroups(new Set()); }}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors">
                <option value="none">なし</option>
                <option value="vehicle">車両別</option>
                <option value="customer">荷主別</option>
                <option value="date">日付別</option>
                <option value="driver">運転手別</option>
              </select>
            </div>
            {groupBy !== 'none' && (
              <div className="flex gap-3">
                <button onClick={expandAll} className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1">
                  <ChevronsUpDown className="w-3.5 h-3.5" />
                  すべて展開
                </button>
                <button onClick={collapseAll} className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1">
                  <ChevronsUpDown className="w-3.5 h-3.5" />
                  すべて折りたたむ
                </button>
              </div>
            )}
          </div>
        </div>

        {groupBy === 'none' ? (
          <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden">
            {renderTable(filteredOrders)}
          </div>
        ) : (
          groupedOrders && Array.from(groupedOrders.entries()).map(([key, groupOrders]) => (
            <div key={key} className="bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden mb-3">
              <button
                onClick={() => toggleGroup(key)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors"
              >
                <span className="font-semibold text-sm text-gray-800 inline-flex items-center gap-2">
                  {expandedGroups.has(key) ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                  {getGroupLabel(key)}
                </span>
                <span className="text-xs font-medium text-gray-400 bg-gray-200/60 px-2 py-0.5 rounded-full">{groupOrders.length}件</span>
              </button>
              {expandedGroups.has(key) && renderTable(groupOrders)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
