
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
    canManageCourses: boolean;
    // Added missing permissions
    canManageSubjects: boolean;
    isTeacher: boolean;
    isSostenedor: boolean;
    canManagePayments: boolean;
}

export const usePermissions = (): Permissions => {
    const { user } = useAuth();
    const role = user?.role || 'guest';

    const isStaff = role === 'admin' || role === 'sostenedor' || role === 'teacher';
    const isAdmin = role === 'admin' || role === 'sostenedor';
    const isTeacher = role === 'teacher';
    const isSostenedor = role === 'sostenedor';
    const isSuperAdmin = role === 'admin';

    return {
        user,
        canEditProfile: true,
        canManageStudents: isStaff,
        canManageUsers: isAdmin,
        canManageEnrollments: isStaff,
        canEditAnnotations: isStaff,
        canEditGrades: isStaff,
        canViewSensitiveData: isAdmin,
        isSuperAdmin,
        canManageCourses: isAdmin,
        // New permissions
        canManageSubjects: isAdmin || isTeacher,
        isTeacher,
        isSostenedor,
        canManagePayments: isAdmin,
    };
};
