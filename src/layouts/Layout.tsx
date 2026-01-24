import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useTenant } from '../context/TenantContext';
import {
    LogOut, Home, Users, UserPlus, FileText,
    ClipboardList, Calendar, DollarSign, Settings,
    School, TrendingUp, GraduationCap,
    CheckCircle2, Menu, X, ChevronRight,
    Bell, Search, BookOpen
} from 'lucide-react';

const Layout = () => {
    const { user, logout } = useAuth();
    const { tenant } = useTenant();
    const permissions = usePermissions();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const handleLogout = () => {
        if (window.confirm('¿Estás seguro que deseas salir del sistema?')) {
            logout();
        }
    };

    // Close menu on navigation
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    // Handle ESC key to close menu
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsMenuOpen(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const closeMenu = () => setIsMenuOpen(false);

    const NavLink = ({ to, icon: Icon, children }: any) => {
        const isActive = location.pathname === to;
        return (
            <Link
                to={to}
                className={`flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 group ${isActive
                    ? 'bg-white/15 shadow-[0_8px_20px_-10px_rgba(0,0,0,0.3)] border border-white/10 translate-x-1'
                    : 'hover:bg-white/5 border border-transparent'
                    }`}
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-white/10' : 'bg-transparent group-hover:bg-white/5'}`}>
                        <Icon size={18} className={isActive ? 'text-white' : 'text-blue-300 group-hover:text-white'} />
                    </div>
                    <span className={`font-black text-[11px] uppercase tracking-widest ${isActive ? 'text-white' : 'text-blue-200/80 group-hover:text-white'}`}>
                        {children}
                    </span>
                </div>
                {isActive && <ChevronRight size={14} className="text-white/40" />}
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Mobile Header - High Fidelity */}
            <header
                className="md:hidden flex items-center justify-between px-6 py-4 text-white z-[70] sticky top-0 shadow-2xl backdrop-blur-xl border-b border-white/5"
                style={{ backgroundColor: tenant?.theme?.primaryColor ? `${tenant.theme.primaryColor}ee` : '#11355aee' }}
            >
                <div className="flex items-center gap-3 min-w-0">
                    {tenant?.theme?.logoUrl ? (
                        <img src={tenant.theme.logoUrl} alt={`${tenant.name} logo`} className="w-8 h-8 rounded-xl border border-white/15 backdrop-blur-md shadow-inner shrink-0 object-contain" />
                    ) : (
                        <div className="bg-white/10 p-2 rounded-xl border border-white/15 backdrop-blur-md shadow-inner shrink-0">
                            <School size={18} className="text-white" />
                        </div>
                    )}
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-sm font-black tracking-tighter uppercase truncate">
                            {tenant?.name || 'MARITIMO'}
                        </h1>
                        <span className="text-[8px] font-black text-blue-300/60 uppercase tracking-widest leading-none">Gestión Digital</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                        <Bell size={20} className="text-blue-100" />
                    </button>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`p-2.5 rounded-xl transition-all active:scale-90 border border-white/10 shadow-lg ${isMenuOpen ? 'bg-white text-slate-900' : 'bg-white/10 text-white'}`}
                        aria-label="Toggle Menu"
                    >
                        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </header>

            {/* Premium Overlay Backdrop */}
            <div
                className={`fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] transition-all duration-500 md:hidden ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                onClick={closeMenu}
            />

            {/* Sidebar - Precision Engineered Navigation */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-[65] w-[300px] text-white flex flex-col transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
                    md:relative md:translate-x-0 border-r border-white/5
                    ${isMenuOpen ? 'translate-x-0 shadow-[40px_0_80px_-20px_rgba(0,0,0,0.5)]' : '-translate-x-full shadow-none'}
                `}
                style={{ backgroundColor: tenant?.theme?.primaryColor || '#11355a' }}
            >
                {/* Desktop Header Enhancement */}
                <div className="p-10 hidden md:block border-b border-white/5 relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>

                    <h1 className="text-2xl font-black tracking-tighter flex items-center gap-4 uppercase relative z-10">
                        {tenant?.theme?.logoUrl ? (
                            <img src={tenant.theme.logoUrl} alt={`${tenant.name} logo`} className="w-12 h-12 rounded-2xl border border-white/15 backdrop-blur-lg shadow-2xl object-contain" />
                        ) : (
                            <div className="bg-white/10 p-3 rounded-2xl border border-white/15 backdrop-blur-lg shadow-2xl">
                                <School size={26} className="text-white" />
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="leading-none text-white">{tenant?.name || 'MARITIMO'}</span>
                            <span className="text-[10px] text-blue-400 font-black tracking-[0.2em] mt-1.5 opacity-60">EINSMART® v4.0</span>
                        </div>
                    </h1>
                </div>

                {/* Main Navigation Logic */}
                <nav className="flex-1 px-6 py-8 space-y-2 overflow-y-auto custom-scrollbar relative z-10">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <span className="text-[9px] font-black text-blue-300/40 uppercase tracking-[0.25em]">Principal</span>
                        <div className="h-[1px] flex-1 bg-white/5 ml-4"></div>
                    </div>

                    <NavLink to="/" icon={Home}>Escritorio</NavLink>

                    {(permissions.canManageStudents || user?.role === 'apoderado' || user?.role === 'student') && (
                        <NavLink to="/students" icon={Users}>
                            {(user?.role === 'apoderado' || user?.role === 'student') ? 'Mi Ficha' : 'Alumnos'}
                        </NavLink>
                    )}

                    {permissions.canManageEnrollments && permissions.user?.role !== 'student' && (
                        <NavLink to="/enrollments" icon={UserPlus}>Matrículas</NavLink>
                    )}

                    {(permissions.canManageCourses || user?.role === 'teacher' || user?.role === 'admin') && (
                        <NavLink to="/courses" icon={GraduationCap}>Cursos</NavLink>
                    )}

                    <NavLink to="/grades" icon={ClipboardList}>Notas</NavLink>
                    <NavLink to="/attendance" icon={CheckCircle2}>Asistencia</NavLink>
                    <NavLink to="/events" icon={Calendar}>Eventos</NavLink>
                    <NavLink to="/messages" icon={FileText}>Mensajes</NavLink>

                    <div className="pt-10 mb-4 px-2">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[9px] font-black text-blue-300/40 uppercase tracking-[0.25em]">Gestión</span>
                            <div className="h-[1px] flex-1 bg-white/5 ml-4"></div>
                        </div>

                        {(permissions.canManageSubjects || user?.role === 'teacher' || user?.role === 'admin') && (
                            <NavLink to="/subjects" icon={BookOpen}>Ramos</NavLink>
                        )}

                        {(user?.role === 'teacher' || user?.role === 'admin') && (
                            <NavLink to="/curriculum-material" icon={ClipboardList}>Curriculum</NavLink>
                        )}

                        {(user?.role === 'sostenedor' || permissions.isSuperAdmin) && (
                            <NavLink to="/settings" icon={Settings}>Institución</NavLink>
                        )}

                        {permissions.canViewSensitiveData && (
                            <NavLink to="/analytics" icon={TrendingUp}>Reportes</NavLink>
                        )}

                        {permissions.isSuperAdmin && (
                            <NavLink to="/tenants" icon={School}>Clientes</NavLink>
                        )}

                        {(permissions.canManagePayments || permissions.isSuperAdmin) && (
                            <NavLink to="/payments" icon={DollarSign}>Pagos</NavLink>
                        )}

                        {(user?.role === 'sostenedor' || permissions.isSuperAdmin) && (
                            <NavLink to="/finance-dashboard" icon={TrendingUp}>Finanzas Sostenedor</NavLink>
                        )}

                        {/* Nuevo enlace para Nóminas */}
                        {(permissions.isSuperAdmin || user?.role === 'sostenedor') && (
                            <NavLink to="/payroll" icon={DollarSign}>Nóminas</NavLink>
                        )}
                    </div>
                </nav>

                {/* Premium Profile Section */}
                <div className="p-8 border-t border-white/5 bg-black/20 relative z-20">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative group">
                            <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center font-black text-lg uppercase shadow-2xl border-2 border-white/20 ring-4 ring-black/10 group-hover:rotate-6 transition-all">
                                {user?.name?.substring(0, 1) || 'A'}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#11355a] shadow-lg"></div>
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-black text-white truncate leading-tight">{user?.name || 'Invitado'}</div>
                            <div className="text-[9px] text-blue-300 font-black uppercase tracking-widest mt-1 opacity-60 bg-white/5 px-2 py-0.5 rounded-full inline-block">{user?.role}</div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-3 text-white/70 hover:text-white hover:bg-rose-500/20 w-full py-3.5 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest border border-white/5 hover:border-rose-500/20 shadow-xl"
                    >
                        <LogOut size={16} className="text-rose-400" />
                        <span>Salir del Sistema</span>
                    </button>
                </div>
            </aside>

            {/* Main Application Area */}
            <main className="flex-1 bg-slate-50 md:h-screen overflow-y-auto relative custom-scrollbar">
                {/* Desktop Top Bar - Subtile but useful */}
                <header className="hidden md:flex items-center justify-between px-10 py-6 bg-white border-b border-slate-100 sticky top-0 z-40">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar estudiantes, notas o reportes..."
                            className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-blue-100 px-12 py-3 rounded-2xl outline-none text-sm font-bold text-slate-600 transition-all shadow-inner placeholder:font-bold placeholder:text-slate-300"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-3 text-slate-400 hover:text-blue-600 bg-white hover:bg-blue-50 rounded-2xl transition-all border border-slate-100 shadow-sm relative">
                            <Bell size={20} />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </header>

                <div className="max-w-[1600px] mx-auto p-3 md:p-0 min-h-full pb-24 md:pb-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
