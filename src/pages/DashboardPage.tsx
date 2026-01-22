import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useTenant } from '../context/TenantContext';
import api from '../services/api';
import { User, BookOpen, GraduationCap, DollarSign, Save, Calendar, AlertCircle, FileText, School, MapPin } from 'lucide-react';

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
        <div className="space-y-8 p-6 lg:p-10 animate-in fade-in duration-700">
            {/* Header / Welcome */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 flex items-center gap-2">
                        Bienvenido, {user?.name}
                    </h1>
                    <p className="text-gray-500 font-bold flex items-center gap-2">
                        <School size={16} className="text-blue-500" />
                        Portal Institucional: {tenant?.name || 'Maritimo 4.0'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest
                        ${isSuperAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {user?.role}
                    </span>
                </div>
            </div>

            {/* Stats Cards (Role Conditional) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {canManageStudents && (
                    <div className="bg-white p-6 rounded-2xl shadow-xl shadow-blue-500/5 border-l-8 border-blue-500 active:scale-[0.98] transition-all">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-50 rounded-lg"><GraduationCap className="text-blue-500" /></div>
                            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">Estudiantes</h3>
                        </div>
                        <p className="text-4xl font-black text-gray-800">{stats.studentCount.toLocaleString()}</p>
                    </div>
                )}

                {(isSuperAdmin || user?.role === 'teacher') && (
                    <div className="bg-white p-6 rounded-2xl shadow-xl shadow-emerald-500/5 border-l-8 border-emerald-500 active:scale-[0.98] transition-all">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-50 rounded-lg"><BookOpen className="text-emerald-500" /></div>
                            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">Cursos Activos</h3>
                        </div>
                        <p className="text-4xl font-black text-gray-800">{stats.courseCount}</p>
                    </div>
                )}

                <div className="bg-white p-6 rounded-2xl shadow-xl shadow-amber-500/5 border-l-8 border-amber-500 active:scale-[0.98] transition-all">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-50 rounded-lg"><DollarSign className="text-amber-500" /></div>
                        <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">Estado</h3>
                    </div>
                    <p className="text-lg font-black text-emerald-600 uppercase italic">Institución Activa</p>
                </div>
            </div>

            {/* Notifications & Events Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upcoming Events */}
                <div className="bg-white rounded-3xl shadow-2xl border overflow-hidden">
                    <div
                        className="px-6 py-4 flex items-center justify-between"
                        style={{ backgroundColor: tenant?.theme?.primaryColor || '#11355a' }}
                    >
                        <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={18} className="text-blue-300" /> Eventos
                        </h2>
                        <a href="/events" className="text-xs font-black text-blue-200 hover:text-white uppercase">Ver todos</a>
                    </div>
                    <div className="p-6 space-y-4">
                        {upcomingEvents.map((event: any) => (
                            <div key={event._id} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-2xl transition-colors border-b last:border-0 border-dashed">
                                <div
                                    className="p-3 rounded-2xl text-white text-center min-w-[60px]"
                                    style={{ backgroundColor: tenant?.theme?.primaryColor || '#11355a', opacity: 0.9 }}
                                >
                                    <span className="block text-[10px] font-black uppercase text-blue-200">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                                    <span className="block text-xl font-black">{new Date(event.date).getDate()}</span>
                                </div>
                                <div className="py-1">
                                    <h4 className="font-black text-gray-800 uppercase text-sm tracking-tight">{event.title}</h4>
                                    <p className="text-xs text-gray-400 font-bold flex items-center gap-1 mt-1">
                                        <MapPin size={12} /> {event.location}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {upcomingEvents.length === 0 && <p className="text-sm text-gray-400 font-bold p-10 text-center uppercase tracking-widest">No hay eventos próximos.</p>}
                    </div>
                </div>

                {/* Academic Notifications (Placeholders for now) */}
                {(user?.role === 'student' || user?.role === 'apoderado') && (
                    <div className="bg-white rounded-3xl shadow-2xl border overflow-hidden">
                        <div
                            className="px-6 py-4 flex items-center justify-between"
                            style={{ backgroundColor: tenant?.theme?.primaryColor || '#11355a' }}
                        >
                            <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-2">
                                <AlertCircle size={18} className="text-red-300" /> Académico
                            </h2>
                        </div>
                        <div className="p-6 space-y-3">
                            {recentGrades.map((grade: any) => (
                                <div key={grade._id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-2xl transition-colors border shadow-sm">
                                    <FileText className="text-emerald-500" size={18} />
                                    <div className="flex-1">
                                        <p className="text-xs font-black text-gray-400 uppercase">Nueva Calificación</p>
                                        <p className="text-sm font-bold">{grade.evaluationId?.title || 'Evaluación'}</p>
                                    </div>
                                    <span className="text-lg font-black text-emerald-600">{grade.score}</span>
                                </div>
                            ))}
                            {recentGrades.length === 0 && (
                                <p className="text-sm text-gray-400 font-bold p-10 text-center uppercase tracking-widest">Sin novedades recientes.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Profile Management Section */}
            {canEditProfile && (
                <div className="bg-white rounded-3xl shadow-2xl border overflow-hidden">
                    <div
                        className="px-6 py-4 flex items-center gap-2"
                        style={{ backgroundColor: tenant?.theme?.primaryColor || '#11355a' }}
                    >
                        <User className="text-white w-5 h-5 shadow-sm" />
                        <h2 className="text-white font-black uppercase tracking-widest">Mi Perfil</h2>
                    </div>

                    <div className="p-8">
                        {msg.text && (
                            <div className={`mb-6 p-4 rounded-2xl font-bold flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                <AlertCircle size={18} />
                                {msg.text}
                            </div>
                        )}

                        <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Read Only Fields */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">RUT (Identificador)</label>
                                    <div className="bg-gray-50 p-3 rounded-xl border-2 border-gray-100 text-gray-600 font-bold">{profileData.rut || 'No registrado'}</div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Rol en el Sistema</label>
                                    <div className="bg-gray-50 p-3 rounded-xl border-2 border-gray-100 text-[#11355a] font-black capitalize tracking-tight">{user?.role}</div>
                                </div>
                            </div>

                            {/* Editable Fields */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Nombre Completo</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 bg-white border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/10 transition-all outline-none font-bold"
                                        value={profileData.name}
                                        onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        className="w-full p-3 bg-white border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none font-bold"
                                        value={profileData.email}
                                        onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-[#11355a] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-900 shadow-xl active:scale-95 transition-all flex items-center gap-2 disabled:bg-gray-400"
                                >
                                    <Save className="w-5 h-5" />
                                    {loading ? 'GUARDANDO...' : 'GUARDAR PERFIL'}
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
