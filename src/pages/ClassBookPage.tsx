
import { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import {
    BookOpen, CheckCircle, Clock, ShieldCheck,
    Save, Filter, Calendar as CalendarIcon,
    AlertCircle, FileText, Target, X
} from 'lucide-react';

interface ClassLog {
    _id: string;
    courseId: { _id: string; name: string };
    subjectId: { _id: string; name: string };
    teacherId: { _id: string; name: string };
    date: string;
    topic: string;
    activities: string;
    objectives: string[];
    isSigned: boolean;
    signedAt?: string;
}

const ClassBookPage = () => {
    const permissions = usePermissions();
    const [logs, setLogs] = useState<ClassLog[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters & Form
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        courseId: '',
        subjectId: '',
        date: new Date().toISOString().split('T')[0],
        topic: '',
        activities: '',
        objectives: [] as string[]
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [selectedCourse, selectedSubject]);

    const fetchInitialData = async () => {
        try {
            const [coursesRes, subjectsRes] = await Promise.all([
                api.get('/courses'),
                api.get('/subjects')
            ]);
            setCourses(coursesRes.data);
            setSubjects(subjectsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedCourse) params.append('courseId', selectedCourse);
            if (selectedSubject) params.append('subjectId', selectedSubject);

            const res = await api.get(`/class-logs?${params.toString()}`);
            setLogs(res.data);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/class-logs', formData);
            alert('Libro de clase actualizado correctamente');
            setShowForm(false);
            setFormData({
                ...formData,
                topic: '',
                activities: '',
                objectives: []
            });
            fetchLogs();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al guardar el registro');
        }
    };

    const handleSign = async (id: string) => {
        if (!window.confirm('¿Confirma la firma electrónica de este registro pedagógico? Una vez firmado no podrá editarse.')) return;
        try {
            await api.post(`/class-logs/${id}/sign`);
            alert('Registro firmado electrónicamente');
            fetchLogs();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al firmar');
        }
    };

    const filteredSubjects = formData.courseId
        ? subjects.filter(s => {
            const sCourseId = typeof s.courseId === 'object' ? (s.courseId as any)._id : s.courseId;
            return sCourseId === formData.courseId;
        })
        : [];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-[#11355a] tracking-tight flex items-center gap-4">
                        <div className="p-4 bg-blue-50 rounded-3xl border border-blue-100 shadow-sm">
                            <BookOpen size={40} className="text-blue-600" />
                        </div>
                        Libro de Clases Digital
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg font-medium flex items-center gap-2">
                        <ShieldCheck size={18} className="text-emerald-500" />
                        Registro oficial de actividades y leccionario institucional.
                    </p>
                </div>
                {permissions.isStaff && !showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                    >
                        <Save size={24} /> NUEVA ENTRADA
                    </button>
                )}
            </div>

            {/* Quick Stats / Regulatory Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle size={24} /></div>
                    <div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">CUMPLIMIENTO</div>
                        <div className="text-2xl font-black text-gray-800">100% Legal</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Clock size={24} /></div>
                    <div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">ÚLTIMA FIRMA</div>
                        <div className="text-2xl font-black text-gray-800">Hace 2 horas</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><AlertCircle size={24} /></div>
                    <div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">PENDIENTES</div>
                        <div className="text-2xl font-black text-gray-800">0 Registros</div>
                    </div>
                </div>
            </div>

            {showForm ? (
                <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-[#11355a] p-10 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black tracking-tighter uppercase mb-2">Nuevo Registro de Clase</h2>
                            <p className="text-blue-300 font-extrabold uppercase text-[10px] tracking-[0.3em]">ENTRADA OFICIAL AL LECCIONARIO</p>
                        </div>
                        <button onClick={() => setShowForm(false)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-all"><X size={32} /></button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-10 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="block text-sm font-black text-slate-700 ml-1 uppercase tracking-widest text-[10px]">CURSO & FECHA</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <select
                                        required
                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-black text-slate-700"
                                        value={formData.courseId}
                                        onChange={e => setFormData({ ...formData, courseId: e.target.value, subjectId: '' })}
                                    >
                                        <option value="">-- Seleccionar Curso --</option>
                                        {Array.from(new Set(courses.map(c => c.name)))
                                            .sort()
                                            .map(name => {
                                                const course = courses.find(c => c.name === name);
                                                return (
                                                    <option key={course?._id} value={course?._id}>{name}</option>
                                                );
                                            })
                                        }
                                    </select>
                                    <input
                                        type="date"
                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-black text-slate-700"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="block text-sm font-black text-slate-700 ml-1 uppercase tracking-widest text-[10px]">ASIGNATURA</label>
                                <select
                                    required
                                    disabled={!formData.courseId}
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-black text-slate-700 disabled:opacity-50"
                                    value={formData.subjectId}
                                    onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
                                >
                                    <option value="">-- Seleccionar Asignatura --</option>
                                    {filteredSubjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-black text-slate-700 ml-1 uppercase tracking-widest text-[10px]">TEMA DE LA CLASE</label>
                            <input
                                required
                                placeholder="Ej: Introducción a las Fracciones Equitativas"
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-slate-700"
                                value={formData.topic}
                                onChange={e => setFormData({ ...formData, topic: e.target.value })}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-black text-slate-700 ml-1 uppercase tracking-widest text-[10px]">DESCRIPCIÓN DE ACTIVIDADES</label>
                            <textarea
                                required
                                rows={4}
                                placeholder="Describa el desarrollo de la clase, metodologías aplicadas y recursos utilizados..."
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-slate-600 resize-none"
                                value={formData.activities}
                                onChange={e => setFormData({ ...formData, activities: e.target.value })}
                            />
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                className="w-full bg-[#11355a] text-white py-6 rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-blue-900/40 hover:scale-[1.01] active:scale-95 transition-all"
                            >
                                Registrar en el Libro Digital
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <>
                    {/* Filters */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Filtrar por Curso</label>
                            <select
                                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-blue-500 outline-none font-bold"
                                value={selectedCourse}
                                onChange={e => setSelectedCourse(e.target.value)}
                            >
                                <option value="">Todos los cursos</option>
                                {Array.from(new Set(courses.map(c => c.name)))
                                    .sort()
                                    .map(name => {
                                        const course = courses.find(c => c.name === name);
                                        return (
                                            <option key={course?._id} value={course?._id}>{name}</option>
                                        );
                                    })
                                }
                            </select>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Filtrar por Asignatura</label>
                            <select
                                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-blue-500 outline-none font-bold"
                                value={selectedSubject}
                                onChange={e => setSelectedSubject(e.target.value)}
                            >
                                <option value="">Todas las asignaturas</option>
                                {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.courseId?.name})</option>)}
                            </select>
                        </div>
                        <button
                            onClick={fetchLogs}
                            className="p-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                        >
                            <Filter size={20} />
                        </button>
                    </div>

                    {/* Logs List */}
                    <div className="space-y-6">
                        {loading ? (
                            <div className="flex justify-center p-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="bg-white rounded-[2.5rem] p-20 text-center border-4 border-dashed border-slate-100">
                                <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No se encontraron registros en el leccionario</p>
                            </div>
                        ) : (
                            logs.map(log => (
                                <div key={log._id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl hover:scale-[1.005] transition-all duration-500">
                                    <div className="p-8 flex flex-col md:flex-row gap-8">
                                        <div className="md:w-48 shrink-0 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                            <CalendarIcon size={24} className="text-blue-600 mb-2" />
                                            <div className="text-2xl font-black text-slate-800">{new Date(log.date).getDate()}</div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {new Date(log.date).toLocaleString('es-CL', { month: 'short' }).toUpperCase()}
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-blue-100">
                                                    {log.courseId?.name}
                                                </span>
                                                <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest">
                                                    {log.subjectId?.name}
                                                </span>
                                                {log.isSigned ? (
                                                    <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-emerald-100 flex items-center gap-1">
                                                        <ShieldCheck size={12} /> REGISTRO FIRMADO
                                                    </span>
                                                ) : (
                                                    <span className="px-4 py-1.5 bg-amber-50 text-amber-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-amber-100 flex items-center gap-1">
                                                        <AlertCircle size={12} /> PENDIENTE DE FIRMA
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="text-2xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">{log.topic}</h3>
                                            <p className="text-slate-500 font-bold text-sm leading-relaxed line-clamp-2">{log.activities}</p>

                                            <div className="pt-4 flex items-center gap-4 text-xs font-black text-slate-300 uppercase tracking-widest">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-200" />
                                                    {log.teacherId?.name}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="md:w-48 shrink-0 flex flex-col justify-center gap-3">
                                            {!log.isSigned && (
                                                <button
                                                    onClick={() => handleSign(log._id)}
                                                    className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Target size={14} /> FIRMAR DIGITAL
                                                </button>
                                            )}
                                            <button className="w-full bg-slate-50 text-slate-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-100 hover:bg-white hover:text-blue-600 transition-all">
                                                VER DETALLE
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ClassBookPage;
