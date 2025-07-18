import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Building2,
  Bell,
  Settings,
  Search,
  LogOut,
  Menu,
  X,
  Home,
  Calendar,
  Users,
  Plus
} from 'lucide-react';

const Header = ({ title = "Sistema de Agendamento", currentPage = "dashboard" }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const NavigationItem = ({ icon: Icon, label, path, active }) => (
    <button
      onClick={() => {
        navigate(path);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active 
          ? 'bg-blue-100 text-blue-700' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="bg-white/90 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo e Título */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                <p className="text-xs text-gray-500">Gestão Inteligente</p>
              </div>
            </button>
          </div>

          {/* Navegação Desktop */}
          <div className="hidden md:flex items-center space-x-2">
            <NavigationItem
              icon={Home}
              label="Dashboard"
              path="/dashboard"
              active={currentPage === "dashboard"}
            />
            <NavigationItem
              icon={Plus}
              label="Nova Reserva"
              path="/nova-reserva"
              active={currentPage === "nova-reserva"}
            />
            <NavigationItem
              icon={Calendar}
              label="Reservas"
              path="/reservas"
              active={currentPage === "reservas"}
            />
            <NavigationItem
              icon={Building2}
              label="Salas"
              path="/salas"
              active={currentPage === "salas"}
            />
          </div>

          {/* Search e Ações */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/50 backdrop-blur-sm w-64"
              />
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100/50 transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100/50 transition-colors">
              <Settings className="h-5 w-5" />
            </button>
          </div>

          {/* Perfil do Usuário */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-3 pl-4 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name || user?.username || 'Usuário'}
                </p>
                <p className="text-xs text-gray-500">Administrador</p>
              </div>
              <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg cursor-pointer hover:shadow-xl transition-shadow">
                {(user?.first_name || user?.username || 'U')[0].toUpperCase()}
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            {/* Menu Mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-3">
              {/* Search Mobile */}
              <div className="relative">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              {/* Navegação Mobile */}
              <div className="grid grid-cols-2 gap-2">
                <NavigationItem
                  icon={Home}
                  label="Dashboard"
                  path="/dashboard"
                  active={currentPage === "dashboard"}
                />
                <NavigationItem
                  icon={Plus}
                  label="Nova Reserva"
                  path="/nova-reserva"
                  active={currentPage === "nova-reserva"}
                />
                <NavigationItem
                  icon={Calendar}
                  label="Reservas"
                  path="/reservas"
                  active={currentPage === "reservas"}
                />
                <NavigationItem
                  icon={Building2}
                  label="Salas"
                  path="/salas"
                  active={currentPage === "salas"}
                />
              </div>

              {/* Perfil Mobile */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mt-4">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                    {(user?.first_name || user?.username || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user?.first_name || user?.username || 'Usuário'}
                    </p>
                    <p className="text-xs text-gray-500">Administrador</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
