import { useState, useEffect } from 'react';

// Hook personalizado para localStorage seguro
export const useSafeLocalStorage = (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      
      // Se não existe, retorna valor padrão
      if (item === null) {
        return defaultValue;
      }
      
      // Se é string vazia ou 'undefined' ou 'null'
      if (item === '' || item === 'undefined' || item === 'null') {
        localStorage.removeItem(key);
        return defaultValue;
      }
      
      // Tentar fazer parse
      return JSON.parse(item);
    } catch (error) {
      console.warn(`Erro ao ler localStorage key "${key}":`, error);
      localStorage.removeItem(key); // Remove dado corrompido
      return defaultValue;
    }
  });

  const setStoredValue = (newValue) => {
    try {
      setValue(newValue);
      if (newValue === null || newValue === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(newValue));
      }
    } catch (error) {
      console.error(`Erro ao salvar localStorage key "${key}":`, error);
    }
  };

  return [value, setStoredValue];
};

// Hook para autenticação segura
export const useAuthStorage = () => {
  const [accessToken, setAccessToken] = useSafeLocalStorage('accessToken', null);
  const [refreshToken, setRefreshToken] = useSafeLocalStorage('refreshToken', null);
  const [user, setUser] = useSafeLocalStorage('user', null);

  const clearAuth = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.clear(); // Limpar tudo para garantir
  };

  const isAuthenticated = () => {
    return !!(accessToken && refreshToken);
  };

  return {
    accessToken,
    refreshToken,
    user,
    setAccessToken,
    setRefreshToken,
    setUser,
    clearAuth,
    isAuthenticated
  };
};

export default useSafeLocalStorage;
