import { useState, useEffect } from 'react';

// Hook personalizado para localStorage seguro
export const useSafeLocalStorage = (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    try {
      // Verificar se localStorage está disponível
      if (typeof Storage === 'undefined') {
        console.warn('localStorage não está disponível');
        return defaultValue;
      }

      const item = localStorage.getItem(key);
      
      // Se não existe, retorna valor padrão
      if (item === null || item === undefined) {
        return defaultValue;
      }
      
      // Se é string vazia ou 'undefined' ou 'null' ou contém apenas espaços
      if (item === '' || item === 'undefined' || item === 'null' || item.trim() === '') {
        localStorage.removeItem(key);
        return defaultValue;
      }

      // Verificar se começa com caracteres válidos JSON
      const firstChar = item.trim().charAt(0);
      if (!['{', '[', '"', 't', 'f', 'n'].includes(firstChar)) {
        console.warn(`localStorage key "${key}" contém dados inválidos:`, item.substring(0, 50));
        localStorage.removeItem(key);
        return defaultValue;
      }
      
      // Tentar fazer parse
      const parsed = JSON.parse(item);
      
      // Validação adicional para evitar dados corrompidos
      if (parsed === undefined) {
        localStorage.removeItem(key);
        return defaultValue;
      }
      
      return parsed;
    } catch (error) {
      console.error(`Erro ao ler localStorage key "${key}":`, error);
      
      // Tentar limpar o dado corrompido
      try {
        localStorage.removeItem(key);
      } catch (removeError) {
        console.error('Erro ao remover dado corrompido:', removeError);
      }
      
      return defaultValue;
    }
  });

  const setStoredValue = (newValue) => {
    try {
      setValue(newValue);
      
      if (newValue === null || newValue === undefined) {
        localStorage.removeItem(key);
        return;
      }
      
      // Validar se o valor pode ser serializado
      const serialized = JSON.stringify(newValue);
      
      // Verificar se a serialização é válida
      if (serialized === undefined || serialized === 'undefined') {
        console.warn(`Tentativa de salvar valor inválido em "${key}":`, newValue);
        localStorage.removeItem(key);
        return;
      }
      
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Erro ao salvar localStorage key "${key}":`, error);
      
      // Se houver erro, remover a chave para evitar corrupção
      try {
        localStorage.removeItem(key);
      } catch (removeError) {
        console.error('Erro ao remover chave após falha de salvamento:', removeError);
      }
    }
  };

  return [value, setStoredValue];
};

// Utilidade para limpar localStorage corrompido
export const clearCorruptedStorage = () => {
  try {
    const keys = Object.keys(localStorage);
    let clearedKeys = [];
    
    keys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          JSON.parse(item); // Testar se é válido
        }
      } catch (error) {
        console.warn(`Removendo chave corrompida "${key}":`, error);
        localStorage.removeItem(key);
        clearedKeys.push(key);
      }
    });
    
    if (clearedKeys.length > 0) {
      console.log('Chaves corrompidas removidas:', clearedKeys);
    }
    
    return clearedKeys;
  } catch (error) {
    console.error('Erro ao limpar localStorage corrompido:', error);
    // Em caso de erro grave, limpar tudo
    localStorage.clear();
    return ['*'];
  }
};

// Hook para autenticação segura
export const useAuthStorage = () => {
  const [accessToken, setAccessToken] = useSafeLocalStorage('accessToken', null);
  const [refreshToken, setRefreshToken] = useSafeLocalStorage('refreshToken', null);
  const [user, setUser] = useSafeLocalStorage('user', null);

  const clearAuth = () => {
    try {
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      
      // Remover chaves específicas de auth
      ['accessToken', 'refreshToken', 'user'].forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Erro ao remover ${key}:`, error);
        }
      });
      
      // Limpar qualquer dado corrompido
      clearCorruptedStorage();
    } catch (error) {
      console.error('Erro ao limpar autenticação:', error);
      // Em caso de erro, limpar tudo
      localStorage.clear();
    }
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
