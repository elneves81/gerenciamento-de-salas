import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

// Debounce hook para otimizar inputs
export const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

// Throttle hook para eventos de scroll/resize
export const useThrottle = (callback, delay) => {
  const lastRan = useRef(Date.now());

  const throttledCallback = useCallback((...args) => {
    if (Date.now() - lastRan.current >= delay) {
      callback(...args);
      lastRan.current = Date.now();
    }
  }, [callback, delay]);

  return throttledCallback;
};

// Hook para lazy loading de imagens
export const useLazyImage = (src, placeholder = '') => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = new Image();
          img.onload = () => {
            setImageSrc(src);
            setIsLoaded(true);
          };
          img.onerror = () => {
            setIsError(true);
          };
          img.src = src;
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return { imageSrc, isLoaded, isError, imgRef };
};

// Hook para detectar se elemento está visível
export const useIntersectionObserver = (options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        ...options
      }
    );

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [options]);

  return [elementRef, isVisible];
};

// Formatadores de dados otimizados
export const formatters = {
  // Formatador de data memoizado
  date: useMemo(() => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, []),

  // Formatador de data/hora memoizado
  datetime: useMemo(() => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []),

  // Formatador de moeda memoizado
  currency: useMemo(() => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }, [])
};

// Função para criar seletores memoizados
export const createSelector = (selector) => {
  let lastArgs = null;
  let lastResult = null;

  return (...args) => {
    if (!lastArgs || !shallowEqual(args, lastArgs)) {
      lastArgs = args;
      lastResult = selector(...args);
    }
    return lastResult;
  };
};

// Comparação shallow para otimização
const shallowEqual = (a, b) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

// Função para otimizar re-renders desnecessários
export const shouldComponentUpdate = (prevProps, nextProps, keys = []) => {
  if (keys.length === 0) {
    return !shallowEqual(Object.values(prevProps), Object.values(nextProps));
  }
  
  return keys.some(key => prevProps[key] !== nextProps[key]);
};

// Utilitário para batch updates
export const batchUpdates = (updates) => {
  // React 18+ já faz batching automático
  updates.forEach(update => update());
};

// Hook para performance monitoring
export const usePerformanceMonitor = (componentName) => {
  const renderStart = useRef(performance.now());
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = performance.now() - renderStart.current;
    
    if (renderTime > 16) { // > 16ms pode causar jank
      console.warn(`${componentName} render lento: ${renderTime.toFixed(2)}ms (render #${renderCount.current})`);
    }
    
    renderStart.current = performance.now();
  });

  return renderCount.current;
};

// Cache simples para computações pesadas
class SimpleCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    const value = this.cache.get(key);
    if (value) {
      // Move para o final (LRU)
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      // Remove o mais antigo
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
  }
}

export const cache = new SimpleCache();

// Hook para memoização avançada
export const useMemoAdvanced = (factory, deps, cacheKey) => {
  return useMemo(() => {
    if (cacheKey) {
      const cached = cache.get(cacheKey);
      if (cached) return cached;
      
      const result = factory();
      cache.set(cacheKey, result);
      return result;
    }
    return factory();
  }, deps);
};
