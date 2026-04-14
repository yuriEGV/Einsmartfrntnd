import { Link, useLocation } from 'react-router-dom';
import { School, Activity, BarChart3, Settings, LogOut, ChevronRight, User, ShieldAlert } from 'lucide-react';

interface EinsmartMasterSidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (v: boolean) => void;
    user: any;
    handleLogout: () => void;
}

export default function EinsmartMasterSidebar({ isCollapsed, setIsCollapsed, user, handleLogout }: EinsmartMasterSidebarProps) {
    const location = useLocation();

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
                        <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
                    </div>
                    {!isCollapsed && (
                        <span className={`font-black text-[11px] uppercase tracking-widest ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                            {children}
                        </span>
                    )}
                </div>
                {isActive && !isCollapsed && <ChevronRight size={14} className="text-white/40" />}
            </Link>
        );
    };

    return (
        <aside
            className={`
                fixed inset-y-0 left-0 z-[65] text-white flex flex-col transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)
                md:relative border-r border-white/5
                ${isCollapsed ? 'md:w-[90px]' : 'md:w-[300px]'}
            `}
            style={{ backgroundColor: '#0f172a' }} // Dark, serious theme for the HQ Master
        >
            {/* Header HQ */}
            <div className={`p-6 hidden md:flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} border-b border-white/5 relative overflow-hidden group h-[88px]`}>
                {!isCollapsed && (
                    <h1 className="text-xl font-black tracking-tighter flex items-center gap-3 uppercase relative z-10 truncate">
                        <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-2 rounded-xl border border-white/10 shadow-2xl">
                            <ShieldAlert size={22} className="text-emerald-400" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="leading-none text-white truncate text-sm">EINSMART HQ</span>
                            <span className="text-[9px] text-slate-400 tracking-widest uppercase mt-1">Overlord Control</span>
                        </div>
                    </h1>
                )}
                {isCollapsed && (
                    <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-2 rounded-xl border border-white/10 shadow-2xl relative z-10">
                        <ShieldAlert size={24} className="text-emerald-400" />
                    </div>
                )}

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all ${isCollapsed ? 'absolute inset-0 w-full h-full opacity-0' : 'relative'}`}
                    title={isCollapsed ? "Expandir" : "Contraer"}
                >
                    {!isCollapsed && <ChevronRight size={18} className="rotate-180" />}
                </button>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar relative z-10 overflow-x-hidden">
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-6 px-2`}>
                    {!isCollapsed && <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Mesa de Control</span>}
                    <div className={`h-[1px] bg-white/5 ${isCollapsed ? 'w-4' : 'flex-1 ml-4'}`}></div>
                </div>

                <NavLink to="/" icon={Activity}>Einsmart Dashboard</NavLink>
                <NavLink to="/tenants" icon={School}>Clientes (Colegios)</NavLink>
                <NavLink to="/global-analytics" icon={BarChart3}>Rendimiento Global</NavLink>
                <NavLink to="/audit" icon={Settings}>Trazabilidad y Logs</NavLink>
            </nav>

            {/* Profile Section */}
            <div className={`p-6 border-t border-white/5 bg-black/20 relative z-20 ${isCollapsed ? 'flex flex-col items-center gap-4' : ''}`}>
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-4 mb-6'}`}>
                    <div className="relative group shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-black text-lg uppercase shadow-2xl border-2 border-white/20 ring-4 ring-black/10">
                            <User size={18} />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-teal-400 rounded-full border-2 border-[#0f172a] shadow-lg"></div>
                    </div>
                    {!isCollapsed && (
                        <div className="min-w-0 overflow-hidden">
                            <span className="text-sm font-black text-white truncate leading-tight block">{user?.name || 'Root Admin'}</span>
                            <div className="text-[9px] text-teal-400 font-black uppercase tracking-widest mt-1 bg-white/5 px-2 py-0.5 rounded-full inline-block">FISCALIZADOR</div>
                        </div>
                    )}
                </div>
                <button
                    onClick={handleLogout}
                    className={`flex items-center justify-center gap-3 text-white/70 hover:text-white hover:bg-rose-500/20 py-3.5 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest border border-white/5 hover:border-rose-500/20 shadow-xl ${isCollapsed ? 'w-10 h-10 p-0' : 'w-full'}`}
                    title="Cerrar Conexión Einsmart"
                >
                    <LogOut size={16} className="text-rose-400" />
                    {!isCollapsed && <span>Cerrar Conexión</span>}
                </button>
            </div>
        </aside>
    );
}
