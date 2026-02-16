import React, { useState, useEffect } from 'react';
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
    return <div>読み込み中...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">設定</h1>

      {/* 成功メッセージ */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      {/* エラーメッセージ */}
      {saveError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {saveError}
        </div>
      )}

      {/* タブナビゲーション */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 基本設定タブ */}
      {activeTab === 'basic' && (
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">基本設定</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              会社名
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSaveBasic}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            保存
          </button>
        </div>
      )}

      {/* 車種設定タブ */}
      {activeTab === 'vehicleTypes' && (
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">車種設定</h2>
          <div className="mb-4 flex flex-wrap gap-2">
            {vehicleTypes.map((type) => (
              <span
                key={type}
                className="inline-flex items-center px-3 py-1 bg-gray-100 rounded text-sm"
              >
                {type}
                <button
                  onClick={() => handleRemoveVehicleType(type)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newVehicleType}
              onChange={(e) => setNewVehicleType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddVehicleType();
              }}
              placeholder="新規車種を入力"
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddVehicleType}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              追加
            </button>
          </div>
          <button
            onClick={handleSaveVehicleTypes}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            保存
          </button>
        </div>
      )}

      {/* 依頼タイプ設定タブ */}
      {activeTab === 'requestTypes' && (
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">依頼タイプ設定</h2>
          <div className="mb-4 flex flex-wrap gap-2">
            {requestTypes.map((type) => (
              <span
                key={type}
                className="inline-flex items-center px-3 py-1 bg-gray-100 rounded text-sm"
              >
                {type}
                <button
                  onClick={() => handleRemoveRequestType(type)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newRequestType}
              onChange={(e) => setNewRequestType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddRequestType();
              }}
              placeholder="新規依頼タイプを入力"
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddRequestType}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              追加
            </button>
          </div>
          <button
            onClick={handleSaveRequestTypes}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            保存
          </button>
        </div>
      )}

      {/* アプリ情報 */}
      <div className="mt-6 bg-white rounded shadow p-6">
        <h2 className="text-lg font-semibold mb-4">アプリ情報</h2>
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
