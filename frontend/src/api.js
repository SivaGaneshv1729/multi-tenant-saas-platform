import axios from 'axios';

// Create a configured instance of axios
const api = axios.create({
    baseURL: 'http://localhost:5000/api', // Docker maps this port locally
});

// REQUEST INTERCEPTOR: Automatically adds the Token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;