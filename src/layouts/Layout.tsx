import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useTenant } from '../context/TenantContext';
import { LogOut, Home, Users, UserPlus, FileText, ClipboardList, Calendar, DollarSign, Settings, ShieldCheck, School, TrendingUp, GraduationCap, BookOpen, CheckCircle2, Menu, X } from 'lucide-react';

const Layout = () => {
    const { user, logout } = useAuth();
    const { tenant } = useTenant();
    const permissions = usePermissions();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const closeMenu = () => setIsMenuOpen(false);

    const NavLink = ({ to, icon: Icon, children }: any) => {
        const isActive = location.pathname === to;
        return (
            <Link
                to={to}
                onClick={closeMenu}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${isActive
                    ? 'bg-white/20 shadow-lg scale-[1.02]'
                    : 'hover:bg-white/10'
                    }`}
            >
                <Icon size={20} className={isActive ? 'text-white' : 'text-blue-300 group-hover:text-white'} />
                <span className={`font-bold text-sm ${isActive ? 'text-white' : ''}`}>{children}</span>
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row">
            {/* Mobile Header */}
            <header
                className="md:hidden flex items-center justify-between p-4 text-white shadow-lg sticky top-0 z-50"
                style={{ backgroundColor: tenant?.theme?.primaryColor || '#11355a' }}
            >
                <h1 className="text-xl font-black tracking-tighter uppercase flex items-center gap-2">
                    {tenant?.name || 'MARITIMO'} <span className="text-blue-400 opacity-50 text-xs">4.0</span>
                </h1>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 hover:bg-white/10 rounded-lg">
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Backdrop for mobile */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={closeMenu}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-72 text-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out
                    md:relative md:translate-x-0
                    ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
                style={{ backgroundColor: tenant?.theme?.primaryColor || '#11355a' }}
            >
                <div className="p-8 border-b border-white/10 hidden md:block">
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

                    <NavLink to="/" icon={Home}>Dashboard</NavLink>

                    {(permissions.canManageStudents || user?.role === 'apoderado' || user?.role === 'student') && (
                        <NavLink to="/students" icon={Users}>
                            {(user?.role === 'apoderado' || user?.role === 'student') ? 'Perfil Estudiante' : 'Estudiantes'}
                        </NavLink>
                    )}

                    {permissions.canManageEnrollments && permissions.user?.role !== 'student' && (
                        <NavLink to="/enrollments" icon={UserPlus}>Matrículas</NavLink>
                    )}

                    {(permissions.canManageCourses || permissions.isSuperAdmin || permissions.user?.role === 'sostenedor' || permissions.user?.role === 'admin' || permissions.user?.role === 'teacher') && (
                        <NavLink to="/courses" icon={GraduationCap}>Cursos</NavLink>
                    )}

                    {(permissions.canManageSubjects || permissions.isSuperAdmin || permissions.user?.role === 'sostenedor' || permissions.user?.role === 'admin' || permissions.user?.role === 'teacher') && (
                        <NavLink to="/subjects" icon={BookOpen}>Ramos</NavLink>
                    )}

                    {permissions.canEditGrades && (
                        <NavLink to="/evaluations" icon={ClipboardList}>Evaluaciones</NavLink>
                    )}

                    <NavLink to="/annotations" icon={FileText}>Anotaciones</NavLink>
                    <NavLink to="/grades" icon={ClipboardList}>Calificaciones</NavLink>
                    <NavLink to="/attendance" icon={CheckCircle2}>Asistencia</NavLink>
                    <NavLink to="/events" icon={Calendar}>Calendario</NavLink>
                    <NavLink to="/messages" icon={FileText}>Mensajes</NavLink>

                    <div className="pt-4 mt-4 border-t border-blue-900/50">
                        <p className="text-[10px] font-black text-blue-300/50 uppercase tracking-widest mb-4 px-2">Administración</p>

                        {permissions.canManageUsers && (
                            <NavLink to="/users" icon={Users}>Usuarios</NavLink>
                        )}

                        {(user?.role === 'sostenedor' || permissions.isSuperAdmin) && (
                            <NavLink to="/settings" icon={Settings}>Mi Institución</NavLink>
                        )}

                        {permissions.canViewSensitiveData && (
                            <NavLink to="/analytics" icon={TrendingUp}>Análisis y Rankings</NavLink>
                        )}

                        {permissions.isSuperAdmin && (
                            <NavLink to="/tenants" icon={School}>Instituciones</NavLink>
                        )}

                        {permissions.canViewSensitiveData && (
                            <NavLink to="/audit" icon={ShieldCheck}>Bitácora Auditoría</NavLink>
                        )}

                        <NavLink to="/payments" icon={DollarSign}>Pagos y Aranceles</NavLink>
                    </div>
                </nav>

                <div className="p-6 border-t border-blue-900/50 bg-blue-950/20 mt-auto">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-black text-sm uppercase flex-shrink-0">
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
            <main className="flex-1 overflow-y-auto bg-gray-50 h-[calc(100vh-64px)] md:h-screen transition-all">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
