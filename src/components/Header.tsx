import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // User will see error in console, but won't be stuck
    }
  };

  return (
    <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
      <div>
        <span className="text-gray-600">ようこそ、{currentUser?.displayName || currentUser?.email}さん</span>
      </div>
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        ログアウト
      </button>
    </header>
  );
};
