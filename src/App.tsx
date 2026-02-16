import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

// 仮ページコンポーネント
const DispatchPlanPage: React.FC = () => <div>配車計画画面（実装予定）</div>;
const DispatchStatusPage: React.FC = () => <div>配車状況確認画面（実装予定）</div>;
const VehicleMasterPage: React.FC = () => <div>車両マスタ画面（実装予定）</div>;
const CustomerMasterPage: React.FC = () => <div>荷主マスタ画面（実装予定）</div>;
const UsersPage: React.FC = () => <div>ユーザー管理画面（実装予定）</div>;
const SettingsPage: React.FC = () => <div>設定画面（実装予定）</div>;

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/dispatch-plan" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dispatch-plan"
            element={
              <ProtectedRoute allowedRoles={['admin', 'dispatcher']}>
                <Layout><DispatchPlanPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dispatch-status"
            element={
              <ProtectedRoute allowedRoles={['admin', 'dispatcher']}>
                <Layout><DispatchStatusPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/master/vehicles"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout><VehicleMasterPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/master/customers"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout><CustomerMasterPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout><UsersPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout><SettingsPage /></Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
