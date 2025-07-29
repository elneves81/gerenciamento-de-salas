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
      
      // Retry logic melhorado
      if (retryCount < 2 && error.response?.status !== 401) {
        console.log(`Tentativa ${retryCount + 1} de recarregar usuário...`);
        setTimeout(() => loadUser(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }

      // Se erro 401 ou muitas tentativas, limpar auth
      if (error.response?.status === 401 || retryCount >= 2) {
        console.log('Token inválido ou muitas tentativas, fazendo logout...');
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
        action: 'login',
        username,
        password,
      });
      
      const { access, refresh, user: userData } = response.data;
      
      setToken(access);
      setRefreshToken(refresh);
      setAuthHeader(access);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.non_field_errors?.[0] ||
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
      const errorMessage = error.response?.data?.message || 'Erro ao registrar usuário';
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
      const errorMessage = error.response?.data?.message || 'Erro ao fazer login com Google';
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

  // Inicializar quando o token muda
  useEffect(() => {
    if (token) {
      setAuthHeader(token);
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token, setAuthHeader, loadUser]);

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
