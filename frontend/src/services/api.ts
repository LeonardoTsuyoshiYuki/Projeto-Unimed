import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
});

// Add interceptors for auth if needed
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Public API instance for unauthenticated requests
export const publicApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
});

export default api;
