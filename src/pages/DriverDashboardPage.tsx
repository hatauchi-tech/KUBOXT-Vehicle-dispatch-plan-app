import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, FileText, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useOrders } from '../hooks/useOrders';
import { Order } from '../types';

export const DriverDashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { orders, loading, error } = useOrders('assigned');
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const myOrders = useMemo(() => {
    if (!currentUser) return [];
    return orders.filter((order) => {
      const matchesDriver =
        order.assignedDriverName === currentUser.displayName ||
        order.assignedDriverName === currentUser.email;
      const matchesDate = isSameDay(order.loadDate, selectedDate);
      return matchesDriver && matchesDate;
    });
  }, [orders, currentUser, selectedDate]);

  const handlePrevDay = () => {
    setSelectedDate((prev) => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => addDays(prev, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const handleStartReport = (order: Order) => {
    navigate(`/daily-report?orderId=${order.orderId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400 text-sm">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">運転手ダッシュボード</h1>
        {currentUser && (
          <p className="text-sm text-gray-500 mt-1">
            {currentUser.displayName || currentUser.email} さん
          </p>
        )}
      </div>

      {/* 日付ナビゲーション */}
      <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevDay}
            className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
            aria-label="前日"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-base font-semibold text-gray-900">
              <Calendar className="w-4 h-4 text-gray-400" />
              {format(selectedDate, 'yyyy年M月d日(E)', { locale: ja })}
            </div>
            {!isSameDay(selectedDate, new Date()) && (
              <button
                onClick={handleToday}
                className="mt-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                今日に戻る
              </button>
            )}
          </div>

          <button
            onClick={handleNextDay}
            className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
            aria-label="翌日"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* 配車件数 */}
      <div className="mb-4">
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
          配車予定:
          <span className="inline-flex items-center justify-center bg-gray-100 text-gray-700 rounded-full px-2.5 py-0.5 text-xs font-medium">
            {myOrders.length}件
          </span>
        </span>
      </div>

      {/* 案件リスト */}
      {myOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">本日の配車予定はありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myOrders.map((order) => (
            <div
              key={order.orderId}
              className="bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden"
            >
              {/* カードヘッダー（タップで展開） */}
              <button
                onClick={() => toggleExpand(order.orderId)}
                className="w-full text-left p-4 hover:bg-gray-50/50 active:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {order.itemName}
                      </span>
                      {order.assignedVehicleType && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {order.assignedVehicleType}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-emerald-600 font-medium whitespace-nowrap">積込</span>
                        <span className="text-gray-800 truncate">{order.loadAddress1}</span>
                        {order.loadTime && (
                          <span className="text-gray-400 whitespace-nowrap text-xs">{order.loadTime}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-red-600 font-medium whitespace-nowrap">荷卸</span>
                        <span className="text-gray-800 truncate">{order.unloadAddress1}</span>
                        {order.unloadTime && (
                          <span className="text-gray-400 whitespace-nowrap text-xs">{order.unloadTime}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${
                      expandedOrderId === order.orderId ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {/* 展開エリア */}
              {expandedOrderId === order.orderId && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                  <dl className="space-y-2 text-sm">
                    <div className="flex">
                      <dt className="text-gray-500 w-24 flex-shrink-0">依頼ID</dt>
                      <dd className="text-gray-800">{order.orderId}</dd>
                    </div>
                    <div className="flex">
                      <dt className="text-gray-500 w-24 flex-shrink-0">品名</dt>
                      <dd className="text-gray-800">{order.itemName}</dd>
                    </div>
                    <div className="flex">
                      <dt className="text-gray-500 w-24 flex-shrink-0">積込地1</dt>
                      <dd className="text-gray-800">{order.loadAddress1}</dd>
                    </div>
                    {order.loadAddress2 && (
                      <div className="flex">
                        <dt className="text-gray-500 w-24 flex-shrink-0">積込地2</dt>
                        <dd className="text-gray-800">{order.loadAddress2}</dd>
                      </div>
                    )}
                    <div className="flex">
                      <dt className="text-gray-500 w-24 flex-shrink-0">積込時間</dt>
                      <dd className="text-gray-800">{order.loadTime || '指定なし'}</dd>
                    </div>
                    <div className="flex">
                      <dt className="text-gray-500 w-24 flex-shrink-0">荷卸地1</dt>
                      <dd className="text-gray-800">{order.unloadAddress1}</dd>
                    </div>
                    {order.unloadAddress2 && (
                      <div className="flex">
                        <dt className="text-gray-500 w-24 flex-shrink-0">荷卸地2</dt>
                        <dd className="text-gray-800">{order.unloadAddress2}</dd>
                      </div>
                    )}
                    <div className="flex">
                      <dt className="text-gray-500 w-24 flex-shrink-0">荷卸日</dt>
                      <dd className="text-gray-800">
                        {format(order.unloadDate, 'yyyy/MM/dd')}
                      </dd>
                    </div>
                    <div className="flex">
                      <dt className="text-gray-500 w-24 flex-shrink-0">荷卸時間</dt>
                      <dd className="text-gray-800">{order.unloadTime || '指定なし'}</dd>
                    </div>
                    {order.assignedVehicleNumber && (
                      <div className="flex">
                        <dt className="text-gray-500 w-24 flex-shrink-0">車両番号</dt>
                        <dd className="text-gray-800">{order.assignedVehicleNumber}</dd>
                      </div>
                    )}
                  </dl>

                  <div className="mt-4">
                    <button
                      onClick={() => handleStartReport(order)}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-lg transition-colors min-h-[48px] text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      日報を入力する
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
