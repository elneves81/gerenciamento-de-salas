import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '../services/api';

const AuthContext = createContext();

// Hook customizado com error handling
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Hook para localStorage com error handling
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Erro ao ler localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      setStoredValue(value);
      if (value === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Erro ao salvar localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useLocalStorage('token', null);
  const [refreshToken, setRefreshToken] = useLocalStorage('refreshToken', null);
  const abortControllerRef = useRef(null);

  // Configurar header de autorização
  const setAuthHeader = useCallback((authToken) => {
    if (authToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, []);

  // Carregar usuário com retry e timeout
  const loadUser = useCallback(async (retryCount = 0) => {
    if (!token) {
      setLoading(false);
      return;
    }

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    try {
      setError(null);
      setAuthHeader(token);

      // Criar novo AbortController
      abortControllerRef.current = new AbortController();
      const controller = abortControllerRef.current;
      
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
      
      const response = await api.get('/auth', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      setUser(response.data);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Requisição cancelada');
        return;
      }

      console.error('Erro ao carregar usuário:', error);
      
      if (error.response?.status === 401) {
        // Token inválido, limpar dados
        setToken(null);
        setRefreshToken(null);
        setAuthHeader(null);
        setError('Sessão expirada');
      } else if (retryCount < 1) {
        // Retry apenas 1 vez
        setTimeout(() => loadUser(retryCount + 1), 2000);
        return;
      } else {
        setError('Erro ao carregar dados do usuário');
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [token, setToken, setRefreshToken, setAuthHeader]);

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
