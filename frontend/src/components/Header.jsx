import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Users, Building2, LogOut } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-blue-600" />
            <h1 className="ml-2 text-2xl font-bold text-gray-900">
              Agendamento de Salas
            </h1>
          </div>

          <nav className="flex space-x-8">
            <a
              href="/dashboard"
              className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              <Calendar className="inline h-4 w-4 mr-1" />
              Dashboard
            </a>
            <a
              href="/salas"
              className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              <Building2 className="inline h-4 w-4 mr-1" />
              Salas
            </a>
            <a
              href="/reservas"
              className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              <Users className="inline h-4 w-4 mr-1" />
              Reservas
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              Olá, {user?.first_name || user?.username}
            </span>
            <button
              onClick={logout}
              className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              <LogOut className="inline h-4 w-4 mr-1" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
