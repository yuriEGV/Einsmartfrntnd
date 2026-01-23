import api from './api';

export const createPayrollPayment = async (paymentData: any) => {
    const response = await api.post('/payroll', paymentData);
    return response.data;
};

export const getPayrollPayments = async (tenantId?: string, userId?: string) => {
    const params = new URLSearchParams();
    if (tenantId) params.append('tenantId', tenantId);
    if (userId) params.append('userId', userId);

    const response = await api.get(`/payroll?${params.toString()}`);
    return response.data;
};

export const getPayrollPaymentById = async (id: string) => {
    const response = await api.get(`/payroll/${id}`);
    return response.data;
};

export const updatePayrollPayment = async (id: string, paymentData: any) => {
    const response = await api.put(`/payroll/${id}`, paymentData);
    return response.data;
};

export const deletePayrollPayment = async (id: string) => {
    const response = await api.delete(`/payroll/${id}`);
    return response.data;
};
