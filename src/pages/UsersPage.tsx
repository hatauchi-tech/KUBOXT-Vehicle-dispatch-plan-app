import React, { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { UserList } from '../components/users/UserList';
import { UserForm } from '../components/users/UserForm';
import { User } from '../types';

export const UsersPage: React.FC = () => {
  const { users, loading, error, createUser, updateUser, deleteUser, sendPasswordReset } = useUsers();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAdd = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleSubmit = async (user: Omit<User, 'createdAt'>) => {
    if (editingUser) {
      await updateUser(editingUser.uid, { role: user.role, displayName: user.displayName });
    } else {
      await createUser(user);
    }
    setShowForm(false);
    setEditingUser(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  const handlePasswordReset = async (user: User) => {
    try {
      await sendPasswordReset(user.email);
      setMessage(`${user.email} にパスワードリセットメールを送信しました`);
      setTimeout(() => setMessage(null), 5000);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'パスワードリセットメールの送信に失敗しました');
      setTimeout(() => setMessage(null), 5000);
    }
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
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">ユーザー管理</h1>
            <span className="inline-flex items-center gap-1 mt-0.5 text-xs text-gray-500">
              登録人数
              <span className="inline-flex items-center justify-center bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 text-xs font-medium">
                {users.length}人
              </span>
            </span>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          ユーザー追加
        </button>
      </div>
      {message && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
          {message}
        </div>
      )}
      <UserList
        users={users}
        onEdit={handleEdit}
        onDelete={deleteUser}
        onPasswordReset={handlePasswordReset}
      />
      {showForm && (
        <UserForm
          user={editingUser}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};
