import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import HeaderPremium from './components/HeaderPremium';
import Dashboard from './pages/DashboardPremium';
import Salas from './pages/Salas';
import Reservas from './pages/Reservas';
import AuthPage from './pages/AuthPage';
import NovaReserva from './pages/NovaReserva';
import GerenciarSalas from './pages/GerenciarSalas';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-gray-50">
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
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
        <Route path="/salas" element={
          <>
            <HeaderPremium currentPage="salas" />
            <main className="min-h-screen pt-4">
              <Salas />
            </main>
          </>
        } />
        <Route path="/gerenciar-salas" element={<GerenciarSalas />} />
        <Route path="/admin/salas" element={<GerenciarSalas />} />
        <Route path="/reservas" element={
          <>
            <HeaderPremium currentPage="reservas" />
            <main className="min-h-screen pt-4">
              <Reservas />
            </main>
          </>
        } />
        <Route path="/nova-reserva" element={
          <>
            <HeaderPremium currentPage="nova-reserva" />
            <main className="min-h-screen pt-4">
              <NovaReserva />
            </main>
          </>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default App;
