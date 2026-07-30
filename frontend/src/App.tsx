import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './features/auth/auth-context';
import { AuthPage } from './features/auth/auth-page';
import { MediaAssetProvider } from './features/media-assets/media-asset-context';
import { DashboardPage } from './pages/dashboard-page';
import { HomePage } from './pages/home-page';
import { OrdersPage } from './pages/orders-page';

export const App = () => (
  <MediaAssetProvider>
    <AuthProvider>
      <Routes>
        <Route element={<HomePage />} path="/" />
        <Route element={<AuthPage mode="login" />} path="/login" />
        <Route element={<AuthPage mode="register" />} path="/register" />
        <Route element={<DashboardPage />} path="/dashboard" />
        <Route element={<OrdersPage />} path="/orders" />
        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
    </AuthProvider>
  </MediaAssetProvider>
);
