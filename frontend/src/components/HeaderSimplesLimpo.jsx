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

const HeaderSimplesLimpo = ({ title = "Sistema de Reservas" }) => {
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
      position: 'sticky',
      top: 0,
      zIndex: 1100,
      width: '100%'
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
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.25)'
              }
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.25)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
          >
            <Building2 size={24} style={{ color: 'white' }} />
          </button>
          
          <div>
            <h1 style={{
              color: 'white',
              fontSize: '20px',
              fontWeight: '600',
              margin: 0,
              letterSpacing: '-0.5px'
            }}>
              {title}
            </h1>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '13px',
              margin: 0,
              fontWeight: '400'
            }}>
              Gerencie suas reservas de forma simples
            </p>
          </div>
        </div>

        {/* Barra de Pesquisa */}
        <div style={{
          flex: '1',
          maxWidth: '400px',
          margin: '0 32px',
          position: 'relative'
        }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search 
              size={18} 
              style={{
                position: 'absolute',
                left: '12px',
                color: 'rgba(255, 255, 255, 0.7)',
                zIndex: 1
              }}
            />
            <input
              type="text"
              placeholder="Pesquisar reservas, salas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: 'none',
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                backdropFilter: 'blur(10px)',
                '::placeholder': {
                  color: 'rgba(255, 255, 255, 0.7)'
                }
              }}
              onFocus={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.25)'}
              onBlur={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
            />
          </div>
        </div>

        {/* Controles do usuário */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {/* Centro de Notificações - APENAS para esta página */}
          <div style={{ position: 'relative' }}>
            {/* Vou remover o NotificationCenter para testar */}
          </div>

          {/* Configurações */}
          <button style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: 'none',
            borderRadius: '10px',
            padding: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.25)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
          >
            <Settings size={18} style={{ color: 'white' }} />
          </button>

          {/* Menu do usuário */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                borderRadius: '12px',
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.25)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ff6b6b, #ffd93d)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
              </div>
              <span style={{
                color: 'white',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {user?.nome || 'Usuário'}
              </span>
              <ChevronDown 
                size={16} 
                style={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  transform: isProfileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }} 
              />
            </button>

            {/* Menu dropdown */}
            {isProfileMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '48px',
                right: '0',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                minWidth: '200px',
                zIndex: 1200,
                overflow: 'hidden',
                border: '1px solid rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{
                  padding: '16px',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ff6b6b, #ffd93d)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}>
                      {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div style={{
                        fontWeight: '600',
                        color: '#1f2937',
                        fontSize: '14px'
                      }}>
                        {user?.nome || 'Usuário'}
                      </div>
                      <div style={{
                        color: '#6b7280',
                        fontSize: '12px'
                      }}>
                        {user?.email || 'usuario@email.com'}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/dashboard')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#374151',
                    fontSize: '14px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <User size={16} />
                  Perfil
                </button>

                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#dc2626',
                    fontSize: '14px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderSimplesLimpo;
