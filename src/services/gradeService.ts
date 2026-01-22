import api from './api';

export interface Grade {
    _id?: string;
    evaluationId: string; // or expanded object
    estudianteId: string; // or expanded object
    score: number;
}

export const getGrades = async () => {
    const response = await api.get('/grades');
    return response.data;
};

export const getGradesByStudent = async (studentId: string) => {
    const response = await api.get(`/grades/student/${studentId}`);
    return response.data;
};
