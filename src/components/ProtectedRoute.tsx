import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <div className="min-h-screen flex items-center justify-center">アクセス権限がありません</div>;
  }

  return <>{children}</>;
};
