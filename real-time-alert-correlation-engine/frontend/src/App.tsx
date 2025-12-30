// frontend/src/App.tsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import ProtectedRoute from './components/layout/ProtectedRoute';

const Login = lazy(() => import('./pages/Login'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AlertsPage = lazy(() => import('./pages/AlertsPage'));
const IncidentsPage = lazy(() => import('./pages/IncidentsPage'));
const MapPage = lazy(() => import('./pages/MapPage'));

const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="app-container">
      {!isAuthenticated ? (
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      ) : (
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={
                    <ProtectedRoute allowedRoles={['OFFICER', 'SUPERVISOR', 'ADMIN']}>
                      <DashboardPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute allowedRoles={['OFFICER', 'SUPERVISOR', 'ADMIN']}>
                      <DashboardPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/alerts" element={
                    <ProtectedRoute allowedRoles={['OFFICER', 'SUPERVISOR', 'ADMIN']}>
                      <AlertsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/incidents" element={
                    <ProtectedRoute allowedRoles={['OFFICER', 'SUPERVISOR', 'ADMIN']}>
                      <IncidentsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/map" element={
                    <ProtectedRoute allowedRoles={['OFFICER', 'SUPERVISOR', 'ADMIN']}>
                      <MapPage />
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;