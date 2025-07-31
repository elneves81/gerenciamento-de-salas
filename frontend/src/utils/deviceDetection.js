import React from 'react';

// Utilitário para detecção de dispositivos móveis
export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
};

// Hook customizado para detectar mobile usando Media Query
export const useIsMobile = () => {
  if (typeof window === 'undefined') return false;
  
  // Fallback simples se useMediaQuery não estiver disponível
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

// Definição global de isMobile como fallback
if (typeof window !== 'undefined' && !window.isMobile) {
  window.isMobile = isMobileDevice();
}
