import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDailyReports } from '../hooks/useDailyReports';
import { orderService } from '../services/orderService';
import { Order, DailyReport } from '../types';

const INSPECTION_OPTIONS = ['良好', '要注意', '要修理'] as const;

export const DailyReportPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { createReport, updateReport, getReportByOrderId } = useDailyReports();

  const orderId = searchParams.get('orderId') || '';

  const [order, setOrder] = useState<Order | null>(null);
  const [existingReport, setExistingReport] = useState<DailyReport | null>(null);
  const [orderLoading, setOrderLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // フォーム状態
  const [departureTime, setDepartureTime] = useState('');
  const [loadStartTime, setLoadStartTime] = useState('');
  const [loadEndTime, setLoadEndTime] = useState('');
  const [unloadStartTime, setUnloadStartTime] = useState('');
  const [unloadEndTime, setUnloadEndTime] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [departureMeter, setDepartureMeter] = useState('');
  const [returnMeter, setReturnMeter] = useState('');
  const [vehicleInspection, setVehicleInspection] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = useCallback(async () => {
    if (!orderId) {
      setOrderLoading(false);
      return;
    }
    try {
      setOrderLoading(true);
      const [orderData, reportData] = await Promise.all([
        orderService.getById(orderId),
        getReportByOrderId(orderId),
      ]);
      setOrder(orderData);
      if (reportData) {
        setExistingReport(reportData);
        setDepartureTime(reportData.departureTime || '');
        setLoadStartTime(reportData.loadStartTime || '');
        setLoadEndTime(reportData.loadEndTime || '');
        setUnloadStartTime(reportData.unloadStartTime || '');
        setUnloadEndTime(reportData.unloadEndTime || '');
        setReturnTime(reportData.returnTime || '');
        setDepartureMeter(
          reportData.departureMeter != null ? String(reportData.departureMeter) : ''
        );
        setReturnMeter(
          reportData.returnMeter != null ? String(reportData.returnMeter) : ''
        );
        setVehicleInspection(reportData.vehicleInspection || '');
        setNotes(reportData.notes || '');
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setErrorMessage('データの読み込みに失敗しました');
    } finally {
      setOrderLoading(false);
    }
  }, [orderId, getReportByOrderId]);

  useEffect(() => {
    loadData();
    // loadData is memoized with useCallback; include it as dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const handleSave = async () => {
    if (!order || !currentUser) return;

    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const reportData = {
        orderId: order.orderId,
        vehicleNumber: order.assignedVehicleNumber || '',
        departureTime: departureTime || undefined,
        loadStartTime: loadStartTime || undefined,
        loadEndTime: loadEndTime || undefined,
        unloadStartTime: unloadStartTime || undefined,
        unloadEndTime: unloadEndTime || undefined,
        returnTime: returnTime || undefined,
        departureMeter: departureMeter ? Number(departureMeter) : undefined,
        returnMeter: returnMeter ? Number(returnMeter) : undefined,
        vehicleInspection: vehicleInspection || undefined,
        notes: notes || undefined,
      };

      if (existingReport) {
        await updateReport(existingReport.reportId, reportData);
        setSuccessMessage('日報を更新しました');
      } else {
        const reportId = `${order.orderId}_${Date.now()}`;
        await createReport({
          ...reportData,
          reportId,
        });
        setExistingReport({
          ...reportData,
          reportId,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as DailyReport);
        setSuccessMessage('日報を保存しました');
      }
    } catch (err) {
      console.error('Failed to save daily report:', err);
      setErrorMessage(
        `日報の保存に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`
      );
    } finally {
      setSaving(false);
    }
  };

  if (orderLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400 text-sm">読み込み中...</div>
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700 text-sm">
          依頼IDが指定されていません。
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          戻る
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          依頼データが見つかりません。
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          戻る
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="戻る"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">日報入力</h1>
      </div>

      {/* 成功メッセージ */}
      {successMessage && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {successMessage}
        </div>
      )}

      {/* エラーメッセージ */}
      {errorMessage && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* 受注情報（読み取り専用） */}
      <div className="bg-blue-50 border border-blue-200/60 rounded-xl p-4 mb-6">
        <h2 className="text-sm font-semibold text-blue-800 mb-3">受注情報</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex">
            <dt className="text-blue-600 w-20 flex-shrink-0">依頼ID</dt>
            <dd className="text-blue-900">{order.orderId}</dd>
          </div>
          <div className="flex">
            <dt className="text-blue-600 w-20 flex-shrink-0">品名</dt>
            <dd className="text-blue-900">{order.itemName}</dd>
          </div>
          <div className="flex">
            <dt className="text-blue-600 w-20 flex-shrink-0">積込日</dt>
            <dd className="text-blue-900">
              {format(order.loadDate, 'yyyy/MM/dd')}
              {order.loadTime && ` ${order.loadTime}`}
            </dd>
          </div>
          <div className="flex">
            <dt className="text-blue-600 w-20 flex-shrink-0">積込地</dt>
            <dd className="text-blue-900">
              {order.loadAddress1}
              {order.loadAddress2 && ` / ${order.loadAddress2}`}
            </dd>
          </div>
          <div className="flex">
            <dt className="text-blue-600 w-20 flex-shrink-0">荷卸日</dt>
            <dd className="text-blue-900">
              {format(order.unloadDate, 'yyyy/MM/dd')}
              {order.unloadTime && ` ${order.unloadTime}`}
            </dd>
          </div>
          <div className="flex">
            <dt className="text-blue-600 w-20 flex-shrink-0">荷卸地</dt>
            <dd className="text-blue-900">
              {order.unloadAddress1}
              {order.unloadAddress2 && ` / ${order.unloadAddress2}`}
            </dd>
          </div>
          {order.assignedVehicleNumber && (
            <div className="flex">
              <dt className="text-blue-600 w-20 flex-shrink-0">車両</dt>
              <dd className="text-blue-900">{order.assignedVehicleNumber}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* 日報入力フォーム */}
      <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-4">日報データ</h2>

        <div className="space-y-5">
          {/* 出庫・帰庫 */}
          <fieldset className="border border-gray-100 rounded-lg p-4">
            <legend className="text-sm font-medium text-gray-700 px-2">出庫・帰庫</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="departureTime" className="block text-xs font-medium text-gray-500 mb-1.5">
                  出庫時間
                </label>
                <input
                  id="departureTime"
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors min-h-[44px]"
                />
              </div>
              <div>
                <label htmlFor="returnTime" className="block text-xs font-medium text-gray-500 mb-1.5">
                  帰庫時間
                </label>
                <input
                  id="returnTime"
                  type="time"
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors min-h-[44px]"
                />
              </div>
            </div>
          </fieldset>

          {/* 積込時間 */}
          <fieldset className="border border-gray-100 rounded-lg p-4">
            <legend className="text-sm font-medium text-gray-700 px-2">積込</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="loadStartTime" className="block text-xs font-medium text-gray-500 mb-1.5">
                  開始時間
                </label>
                <input
                  id="loadStartTime"
                  type="time"
                  value={loadStartTime}
                  onChange={(e) => setLoadStartTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors min-h-[44px]"
                />
              </div>
              <div>
                <label htmlFor="loadEndTime" className="block text-xs font-medium text-gray-500 mb-1.5">
                  完了時間
                </label>
                <input
                  id="loadEndTime"
                  type="time"
                  value={loadEndTime}
                  onChange={(e) => setLoadEndTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors min-h-[44px]"
                />
              </div>
            </div>
          </fieldset>

          {/* 荷卸時間 */}
          <fieldset className="border border-gray-100 rounded-lg p-4">
            <legend className="text-sm font-medium text-gray-700 px-2">荷卸</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="unloadStartTime" className="block text-xs font-medium text-gray-500 mb-1.5">
                  開始時間
                </label>
                <input
                  id="unloadStartTime"
                  type="time"
                  value={unloadStartTime}
                  onChange={(e) => setUnloadStartTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors min-h-[44px]"
                />
              </div>
              <div>
                <label htmlFor="unloadEndTime" className="block text-xs font-medium text-gray-500 mb-1.5">
                  完了時間
                </label>
                <input
                  id="unloadEndTime"
                  type="time"
                  value={unloadEndTime}
                  onChange={(e) => setUnloadEndTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors min-h-[44px]"
                />
              </div>
            </div>
          </fieldset>

          {/* メーター */}
          <fieldset className="border border-gray-100 rounded-lg p-4">
            <legend className="text-sm font-medium text-gray-700 px-2">メーター (km)</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="departureMeter" className="block text-xs font-medium text-gray-500 mb-1.5">
                  出庫メーター
                </label>
                <input
                  id="departureMeter"
                  type="number"
                  inputMode="numeric"
                  value={departureMeter}
                  onChange={(e) => setDepartureMeter(e.target.value)}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors min-h-[44px]"
                />
              </div>
              <div>
                <label htmlFor="returnMeter" className="block text-xs font-medium text-gray-500 mb-1.5">
                  帰庫メーター
                </label>
                <input
                  id="returnMeter"
                  type="number"
                  inputMode="numeric"
                  value={returnMeter}
                  onChange={(e) => setReturnMeter(e.target.value)}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors min-h-[44px]"
                />
              </div>
            </div>
            {departureMeter && returnMeter && Number(returnMeter) > Number(departureMeter) && (
              <p className="mt-2 text-xs text-gray-500">
                走行距離: {Number(returnMeter) - Number(departureMeter)} km
              </p>
            )}
          </fieldset>

          {/* 車両点検 */}
          <div>
            <label htmlFor="vehicleInspection" className="block text-sm font-medium text-gray-700 mb-1.5">
              車両点検
            </label>
            <select
              id="vehicleInspection"
              value={vehicleInspection}
              onChange={(e) => setVehicleInspection(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors min-h-[44px] bg-white"
            >
              <option value="">選択してください</option>
              {INSPECTION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* 備考 */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1.5">
              備考
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="特記事項があれば入力してください"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* 保存ボタン */}
        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors min-h-[48px] flex items-center justify-center gap-2 text-sm"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                保存中...
              </>
            ) : existingReport ? (
              <>
                <Save className="w-4 h-4" />
                日報を更新する
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                日報を保存する
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
