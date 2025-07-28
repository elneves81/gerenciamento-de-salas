import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import HeaderPremium from './components/HeaderPremium';

// Lazy loading para melhor performance
const Dashboard = lazy(() => import('./pages/DashboardPremium'));
const Salas = lazy(() => import('./pages/Salas'));
const Reservas = lazy(() => import('./pages/Reservas'));
const NovaReserva = lazy(() => import('./pages/NovaReserva'));

// Layout wrapper otimizado
const PageLayout = React.memo(({ children, currentPage = null }) => (
  <>
    {currentPage && <HeaderPremium currentPage={currentPage} />}
    <main className="min-h-screen pt-4">
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </main>
  </>
));

PageLayout.displayName = 'PageLayout';

// Loading component otimizado
const LoadingSpinner = React.memo(() => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      <p className="text-gray-600 text-sm animate-pulse">Carregando...</p>
    </div>
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

// Error fallback para Suspense
const SuspenseErrorFallback = (error, retry) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
      <div className="mb-4">
        <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Erro ao carregar página
      </h2>
      
      <p className="text-gray-600 mb-4">
        Não foi possível carregar esta página. Verifique sua conexão.
      </p>

      <button
        onClick={retry}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        Tentar Novamente
      </button>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary fallback={SuspenseErrorFallback}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-gray-50">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route 
                path="/" 
                element={
                  <ErrorBoundary>
                    <Dashboard />
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <ErrorBoundary>
                    <Dashboard />
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/salas" 
                element={
                  <PageLayout currentPage="salas">
                    <Salas />
                  </PageLayout>
                } 
              />
              <Route 
                path="/reservas" 
                element={
                  <PageLayout currentPage="reservas">
                    <Reservas />
                  </PageLayout>
                } 
              />
              <Route 
                path="/nova-reserva" 
                element={
                  <PageLayout currentPage="nova-reserva">
                    <NovaReserva />
                  </PageLayout>
                } 
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default React.memo(App);
