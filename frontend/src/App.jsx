import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './components/NotificationSystem';
import StorageInitializer from './components/StorageInitializer';
import HeaderModernoLimpo from './components/HeaderModernoLimpo';
import HeaderSimples from './components/HeaderSimples';
import Dashboard from './pages/DashboardPremium';
import ReservasModerno from './pages/ReservasModerno';
import AuthPage from './pages/AuthPage';
import NovaReserva from './pages/NovaReserva';
import GerenciarSalas from './pages/GerenciarSalas';

function App() {
  return (
    <StorageInitializer>
      <AuthProvider>
        <NotificationProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="min-h-screen bg-gray-50">
              <AppContent />
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </StorageInitializer>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/gerenciar-salas" element={<GerenciarSalas />} />
        <Route path="/admin/salas" element={<GerenciarSalas />} />
        <Route 
          path="/reservas" 
          element={
            <div key="reservas-page">
              <HeaderSimples />
              <main className="min-h-screen pt-4">
                <ReservasModerno />
              </main>
            </div>
          } 
        />
        <Route 
          path="/nova-reserva" 
          element={
            <div key="nova-reserva-page">
              <HeaderModernoLimpo currentPage="nova-reserva" />
              <main className="min-h-screen pt-4">
                <NovaReserva />
              </main>
            </div>
          } 
        />
        {/* Redirect /salas to /reservas */}
        <Route path="/salas" element={<Navigate to="/reservas" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default App;
