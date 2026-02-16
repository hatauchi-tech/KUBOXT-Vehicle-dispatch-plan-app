import { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { settingsService } from '../services/settingsService';

const DEFAULT_SETTINGS: AppSettings = {
  supportedVehicleTypes: ['4t', '2t', '1t', '0.5t'],
  supportedRequestTypes: ['引越し', '配送', '回収', 'その他'],
  companyName: '株式会社KUBOXT',
  updatedAt: new Date(),
  updatedBy: '',
};

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.get();
      setSettings(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setError('設定の取得に失敗しました');
      setSettings({ ...DEFAULT_SETTINGS });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (data: Omit<AppSettings, 'updatedAt' | 'updatedBy'>, updatedBy: string) => {
    try {
      await settingsService.update(data, updatedBy);
      await fetchSettings();
    } catch (err) {
      console.error('Failed to update settings:', err);
      throw new Error(`設定の更新に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    }
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch: fetchSettings,
  };
};
