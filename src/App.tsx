import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { VehicleMasterPage } from './pages/VehicleMasterPage';
import { CustomerMasterPage } from './pages/CustomerMasterPage';
import { DispatchPlanPage } from './pages/DispatchPlanPage';
import { DispatchStatusPage } from './pages/DispatchStatusPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';

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
