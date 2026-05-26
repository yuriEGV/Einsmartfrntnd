import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { Plus, Trash2, Calendar, Save, ShieldAlert, Loader2, Briefcase, User, Search, AlertCircle } from 'lucide-react';

interface Schedule {
    _id: string;
    courseId: { _id: string; name: string };
    subjectId: { _id: string; name: string };
    teacherId: { _id: string; name: string };
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isDual?: boolean;
}

interface Course {
    _id: string;
    name: string;
}

interface Subject {
    _id: string;
    name: string;
    courseId: string;
}

interface Teacher {
    _id: string;
    name: string;
}

const BLOCKS = [
    { id: 1, start: '08:00', end: '08:45' },
    { id: 2, start: '08:45', end: '09:30' },
    { id: 3, start: '09:45', end: '10:30' },
    { id: 4, start: '10:30', end: '11:15' },
    { id: 5, start: '11:25', end: '12:10' },
    { id: 6, start: '12:10', end: '12:55' },
    { id: 7, start: '13:40', end: '14:25' },
    { id: 8, start: '14:25', end: '15:10' },
];

const DAYS = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

const ScheduleManagementPage = () => {
    const { isAdmin, isUTP, isDirector, isStudent, isApoderado, isTeacher, user, canViewSensitiveData } = usePermissions();
    const canEdit = isAdmin || isUTP || isDirector || canViewSensitiveData;

    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [alternancias, setAlternancias] = useState<any[]>([]);
    const [selectedAlt, setSelectedAlt] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [dualSearch, setDualSearch] = useState('');
    const [showAllDual, setShowAllDual] = useState(true);
    const [allAlternancias, setAllAlternancias] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);

    const [formData, setFormData] = useState({
        courseId: '',
        subjectId: '',
        teacherId: '',
        dayOfWeek: 1,
        blockId: 1,
        isDual: false
    });

    const isInitialMount = React.useRef(true);

    useEffect(() => {
        if (canEdit || isTeacher) {
            fetchInitialData();
        }
        
        // Students, Guardians and Teachers should see their own schedule automatically
        if (isStudent || isApoderado || isTeacher) {
            fetchSchedules();
        }
        isInitialMount.current = false;
    }, []);

    useEffect(() => {
        if (isInitialMount.current) return;
        if (selectedCourse || isTeacher) {
            fetchSchedules();
        }
    }, [selectedCourse]);

    const fetchInitialData = async () => {
        try {
            const promises: Promise<any>[] = [api.get('/courses')];
            if (canEdit) {
                promises.push(api.get('/users?role=teacher'));
            }
            
            const results = await Promise.all(promises);
            setCourses(results[0].data);
            if (canEdit && results[1]) {
                setTeachers(results[1].data);
            }
        } catch (error) {
            console.error('Error fetching initial data', error);
        }
    };

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];
            let url = `/schedules?date=${today}`;
            if (selectedCourse) url += `&courseId=${selectedCourse}`;
            
            const res = await api.get(url);

            // Fetch Alternancias for Dual Modules integration
            const altRes = await api.get('/alternancias');
            setAllAlternancias(altRes.data);
            const courseAlts = selectedCourse 
                ? altRes.data.filter((a: any) => a.careerId?._id === selectedCourse || a.courseId === selectedCourse) 
                : altRes.data;
            setAlternancias(courseAlts);
            
            // Polymorphic structure support (Handles {schedules, events} vs [schedules])
            if (res.data && res.data.schedules) {
                setSchedules(res.data.schedules || []);
                setEvents(res.data.events || []);
            } else if (Array.isArray(res.data)) {
                setSchedules(res.data || []);
                setEvents([]);
            } else {
                setSchedules([]);
                setEvents([]);
            }
        } catch (error) {
            console.error('Error fetching schedules', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async (courseId: string) => {
        try {
            const res = await api.get(`/subjects?courseId=${courseId}`);
            setSubjects(res.data);
        } catch (error) {
            console.error('Error fetching subjects', error);
        }
    };

    const handleCourseChange = (courseId: string) => {
        setSelectedCourse(courseId);
        if (courseId) fetchSubjects(courseId);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const block = BLOCKS.find(b => b.id === formData.blockId);
            const payload = {
                ...formData,
                startTime: block?.start,
                endTime: block?.end
            };
            await api.post('/schedules', payload);
            setShowModal(false);
            fetchSchedules();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al guardar horario');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Eliminar este bloque de horario?')) return;
        try {
            await api.delete(`/schedules/${id}`);
            fetchSchedules();
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    // canEdit is defined at component top-level

    // Helper to get item in a specific cell
    const getCellContent = (day: number, blockId: number) => {
        const item = (schedules || []).find(s => s.dayOfWeek === day && (s as any).blockId === blockId);
        const dayEvents = (events || []).filter(e => {
            const eventDate = new Date(e.date);
            return eventDate.getDay() === day;
        });
        return { item, dayEvents };
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tighter">
                        <Calendar className="text-blue-600" size={32} />
                        Horario Académico {isTeacher ? 'Docente' : 'Estudiantil'}
                    </h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                        {isTeacher ? `Carga horaria de ${user?.name}` : 'Matriz de clases y eventos semanales'}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {(canEdit || (isTeacher && courses.length > 0)) && (
                        <div className="min-w-[240px] print:hidden">
                            <select
                                className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-black text-slate-700 appearance-none shadow-sm"
                                value={selectedCourse}
                                onChange={(e) => handleCourseChange(e.target.value)}
                            >
                                {isTeacher ? (
                                    <>
                                        <option value="">Mi Horario Personal</option>
                                        {Array.isArray(courses) && courses.map(c => (
                                            <option key={c._id} value={c._id}>Horario de {c.name}</option>
                                        ))}
                                    </>
                                ) : (
                                    <>
                                        <option value="">Seleccionar Curso...</option>
                                        {Array.isArray(courses) && courses.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </>
                                )}
                            </select>
                        </div>
                    )}
                    {canEdit && selectedCourse && (
                        <div className="flex items-center gap-3">
                            <Link
                                to="/subjects"
                                className="bg-slate-100 text-slate-500 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-200 transition-all border border-slate-200 active:scale-95"
                            >
                                Gestionar Asignaturas
                            </Link>
                            <button
                                onClick={() => {
                                    setFormData({
                                        courseId: selectedCourse,
                                        subjectId: '',
                                        teacherId: '',
                                        dayOfWeek: 1,
                                        blockId: 1,
                                        isDual: false
                                    });
                                    fetchSubjects(selectedCourse);
                                    setShowModal(true);
                                }}
                                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95"
                            >
                                <Plus size={18} /> Nuevo Bloque
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="p-6 border-r border-white/5 text-[10px] uppercase tracking-widest font-black w-32">Bloque</th>
                                {[1, 2, 3, 4, 5].map(d => (
                                    <th key={d} className="p-6 border-r border-white/5 text-[10px] uppercase tracking-widest font-black">
                                        {DAYS[d]}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center">
                                        <Loader2 className="animate-spin mx-auto text-blue-600 mb-4" size={48} />
                                        <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Sincronizando Horarios...</p>
                                    </td>
                                </tr>
                            ) : BLOCKS.map(block => (
                                <tr key={block.id} className="border-b border-slate-100">
                                    <td className="p-6 bg-slate-50 border-r border-slate-100">
                                        <div className="flex flex-col items-center">
                                            <span className="text-xl font-black text-slate-800 tracking-tighter">{block.id}º</span>
                                            <span className="text-[10px] font-bold text-slate-400 mt-1">{block.start} - {block.end}</span>
                                        </div>
                                    </td>
                                    {[1, 2, 3, 4, 5].map(day => {
                                        const { item, dayEvents } = getCellContent(day, block.id);
                                        return (
                                            <td key={day} className="p-3 border-r border-slate-100 min-w-[200px] align-top">
                                                {item ? (
                                                    <div className="group relative bg-blue-50/50 p-4 rounded-2xl border-2 border-blue-100 hover:border-blue-400 hover:bg-white hover:shadow-xl transition-all h-full min-h-[100px] flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className={`text-[8px] text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${item.isDual ? 'bg-[#2DAAB8]' : 'bg-blue-600'}`}>
                                                                    {item.isDual ? 'FORMACIÓN DUAL' : item.courseId.name}
                                                                </span>
                                                                {canEdit && (
                                                                    <button onClick={() => handleDelete(item._id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <h4 className={`font-black text-xs uppercase leading-tight ${item.isDual ? 'text-[#002447]' : 'text-slate-800'}`}>
                                                                {item.subjectId?.name}
                                                            </h4>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 truncate">
                                                                {item.isDual ? 'ENTORNO EMPRESA' : item.teacherId?.name}
                                                            </p>
                                                        </div>
                                                        
                                                        {dayEvents.length > 0 && block.id === 1 && (
                                                            <div className="mt-3 pt-3 border-t border-blue-100 animate-pulse">
                                                                <div className="flex items-center gap-2 text-rose-600">
                                                                    <ShieldAlert size={10} />
                                                                    <span className="text-[8px] font-black uppercase tracking-tighter">Evaluación Hoy</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="h-full min-h-[100px] bg-slate-50/30 border-2 border-dashed border-slate-50 rounded-2xl flex items-center justify-center opacity-40">
                                                        <span className="text-[8px] font-bold uppercase text-slate-300 tracking-[0.2em]">Bloque Libre</span>
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Event Markers Section */}
            {(events.length > 0 || alternancias.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {events.length > 0 && (
                        <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100 animate-in slide-in-from-bottom duration-700">
                            <h3 className="text-amber-900 font-black uppercase text-xs tracking-widest flex items-center gap-2 mb-4">
                                <Calendar size={18} /> Eventos y Evaluaciones de la Semana
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {events.map((e, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-amber-100 flex items-center gap-4">
                                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                                            <span className="font-black text-sm">{new Date(e.date).getDate()}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-slate-800 uppercase text-[10px] truncate">{e.title}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase">{e.type}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {(allAlternancias.length > 0 || alternancias.length > 0) && (
                        <div className="bg-[#2DAAB8]/5 rounded-[2rem] p-8 border border-[#2DAAB8]/10 animate-in slide-in-from-bottom duration-700 delay-100 flex flex-col h-[560px]">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
                                <h3 className="text-[#002447] font-black uppercase text-xs tracking-widest flex items-center gap-2">
                                    <Briefcase size={18} className="text-[#2DAAB8]" /> Monitor de Formación Dual Activa
                                </h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Mostrar Todos</span>
                                    <button 
                                        type="button"
                                        onClick={() => setShowAllDual(!showAllDual)}
                                        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${showAllDual ? 'bg-[#2DAAB8]' : 'bg-slate-200'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 ${showAllDual ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Search bar */}
                            <div className="relative mb-4 shrink-0">
                                <input 
                                    type="text"
                                    placeholder="Buscar alumno o empresa..."
                                    value={dualSearch}
                                    onChange={e => setDualSearch(e.target.value)}
                                    className="w-full px-5 py-3 rounded-2xl bg-white border border-slate-200 focus:border-[#2DAAB8] focus:ring-1 focus:ring-[#2DAAB8] outline-none font-bold text-xs uppercase text-[#002447] placeholder:text-slate-300 shadow-sm"
                                />
                                <Search size={14} className="absolute right-4 top-3.5 text-slate-300" />
                            </div>

                            {/* List wrapper with max-h and custom scrollbar */}
                            <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                                {(() => {
                                    const sourceList = showAllDual ? allAlternancias : alternancias;
                                    const filtered = sourceList.filter((a: any) => {
                                        const name = `${a.estudianteId?.nombres || ''} ${a.estudianteId?.apellidos || ''}`.toLowerCase();
                                        const company = (a.empresa?.razonSocial || '').toLowerCase();
                                        const search = dualSearch.toLowerCase();
                                        return name.includes(search) || company.includes(search);
                                    });

                                    if (filtered.length === 0) {
                                        return (
                                            <div className="py-12 text-center">
                                                <AlertCircle size={28} className="mx-auto text-slate-300 mb-2" />
                                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Sin resultados</p>
                                            </div>
                                        );
                                    }

                                    return filtered.map((alt, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => setSelectedAlt(alt)}
                                            className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-[#2DAAB8]/10 hover:border-[#2DAAB8]/20 transition-all shadow-sm hover:shadow-md cursor-pointer group active:scale-98"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-[#002447] rounded-xl flex items-center justify-center text-white overflow-hidden border-2 border-white group-hover:border-[#2DAAB8] transition-colors shrink-0">
                                                    {alt.estudianteId?.photoUrl ? (
                                                        <img src={alt.estudianteId.photoUrl} alt="Alumno" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={18} />
                                                    )}
                                                </div>
                                                <div className="min-w-0 text-left">
                                                    <p className="font-black text-[#002447] uppercase text-[10px] group-hover:text-[#2DAAB8] transition-colors truncate">
                                                        {alt.estudianteId?.firstName || alt.estudianteId?.nombres} {alt.estudianteId?.lastName || alt.estudianteId?.apellidos}
                                                    </p>
                                                    <p className="text-[9px] text-[#2DAAB8] font-bold uppercase tracking-wider truncate">{alt.empresa?.razonSocial || 'Empresa por asignar'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex items-center gap-2 shrink-0">
                                                <span className="bg-[#2DAAB8]/10 text-[#2DAAB8] px-3 py-1 rounded-full text-[8px] font-black uppercase">{alt.tipo}</span>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[999] md:pl-[300px]">
                    <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl border-8 border-white">
                        <div className="p-10 bg-[#11355a] text-white relative overflow-hidden">
                            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none mb-2">Asignar Bloque</h2>
                            <p className="text-blue-300 font-bold uppercase text-[10px] tracking-widest">Planificación Semanal</p>
                        </div>
                        <form onSubmit={handleSave} className="p-10 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">ASIGNATURA</label>
                                    <select
                                        required
                                        className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none font-black text-slate-700 shadow-inner"
                                        value={formData.subjectId}
                                        onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {subjects.length === 0 ? (
                                            <option disabled>No hay asignaturas vinculadas a este curso</option>
                                        ) : subjects.map(s => (
                                            <option key={s._id} value={s._id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">PROFESOR</label>
                                    <select
                                        required
                                        className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-black text-slate-700"
                                        value={formData.teacherId}
                                        onChange={e => setFormData({ ...formData, teacherId: e.target.value })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {teachers.map(t => (
                                            <option key={t._id} value={t._id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">DÍA</label>
                                    <select
                                        className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-black text-slate-700"
                                        value={formData.dayOfWeek}
                                        onChange={e => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                                    >
                                        {[1, 2, 3, 4, 5].map(d => (
                                            <option key={d} value={d}>{DAYS[d]}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">BLOQUE HORARIO</label>
                                    <select
                                        className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-black text-slate-700"
                                        value={formData.blockId}
                                        onChange={e => setFormData({ ...formData, blockId: parseInt(e.target.value) })}
                                    >
                                        {BLOCKS.map(b => (
                                            <option key={b.id} value={b.id}>{b.id}º ({b.start} - {b.end})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2 flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                                    <input 
                                        type="checkbox" 
                                        id="isDual"
                                        className="w-5 h-5 accent-[#2DAAB8]"
                                        checked={formData.isDual}
                                        onChange={e => setFormData({ ...formData, isDual: e.target.checked })}
                                    />
                                    <label htmlFor="isDual" className="text-[10px] font-black text-[#002447] uppercase tracking-widest cursor-pointer">
                                        Bloque de Formación Dual (En Empresa)
                                    </label>
                                </div>
                            </div>
                            <div className="pt-6 flex gap-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                                <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2">
                                    <Save size={18} /> Confirmar Asignación
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Quick View Modal for Dual Alternancia */}
            {selectedAlt && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[999] md:pl-[300px]">
                    <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl border-8 border-white overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 bg-[#002447] text-white relative overflow-hidden">
                            <h2 className="text-xl font-black uppercase tracking-tighter leading-none mb-2">
                                {selectedAlt.estudianteId?.firstName || selectedAlt.estudianteId?.nombres} {selectedAlt.estudianteId?.lastName || selectedAlt.estudianteId?.apellidos}
                            </h2>
                            <p className="text-[#2DAAB8] font-bold uppercase text-[9px] tracking-widest">EXPEDIENTE DE FORMACIÓN DUAL</p>
                            <button onClick={() => setSelectedAlt(null)} className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all">✕</button>
                        </div>
                        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Especialidad / Carrera</label>
                                    <p className="text-xs font-bold text-slate-700 uppercase">{selectedAlt.careerId?.name || 'No asignada'}</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                                    <div>
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Empresa</label>
                                        <p className="text-xs font-bold text-slate-700 uppercase">{selectedAlt.empresa?.razonSocial || 'Por asignar'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">RUT Empresa</label>
                                        <p className="text-xs font-bold text-slate-700 uppercase">{selectedAlt.empresa?.rut || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                                    <div>
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Tipo de Alternancia</label>
                                        <span className="inline-block bg-[#2DAAB8]/10 text-[#2DAAB8] px-3 py-1 rounded-full text-[9px] font-black uppercase mt-1">
                                            {selectedAlt.tipo}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado</label>
                                        <span className="inline-block bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[9px] font-black uppercase mt-1">
                                            {selectedAlt.estado}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                                    <div>
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha de Inicio</label>
                                        <p className="text-xs font-bold text-slate-700">{selectedAlt.fechaInicio ? new Date(selectedAlt.fechaInicio).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha de Término</label>
                                        <p className="text-xs font-bold text-slate-700">{selectedAlt.fechaTermino ? new Date(selectedAlt.fechaTermino).toLocaleDateString() : 'Activa/Abierta'}</p>
                                    </div>
                                </div>

                                {selectedAlt.maestroGuia?.nombre && (
                                    <div className="border-t border-slate-100 pt-4">
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Maestro Guía en Empresa</label>
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                                            <p className="font-black text-slate-700 uppercase">{selectedAlt.maestroGuia.nombre}</p>
                                            {selectedAlt.maestroGuia.cargo && <p className="text-slate-400 font-bold uppercase text-[9px]">Cargo: {selectedAlt.maestroGuia.cargo}</p>}
                                            {selectedAlt.maestroGuia.telefono && <p className="text-slate-500 font-medium">Fono: {selectedAlt.maestroGuia.telefono}</p>}
                                            {selectedAlt.maestroGuia.email && <p className="text-slate-500 font-medium">Email: {selectedAlt.maestroGuia.email}</p>}
                                        </div>
                                    </div>
                                )}

                                {selectedAlt.modulosDual && selectedAlt.modulosDual.length > 0 && (
                                    <div className="border-t border-slate-100 pt-4">
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Módulos Técnicos Asociados</label>
                                        <div className="space-y-2">
                                            {selectedAlt.modulosDual.map((mod: any, index: number) => (
                                                <div key={index} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                                                    <span className="font-black text-slate-700 uppercase">{mod.subjectId?.name || 'Módulo Técnico'}</span>
                                                    <span className="bg-[#2DAAB8]/10 text-[#2DAAB8] px-2 py-0.5 rounded text-[9px] font-black shrink-0">
                                                        {mod.horasEmpresa || 0} Hrs Empresa
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button 
                                    type="button" 
                                    onClick={() => setSelectedAlt(null)} 
                                    className="flex-1 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
                                >
                                    Cerrar
                                </button>
                                <Link 
                                    to="/alternancias" 
                                    className="flex-[2] py-4 bg-[#002447] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-950 shadow-xl transition-all text-center flex items-center justify-center gap-2"
                                >
                                    Ir a Expedientes
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduleManagementPage;
