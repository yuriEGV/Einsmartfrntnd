import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useTenant } from '../context/TenantContext';
import api from '../services/api';
import InstitutionalCalendar from '../components/InstitutionalCalendar';
import { BookOpen, GraduationCap, Calendar, AlertCircle, FileText, School, MapPin, ShieldAlert, ChevronRight, Award, Clock, TrendingUp, User, X } from 'lucide-react';
import EinsmartDashboardPage from './EinsmartDashboardPage';

const DashboardPage = () => {
    const { user } = useAuth();
    const { tenant } = useTenant();
    const { isSuperAdmin, canManageStudents, isTutor } = usePermissions();

    const [stats, setStats] = useState<any>({ studentCount: 0, courseCount: 0, tenantCount: 0, isPlatformView: false });
    const [updateInfo, setUpdateInfo] = useState<{hasUpdate: boolean, localHash?: string, remoteHash?: string} | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [recentGrades, setRecentGrades] = useState([]);
    const [notifications, setNotifications] = useState([]); // [NEW] For Admin/Sostenedor
    const [adminRanking, setAdminRanking] = useState([]);
    const [classBookMetrics, setClassBookMetrics] = useState<any>(null);
    const [recentAnotaciones, setRecentAnotaciones] = useState([]);
    const [pendingCitations, setPendingCitations] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [pendingSignatures, setPendingSignatures] = useState([]);
    const [accessLogs, setAccessLogs] = useState([]); // [NEW] Access Logs
    const [pendingAdminDays, setPendingAdminDays] = useState([]); // [NEW] Administrative Days
    const [dualStats, setDualStats] = useState({ total: 0, withCompany: 0 }); // [NEW] Dual Stats

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            // Parallel fetch
            const [eventsRes, statsRes, signaturesRes, logsRes, adminDaysRes] = await Promise.all([
                api.get('/events'),
                (canManageStudents || isSuperAdmin || user?.role === 'teacher') ? api.get('/analytics/dashboard-stats') : Promise.resolve({ data: { studentCount: 0, courseCount: 0 } }),
                (user?.role === 'teacher' || isSuperAdmin) ? api.get('/class-logs?isSigned=false') : Promise.resolve({ data: [] }),
                (['admin', 'sostenedor', 'director', 'utp', 'inspector_general'].includes(user?.role || '')) ? api.get('/logs/class-book?limit=5') : Promise.resolve({ data: [] }),
                (['admin', 'sostenedor', 'director', 'utp', 'inspector_general', 'secretary', 'secretaria'].includes(user?.role || '')) ? api.get('/admin-days/all?status=pendiente') : Promise.resolve({ data: [] })
            ]);

            setUpcomingEvents(eventsRes.data.slice(0, 3));
            if (statsRes.data) setStats(statsRes.data);
            if (signaturesRes.data) setPendingSignatures(signaturesRes.data);
            if (logsRes.data) setAccessLogs(logsRes.data);
            if (adminDaysRes.data) setPendingAdminDays(adminDaysRes.data);

            // Fetch Alternancia Stats
            const altRes = await api.get('/alternancias');
            if (altRes.data) {
                setDualStats({
                    total: altRes.data.length,
                    withCompany: altRes.data.filter((a: any) => a.empresa).length
                });
            }

            if (user?.role === 'student' || user?.role === 'apoderado') {
                const [gradesRes, anotRes, citRes] = await Promise.all([
                    api.get('/grades'),
                    api.get('/anotaciones'),
                    api.get('/citaciones')
                ]);
                setRecentGrades(gradesRes.data.slice(0, 5));
                setRecentAnotaciones(anotRes.data.slice(0, 5));
                setPendingCitations(citRes.data.filter((c: any) => c.estado !== 'realizada' && c.estado !== 'cancelada'));
            } else {
                // [NEW] Fetch Admin Day Ranking for Director/Sostenedor
                if (user?.role === 'director' || user?.role === 'sostenedor' || isSuperAdmin || user?.role === 'inspector_general') {
                    const [rankingRes, metricsRes, citRes] = await Promise.all([
                        api.get('/admin-days/ranking'),
                        api.get('/analytics/class-book'),
                        api.get('/citaciones')
                    ]);
                    setAdminRanking(rankingRes.data.slice(0, 5));
                    setClassBookMetrics(metricsRes.data);
                    setPendingCitations(citRes.data.filter((c: any) => c.estado !== 'realizada' && c.estado !== 'cancelada'));
                }
            }

            // Fetch notifications for ALL roles
            const notifRes = await api.get('/user-notifications');
            setNotifications(notifRes.data.slice(0, 5));

            // Fetch updates for ALL roles
            const updateRes = await api.get('/updates/check').catch(() => ({ data: null }));
            if (updateRes.data && updateRes.data.hasUpdate) {
                setUpdateInfo(updateRes.data);
            }
        } catch (error) {
            console.error('Error loading dashboard data', error);
        }
    };

    if (isSuperAdmin) {
        return (
            <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700">
                {/* Alerta de Actualización del Sistema */}
                {updateInfo?.hasUpdate && (
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none p-6 mx-4 md:mx-10 mt-6 md:mt-10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-emerald-900/20 text-white">
                        <div className="flex items-center gap-6 text-center md:text-left">
                            <div className="p-4 bg-white/20 backdrop-blur-md rounded-3xl shadow-xl">
                                <AlertCircle size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter drop-shadow-md">ACTUALIZACIÓN DE SISTEMA DISPONIBLE</h3>
                                <p className="text-sm font-bold text-emerald-50">Hay una nueva versión de Einsmart lista para ser instalada. ({updateInfo.localHash} → {updateInfo.remoteHash})</p>
                            </div>
                        </div>
                        <button
                            onClick={async () => {
                                if (window.confirm('¿Estás seguro que deseas instalar la actualización? El sistema se reiniciará durante unos minutos para aplicar los cambios.')) {
                                    setIsUpdating(true);
                                    try {
                                        await api.post('/updates/run');
                                        alert('La actualización se ha iniciado en el servidor. El sistema se reiniciará automáticamente. Por favor, espera unos minutos y recarga la página.');
                                    } catch (error) {
                                        console.error(error);
                                        alert('Hubo un error al intentar iniciar la actualización.');
                                        setIsUpdating(false);
                                    }
                                }
                            }}
                            disabled={isUpdating}
                            className={`bg-white text-emerald-700 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-50 transition-all shadow-lg active:scale-95 ${isUpdating ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isUpdating ? 'Instalando...' : 'Descargar e Instalar'} <ChevronRight size={18} />
                        </button>
                    </div>
                )}
                <EinsmartDashboardPage stats={stats} />
            </div>
        );
    }

    return (
        <div className="space-y-6 md:space-y-10 p-4 md:p-10 animate-in fade-in duration-700">
            {/* Alerta de Actualización del Sistema */}
            {updateInfo?.hasUpdate && (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-10 duration-700 shadow-2xl shadow-emerald-900/20 text-white">
                    <div className="flex items-center gap-6 text-center md:text-left">
                        <div className="p-4 bg-white/20 backdrop-blur-md rounded-3xl shadow-xl">
                            <AlertCircle size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter drop-shadow-md">ACTUALIZACIÓN DE SISTEMA DISPONIBLE</h3>
                            <p className="text-sm font-bold text-emerald-50">Hay una nueva versión de Einsmart lista para ser instalada. ({updateInfo.localHash} → {updateInfo.remoteHash})</p>
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            if (window.confirm('¿Estás seguro que deseas instalar la actualización? El sistema se reiniciará durante unos minutos para aplicar los cambios.')) {
                                setIsUpdating(true);
                                try {
                                    await api.post('/updates/run');
                                    alert('La actualización se ha iniciado en el servidor. El sistema se reiniciará automáticamente. Por favor, espera unos minutos y recarga la página.');
                                } catch (error) {
                                    console.error(error);
                                    alert('Hubo un error al intentar iniciar la actualización.');
                                    setIsUpdating(false);
                                }
                            }
                        }}
                        disabled={isUpdating}
                        className={`bg-white text-emerald-700 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-50 transition-all shadow-lg active:scale-95 ${isUpdating ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isUpdating ? 'Instalando...' : 'Descargar e Instalar'} <ChevronRight size={18} />
                    </button>
                </div>
            )}

            {/* Alertas Regulatorias */}
            {pendingSignatures.length > 0 && (
                <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 animate-in zoom-in-95 duration-500">
                    <div className="flex items-center gap-6 text-center md:text-left">
                        <div className="p-4 bg-rose-600 text-white rounded-3xl shadow-xl shadow-rose-200">
                            <ShieldAlert size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-rose-900 uppercase tracking-tighter">Pendiente de Firma Digital</h3>
                            <p className="text-sm font-bold text-rose-700/70">Tienes {pendingSignatures.length} registros en el Libro de Clases sin firmar.</p>
                        </div>
                    </div>
                    <a
                        href="/class-book"
                        className="bg-rose-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 active:scale-95"
                    >
                        Ir al Libro de Clases <ChevronRight size={18} />
                    </a>
                </div>
            )}

            {/* Citaciones Pendientes para Apoderados */}
            {(pendingCitations.filter((c: any) => c.tipo === 'citacion' || !c.tipo).length > 0) && (
                <div className="bg-blue-50 border-2 border-blue-100 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 animate-in zoom-in-95 duration-500 shadow-xl shadow-blue-900/5">
                    <div className="flex items-center gap-6 text-center md:text-left">
                        <div className="p-4 bg-blue-600 text-white rounded-3xl shadow-xl shadow-blue-200">
                            <Calendar size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-blue-900 uppercase tracking-tighter">
                                {user?.role === 'student' || user?.role === 'apoderado' ? 'CITACIÓN PENDIENTE' : 'CONTROL DE CITACIONES'}
                            </h3>
                            <p className="text-sm font-bold text-blue-700/70">
                                {user?.role === 'student' || user?.role === 'apoderado'
                                    ? `Tienes citaciones agendadas para entrevista.`
                                    : `Hay citaciones pendientes en el establecimiento.`}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                        {pendingCitations.filter((c: any) => c.tipo === 'citacion' || !c.tipo).map((cit: any) => (
                            <div key={cit._id} className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-white/70 px-6 py-2 rounded-2xl border border-blue-100 flex items-center justify-between gap-4 group hover:bg-white transition-all">
                                <span>{new Date(cit.fecha).toLocaleDateString()} • {cit.hora}</span>
                                <span className="text-[8px] opacity-60">|</span>
                                <span className="flex-1 truncate">
                                    {cit.profesorId?.name?.split(' ')[0]}
                                    <span className="text-blue-300 mx-1">➜</span>
                                    {cit.apoderadoId?.nombre} {cit.apoderadoId?.apellidos}
                                </span>
                                <span className="text-[8px] opacity-60">|</span>
                                <span className="italic opacity-70 truncate max-w-[150px]">{cit.motivo}</span>
                                {(['admin', 'sostenedor', 'director', 'utp', 'inspector_general'].includes(user?.role || '')) && (
                                    <button
                                        onClick={async () => {
                                            if (window.confirm('¿Eliminar esta citación?')) {
                                                await api.delete(`/citaciones/${cit._id}`);
                                                window.location.reload();
                                            }
                                        }}
                                        className="p-1 hover:bg-rose-50 text-rose-400 rounded-lg transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Peticiones Pendientes */}
            {(pendingCitations.filter((c: any) => c.tipo === 'peticion').length > 0) && (
                <div className="bg-purple-50 border-2 border-purple-100 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 animate-in zoom-in-95 duration-500 shadow-xl shadow-purple-900/5 mt-6">
                    <div className="flex items-center gap-6 text-center md:text-left">
                        <div className="p-4 bg-purple-600 text-white rounded-3xl shadow-xl shadow-purple-200">
                            <FileText size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-purple-900 uppercase tracking-tighter">
                                CONTROL DE PETICIONES
                            </h3>
                            <p className="text-sm font-bold text-purple-700/70">
                                Hay peticiones y solicitudes pendientes.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                        {pendingCitations.filter((c: any) => c.tipo === 'peticion').map((cit: any) => (
                            <div key={cit._id} className="text-[9px] font-black text-purple-600 uppercase tracking-widest bg-white/70 px-6 py-2 rounded-2xl border border-purple-100 flex items-center justify-between gap-4 group hover:bg-white transition-all">
                                <span>{new Date(cit.fecha).toLocaleDateString()}</span>
                                <span className="text-[8px] opacity-60">|</span>
                                <span className="flex-1 truncate uppercase">
                                    {cit.estudianteId?.nombres} {cit.estudianteId?.apellidos}
                                </span>
                                <span className="text-[8px] opacity-60">|</span>
                                <span className="italic opacity-70 truncate max-w-[150px]">{cit.motivo}</span>
                                {(['admin', 'sostenedor', 'director', 'utp', 'inspector_general'].includes(user?.role || '')) && (
                                    <button
                                        onClick={async () => {
                                            if (window.confirm('¿Eliminar esta petición?')) {
                                                await api.delete(`/citaciones/${cit._id}`);
                                                window.location.reload();
                                            }
                                        }}
                                        className="p-1 hover:bg-rose-50 text-rose-400 rounded-lg transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Días Administrativos Pendientes */}
            {pendingAdminDays.length > 0 && (
                <div className="bg-amber-50 border-2 border-amber-100 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 animate-in zoom-in-95 duration-500 shadow-xl shadow-amber-900/5 mt-6">
                    <div className="flex items-center gap-6 text-center md:text-left">
                        <div className="p-4 bg-amber-600 text-white rounded-3xl shadow-xl shadow-amber-200">
                            <Clock size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-amber-900 uppercase tracking-tighter">SOLICITUDES ADMINISTRATIVAS</h3>
                            <p className="text-sm font-bold text-amber-700/70">Hay {pendingAdminDays.length} solicitudes de funcionarios esperando revisión.</p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                        {pendingAdminDays.slice(0, 3).map((req: any) => (
                            <div key={req._id} className="text-[9px] font-black text-amber-600 uppercase tracking-widest bg-white/70 px-6 py-2 rounded-2xl border border-amber-100 flex items-center justify-between gap-4">
                                <span>{new Date(req.date).toLocaleDateString()}</span>
                                <span className="text-[8px] opacity-60">|</span>
                                <span className="flex-1 truncate uppercase font-black">{req.userId?.name}</span>
                                <span className="text-[8px] opacity-60">|</span>
                                <span className="bg-amber-100 px-2 py-0.5 rounded text-[8px]">{req.type}</span>
                            </div>
                        ))}
                        <a href="/admin-days" className="text-center text-[8px] font-black text-amber-500 uppercase hover:underline mt-1">Gestionar Solicitudes</a>
                    </div>
                </div>
            )}

            {/* Alertas de Cobertura de Clases */}
            {classBookMetrics?.alerts?.length > 0 && (
                <div className="bg-amber-50 border-2 border-amber-100 p-6 rounded-[2.5rem] space-y-4 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-amber-900 uppercase tracking-tight">Alertas de Efectividad</h3>
                            <p className="text-xs font-bold text-amber-700/70">Se han detectado cursos con baja cobertura de horario oficial.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {classBookMetrics.alerts.slice(0, 3).map((alert: any, idx: number) => (
                            <div key={idx} className="bg-white/50 p-4 rounded-2xl border border-amber-200 flex items-center gap-3">
                                <AlertCircle size={16} className="text-amber-600" />
                                <span className="text-[10px] font-black text-amber-900 uppercase tracking-tight">{alert.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Header / Welcome & Quick Profile - Compact on Mobile */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 bg-white md:bg-transparent p-5 md:p-0 rounded-3xl shadow-sm md:shadow-none border md:border-none">
                <div className="space-y-1">
                    <h1 className="text-xl md:text-4xl font-black text-gray-800 tracking-tight leading-tight">
                        <span className="block md:inline text-blue-600 opacity-90">Hola,</span> {user?.name.split(' ')[0]}
                    </h1>
                    <p className="text-[10px] md:text-sm text-gray-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: tenant?.theme?.secondaryColor || '#3b82f6' }}></div>
                        Portal: {tenant?.name || 'Einsmart'}
                    </p>
                </div>

                {/* Integrated Profile Widget */}
                <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-full shadow-sm border border-slate-100 scale-90 origin-right">
                    <a href="/profile" className="flex items-center gap-4 group">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg group-hover:scale-110 transition-transform">
                            {user?.name?.charAt(0) || <User size={20} />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-700 uppercase tracking-tight group-hover:text-blue-600 transition-colors">Mi Cuenta</span>
                            <span className="text-[10px] font-bold text-slate-400">Ver Perfil</span>
                        </div>
                    </a>
                    <div className="h-8 w-[1px] bg-slate-100"></div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border
                        ${isSuperAdmin ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                        {user?.role}
                    </span>
                </div>
            </div>

            {/* Stats Cards - Grid optimized for adaptability */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.isPlatformView ? (
                    <>
                        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><School size={24} /></div>
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Instituciones</span>
                            </div>
                            <p className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">{stats.tenantCount}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">Colegios en la Plataforma</p>
                        </div>
                        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all"><GraduationCap size={24} /></div>
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Matrícula Global</span>
                            </div>
                            <p className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">{stats.studentCount.toLocaleString()}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">Estudiantes Sincronizados</p>
                        </div>
                    </>
                ) : (
                    <>
                        {(canManageStudents || user?.role === 'teacher') && (
                            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><GraduationCap size={24} /></div>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                        {user?.role === 'teacher' ? 'Mis Estudiantes' : 'Estudiantes'}
                                    </span>
                                </div>
                                <p className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">{stats.studentCount.toLocaleString()}</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">
                                    {user?.role === 'teacher' ? 'Alumnos a cargo' : 'Matrículas Vigentes'}
                                </p>
                            </div>
                        )}

                        {(isSuperAdmin || user?.role === 'teacher') && (
                            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all"><BookOpen size={24} /></div>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                        {user?.role === 'teacher' ? 'Mis Cursos' : 'Cursos'}
                                    </span>
                                </div>
                                <p className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">{stats.courseCount}</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">
                                    {user?.role === 'teacher' ? 'Cursos Asignados' : 'Niveles Académicos'}
                                </p>
                            </div>
                        )}
                    </>
                )}

                <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all group flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all"><School size={24} /></div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{stats.isPlatformView ? 'Plataforma' : 'Estado'}</span>
                    </div>
                    <p className="text-lg font-black text-emerald-600 uppercase italic tracking-tight">{stats.isPlatformView ? 'Sistema Operativo' : 'Institución Activa'}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">{stats.isPlatformView ? 'Todos los Nodos OK' : `Periodo ${new Date().getFullYear()}`}</p>
                </div>

                {!stats.isPlatformView && dualStats.total > 0 && (
                    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all group flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-[#2DAAB8]/10 rounded-2xl text-[#2DAAB8] group-hover:bg-[#2DAAB8] group-hover:text-white transition-all"><TrendingUp size={24} /></div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-right">Estadísticas Duales</span>
                        </div>
                        <div className="flex items-end gap-3">
                            <p className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">{dualStats.total}</p>
                            <div className="pb-2">
                                <p className="text-[10px] font-black text-[#2DAAB8] uppercase leading-none">{dualStats.withCompany} ASIGNADOS</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Alumnos en Alternancia</p>
                            </div>
                        </div>
                    </div>
                )}

                {classBookMetrics && !stats.isPlatformView && (
                    <div className="bg-[#11355a] p-6 md:p-8 rounded-3xl shadow-2xl border border-slate-100/10 hover:shadow-blue-900/40 transition-all group lg:col-span-3">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="space-y-2">
                                <h3 className="text-blue-300 font-black text-[10px] uppercase tracking-[0.3em]">Eficiencia en Aula</h3>
                                <p className="text-4xl font-black text-white tracking-tighter">{classBookMetrics.globalCoverage}% <span className="text-sm font-bold text-blue-400/60 uppercase">Cobertura Global</span></p>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 flex-1 w-full pl-0 md:pl-10">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-blue-400/50 uppercase tracking-widest">Tiempo Perdido</p>
                                    <p className="text-xl font-black text-rose-400">{classBookMetrics.classTimeMetrics.reduce((acc: any, curr: any) => acc + curr.totalDelay + curr.totalInterruption, 0)}m</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-blue-400/50 uppercase tracking-widest">Clases Firmadas</p>
                                    <p className="text-xl font-black text-emerald-400">{classBookMetrics.classTimeMetrics.reduce((acc: any, curr: any) => acc + curr.classCount, 0)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-blue-400/50 uppercase tracking-widest">Horas Efectivas</p>
                                    <p className="text-xl font-black text-blue-300">
                                        {(() => {
                                            const totalMin = classBookMetrics.classTimeMetrics.reduce((acc: any, curr: any) => acc + curr.totalDuration, 0);
                                            return totalMin < 60 ? `${totalMin}m` : `${(totalMin / 60).toFixed(1)}h`;
                                        })()}
                                    </p>
                                </div>
                                <a href="/schedules" className="flex flex-col items-center justify-center p-3 border border-white/10 rounded-2xl bg-white/5 hover:bg-white/10 transition-all">
                                    <Clock className="text-blue-400" size={20} />
                                    <span className="text-[8px] font-black text-white mt-1 uppercase">Ver Horarios</span>
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {isTutor && (
                <div className="bg-gradient-to-r from-[#2DAAB8] to-[#002447] p-8 md:p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="p-6 bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/20">
                            <Briefcase size={48} className="text-white" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-2">Gestión de Alumnos en Alternancia</h2>
                            <p className="text-blue-100 font-bold opacity-80 mb-6">Evalúa el desempeño de tus alumnos asignados y mantente en contacto con el establecimiento.</p>
                            <a href="/alternancias" className="inline-flex items-center gap-3 bg-white text-[#002447] px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl active:scale-95">
                                Ver mis Alumnos <ChevronRight size={18} />
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Notifications & Events Section - Stacked on Mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
                {/* Upcoming Events */}
                {!isTutor && (
                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden group">
                    <div
                        className="px-8 py-6 flex items-center justify-between"
                        style={{ backgroundColor: tenant?.theme?.primaryColor || '#11355a' }}
                    >
                        <h2 className="text-white font-black uppercase tracking-[0.1em] text-sm flex items-center gap-2">
                            <Calendar size={18} className="text-blue-300" /> EVENTOS PRÓXIMOS
                        </h2>
                        <a href="/events" className="text-[10px] font-black text-blue-200/80 hover:text-white uppercase transition-all">Ver todos</a>
                    </div>
                    <div className="p-6 md:p-8 space-y-5">
                        {upcomingEvents.map((event: any) => (
                            <div key={event._id} className="flex items-center gap-5 p-2 group/item">
                                <div
                                    className="p-3.5 rounded-2xl text-white text-center min-w-[65px] shadow-lg transition-transform group-hover/item:scale-110"
                                    style={{ backgroundColor: tenant?.theme?.primaryColor || '#11355a', opacity: 0.95 }}
                                >
                                    <span className="block text-[10px] font-black uppercase text-blue-200 leading-none mb-1">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                                    <span className="block text-2xl font-black leading-none">{new Date(event.date).getDate()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-extrabold text-gray-800 uppercase text-sm md:text-base tracking-tight truncate">{event.title}</h4>
                                    <p className="text-xs text-gray-400 font-bold flex items-center gap-1.5 mt-1.5 opacity-70">
                                        <MapPin size={14} className="text-blue-400" /> {event.location || 'Todo el colegio'}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {upcomingEvents.length === 0 && (
                            <div className="py-12 text-center">
                                <Calendar size={48} className="mx-auto text-gray-100 mb-4" />
                                <p className="text-gray-300 font-black uppercase tracking-widest text-[10px]">Agenda despejada</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

                {/* Academic Notifications (Grades & Annotations) */}
                {(user?.role === 'student' || user?.role === 'apoderado') && (
                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                        <div
                            className="px-8 py-6 flex justify-between items-center"
                            style={{ backgroundColor: tenant?.theme?.primaryColor || '#11355a' }}
                        >
                            <h2 className="text-white font-black uppercase tracking-[0.1em] text-sm flex items-center gap-2">
                                <AlertCircle size={18} className="text-rose-300" /> ACTIVIDAD ACADÉMICA
                            </h2>
                            <a href="/hoja-de-vida" className="text-xs font-black text-blue-200 hover:text-white transition-colors">Ver Completa →</a>
                        </div>
                        <div className="p-6 md:p-8 space-y-4">
                            {/* Mix of grades and annotations */}
                            {[...recentGrades.map((g: any) => ({ ...(g as any), itemType: 'grade' })), ...recentAnotaciones.map((a: any) => ({ ...(a as any), itemType: 'annotation' }))]
                                .sort((a, b) => new Date(b.createdAt || b.fechaOcurrencia).getTime() - new Date(a.createdAt || a.fechaOcurrencia).getTime())
                                .slice(0, 6)
                                .map((item: any) => (
                                    <div key={item._id} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-[1.5rem] transition-all border-2 border-transparent hover:border-slate-100 group">
                                        <div className={`${item.itemType === 'grade' ? 'bg-emerald-50' : (item.tipo === 'positiva' ? 'bg-emerald-50' : 'bg-rose-50')} p-2.5 rounded-xl group-hover:scale-110 transition-transform`}>
                                            {item.itemType === 'grade' ? <FileText className="text-emerald-500" size={20} /> : <AlertCircle className={item.tipo === 'positiva' ? 'text-emerald-500' : 'text-rose-500'} size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                                                {item.itemType === 'grade' ? 'Calificación Nueva' : `Anotación ${item.tipo}`}
                                            </p>
                                            <p className="text-sm font-black text-slate-700 truncate">{item.evaluationId?.title || item.titulo || 'Registro'}</p>
                                        </div>
                                        {item.itemType === 'grade' ? (
                                            <span className="text-2xl font-black text-emerald-600 tracking-tighter">{item.score}</span>
                                        ) : (
                                            <span className="text-[10px] font-black text-slate-400 italic">{new Date(item.fechaOcurrencia).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                ))}
                            {recentGrades.length === 0 && recentAnotaciones.length === 0 && (
                                <div className="py-12 text-center">
                                    <AlertCircle size={48} className="mx-auto text-gray-100 mb-4" />
                                    <p className="text-gray-300 font-black uppercase tracking-widest text-[10px]">Sin novedades</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* [NEW] General Notifications for Admin/Sostenedor/Director */}
                {(user?.role === 'admin' || user?.role === 'sostenedor' || user?.role === 'teacher' || user?.role === 'director') && (
                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden mt-6">
                        <div
                            className="px-8 py-6"
                            style={{ backgroundColor: tenant?.theme?.primaryColor || '#11355a' }}
                        >
                            <h2 className="text-white font-black uppercase tracking-[0.1em] text-sm flex items-center gap-2">
                                <AlertCircle size={18} className="text-amber-300" /> NOTIFICACIONES
                            </h2>
                        </div>
                        <div className="p-6 md:p-8 space-y-4">
                            {notifications.map((notif: any) => (
                                <div key={notif._id} className={`flex items-start gap-4 p-4 rounded-[1.5rem] transition-all border-2 group relative ${notif.isRead ? 'bg-white border-transparent hover:border-slate-100' : 'bg-blue-50/50 border-blue-100'}`}>
                                    <div className="bg-blue-50 p-2.5 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                                        <AlertCircle className="text-blue-500" size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{notif.type || 'Sistema'}</p>
                                            <span className="text-[9px] font-bold text-gray-300">{new Date(notif.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1">{notif.title}</h4>
                                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{notif.message}</p>
                                        {notif.link && (
                                            <a href={notif.link} className="inline-block mt-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">
                                                Ver Detalles →
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {notifications.length === 0 && (
                                <div className="py-12 text-center">
                                    <AlertCircle size={48} className="mx-auto text-gray-100 mb-4" />
                                    <p className="text-gray-300 font-black uppercase tracking-widest text-[10px]">Sin notificaciones nuevas</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {/* [NEW] Administrative Days Ranking for Director/Sostenedor */}
                {(user?.role === 'director' || user?.role === 'sostenedor' || isSuperAdmin) && adminRanking.length > 0 && (
                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden mt-6">
                        <div
                            className="px-8 py-6"
                            style={{ backgroundColor: tenant?.theme?.primaryColor || '#11355a' }}
                        >
                            <h2 className="text-white font-black uppercase tracking-[0.1em] text-sm flex items-center gap-2">
                                <Award size={18} className="text-amber-300" /> RANKING DÍAS ADMINISTRATIVOS
                            </h2>
                        </div>
                        <div className="p-6 md:p-8 space-y-4">
                            {adminRanking.map((rank: any, index: number) => (
                                <div key={rank.userId} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-[1.5rem] transition-all border-2 border-transparent hover:border-slate-100 group">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${index === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                                        #{index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-800 text-sm leading-tight uppercase">{rank.userName}</h4>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{rank.role}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xl font-black text-blue-600 tracking-tighter">{rank.usedDays}</span>
                                        <p className="text-[8px] font-black text-slate-300 uppercase leading-none">Días Usados</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* [NEW] Historial de Acceso al Libro de Clases (Solo Directivos) */}
                {accessLogs.length > 0 && (
                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden mt-6 lg:col-span-2">
                        <div
                            className="px-8 py-6"
                            style={{ backgroundColor: tenant?.theme?.primaryColor || '#11355a' }}
                        >
                            <h2 className="text-white font-black uppercase tracking-[0.1em] text-sm flex items-center gap-2">
                                <Clock size={18} className="text-emerald-300" /> HISTORIAL DE ACCESO LIBRO DIGITAL
                            </h2>
                        </div>
                        <div className="p-6 md:p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {accessLogs.map((log: any) => (
                                    <div key={log._id} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-[1.5rem] transition-all border border-slate-100 group">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm shrink-0 uppercase">
                                            {log.userId?.name?.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-800 text-xs leading-tight uppercase truncate">{log.userId?.name}</h4>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{log.courseId?.name} {log.courseId?.letter}</p>
                                            <p className="text-[8px] font-bold text-emerald-500 uppercase mt-1">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Institutional Calendar for the whole community */}
            {!isTutor && (
                <InstitutionalCalendar
                    items={[]}
                    studentId={user?.role === 'student' ? user._id : undefined}
                    guardianId={user?.role === 'apoderado' ? user._id : undefined}
                />
            )}
        </div>
    );
};

export default DashboardPage;
