import axios from 'axios';

const api = axios.create({
  // O URL do teu backend Laravel
  baseURL: 'http://127.0.0.1:8000/api', 
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