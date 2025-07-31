import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { NotificationCenter } from './NotificationCenter';
import { 
  Building2,
  Settings,
  Search,
  LogOut,
  User,
  ChevronDown
} from 'lucide-react';

const HeaderSimples = ({ title = "Sistema de Reservas" }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header style={{
      background: 'linear-gradient(135deg, #5a60ea 0%, #6c3bb2 100%)',
      padding: '16px 24px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      zIndex: 1000
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Logo e Título */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '12px',
              padding: '10px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.25)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
          >
            <Building2 size={24} />
          </button>
          <div>
            <h1 style={{
              color: 'white',
              fontSize: '20px',
              fontWeight: '700',
              margin: 0,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              {title}
            </h1>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '14px',
              margin: 0,
              fontWeight: '500'
            }}>
              Gestão Inteligente de Salas e Recursos
            </p>
          </div>
        </div>

        {/* Barra de Pesquisa */}
        <div style={{
          position: 'relative',
          maxWidth: '400px',
          flex: 1,
          margin: '0 24px'
        }}>
          <Search 
            size={20} 
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#8B94A8',
              zIndex: 2
            }}
          />
          <input
            type="text"
            placeholder="Pesquisar reservas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 48px',
              borderRadius: '12px',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.95)',
              fontSize: '16px',
              color: '#4A5568',
              outline: 'none',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.background = 'white';
              e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)';
            }}
            onBlur={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.95)';
              e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            }}
          />
        </div>

        {/* Seção do Usuário */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          {/* Notificações */}
          <NotificationCenter />

          {/* Configurações */}
          <button style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: 'none',
            borderRadius: '10px',
            padding: '10px',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.25)'}
          onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
          >
            <Settings size={18} />
          </button>

          {/* Perfil do Usuário */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '8px 16px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.2))';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <User size={18} />
              <span>Administrador do Sistema</span>
              <ChevronDown size={16} />
            </button>

            {/* Menu do Perfil */}
            {isProfileMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                minWidth: '200px',
                overflow: 'hidden',
                zIndex: 1000
              }}>
                <div style={{
                  padding: '16px',
                  borderBottom: '1px solid #E2E8F0'
                }}>
                  <div style={{
                    fontWeight: '600',
                    color: '#2D3748',
                    fontSize: '14px'
                  }}>
                    {user?.nome || 'Administrador'}
                  </div>
                  <div style={{
                    color: '#7F8C8D',
                    fontSize: '12px'
                  }}>
                    {user?.email || 'admin@sistema.com'}
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'transparent',
                    color: '#E53E3E',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#FFF5F5'}
                  onMouseOut={(e) => e.target.style.background = 'transparent'}
                >
                  <LogOut size={16} />
                  Sair do Sistema
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderSimples;
