
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
}

export const usePermissions = (): Permissions => {
    const { user } = useAuth();
    const role = user?.role || 'guest';

    const isStaff = role === 'admin' || role === 'sostenedor' || role === 'director' || role === 'teacher' || role === 'psicologo' || role === 'orientador' || role === 'asistente_aula' || role === 'secretario' || role === 'utp';
    const isAdmin = role === 'admin' || role === 'sostenedor' || role === 'director';
    const isTeacher = role === 'teacher';
    const isSostenedor = role === 'sostenedor';
    const isDirector = role === 'director';
    const isUTP = role === 'utp';
    const isSuperAdmin = role === 'admin';
    const isStudent = role === 'student';
    const isApoderado = role === 'apoderado';

    return {
        user,
        canEditProfile: true,
        canManageStudents: isStaff && !isStudent && !isApoderado,
        canManageUsers: isAdmin,
        canManageEnrollments: isStaff && !isStudent && !isApoderado,
        canEditAnnotations: isStaff && !isStudent && !isApoderado,
        canEditGrades: (isStaff || isUTP) && !isStudent && !isApoderado,
        canViewSensitiveData: isAdmin || isDirector || isUTP,
        isSuperAdmin,
        isStaff,
        canManageCourses: isAdmin || isUTP,
        // New permissions
        canManageSubjects: isAdmin || isTeacher || isUTP,
        isTeacher,
        isSostenedor,
        isDirector,
        isUTP,
        canManagePayments: isSostenedor || isDirector,
        isAdmin,
        isStudent,
        isApoderado,
    };
};
