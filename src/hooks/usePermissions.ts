
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
    canManagePayments: boolean;
    isAdmin: boolean;
    isStudent: boolean;
}

export const usePermissions = (): Permissions => {
    const { user } = useAuth();
    const role = user?.role || 'guest';

    const isStaff = role === 'admin' || role === 'sostenedor' || role === 'director' || role === 'teacher' || role === 'psicologo' || role === 'orientador' || role === 'asistente_aula' || role === 'secretario';
    const isAdmin = role === 'admin' || role === 'sostenedor' || role === 'director';
    const isTeacher = role === 'teacher';
    const isSostenedor = role === 'sostenedor';
    const isDirector = role === 'director';
    const isSuperAdmin = role === 'admin';
    const isStudent = role === 'student';

    return {
        user,
        canEditProfile: true,
        canManageStudents: isStaff,
        canManageUsers: isAdmin,
        canManageEnrollments: isStaff,
        canEditAnnotations: isStaff,
        canEditGrades: isStaff,
        canViewSensitiveData: isAdmin || isDirector,
        isSuperAdmin,
        isStaff,
        canManageCourses: isAdmin,
        // New permissions
        canManageSubjects: isAdmin || isTeacher,
        isTeacher,
        isSostenedor,
        isDirector,
        canManagePayments: isSostenedor || isDirector,
        isAdmin,
        isStudent,
    };
};
