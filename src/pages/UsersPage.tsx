import React, { useState } from 'react';
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
    return <div>読み込み中...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ユーザー管理</h1>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          ユーザー追加
        </button>
      </div>
      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800">
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
