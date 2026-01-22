import api from './api';

export interface Anotacion {
    _id?: string;
    estudianteId: string;
    tipo: 'positiva' | 'negativa';
    titulo: string;
    descripcion: string;
    fechaOcurrencia: string;
    medidas?: string;
    creadoPor?: any;
    tenantId?: string;
    createdAt?: string;
}

export const getAnotaciones = async () => {
    const response = await api.get('/anotaciones');
    return response.data;
};

export const getAnotacionesByStudent = async (studentId: string) => {
    const response = await api.get(`/anotaciones/estudiante/${studentId}`);
    return response.data;
};

export const createAnotacion = async (anotacion: Anotacion) => {
    const response = await api.post('/anotaciones', anotacion);
    return response.data;
};

export const deleteAnotacion = async (id: string) => {
    const response = await api.delete(`/anotaciones/${id}`);
    return response.data;
};
