import axios from 'axios';

const api = axios.create({
  baseURL: "http://localhost:5002/api/v1",
  withCredentials: true, // Your backend URL
});

// Request interceptor to add the auth token to headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;