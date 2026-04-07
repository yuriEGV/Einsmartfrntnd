import axios from 'axios';

/**
 * Resolución de la URL base de la API según el entorno:
 *
 * 1. VITE_API_URL  → Si se define en .env / en el build de Docker/Vercel
 * 2. /api          → Docker local: nginx hace proxy interno al backend
 * 3. localhost     → Desarrollo local sin Docker
 * 4. Vercel URL    → Producción en la nube (fallback automático)
 */
const getBaseURL = () => {
    const envUrl = import.meta.env.VITE_API_URL as string | undefined;

    if (envUrl) {
        // Limpiar espacios/saltos que a veces entran en .env
        return envUrl.trim().replace(/[\r\n]/g, '');
    }

    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;

        // Desarrollo local — sin Docker
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }

        // Docker LAN o cualquier IP privada →
        // El frontend es servido por nginx que hace proxy de /api al backend.
        // Usamos ruta relativa para que funcione en cualquier IP del colegio.
        const isPrivateIP =
            /^192\.168\./.test(hostname) ||
            /^10\./.test(hostname) ||
            /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);

        if (isPrivateIP) {
            return '/api';
        }

        // Producción Vercel (dominio público)
        return 'https://einsmart-bcknd.vercel.app/api';
    }

    return 'http://localhost:5000/api';
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
