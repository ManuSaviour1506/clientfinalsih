import axios from 'axios';

// BUG FIX 1: baseURL was hardcoded to localhost — breaks in staging/production.
// Use Vite env variable with localhost as fallback.
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://clientfinalsihbk.onrender.com/api/v1',
    withCredentials: true,
});

// Request interceptor — attach Bearer token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// BUG FIX 2: No response interceptor — a 401 (expired token) would silently
// fail. Every API call would just show a generic error. The user had no idea
// their session expired and had to manually refresh or re-login.
// Fix: on 401, clear storage and redirect to /login.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('accessToken');
            // Only redirect if not already on auth pages
            if (!window.location.pathname.includes('/login') &&
                !window.location.pathname.includes('/register')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;