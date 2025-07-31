import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '../services/api';
import { useSafeLocalStorage, clearCorruptedStorage } from '../hooks/useSafeLocalStorage';

const AuthContext = createContext();

// Hook customizado com error handling
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useSafeLocalStorage('token', null);
  const [refreshToken, setRefreshToken] = useSafeLocalStorage('refreshToken', null);
  const abortControllerRef = useRef(null);

  // Limpar dados corrompidos na inicialização
  useEffect(() => {
    const clearedKeys = clearCorruptedStorage();
    if (clearedKeys.length > 0) {
      console.log('localStorage corrompido foi limpo na inicialização');
    }
  }, []);

  // Configurar header de autorização
  const setAuthHeader = useCallback((authToken) => {
    if (authToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, []);

  // Carregar usuário com retry e timeout melhorado
  const loadUser = useCallback(async (retryCount = 0) => {
    if (!token) {
      setLoading(false);
      return;
    }

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Criar novo AbortController
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      setError(null);
      setAuthHeader(token);

      const response = await api.get('/auth/me', {
        signal,
        timeout: 10000, // 10 segundos de timeout
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.data) {
        setUser(response.data);
        setError(null);
      }
    } catch (error) {
      // Não tratar erro se foi cancelado
      if (signal.aborted || error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        console.log('Requisição de usuário foi cancelada ou timeout');
        return;
      }

      console.error('Erro ao carregar usuário:', error);
      
      // Retry logic controlado - apenas 1 retry e só em casos específicos
      if (retryCount < 1 && error.response?.status !== 401 && error.response?.status !== 403) {
        console.log(`Tentativa ${retryCount + 1} de recarregar usuário...`);
        // Usar timeout mais longo para evitar spam
        setTimeout(() => loadUser(retryCount + 1), 5000);
        return;
      }

      // Se erro 401/403 ou retry falhou, limpar auth
      if (error.response?.status === 401 || error.response?.status === 403 || retryCount >= 1) {
        console.log('Token inválido ou retry falhou, fazendo logout...');
        logout();
        return;
      }

      setError('Erro ao carregar dados do usuário');
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [token, setAuthHeader]);

  // Login otimizado
  const login = useCallback(async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/auth', {
        username,
        password,
        action: 'login'
      });
      
      const { access, refresh, user: userData } = response.data;
      
      setToken(access);
      setRefreshToken(refresh);
      setAuthHeader(access);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail ||
                          'Erro ao fazer login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [setToken, setRefreshToken, setAuthHeader]);

  // Registrar novo usuário
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/register', userData);
      
      if (response.data.token) {
        setToken(response.data.token);
        if (response.data.refreshToken) {
          setRefreshToken(response.data.refreshToken);
        }
        setAuthHeader(response.data.token);
        setUser(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Erro ao registrar usuário';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setToken, setRefreshToken, setAuthHeader]);

  // Login com Google
  const loginWithGoogle = useCallback(async (credential) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/google-auth', { credential });
      
      if (response.data.token) {
        setToken(response.data.token);
        if (response.data.refreshToken) {
          setRefreshToken(response.data.refreshToken);
        }
        setAuthHeader(response.data.token);
        setUser(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Erro ao fazer login com Google';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setToken, setRefreshToken, setAuthHeader]);

  // Logout otimizado
  const logout = useCallback(() => {
    // Cancelar requisições em andamento
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setToken(null);
    setRefreshToken(null);
    setAuthHeader(null);
    setUser(null);
    setError(null);
  }, [setToken, setRefreshToken, setAuthHeader]);

  // Inicializar quando o token muda - APENAS UMA VEZ
  useEffect(() => {
    if (token && !user) { // Só carregar se não tiver usuário
      setAuthHeader(token);
      loadUser(0); // Reset retry count
    } else if (!token) {
      setLoading(false);
    }
  }, [token, setAuthHeader]); // Remover loadUser das dependências

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Memoizar o valor do contexto
  const contextValue = useMemo(() => ({
    user,
    login,
    register,
    loginWithGoogle,
    logout,
    loading,
    error,
    isAuthenticated: !!user && !!token,
    refreshUser: loadUser
  }), [user, login, register, loginWithGoogle, logout, loading, error, token, loadUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
