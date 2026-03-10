import api from './api';

export const getMedicalLicenses = async (params?: any) => {
    const response = await api.get('/medical-licenses', { params });
    return response.data;
};

export const getMedicalLicenseById = async (id: string) => {
    const response = await api.get(`/medical-licenses/${id}`);
    return response.data;
};

export const createMedicalLicense = async (licenseData: any) => {
    const response = await api.post('/medical-licenses', licenseData);
    return response.data;
};

export const deleteMedicalLicense = async (id: string) => {
    const response = await api.delete(`/medical-licenses/${id}`);
    return response.data;
};
