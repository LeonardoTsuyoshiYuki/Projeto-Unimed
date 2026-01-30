import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

if (BASE_URL.includes('/api')) {
    console.warn('[CONFIG] VITE_API_URL deve ser apenas o domínio, sem /api:', BASE_URL);
}

const api = axios.create({
    baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const publicApi = axios.create({
    baseURL: BASE_URL,
});

export default api;
