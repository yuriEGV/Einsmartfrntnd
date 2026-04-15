
import { useAuth } from '../context/AuthContext';

export interface Permissions {
    user: any;
    canEditProfile: boolean;
    canManageStudents: boolean;
    canManageUsers: boolean;
    canManageEnrollments: boolean;
    canEditAnnotations: boolean;
    canEditGrades: boolean;
    canViewSensitiveData: boolean;
    isSuperAdmin: boolean;
    isStaff: boolean;
    canManageCourses: boolean;
    // Added missing permissions
    canManageSubjects: boolean;
    isTeacher: boolean;
    isSostenedor: boolean;
    isDirector: boolean;
    isUTP: boolean;
    canManagePayments: boolean;
    isAdmin: boolean;
    isStudent: boolean;
    isApoderado: boolean;
    isInspectorGeneral: boolean;
    canApprovePlanning: boolean;
    canManageAlternancias: boolean;
    canManageEvents: boolean;
}

export const usePermissions = (): Permissions => {
    const { user } = useAuth();
    // Normalize role to lowercase for consistency and regularization
    const role = (user?.role || 'guest').toLowerCase();

    const isStaff = ['admin', 'sostenedor', 'director', 'teacher', 'psicologo', 'orientador', 'asistente_aula', 'secretario', 'utp', 'inspector_general'].includes(role);
    const isAdmin = ['admin', 'sostenedor', 'director', 'inspector_general'].includes(role);
    const isTeacher = role === 'teacher';
    const isSostenedor = role === 'sostenedor';
    const isDirector = role === 'director';
    const isInspectorGeneral = role === 'inspector_general';
    const isUTP = role === 'utp';
    const isSuperAdmin = user?.isMaster || (role === 'admin' && user?.email === 'yuri@einsmart.cl') || role === 'superadmin';
    const isStudent = role === 'student';
    const isApoderado = role === 'apoderado';

    return {
        user,
        canEditProfile: true,
        canManageStudents: isStaff && !isStudent && !isApoderado,
        canManageUsers: isAdmin,
        canManageEnrollments: (isAdmin || isDirector || isSostenedor || isTeacher || isUTP || role === 'secretario' || role === 'asistente_aula' || role === 'inspector') && !isStudent && !isApoderado,
        canEditAnnotations: isStaff && !isStudent && !isApoderado,
        canEditGrades: (isStaff || isUTP) && !isStudent && !isApoderado,
        canViewSensitiveData: isAdmin || isDirector || isUTP,
        isSuperAdmin,
        isStaff,
        canManageCourses: isAdmin || isUTP,
        // New permissions
        canManageSubjects: isAdmin || isTeacher || isUTP,
        canManageAlternancias: isAdmin || isUTP || isTeacher,
        canManageEvents: isAdmin || isTeacher || isDirector || isSostenedor || isUTP,
        isTeacher,
        isSostenedor,
        isDirector,
        isUTP,
        canManagePayments: isSostenedor || isDirector,
        isAdmin,
        isStudent,
        isApoderado,
        isInspectorGeneral,
        canApprovePlanning: isAdmin || isUTP,
    };
};
