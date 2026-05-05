import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  // O URL do teu backend Laravel
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Opcional: Interceptor para lidar com erros globais (como 401 não autorizado)
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      console.error("Sessão expirada ou dados inválidos");
    }
    return Promise.reject(error);
  }
);



export default api;