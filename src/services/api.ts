import axios from 'axios';

const getBaseURL = () => {
    let url = import.meta.env.VITE_API_URL || '/api';
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
