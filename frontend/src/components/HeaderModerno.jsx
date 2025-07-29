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
  Plus,
  User,
  ChevronDown
} from 'lucide-react';
import './HeaderModerno.css';

const HeaderModerno = ({ title = "Sistema de Agendamento", currentPage = "dashboard" }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const NavigationItem = ({ icon: Icon, label, path, active }) => (
    <button
      onClick={() => {
        navigate(path);
        setIsMobileMenuOpen(false);
      }}
      className={`nav-item ${active ? 'nav-item-active' : ''}`}
    >
      <Icon className="nav-icon" />
      <span className="nav-label">{label}</span>
    </button>
  );

  return (
    <header className="header-moderno">
      <div className="header-container">
        <div className="header-content">
          {/* Logo e Título */}
          <div className="logo-section">
            <button 
              onClick={() => navigate('/dashboard')}
              className="logo-button"
            >
              <div className="logo-icon">
                <Building2 size={20} />
              </div>
              <span className="logo-text">Sistema de Reservas</span>
            </button>
          </div>

          {/* Navegação Desktop */}
          <nav className="nav-desktop">
            <NavigationItem
              icon={Home}
              label="Dashboard"
              path="/dashboard"
              active={currentPage === 'dashboard'}
            />
            <NavigationItem
              icon={Calendar}
              label="Reservas"
              path="/reservas"
              active={currentPage === 'reservas'}
            />
            <NavigationItem
              icon={Plus}
              label="Nova Reserva"
              path="/nova-reserva"
              active={currentPage === 'nova-reserva'}
            />
            <NavigationItem
              icon={Users}
              label="Salas"
              path="/salas"
              active={currentPage === 'salas'}
            />
          </nav>

          {/* Barra de Pesquisa */}
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Pesquisar reservas, salas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Seção do Usuário */}
          <div className="user-section">
            {/* Notificações */}
            <button className="notification-btn">
              <Bell size={18} />
              <div className="notification-badge"></div>
            </button>

            {/* Menu do Perfil */}
            <div className="profile-menu">
              <button 
                className="profile-button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              >
                <div className="profile-avatar">
                  {user?.nome ? user.nome.charAt(0).toUpperCase() : <User size={16} />}
                </div>
                <div className="profile-info">
                  <div className="profile-name">
                    {user?.nome || 'Usuário'}
                  </div>
                  <div className="profile-role">
                    Administrador
                  </div>
                </div>
                <ChevronDown size={16} />
              </button>

              {isProfileMenuOpen && (
                <div className="profile-dropdown">
                  <button className="dropdown-item" onClick={() => navigate('/perfil')}>
                    <User size={16} />
                    Meu Perfil
                  </button>
                  <button className="dropdown-item" onClick={() => navigate('/configuracoes')}>
                    <Settings size={16} />
                    Configurações
                  </button>
                  <button className="dropdown-item" onClick={logout}>
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              )}
            </div>

            {/* Menu Mobile */}
            <button 
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-search">
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <nav className="mobile-nav">
            <NavigationItem
              icon={Home}
              label="Dashboard"
              path="/dashboard"
              active={currentPage === 'dashboard'}
            />
            <NavigationItem
              icon={Calendar}
              label="Reservas"
              path="/reservas"
              active={currentPage === 'reservas'}
            />
            <NavigationItem
              icon={Plus}
              label="Nova Reserva"
              path="/nova-reserva"
              active={currentPage === 'nova-reserva'}
            />
            <NavigationItem
              icon={Users}
              label="Salas"
              path="/salas"
              active={currentPage === 'salas'}
            />
          </nav>
        </div>
      )}
    </header>
  );
};

export default HeaderModerno;
          box-shadow: 0 8px 32px rgba(102, 126, 234, 0.2);
          transition: all 0.3s ease;
        }

        .header-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 70px;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .logo-button {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }

        .logo-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
                active={currentPage === 'salas'}
              />
            </nav>

            {/* Barra de Pesquisa */}
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Pesquisar reservas, salas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Seção do Usuário */}
            <div className="user-section">
              {/* Notificações */}
              <button className="notification-btn">
                <Bell size={18} />
                <div className="notification-badge"></div>
              </button>

              {/* Menu do Perfil */}
              <div className="profile-menu">
                <button 
                  className="profile-button"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                >
                  <div className="profile-avatar">
                    {user?.nome ? user.nome.charAt(0).toUpperCase() : <User size={16} />}
                  </div>
                  <div className="profile-info">
                    <div className="profile-name">
                      {user?.nome || 'Usuário'}
                    </div>
                    <div className="profile-role">
                      Administrador
                    </div>
                  </div>
                  <ChevronDown size={16} />
                </button>

                <div className={`profile-dropdown ${isProfileMenuOpen ? 'show' : ''}`}>
                  <button className="dropdown-item" onClick={() => navigate('/perfil')}>
                    <User size={16} />
                    Meu Perfil
                  </button>
                  <button className="dropdown-item" onClick={() => navigate('/configuracoes')}>
                    <Settings size={16} />
                    Configurações
                  </button>
                  <button className="dropdown-item" onClick={logout}>
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              </div>

              {/* Menu Mobile */}
              <button 
                className="mobile-menu-btn"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Menu Mobile */}
        <div className={`mobile-menu ${isMobileMenuOpen ? 'show' : ''}`}>
          <div className="mobile-search">
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <nav className="mobile-nav">
            <NavigationItem
              icon={Home}
              label="Dashboard"
              path="/dashboard"
              active={currentPage === 'dashboard'}
            />
            <NavigationItem
              icon={Calendar}
              label="Reservas"
              path="/reservas"
              active={currentPage === 'reservas'}
            />
            <NavigationItem
              icon={Plus}
              label="Nova Reserva"
              path="/nova-reserva"
              active={currentPage === 'nova-reserva'}
            />
            <NavigationItem
              icon={Users}
              label="Salas"
              path="/salas"
              active={currentPage === 'salas'}
            />
          </nav>
        </div>
      </header>
    </>
  );
};

export default HeaderModerno;
