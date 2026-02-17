import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

type TabId = 'basic' | 'vehicleTypes' | 'requestTypes';

export const SettingsPage: React.FC = () => {
  const { settings, loading, error, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 基本設定
  const [companyName, setCompanyName] = useState('');

  // 車種設定
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [newVehicleType, setNewVehicleType] = useState('');

  // 依頼タイプ設定
  const [requestTypes, setRequestTypes] = useState<string[]>([]);
  const [newRequestType, setNewRequestType] = useState('');

  useEffect(() => {
    setCompanyName(settings.companyName);
    setVehicleTypes([...settings.supportedVehicleTypes]);
    setRequestTypes([...settings.supportedRequestTypes]);
  }, [settings]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setSaveError(null);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSaveBasic = async () => {
    try {
      setSaveError(null);
      await updateSettings(
        {
          companyName,
          supportedVehicleTypes: settings.supportedVehicleTypes,
          supportedRequestTypes: settings.supportedRequestTypes,
        },
        settings.updatedBy || 'system',
      );
      showSuccess('基本設定を保存しました');
    } catch (err) {
      console.error('Failed to save basic settings:', err);
      setSaveError('基本設定の保存に失敗しました');
    }
  };

  const handleAddVehicleType = () => {
    const trimmed = newVehicleType.trim();
    if (trimmed === '') return;
    if (vehicleTypes.includes(trimmed)) return;
    setVehicleTypes([...vehicleTypes, trimmed]);
    setNewVehicleType('');
  };

  const handleRemoveVehicleType = (type: string) => {
    setVehicleTypes(vehicleTypes.filter((t) => t !== type));
  };

  const handleSaveVehicleTypes = async () => {
    try {
      setSaveError(null);
      await updateSettings(
        {
          companyName: settings.companyName,
          supportedVehicleTypes: vehicleTypes,
          supportedRequestTypes: settings.supportedRequestTypes,
        },
        settings.updatedBy || 'system',
      );
      showSuccess('車種設定を保存しました');
    } catch (err) {
      console.error('Failed to save vehicle types:', err);
      setSaveError('車種設定の保存に失敗しました');
    }
  };

  const handleAddRequestType = () => {
    const trimmed = newRequestType.trim();
    if (trimmed === '') return;
    if (requestTypes.includes(trimmed)) return;
    setRequestTypes([...requestTypes, trimmed]);
    setNewRequestType('');
  };

  const handleRemoveRequestType = (type: string) => {
    setRequestTypes(requestTypes.filter((t) => t !== type));
  };

  const handleSaveRequestTypes = async () => {
    try {
      setSaveError(null);
      await updateSettings(
        {
          companyName: settings.companyName,
          supportedVehicleTypes: settings.supportedVehicleTypes,
          supportedRequestTypes: requestTypes,
        },
        settings.updatedBy || 'system',
      );
      showSuccess('依頼タイプ設定を保存しました');
    } catch (err) {
      console.error('Failed to save request types:', err);
      setSaveError('依頼タイプ設定の保存に失敗しました');
    }
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'basic', label: '基本設定' },
    { id: 'vehicleTypes', label: '車種設定' },
    { id: 'requestTypes', label: '依頼タイプ設定' },
  ];

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
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">設定</h1>
      </div>

      {/* 成功メッセージ */}
      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
          {successMessage}
        </div>
      )}

      {/* エラーメッセージ */}
      {saveError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {saveError}
        </div>
      )}

      {/* タブナビゲーション */}
      <div className="mb-6">
        <nav className="inline-flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 基本設定タブ */}
      {activeTab === 'basic' && (
        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">基本設定</h2>
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              会社名
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            onClick={handleSaveBasic}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            保存
          </button>
        </div>
      )}

      {/* 車種設定タブ */}
      {activeTab === 'vehicleTypes' && (
        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">車種設定</h2>
          <div className="mb-4 flex flex-wrap gap-2">
            {vehicleTypes.map((type) => (
              <span
                key={type}
                className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700"
              >
                {type}
                <button
                  onClick={() => handleRemoveVehicleType(type)}
                  className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 mb-5">
            <input
              type="text"
              value={newVehicleType}
              onChange={(e) => setNewVehicleType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddVehicleType();
              }}
              placeholder="新規車種を入力"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
            <button
              onClick={handleAddVehicleType}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              追加
            </button>
          </div>
          <button
            onClick={handleSaveVehicleTypes}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            保存
          </button>
        </div>
      )}

      {/* 依頼タイプ設定タブ */}
      {activeTab === 'requestTypes' && (
        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">依頼タイプ設定</h2>
          <div className="mb-4 flex flex-wrap gap-2">
            {requestTypes.map((type) => (
              <span
                key={type}
                className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700"
              >
                {type}
                <button
                  onClick={() => handleRemoveRequestType(type)}
                  className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 mb-5">
            <input
              type="text"
              value={newRequestType}
              onChange={(e) => setNewRequestType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddRequestType();
              }}
              placeholder="新規依頼タイプを入力"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
            <button
              onClick={handleAddRequestType}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              追加
            </button>
          </div>
          <button
            onClick={handleSaveRequestTypes}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            保存
          </button>
        </div>
      )}

      {/* アプリ情報 */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200/60 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">アプリ情報</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex">
            <dt className="w-24 text-gray-500">バージョン:</dt>
            <dd>1.0.0</dd>
          </div>
          <div className="flex">
            <dt className="w-24 text-gray-500">最終更新:</dt>
            <dd>
              {settings.updatedAt
                ? settings.updatedAt.toLocaleDateString('ja-JP')
                : '-'}
            </dd>
          </div>
          <div className="flex">
            <dt className="w-24 text-gray-500">更新者:</dt>
            <dd>{settings.updatedBy || '-'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
};
