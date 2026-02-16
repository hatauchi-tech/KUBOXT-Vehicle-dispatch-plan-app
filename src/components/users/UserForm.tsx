import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';

interface UserFormProps {
  user?: User | null;
  onSubmit: (user: Omit<User, 'createdAt'>) => Promise<void>;
  onCancel: () => void;
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'admin', label: '管理者' },
  { value: 'dispatcher', label: '配車担当者' },
  { value: 'driver', label: 'ドライバー' },
];

export const UserForm: React.FC<UserFormProps> = ({ user, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    uid: '',
    email: '',
    displayName: '',
    role: 'driver' as UserRole,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        role: user.role,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit({
        uid: formData.uid,
        email: formData.email,
        displayName: formData.displayName || undefined,
        role: formData.role,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-screen overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{user ? 'ユーザー編集' : 'ユーザー追加'}</h2>
        {!user && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            ユーザーのFirebase Authアカウントは別途Firebase Consoleで作成してください
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">UID *</label>
              <input
                type="text"
                value={formData.uid}
                onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
                disabled={!!user}
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">メールアドレス *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
                disabled={!!user}
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">表示名</label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">権限 *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 border rounded"
                required
              >
                {ROLE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <div className="mt-4 text-red-500 text-sm">{error}</div>}
          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
