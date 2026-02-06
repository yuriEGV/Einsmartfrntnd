import axios from 'axios';

const getBaseURL = () => {
    // 1. Prioridad: Variable de entorno explícita (VITE_API_URL)
    let url = import.meta.env.VITE_API_URL;

    // 2. Si no hay variable y estamos en producción (no localhost), usar backup default
    if (!url && typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        url = 'https://einsmart-bcknd.vercel.app/api';
    }

    // 3. Si aún no hay nada (probablemente local), usar localhost
    if (!url) {
        url = 'http://localhost:5000/api';
    }

    // Limpiar espacios y saltos de línea que a veces se cuelan en .env
    url = url.trim().replace(/[\r\n]/g, '');

    // Corregir errores de duplicación de protocolo
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
