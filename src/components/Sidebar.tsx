import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { currentUser } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/dispatch-plan', label: '配車計画', roles: ['admin', 'dispatcher'] },
    { path: '/dispatch-status', label: '配車状況確認', roles: ['admin', 'dispatcher'] },
    { path: '/master/vehicles', label: '車両マスタ', roles: ['admin'] },
    { path: '/master/customers', label: '荷主マスタ', roles: ['admin'] },
    { path: '/users', label: 'ユーザー管理', roles: ['admin'] },
    { path: '/settings', label: '設定', roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    currentUser && item.roles.includes(currentUser.role)
  );

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold">配車計画アプリ</h1>
      </div>
      <nav>
        <ul className="space-y-2">
          {filteredMenuItems.map(item => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`block px-4 py-2 rounded ${
                  isActive(item.path) ? 'bg-blue-600' : 'hover:bg-gray-700'
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};
