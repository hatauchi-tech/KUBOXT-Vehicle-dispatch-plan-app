import React from 'react';
import { User } from '../../types';

interface UserListProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (uid: string) => void;
  onPasswordReset: (user: User) => void;
}

const ROLE_LABELS: Record<string, string> = {
  admin: '管理者',
  dispatcher: '配車担当者',
  driver: 'ドライバー',
};

export const UserList: React.FC<UserListProps> = ({ users, onEdit, onDelete, onPasswordReset }) => {
  const handleDelete = (user: User) => {
    if (window.confirm(`ユーザー ${user.displayName || user.email} を削除してもよろしいですか？`)) {
      onDelete(user.uid);
    }
  };

  const handlePasswordReset = (user: User) => {
    if (window.confirm(`${user.email} にパスワードリセットメールを送信しますか？`)) {
      onPasswordReset(user);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">UID</th>
            <th className="px-4 py-2 border">メール</th>
            <th className="px-4 py-2 border">表示名</th>
            <th className="px-4 py-2 border">権限</th>
            <th className="px-4 py-2 border">操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.uid} className="hover:bg-gray-50">
              <td className="px-4 py-2 border text-sm font-mono">{user.uid}</td>
              <td className="px-4 py-2 border">{user.email}</td>
              <td className="px-4 py-2 border">{user.displayName || '-'}</td>
              <td className="px-4 py-2 border">{ROLE_LABELS[user.role] || user.role}</td>
              <td className="px-4 py-2 border">
                <button
                  onClick={() => onEdit(user)}
                  className="px-2 py-1 bg-blue-500 text-white rounded mr-2 hover:bg-blue-600"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(user)}
                  className="px-2 py-1 bg-red-500 text-white rounded mr-2 hover:bg-red-600"
                >
                  削除
                </button>
                <button
                  onClick={() => handlePasswordReset(user)}
                  className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  PW リセット
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <div className="text-center py-8 text-gray-500">ユーザーデータがありません</div>
      )}
    </div>
  );
};
