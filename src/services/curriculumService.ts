import api from './api';

export interface CurriculumMaterial {
    _id?: string;
    courseId: string;
    subjectId?: string;
    title: string;
    description?: string;
    objectives: string[]; // Array de objetivos
    content?: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    uploadedBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

const curriculumService = {
    // Obtener todo el material curricular
    getAll: () => {
        return api.get('/curriculum-materials');
    },

    // Obtener material por ID
    getById: (id: string) => {
        return api.get(`/curriculum-materials/${id}`);
    },

    // Obtener material por curso
    getByCourse: (courseId: string) => {
        return api.get(`/curriculum-materials/course/${courseId}`);
    },

    // Obtener material por asignatura
    getBySubject: (subjectId: string) => {
        return api.get(`/curriculum-materials/subject/${subjectId}`);
    },

    // Crear nuevo material
    create: (material: FormData | CurriculumMaterial) => {
        if (material instanceof FormData) {
            return api.post('/curriculum-materials', material, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        }
        return api.post('/curriculum-materials', material);
    },

    // Actualizar material
    update: (id: string, material: FormData | Partial<CurriculumMaterial>) => {
        if (material instanceof FormData) {
            return api.put(`/curriculum-materials/${id}`, material, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        }
        return api.put(`/curriculum-materials/${id}`, material);
    },

    // Eliminar material
    delete: (id: string) => {
        return api.delete(`/curriculum-materials/${id}`);
    },

    // Obtener archivo curricular
    downloadFile: (id: string) => {
        return api.get(`/curriculum-materials/${id}/download`, {
            responseType: 'blob'
        });
    }
};

export default curriculumService;
