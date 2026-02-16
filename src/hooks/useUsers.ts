import { useState, useEffect } from 'react';
import { User } from '../types';
import { userService } from '../services/userService';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError('ユーザーデータの取得に失敗しました');
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const createUser = async (user: Omit<User, 'createdAt'>) => {
    try {
      await userService.create(user);
      await fetchUsers();
    } catch (err) {
      console.error('Failed to create user:', err);
      throw new Error(`ユーザーの追加に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    }
  };

  const updateUser = async (uid: string, updates: Partial<Pick<User, 'role' | 'displayName'>>) => {
    try {
      await userService.update(uid, updates);
      await fetchUsers();
    } catch (err) {
      console.error('Failed to update user:', err);
      throw new Error(`ユーザーの更新に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    }
  };

  const deleteUser = async (uid: string) => {
    try {
      await userService.delete(uid);
      await fetchUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
      throw new Error(`ユーザーの削除に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await userService.sendPasswordReset(email);
    } catch (err) {
      console.error('Failed to send password reset email:', err);
      throw new Error(`パスワードリセットメールの送信に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    }
  };

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    sendPasswordReset,
    refetch: fetchUsers,
  };
};
