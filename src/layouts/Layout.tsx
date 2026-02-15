// Build trigger: 2026-02-08
import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { useTenant } from '../context/TenantContext';
import {
    LogOut, Home, Users, UserPlus, FileText,
    ClipboardList, Calendar, DollarSign, Settings,
    School, TrendingUp, GraduationCap,
    CheckCircle2, Menu, X, ChevronRight,
    Bell, BookOpen, CreditCard, User, Clock,
    Wand2
} from 'lucide-react';

const Layout = () => {
    const { user, logout } = useAuth();
    const { tenant } = useTenant();
    const permissions = usePermissions();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isAcademicOpen, setIsAcademicOpen] = useState(false);

    // Initial state from localStorage
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebarCollapsed');
        return saved ? JSON.parse(saved) : false;
    });

    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
    }, [isCollapsed]);

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

    // Notifications logic
    const fetchNotifications = async () => {
        try {
            const res = await api.get('/user-notifications');
            setNotifications(res.data);
            setUnreadCount(res.data.filter((n: any) => !n.isRead).length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 60000); // Poll every minute
            return () => clearInterval(interval);
        }
    }, [user]);

    const markAsRead = async (id: string) => {
        try {
            await api.put(`/user-notifications/${id}/read`);
            fetchNotifications();
        } catch (error) {
            console.error(error);
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('/user-notifications/mark-all-read');
            fetchNotifications();
        } catch (error) {
            console.error(error);
        }
    };

    const closeMenu = () => setIsMenuOpen(false);

    const NavLink = ({ to, icon: Icon, children }: any) => {
        const isActive = location.pathname === to;
        return (
            <Link
                to={to}
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-3.5 rounded-2xl transition-all duration-300 group ${isActive
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
        <div className="h-screen bg-[#f8fafc] flex flex-col md:flex-row overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-900">
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
                            {tenant?.name || 'EINSMART'}
                        </h1>
                        {/* <span className="text-[8px] font-black text-blue-300/60 uppercase tracking-widest leading-none">Gestión Digital</span> */}
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
                    fixed inset-y-0 left-0 z-[65] text-white flex flex-col transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)
                    md:relative md:translate-x-0 border-r border-white/5
                    ${isMenuOpen ? 'translate-x-0 shadow-[40px_0_80px_-20px_rgba(0,0,0,0.5)] w-[300px]' : '-translate-x-full md:translate-x-0 shadow-none'}
                    ${isCollapsed ? 'md:w-[90px]' : 'md:w-[300px]'}
                `}
                style={{ backgroundColor: tenant?.theme?.primaryColor || '#11355a' }}
            >
                {/* Desktop Header Enhancement */}
                <div className={`p-6 hidden md:flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} border-b border-white/5 relative overflow-hidden group h-[88px]`}>
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>

                    {!isCollapsed && (
                        <h1 className="text-xl font-black tracking-tighter flex items-center gap-3 uppercase relative z-10 truncate">
                            {tenant?.theme?.logoUrl ? (
                                <img src={tenant.theme.logoUrl} alt={`${tenant.name} logo`} className="w-10 h-10 rounded-xl border border-white/15 backdrop-blur-lg shadow-2xl object-contain" />
                            ) : (
                                <div className="bg-white/10 p-2 rounded-xl border border-white/15 backdrop-blur-lg shadow-2xl">
                                    <School size={22} className="text-white" />
                                </div>
                            )}
                            <div className="flex flex-col min-w-0">
                                <span className="leading-none text-white truncate text-sm">{tenant?.name || 'EINSMART'}</span>
                            </div>
                        </h1>
                    )}

                    {isCollapsed && (
                        <div className="bg-white/10 p-2 rounded-xl border border-white/15 backdrop-blur-lg shadow-2xl relative z-10">
                            <School size={24} className="text-white" />
                        </div>
                    )}

                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all ${isCollapsed ? 'absolute inset-0 w-full h-full opacity-0' : 'relative'}`}
                        title={isCollapsed ? "Expandir" : "Contraer"}
                    >
                        {isCollapsed ? null : <ChevronRight size={18} className="rotate-180" />}
                    </button>
                </div>

                {/* Main Navigation Logic */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar relative z-10 overflow-x-hidden">
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-6 px-2`}>
                        {!isCollapsed && <span className="text-[9px] font-black text-blue-300/40 uppercase tracking-[0.25em]">Principal</span>}
                        <div className={`h-[1px] bg-white/5 ${isCollapsed ? 'w-4' : 'flex-1 ml-4'}`}></div>
                    </div>

                    <NavLink to="/" icon={Home}>{!isCollapsed && "Escritorio"}</NavLink>

                    {permissions.canManageEnrollments && permissions.user?.role !== 'student' && (
                        <NavLink to="/enrollments" icon={UserPlus}>{!isCollapsed && "Matrículas"}</NavLink>
                    )}

                    {(permissions.canManageCourses || user?.role === 'teacher' || user?.role === 'admin') && (
                        <NavLink to="/courses" icon={GraduationCap}>{!isCollapsed && "Cursos"}</NavLink>
                    )}

                    {(permissions.canManageSubjects || user?.role === 'teacher' || user?.role === 'admin') && (
                        <NavLink to="/class-book" icon={BookOpen}>{!isCollapsed && "Libro de Clases"}</NavLink>
                    )}

                    {/* Centro Académico Submenu */}
                    {(user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'director' || user?.role === 'utp') && (
                        <div className="space-y-1">
                            <button
                                onClick={() => {
                                    if (isCollapsed) setIsCollapsed(false);
                                    setIsAcademicOpen(!isAcademicOpen);
                                }}
                                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between'} p-3.5 rounded-2xl transition-all duration-300 group ${isAcademicOpen
                                    ? 'bg-white/10'
                                    : 'hover:bg-white/5'
                                    }`}
                                title={isCollapsed ? "Centro Académico" : ""}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl transition-colors ${isAcademicOpen ? 'bg-white/10' : 'bg-transparent group-hover:bg-white/5'}`}>
                                        <Wand2 size={18} className={isAcademicOpen ? 'text-white' : 'text-blue-300 group-hover:text-white'} />
                                    </div>
                                    {!isCollapsed && (
                                        <span className={`font-black text-[11px] uppercase tracking-widest ${isAcademicOpen ? 'text-white' : 'text-blue-200/80 group-hover:text-white'}`}>
                                            Centro Académico
                                        </span>
                                    )}
                                </div>
                                {!isCollapsed && <ChevronRight size={14} className={`text-white/40 transition-transform duration-300 ${isAcademicOpen ? 'rotate-90' : ''}`} />}
                            </button>

                            {/* Submenu Items */}
                            <div className={`pl-4 space-y-1 overflow-hidden transition-all duration-300 ${isAcademicOpen && !isCollapsed ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                {(permissions.canManageSubjects || permissions.isDirector || permissions.isSostenedor || permissions.isTeacher) && (
                                    <NavLink to="/academic" icon={Wand2}>{!isCollapsed && "Gestionar Currículum"}</NavLink>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Redundant links hidden for teachers to favor unified dashboard */}
                    {(user?.role !== 'teacher') && (
                        <>
                            <NavLink to="/grades" icon={ClipboardList}>{!isCollapsed && "Notas Globales"}</NavLink>
                            <NavLink to="/attendance" icon={CheckCircle2}>{!isCollapsed && "Asistencia Global"}</NavLink>
                        </>
                    )}

                    {/* Redefine messages visibility: Only staff */}
                    {(user?.role === 'admin' || user?.role === 'teacher' || user?.role === 'sostenedor' || user?.role === 'director') && (
                        <NavLink to="/messages" icon={FileText}>{!isCollapsed && "Mensajes"}</NavLink>
                    )}

                    <NavLink to="/events" icon={Calendar}>{!isCollapsed && "Eventos"}</NavLink>

                    <div className="pt-6 mb-4 px-2">
                        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-4`}>
                            {!isCollapsed && <span className="text-[9px] font-black text-blue-300/40 uppercase tracking-[0.25em]">Gestión</span>}
                            <div className={`h-[1px] bg-white/5 ${isCollapsed ? 'w-4' : 'flex-1 ml-4'}`}></div>
                        </div>

                        {(user?.role === 'sostenedor' || permissions.isSuperAdmin || permissions.isDirector || permissions.isTeacher) && (
                            <NavLink to="/students" icon={Users}>{!isCollapsed && "Comunidad Escolar"}</NavLink>
                        )}

                        {(permissions.isStaff && user?.role !== 'student' && user?.role !== 'apoderado') && (
                            <NavLink to="/admin-days" icon={Clock}>{!isCollapsed && "Días Administrativos"}</NavLink>
                        )}

                        {permissions.isAdmin && (
                            <>
                                <NavLink to="/users" icon={Users}>{!isCollapsed && "Gestión de Usuarios"}</NavLink>
                                <NavLink to="/settings" icon={Settings}>{!isCollapsed && "Institución"}</NavLink>
                            </>
                        )}

                        {permissions.canViewSensitiveData && (
                            <NavLink to="/analytics" icon={TrendingUp}>{!isCollapsed && "Reportes"}</NavLink>
                        )}

                        {permissions.isSuperAdmin && (
                            <NavLink to="/tenants" icon={School}>{!isCollapsed && "Clientes"}</NavLink>
                        )}

                        {(permissions.isAdmin || permissions.isSuperAdmin) && (
                            <NavLink to="/careers" icon={GraduationCap}>{!isCollapsed && "Gestión de Carreras"}</NavLink>
                        )}

                        {(permissions.canManagePayments || permissions.isSuperAdmin) && tenant?.paymentType === 'paid' && (
                            <NavLink to="/payments" icon={DollarSign}>{!isCollapsed && "Pagos"}</NavLink>
                        )}

                        {(user?.role === 'sostenedor' || permissions.isSuperAdmin) && (
                            <NavLink to="/finance-dashboard" icon={TrendingUp}>{!isCollapsed && "Finanzas Sostenedor"}</NavLink>
                        )}

                        {/* Nuevo enlace para Nóminas */}
                        {(permissions.isSuperAdmin || user?.role === 'sostenedor') && (
                            <NavLink to="/payroll" icon={DollarSign}>{!isCollapsed && "Nóminas"}</NavLink>
                        )}

                        {(permissions.isSostenedor || permissions.isSuperAdmin) && tenant?.paymentType === 'paid' && (
                            <NavLink to="/tariffs" icon={CreditCard}>{!isCollapsed && "Configuración de Tarifas"}</NavLink>
                        )}
                    </div>
                </nav>

                {/* Premium Profile Section */}
                <div className={`p-6 border-t border-white/5 bg-black/20 relative z-20 ${isCollapsed ? 'flex flex-col items-center gap-4' : ''}`}>
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-4 mb-6'}`}>
                        <Link to="/" className="relative group shrink-0">
                            <div className="w-10 h-10 rounded-[1rem] bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center font-black text-lg uppercase shadow-2xl border-2 border-white/20 ring-4 ring-black/10 group-hover:rotate-6 transition-all">
                                {user?.name?.substring(0, 1) || <User size={18} />}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#11355a] shadow-lg"></div>
                        </Link>
                        {!isCollapsed && (
                            <div className="min-w-0 overflow-hidden">
                                <span className="text-sm font-black text-white truncate leading-tight block">{user?.name || 'Invitado'}</span>
                                <div className="text-[9px] text-blue-300 font-black uppercase tracking-widest mt-1 opacity-60 bg-white/5 px-2 py-0.5 rounded-full inline-block truncate max-w-full">{user?.role}</div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className={`flex items-center justify-center gap-3 text-white/70 hover:text-white hover:bg-rose-500/20 py-3.5 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest border border-white/5 hover:border-rose-500/20 shadow-xl ${isCollapsed ? 'w-10 h-10 p-0' : 'w-full'}`}
                        title="Salir del Sistema"
                    >
                        <LogOut size={16} className="text-rose-400" />
                        {!isCollapsed && <span>Salir del Sistema</span>}
                    </button>
                </div>
            </aside>

            {/* Main Application Area */}
            <main className="flex-1 bg-slate-50 md:h-screen overflow-y-auto relative custom-scrollbar">
                {/* Desktop Top Bar - Notifications only */}
                <header className="hidden md:flex items-center justify-end px-10 py-6 bg-white border-b border-slate-100 sticky top-0 z-40">
                    <div className="flex items-center gap-4 relative">
                        <button
                            onClick={() => setIsNotifOpen(!isNotifOpen)}
                            className="p-3 text-slate-400 hover:text-blue-600 bg-white hover:bg-blue-50 rounded-2xl transition-all border border-slate-100 shadow-sm relative"
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {isNotifOpen && (
                            <div className="absolute top-full right-0 mt-4 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-[100] overflow-hidden animate-in slide-in-from-top-2 duration-300">
                                <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Notificaciones</h3>
                                    {unreadCount > 0 && (
                                        <button onClick={markAllRead} className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest">Marcar todo</button>
                                    )}
                                </div>
                                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                    {notifications.length === 0 ? (
                                        <div className="p-10 text-center text-slate-300 font-bold text-xs uppercase italic">Sin avisos nuevos</div>
                                    ) : (
                                        notifications.map((n) => (
                                            <div
                                                key={n._id}
                                                onClick={() => markAsRead(n._id)}
                                                className={`p-5 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors relative ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                                            >
                                                {!n.isRead && <div className="absolute top-6 left-2 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>}
                                                <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{n.title}</div>
                                                <p className="text-xs font-bold text-slate-600 leading-relaxed mb-1">{n.message}</p>
                                                <div className="text-[9px] font-bold text-slate-300 uppercase">{new Date(n.createdAt).toLocaleString()}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
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
