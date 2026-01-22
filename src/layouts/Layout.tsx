import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useTenant } from '../context/TenantContext';
import { LogOut, Home, Users, UserPlus, FileText, ClipboardList, Calendar, DollarSign, Settings, ShieldCheck, School, TrendingUp, GraduationCap, BookOpen, CheckCircle2 } from 'lucide-react';

const Layout = () => {
    const { user, logout } = useAuth();
    const { tenant } = useTenant();
    const permissions = usePermissions();

    return (
        <div className="min-h-screen bg-[#f8fafc] flex">
            {/* Sidebar */}
            <aside
                className="w-72 text-white shadow-2xl flex flex-col"
                style={{ backgroundColor: tenant?.theme?.primaryColor || '#11355a' }}
            >
                <div className="p-8 border-b border-white/10">
                    <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2 uppercase">
                        <div className="bg-white p-1.5 rounded-lg">
                            <div
                                className="w-5 h-5 rounded-sm"
                                style={{ backgroundColor: tenant?.theme?.secondaryColor || '#3b82f6' }}
                            ></div>
                        </div>
                        {tenant?.name || 'MARITIMO'} <span className="text-blue-400 opacity-50">4.0</span>
                    </h1>
                </div>

                <nav className="flex-1 p-6 space-y-1.5 overflow-y-auto custom-scrollbar">
                    <p className="text-[10px] font-black text-blue-300/50 uppercase tracking-widest mb-4 px-2">Navegación Principal</p>

                    <Link to="/" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all group">
                        <Home size={20} className="text-blue-300 group-hover:text-white" />
                        <span className="font-bold text-sm">Dashboard</span>
                    </Link>

                    {permissions.canManageStudents && (
                        <Link to="/students" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all group">
                            <Users size={20} className="text-blue-300 group-hover:text-white" />
                            <span className="font-bold text-sm">Estudiantes</span>
                        </Link>
                    )}

                    {permissions.canManageEnrollments && (
                        <Link to="/enrollments" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all group">
                            <UserPlus size={20} className="text-blue-300 group-hover:text-white" />
                            <span className="font-bold text-sm">Matrículas</span>
                        </Link>
                    )}

                    {(permissions.canManageCourses || permissions.isSuperAdmin || permissions.user?.role === 'sostenedor' || permissions.user?.role === 'admin' || permissions.user?.role === 'teacher') && (
                        <Link to="/courses" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all group">
                            <GraduationCap size={20} className="text-blue-300 group-hover:text-white" />
                            <span className="font-bold text-sm">Cursos</span>
                        </Link>
                    )}

                    {(permissions.canManageSubjects || permissions.isSuperAdmin || permissions.user?.role === 'sostenedor' || permissions.user?.role === 'admin' || permissions.user?.role === 'teacher') && (
                        <Link to="/subjects" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all group">
                            <BookOpen size={20} className="text-blue-300 group-hover:text-white" />
                            <span className="font-bold text-sm">Ramos</span>
                        </Link>
                    )}

                    {(permissions.canEditGrades || permissions.isSuperAdmin) && (
                        <Link to="/evaluations" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all group">
                            <ClipboardList size={20} className="text-blue-300 group-hover:text-white" />
                            <span className="font-bold text-sm">Evaluaciones</span>
                        </Link>
                    )}

                    <Link to="/annotations" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all group">
                        <FileText size={20} className="text-blue-300 group-hover:text-white" />
                        <span className="font-bold text-sm">Anotaciones</span>
                    </Link>

                    <Link to="/grades" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all group">
                        <ClipboardList size={20} className="text-blue-300 group-hover:text-white" />
                        <span className="font-bold text-sm">Calificaciones</span>
                    </Link>

                    <Link to="/attendance" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all group">
                        <CheckCircle2 size={20} className="text-blue-300 group-hover:text-white" />
                        <span className="font-bold text-sm">Asistencia</span>
                    </Link>

                    <Link to="/events" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all group">
                        <Calendar size={20} className="text-blue-300 group-hover:text-white" />
                        <span className="font-bold text-sm">Calendario</span>
                    </Link>

                    <div className="pt-4 mt-4 border-t border-blue-900/50">
                        <p className="text-[10px] font-black text-blue-300/50 uppercase tracking-widest mb-4 px-2">Administración</p>

                        {permissions.canManageUsers && (
                            <Link to="/users" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all group">
                                <Users size={20} className="text-blue-300 group-hover:text-white" />
                                <span className="font-bold text-sm">Usuarios</span>
                            </Link>
                        )}

                        {(user?.role === 'sostenedor' || permissions.isSuperAdmin) && (
                            <Link to="/settings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all group">
                                <Settings size={20} className="text-blue-300 group-hover:text-white" />
                                <span className="font-bold text-sm">Mi Institución</span>
                            </Link>
                        )}

                        {permissions.canViewSensitiveData && (
                            <Link to="/analytics" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all group">
                                <TrendingUp size={20} className="text-blue-300 group-hover:text-white" />
                                <span className="font-bold text-sm">Análisis y Rankings</span>
                            </Link>
                        )}

                        {permissions.isSuperAdmin && (
                            <Link to="/tenants" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all group">
                                <School size={20} className="text-blue-300 group-hover:text-white" />
                                <span className="font-bold text-sm">Instituciones</span>
                            </Link>
                        )}

                        {permissions.canViewSensitiveData && (
                            <Link to="/audit" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all group">
                                <ShieldCheck size={20} className="text-blue-300 group-hover:text-white" />
                                <span className="font-bold text-sm">Bitácora Auditoría</span>
                            </Link>
                        )}

                        <Link to="/payments" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all group">
                            <DollarSign size={20} className="text-blue-300 group-hover:text-white" />
                            <span className="font-bold text-sm">Pagos y Aranceles</span>
                        </Link>
                    </div>
                </nav>

                <div className="p-6 border-t border-blue-900/50 bg-blue-950/20">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-black text-sm uppercase">
                            {user?.name?.substring(0, 2) || 'AD'}
                        </div>
                        <div className="overflow-hidden">
                            <div className="text-xs font-black truncate">{user?.name || 'Administrador'}</div>
                            <div className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter">{user?.role}</div>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 text-rose-400 hover:text-rose-300 w-full p-2 transition-colors font-bold text-sm"
                    >
                        <LogOut size={18} />
                        <span>Salir del Sistema</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-gray-50">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
