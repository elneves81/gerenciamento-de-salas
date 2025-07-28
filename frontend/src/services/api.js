import axios from 'axios';

// Configurações centralizadas
const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || '/.netlify/functions',
  TIMEOUT: 10000,
  MAX_RETRIES: 2,
  RETRY_DELAY: 1000
};

// Criar instância do axios com configurações otimizadas
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Estado do refresh token
let isRefreshing = false;
let failedQueue = [];

// Processar fila de requisições após refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor de request - adicionar token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const parsedToken = JSON.parse(token);
        config.headers.Authorization = `Bearer ${parsedToken}`;
      } catch (error) {
        console.error('Erro ao fazer parse do token:', error);
        localStorage.removeItem('token');
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de response - handle refresh token inteligente
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Não tentar refresh em endpoints de auth ou se não há internet
    if (originalRequest?.url?.includes('/auth/') || !navigator.onLine) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Se já está fazendo refresh, adicionar à fila
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        processQueue(error, null);
        isRefreshing = false;
        clearAuthData();
        return Promise.reject(error);
      }

      try {
        const parsedRefreshToken = JSON.parse(refreshToken);
        const response = await axios.post(`${API_CONFIG.BASE_URL}/auth`, {
          action: 'refresh',
          refresh: parsedRefreshToken
        }, { timeout: 8000 });

        const { access } = response.data;
        localStorage.setItem('token', JSON.stringify(access));
        
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        originalRequest.headers['Authorization'] = `Bearer ${access}`;
        
        processQueue(null, access);
        
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Erro no refresh token:', refreshError);
        processQueue(refreshError, null);
        clearAuthData();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Limpar dados de autenticação
const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  delete api.defaults.headers.common['Authorization'];
};

// Função de retry para requisições falhas (apenas erros de rede)
const apiWithRetry = async (config, retryCount = 0) => {
  try {
    return await api(config);
  } catch (error) {
    const shouldRetry = retryCount < API_CONFIG.MAX_RETRIES && 
                       !error.response && // Apenas erros de rede
                       navigator.onLine; // Só se tem internet

    if (shouldRetry) {
      console.log(`Tentativa ${retryCount + 1}/${API_CONFIG.MAX_RETRIES + 1} falhou, tentando novamente...`);
      await new Promise(resolve => 
        setTimeout(resolve, API_CONFIG.RETRY_DELAY * (retryCount + 1))
      );
      return apiWithRetry(config, retryCount + 1);
    }
    throw error;
  }
};

// Wrapper para métodos HTTP com retry
api.getWithRetry = (url, config) => apiWithRetry({ method: 'get', url, ...config });
api.postWithRetry = (url, data, config) => apiWithRetry({ method: 'post', url, data, ...config });
api.putWithRetry = (url, data, config) => apiWithRetry({ method: 'put', url, data, ...config });
api.deleteWithRetry = (url, config) => apiWithRetry({ method: 'delete', url, ...config });

// Função para limpar auth (útil para logout)
api.clearAuth = clearAuthData;

// Função para verificar se está autenticado
api.isAuthenticated = () => {
  return !!(localStorage.getItem('token') && localStorage.getItem('refreshToken'));
};

export default api;
