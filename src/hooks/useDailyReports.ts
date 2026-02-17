import { useState, useEffect, useCallback } from 'react';
import { DailyReport } from '../types';
import { dailyReportService } from '../services/dailyReportService';

export const useDailyReports = (vehicleNumber?: string) => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      let data: DailyReport[];
      if (vehicleNumber) {
        data = await dailyReportService.getByVehicleNumber(vehicleNumber);
      } else {
        data = await dailyReportService.getAll();
      }
      setReports(data);
      setError(null);
    } catch (err) {
      setError('日報データの取得に失敗しました');
      console.error('Failed to fetch daily reports:', err);
    } finally {
      setLoading(false);
    }
  }, [vehicleNumber]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const createReport = async (
    report: Omit<DailyReport, 'createdAt' | 'updatedAt'>
  ) => {
    try {
      await dailyReportService.create(report);
      await fetchReports();
    } catch (err) {
      console.error('Failed to create daily report:', err);
      throw new Error(
        `日報の作成に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`
      );
    }
  };

  const updateReport = async (
    reportId: string,
    updates: Partial<DailyReport>
  ) => {
    try {
      await dailyReportService.update(reportId, updates);
      await fetchReports();
    } catch (err) {
      console.error('Failed to update daily report:', err);
      throw new Error(
        `日報の更新に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`
      );
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      await dailyReportService.delete(reportId);
      await fetchReports();
    } catch (err) {
      console.error('Failed to delete daily report:', err);
      throw new Error(
        `日報の削除に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`
      );
    }
  };

  const getReportByOrderId = async (
    orderId: string
  ): Promise<DailyReport | null> => {
    try {
      return await dailyReportService.getByOrderId(orderId);
    } catch (err) {
      console.error('Failed to fetch daily report by orderId:', err);
      return null;
    }
  };

  return {
    reports,
    loading,
    error,
    createReport,
    updateReport,
    deleteReport,
    getReportByOrderId,
    refetch: fetchReports,
  };
};
