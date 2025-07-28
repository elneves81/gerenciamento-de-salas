import { useState, useCallback, useRef, useEffect } from 'react';
import api from '../services/api';

// Hook customizado para gerenciar estados de API
export const useApi = (initialData = null) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  // Função genérica para fazer requisições
  const makeRequest = useCallback(async (requestConfig) => {
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setLoading(true);
    setError(null);

    try {
      // Criar novo AbortController
      abortControllerRef.current = new AbortController();
      
      const config = {
        ...requestConfig,
        signal: abortControllerRef.current.signal
      };

      const response = await api(config);
      setData(response.data);
      return { success: true, data: response.data };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, cancelled: true };
      }
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.detail || 
                          err.message || 
                          'Erro na requisição';
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  // Métodos específicos
  const get = useCallback((url, config = {}) => 
    makeRequest({ method: 'GET', url, ...config }), [makeRequest]);

  const post = useCallback((url, data, config = {}) => 
    makeRequest({ method: 'POST', url, data, ...config }), [makeRequest]);

  const put = useCallback((url, data, config = {}) => 
    makeRequest({ method: 'PUT', url, data, ...config }), [makeRequest]);

  const del = useCallback((url, config = {}) => 
    makeRequest({ method: 'DELETE', url, ...config }), [makeRequest]);

  // Cancelar ao desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Reset manual dos dados
  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
  }, [initialData]);

  return {
    data,
    loading,
    error,
    get,
    post,
    put,
    delete: del,
    reset,
    setData
  };
};

// Hook específico para listas com paginação
export const useApiList = (endpoint, dependencies = []) => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const { loading, error, get } = useApi();

  const fetchItems = useCallback(async (page = 1, filters = {}) => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      ...filters
    });

    const result = await get(`${endpoint}?${queryParams}`);
    
    if (result.success) {
      const { results, count, next, previous } = result.data;
      
      setItems(results || result.data);
      setPagination({
        page,
        totalPages: Math.ceil(count / pagination.itemsPerPage) || 1,
        totalItems: count || result.data.length,
        itemsPerPage: pagination.itemsPerPage,
        hasNext: !!next,
        hasPrevious: !!previous
      });
    }
    
    return result;
  }, [endpoint, get, pagination.itemsPerPage]);

  const addItem = useCallback((newItem) => {
    setItems(prev => [newItem, ...prev]);
    setPagination(prev => ({
      ...prev,
      totalItems: prev.totalItems + 1
    }));
  }, []);

  const updateItem = useCallback((id, updatedItem) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updatedItem } : item
    ));
  }, []);

  const removeItem = useCallback((id) => {
    setItems(prev => prev.filter(item => item.id !== id));
    setPagination(prev => ({
      ...prev,
      totalItems: prev.totalItems - 1
    }));
  }, []);

  // Carregar dados quando dependências mudam
  useEffect(() => {
    fetchItems();
  }, dependencies);

  return {
    items,
    pagination,
    loading,
    error,
    fetchItems,
    addItem,
    updateItem,
    removeItem,
    refresh: () => fetchItems(pagination.page)
  };
};

// Hook para cache simples
export const useApiCache = (key, fetcher, ttl = 5 * 60 * 1000) => { // 5 min default
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchData = useCallback(async (force = false) => {
    const now = Date.now();
    const cached = sessionStorage.getItem(`cache_${key}`);
    
    if (!force && cached && lastFetch && (now - lastFetch < ttl)) {
      try {
        const parsedData = JSON.parse(cached);
        setData(parsedData);
        return { success: true, data: parsedData, fromCache: true };
      } catch (err) {
        console.error('Erro ao fazer parse do cache:', err);
        sessionStorage.removeItem(`cache_${key}`);
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      if (result.success) {
        setData(result.data);
        setLastFetch(now);
        sessionStorage.setItem(`cache_${key}`, JSON.stringify(result.data));
      } else {
        setError(result.error);
      }
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Erro ao buscar dados';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl, lastFetch]);

  const clearCache = useCallback(() => {
    sessionStorage.removeItem(`cache_${key}`);
    setData(null);
    setLastFetch(null);
  }, [key]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: () => fetchData(true),
    clearCache
  };
};
