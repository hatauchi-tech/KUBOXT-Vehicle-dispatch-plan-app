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
    <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">UID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">メール</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">表示名</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">権限</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(user => (
              <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-700 font-mono truncate max-w-[160px] whitespace-nowrap" title={user.uid}>{user.uid}</td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{user.email}</td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{user.displayName || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{ROLE_LABELS[user.role] || user.role}</td>
                <td className="px-4 py-3 text-sm whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(user)}
                      className="px-2.5 py-1 min-h-[44px] text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="px-2.5 py-1 min-h-[44px] text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      削除
                    </button>
                    <button
                      onClick={() => handlePasswordReset(user)}
                      className="px-2.5 py-1 min-h-[44px] text-sm text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                    >
                      PW リセット
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">ユーザーデータがありません</div>
      )}
    </div>
  );
};
