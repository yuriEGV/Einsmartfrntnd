import api from './api';

export interface Expense {
    _id?: string;
    description: string;
    amount: number;
    category: 'Mantenimiento' | 'Recursos Humanos' | 'Servicios Básicos' | 'PME' | 'ADECO' | 'Otros';
    date: string;
    type: 'Normal' | 'PME' | 'ADECO';
    tenantId?: string;
}

const expenseService = {
    getAll: (params?: any) => api.get('/expenses', { params }),
    create: (data: Expense) => api.post('/expenses', data),
    update: (id: string, data: Partial<Expense>) => api.put(`/expenses/${id}`, data),
    delete: (id: string) => api.delete(`/expenses/${id}`),
    getStats: () => api.get('/expenses/stats'),
    getDebtStats: (courseId?: string) => api.get('/payments/stats/debt', { params: { courseId } })
};

export default expenseService;
