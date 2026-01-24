import axios from 'axios';

const getBaseURL = () => {
    // Detectar si estamos en producción (Vercel) basado en el hostname
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        // Estamos en Vercel u otro entorno de producción
        return 'https://einsmart-bcknd.vercel.app/api';
    }

    // En desarrollo local, usar la variable de entorno o localhost por defecto
    let url = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    // Remove newlines, carriage returns and spaces
    url = url.trim().replace(/[\r\n]/g, '');
    // Fix double protocol error if it exists (e.g., https://https://...)
    if (url.startsWith('https://https://')) {
        url = url.replace('https://https://', 'https://');
    }
    return url;
};

const api = axios.create({
    baseURL: getBaseURL(),
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (tenantId) {
        config.headers['x-tenant-id'] = tenantId;
    }

    return config;
});

export default api;
