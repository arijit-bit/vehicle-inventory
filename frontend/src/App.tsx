import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './features/auth/auth-context';
import { AuthPage } from './features/auth/auth-page';
import { ProtectedRoute } from './features/auth/protected-route';
import { DashboardPage } from './pages/dashboard-page';

export const App = () => (
  <AuthProvider>
    <Routes>
      <Route element={<Navigate replace to="/login" />} path="/" />
      <Route element={<AuthPage mode="login" />} path="/login" />
      <Route element={<AuthPage mode="register" />} path="/register" />
      <Route
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
        path="/dashboard"
      />
      <Route element={<Navigate replace to="/login" />} path="*" />
    </Routes>
  </AuthProvider>
);
