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
    <>
      <style jsx>{`
        .header-moderno {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          position: sticky;
          top: 0;
          z-index: 1000;
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
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .logo-button:hover::before {
          left: 100%;
        }

        .logo-button:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .logo-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(45deg, #ffffff, #f0f0f0);
          color: #667eea;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
        }

        .logo-text {
          font-size: 20px;
          font-weight: 700;
          color: white;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .nav-desktop {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
          font-weight: 500;
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }

        .nav-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .nav-item:hover::before {
          left: 100%;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }

        .nav-item-active {
          background: rgba(255, 255, 255, 0.25);
          color: white;
          box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
        }

        .nav-icon {
          width: 18px;
          height: 18px;
        }

        .nav-label {
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .search-container {
          position: relative;
          margin: 0 20px;
        }

        .search-input {
          padding: 10px 16px 10px 44px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 25px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 14px;
          width: 280px;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }

        .search-input:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.15);
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
        }

        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: rgba(255, 255, 255, 0.7);
        }

        .user-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .notification-btn {
          position: relative;
          padding: 10px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .notification-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }

        .notification-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 8px;
          height: 8px;
          background: linear-gradient(45deg, #ff6b6b, #ff5252);
          border-radius: 50%;
          border: 2px solid white;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }

        .profile-menu {
          position: relative;
        }

        .profile-button {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          border: none;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 25px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .profile-button:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .profile-avatar {
          width: 32px;
          height: 32px;
          background: linear-gradient(45deg, #ffffff, #f0f0f0);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #667eea;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
        }

        .profile-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .profile-name {
          font-size: 14px;
          font-weight: 600;
          line-height: 1;
          margin-bottom: 2px;
        }

        .profile-role {
          font-size: 11px;
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .profile-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(20px);
          padding: 8px;
          min-width: 200px;
          opacity: 0;
          transform: translateY(-10px);
          transition: all 0.3s ease;
          pointer-events: none;
        }

        .profile-dropdown.show {
          opacity: 1;
          transform: translateY(0);
          pointer-events: all;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border: none;
          background: transparent;
          border-radius: 12px;
          color: #4a5568;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
          font-size: 14px;
          font-weight: 500;
        }

        .dropdown-item:hover {
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          transform: translateX(4px);
        }

        .mobile-menu-btn {
          display: none;
          padding: 8px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .mobile-menu {
          position: fixed;
          top: 70px;
          left: 0;
          right: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          backdrop-filter: blur(20px);
          padding: 20px;
          transform: translateY(-100%);
          transition: transform 0.3s ease;
          z-index: 999;
        }

        .mobile-menu.show {
          transform: translateY(0);
        }

        .mobile-nav {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }

        .mobile-search {
          margin-bottom: 20px;
        }

        .mobile-search .search-input {
          width: 100%;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .search-container {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .nav-desktop {
            display: none;
          }

          .mobile-menu-btn {
            display: block;
          }

          .header-content {
            height: 60px;
          }

          .logo-text {
            font-size: 18px;
          }

          .profile-info {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .header-container {
            padding: 0 15px;
          }

          .logo-button {
            padding: 6px 12px;
          }

          .logo-text {
            font-size: 16px;
          }
        }
      `}</style>

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
