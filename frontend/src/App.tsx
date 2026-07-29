import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './features/auth/auth-context';
import { AuthPage } from './features/auth/auth-page';
import { DashboardPage } from './pages/dashboard-page';
import { HomePage } from './pages/home-page';

export const App = () => (
  <AuthProvider>
    <Routes>
      <Route element={<HomePage />} path="/" />
      <Route element={<AuthPage mode="login" />} path="/login" />
      <Route element={<AuthPage mode="register" />} path="/register" />
      <Route element={<DashboardPage />} path="/dashboard" />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  </AuthProvider>
);
