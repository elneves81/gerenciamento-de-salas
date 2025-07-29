import { useEffect } from 'react';
import { clearCorruptedStorage } from '../hooks/useSafeLocalStorage';

const StorageInitializer = ({ children }) => {
  useEffect(() => {
    // Limpar localStorage corrompido imediatamente
    try {
      const clearedKeys = clearCorruptedStorage();
      if (clearedKeys.length > 0) {
        console.log('StorageInitializer: Dados corrompidos removidos:', clearedKeys);
        
        // Se muitas chaves foram removidas, pode ser que haja corrupção séria
        if (clearedKeys.length > 5 || clearedKeys.includes('*')) {
          console.warn('StorageInitializer: Detectada corrupção séria do localStorage, fazendo limpeza completa');
          localStorage.clear();
          
          // Recarregar a página para garantir estado limpo
          window.location.reload();
          return;
        }
      }
    } catch (error) {
      console.error('StorageInitializer: Erro ao limpar localStorage:', error);
      // Em caso de erro crítico, limpar tudo e recarregar
      localStorage.clear();
      window.location.reload();
    }
  }, []);

  return children;
};

export default StorageInitializer;
