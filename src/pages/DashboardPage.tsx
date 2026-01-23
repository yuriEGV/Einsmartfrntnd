import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useTenant } from '../context/TenantContext';
import api from '../services/api';
import { User, BookOpen, GraduationCap, Save, Calendar, AlertCircle, FileText, School, MapPin } from 'lucide-react';

const DashboardPage = () => {
    const { user } = useAuth();
    const { tenant } = useTenant();
    const { canEditProfile, isSuperAdmin, canManageStudents } = usePermissions();

    // Profile State
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        rut: user?.rut || '',
        phone: '',
        address: ''
    });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    const [stats, setStats] = useState({ studentCount: 0, courseCount: 0 });
    const [recentGrades, setRecentGrades] = useState([]);
    // const [recentAnotaciones, setRecentAnotaciones] = useState([]); // Unused
    const [upcomingEvents, setUpcomingEvents] = useState([]);

    useEffect(() => {
        if (user) {
            setProfileData(prev => ({
                ...prev,
                name: user.name,
                email: user.email,
                rut: user.rut || ''
            }));
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            // Parallel fetch
            const [eventsRes, statsRes] = await Promise.all([
                api.get('/events'),
                (canManageStudents || isSuperAdmin || user?.role === 'teacher') ? api.get('/analytics/dashboard-stats') : Promise.resolve({ data: { studentCount: 0, courseCount: 0 } })
            ]);

            setUpcomingEvents(eventsRes.data.slice(0, 3));
            if (statsRes.data) setStats(statsRes.data);

            if (user?.role === 'student' || user?.role === 'apoderado') {
                const gradesRes = await api.get('/grades');
                setRecentGrades(gradesRes.data.slice(0, 5));

                // const anotRes = await api.get('/anotaciones');
                // setRecentAnotaciones(anotRes.data.slice(0, 5));
            }
        } catch (error) {
            console.error('Error loading dashboard data', error);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMsg({ type: '', text: '' });

        try {
            await api.put('/auth/perfil', profileData);
            setMsg({ type: 'success', text: 'Perfil actualizado correctamente' });
        } catch (error: any) {
            setMsg({ type: 'error', text: error.response?.data?.message || 'Error al actualizar' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 md:space-y-10 p-4 md:p-10 animate-in fade-in duration-700">
            {/* Header / Welcome - Compact on Mobile */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white md:bg-transparent p-5 md:p-0 rounded-3xl shadow-sm md:shadow-none border md:border-none">
                <div className="space-y-1">
                    <h1 className="text-xl md:text-4xl font-black text-gray-800 tracking-tight leading-tight">
                        <span className="block md:inline text-blue-600 opacity-90">Hola,</span> {user?.name.split(' ')[0]}
                    </h1>
                    <p className="text-[10px] md:text-sm text-gray-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: tenant?.theme?.secondaryColor || '#3b82f6' }}></div>
                        Portal: {tenant?.name || 'Maritimo 4.0'}
                    </p>
                </div>
                <div className="flex items-center">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest border
                        ${isSuperAdmin ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                        {user?.role}
                    </span>
                </div>
            </div>

            {/* Stats Cards - Grid optimized for touch */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
                {canManageStudents && (
                    <div className="bg-white p-5 md:p-8 rounded-[2rem] shadow-xl shadow-blue-500/5 border-b-4 border-blue-500 hover:translate-y-[-4px] transition-all">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-blue-50 rounded-xl"><GraduationCap size={20} className="text-blue-500" /></div>
                            <h3 className="hidden md:block text-[10px] font-black text-gray-400 uppercase tracking-widest">Estudiantes</h3>
                        </div>
                        <p className="text-xl md:text-5xl font-black text-gray-800 tracking-tighter">{stats.studentCount.toLocaleString()}</p>
                        <p className="md:hidden text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Estudiantes</p>
                    </div>
                )}

                {(isSuperAdmin || user?.role === 'teacher') && (
                    <div className="bg-white p-5 md:p-8 rounded-[2rem] shadow-xl shadow-emerald-500/5 border-b-4 border-emerald-500 hover:translate-y-[-4px] transition-all">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-emerald-50 rounded-xl"><BookOpen size={20} className="text-emerald-500" /></div>
                            <h3 className="hidden md:block text-[10px] font-black text-gray-400 uppercase tracking-widest">Cursos</h3>
                        </div>
                        <p className="text-xl md:text-5xl font-black text-gray-800 tracking-tighter">{stats.courseCount}</p>
                        <p className="md:hidden text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Cursos</p>
                    </div>
                )}

                <div className="hidden md:block bg-white p-8 rounded-[2rem] shadow-xl shadow-amber-500/5 border-b-4 border-amber-500 hover:translate-y-[-4px] transition-all">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-amber-50 rounded-xl"><School size={20} className="text-amber-500" /></div>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</h3>
                    </div>
                    <p className="text-lg font-black text-emerald-600 uppercase italic">Institución Activa</p>
                </div>
            </div>

            {/* Notifications & Events Section - Stacked on Mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
                {/* Upcoming Events */}
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

                {/* Academic Notifications */}
                {(user?.role === 'student' || user?.role === 'apoderado') && (
                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                        <div
                            className="px-8 py-6"
                            style={{ backgroundColor: tenant?.theme?.primaryColor || '#11355a' }}
                        >
                            <h2 className="text-white font-black uppercase tracking-[0.1em] text-sm flex items-center gap-2">
                                <AlertCircle size={18} className="text-rose-300" /> ACTIVIDAD ACADÉMICA
                            </h2>
                        </div>
                        <div className="p-6 md:p-8 space-y-4">
                            {recentGrades.map((grade: any) => (
                                <div key={grade._id} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-[1.5rem] transition-all border-2 border-transparent hover:border-slate-100 group">
                                    <div className="bg-emerald-50 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                                        <FileText className="text-emerald-500" size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Calificación Nueva</p>
                                        <p className="text-sm font-black text-slate-700 truncate">{grade.evaluationId?.title || 'Evaluación'}</p>
                                    </div>
                                    <span className="text-2xl font-black text-emerald-600 tracking-tighter">{grade.score}</span>
                                </div>
                            ))}
                            {recentGrades.length === 0 && (
                                <div className="py-12 text-center">
                                    <AlertCircle size={48} className="mx-auto text-gray-100 mb-4" />
                                    <p className="text-gray-300 font-black uppercase tracking-widest text-[10px]">Sin novedades</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Profile Management Section - Collapsed on smaller screens by design or just responsive */}
            {canEditProfile && (
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                    <div
                        className="px-8 py-6 flex items-center gap-3"
                        style={{ backgroundColor: tenant?.theme?.primaryColor || '#11355a' }}
                    >
                        <User className="text-white w-5 h-5" />
                        <h2 className="text-white font-black uppercase tracking-[0.1em] text-sm">CONFIGURACIÓN DE CUENTA</h2>
                    </div>

                    <div className="p-6 md:p-10">
                        {msg.text && (
                            <div className={`mb-8 p-5 rounded-2xl font-black flex items-center gap-3 animate-in slide-in-from-top-2 ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                <AlertCircle size={20} />
                                <span className="text-xs uppercase tracking-tight">{msg.text}</span>
                            </div>
                        )}

                        <form onSubmit={handleUpdateProfile} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                                <div className="space-y-6">
                                    <div className="group">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">NOMBRE COMPLETO</label>
                                        <input
                                            type="text"
                                            className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none font-extrabold text-slate-700 shadow-inner group-focus-within:shadow-blue-500/5"
                                            value={profileData.name}
                                            onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">CORREO ELECTRÓNICO</label>
                                        <input
                                            type="email"
                                            className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none font-extrabold text-blue-600 shadow-inner group-focus-within:shadow-blue-500/5"
                                            value={profileData.email}
                                            onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-slate-50/50 p-6 rounded-3xl border-2 border-dashed border-slate-100">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Detalles del Sistema</h4>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-slate-500 uppercase">Identificador</span>
                                                <span className="font-mono text-xs font-black text-slate-800 bg-white px-2 py-1 rounded-lg border">{profileData.rut || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-slate-500 uppercase">Rol</span>
                                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 uppercase tracking-tighter">{user?.role}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center md:justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full md:w-auto bg-[#11355a] text-white px-12 py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-900 shadow-2xl hover:shadow-blue-900/40 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:bg-gray-300"
                                >
                                    {loading ? 'MODIFICANDO...' : (
                                        <>
                                            <Save size={20} />
                                            CONFIRMAR CAMBIOS
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
