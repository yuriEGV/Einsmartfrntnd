
import { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import {
    BookOpen, CheckCircle, Clock, ShieldCheck,
    Save, Calendar as CalendarIcon,
    AlertCircle, FileText, Target, X, Search,
    UserCheck, UserX, BarChart3, Info
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

    // Attendance Integration
    const [classStudents, setClassStudents] = useState<any[]>([]);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
    const [fetchingStudents, setFetchingStudents] = useState(false);

    // Grades Modal
    const [showGradesModal, setShowGradesModal] = useState(false);
    const [selectedStudentForGrades, setSelectedStudentForGrades] = useState<any>(null);
    const [studentGrades, setStudentGrades] = useState<any[]>([]);
    const [loadingGrades, setLoadingGrades] = useState(false);

    // Past Attendance Detail
    const [showAttDetailModal, setShowAttDetailModal] = useState(false);
    const [attDetailData, setAttDetailData] = useState<any[]>([]);
    const [loadingAttDetail, setLoadingAttDetail] = useState(false);
    const [selectedLogForAtt, setSelectedLogForAtt] = useState<any>(null);

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

    // Fetch students when course selected in form
    useEffect(() => {
        if (formData.courseId) {
            fetchClassStudents();
        } else {
            setClassStudents([]);
            setAttendanceMap({});
        }
    }, [formData.courseId]);

    useEffect(() => {
        // Only load on initial mount or when requested. 
        // fetchLogs(); 
    }, []);

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

    const fetchClassStudents = async () => {
        setFetchingStudents(true);
        try {
            const res = await api.get(`/estudiantes?cursoId=${formData.courseId}`);
            const studs = res.data;
            setClassStudents(studs);

            const initialAtt: Record<string, string> = {};
            studs.forEach((s: any) => initialAtt[s._id] = 'presente');
            setAttendanceMap(initialAtt);
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setFetchingStudents(false);
        }
    };

    const fetchStudentGrades = async (student: any) => {
        setLoadingGrades(true);
        setSelectedStudentForGrades(student);
        setShowGradesModal(true);
        try {
            const res = await api.get(`/grades/student/${student._id}`);
            // Show last 5 grades
            setStudentGrades(res.data.slice(-5));
        } catch (error) {
            console.error("Error fetching grades:", error);
        } finally {
            setLoadingGrades(false);
        }
    };

    const fetchAttendanceDetail = async (log: any) => {
        setLoadingAttDetail(true);
        setSelectedLogForAtt(log);
        setShowAttDetailModal(true);
        try {
            const dateStr = new Date(log.date).toISOString().split('T')[0];
            const res = await api.get(`/attendance?courseId=${log.courseId._id}&fecha=${dateStr}`);
            setAttDetailData(res.data);
        } catch (error) {
            console.error("Error fetching attendance detail:", error);
        } finally {
            setLoadingAttDetail(false);
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

            // Also save attendance if students are loaded
            if (classStudents.length > 0) {
                const attendancePayload = {
                    courseId: formData.courseId,
                    fecha: formData.date,
                    students: Object.entries(attendanceMap).map(([estudianteId, estado]) => ({
                        estudianteId,
                        estado
                    }))
                };
                await api.post('/attendance/bulk', attendancePayload);
            }

            alert('Libro de clase y asistencia actualizados correctamente');
            setShowForm(false);
            setFormData({
                ...formData,
                topic: '',
                activities: '',
                objectives: []
            });
            setClassStudents([]);
            setAttendanceMap({});
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

                        {/* Attendance Section within Form */}
                        {classStudents.length > 0 && (
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                        <UserCheck size={18} className="text-blue-500" />
                                        Registro de Asistencia ({classStudents.length} Alumnos)
                                    </h3>
                                    <div className="flex gap-2 text-[10px] font-bold uppercase text-slate-400">
                                        {fetchingStudents && <span className="flex items-center gap-1 animate-pulse"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Cargando...</span>}
                                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Presente</span>
                                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Ausente</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {classStudents.map(student => (
                                        <div key={student._id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between group/item transition-all hover:shadow-md">
                                            <div className="truncate pr-2 flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => fetchStudentGrades(student)}
                                                    className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all opacity-0 group-hover/item:opacity-100"
                                                    title="Ver Notas"
                                                >
                                                    <BarChart3 size={14} />
                                                </button>
                                                <div className="truncate">
                                                    <div className="text-xs font-black text-slate-700 truncate">{student.apellidos}, {student.nombres}</div>
                                                    <div className="text-[9px] text-slate-400 font-mono">{student.rut}</div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setAttendanceMap(prev => ({
                                                    ...prev,
                                                    [student._id]: prev[student._id] === 'presente' ? 'ausente' : 'presente'
                                                }))}
                                                className={`p-2 rounded-lg transition-all ${attendanceMap[student._id] === 'presente'
                                                    ? 'bg-emerald-50 text-emerald-600 hover:bg-rose-50 hover:text-rose-600'
                                                    : 'bg-rose-50 text-rose-600 hover:bg-emerald-50 hover:text-emerald-600'
                                                    }`}
                                            >
                                                {attendanceMap[student._id] === 'presente' ? <UserCheck size={16} /> : <UserX size={16} />}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

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
                            className="px-6 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 font-black text-xs uppercase tracking-widest flex items-center gap-2"
                        >
                            <Search size={14} /> BUSCAR
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
                                            <button className="w-full bg-slate-50 text-slate-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-100 hover:bg-white hover:text-blue-600 transition-all flex items-center justify-center gap-2" onClick={() => fetchAttendanceDetail(log)}>
                                                <Info size={14} /> VER ASISTENCIA
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {/* Grades Modal */}
            {showGradesModal && selectedStudentForGrades && (
                <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
                        <div className="bg-[#11355a] p-8 text-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-black tracking-tight">{selectedStudentForGrades.apellidos}, {selectedStudentForGrades.nombres}</h2>
                                    <p className="text-blue-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1">ÚLTIMAS CALIFICACIONES</p>
                                </div>
                                <button onClick={() => setShowGradesModal(false)} className="text-white/40 hover:text-white transition-all"><X size={24} /></button>
                            </div>
                        </div>
                        <div className="p-8">
                            {loadingGrades ? (
                                <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                            ) : studentGrades.length === 0 ? (
                                <p className="text-center text-slate-400 font-bold py-10">Sin calificaciones registradas.</p>
                            ) : (
                                <div className="space-y-4">
                                    {studentGrades.map((g: any) => (
                                        <div key={g._id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{g.evaluationId?.title || 'Evaluación'}</div>
                                                <div className="text-sm font-black text-slate-700">{new Date(g.createdAt).toLocaleDateString()}</div>
                                            </div>
                                            <div className={`text-xl font-black ${g.score >= 4 ? 'text-blue-600' : 'text-rose-600'}`}>
                                                {g.score.toFixed(1)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <button onClick={() => setShowGradesModal(false)} className="w-full mt-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                                CERRAR
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Attendance Detail Modal */}
            {showAttDetailModal && selectedLogForAtt && (
                <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
                        <div className="bg-emerald-600 p-8 text-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-black tracking-tight uppercase">Detalle de Asistencia</h2>
                                    <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                                        {selectedLogForAtt.courseId?.name} • {new Date(selectedLogForAtt.date).toLocaleDateString()}
                                    </p>
                                </div>
                                <button onClick={() => setShowAttDetailModal(false)} className="text-white/40 hover:text-white transition-all"><X size={24} /></button>
                            </div>
                        </div>
                        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {loadingAttDetail ? (
                                <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>
                            ) : attDetailData.length === 0 ? (
                                <div className="text-center py-10 space-y-3">
                                    <AlertCircle size={40} className="mx-auto text-amber-500 opacity-50" />
                                    <p className="text-slate-400 font-bold">No se encontró registro detallado de asistencia para este día.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-6 mb-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                                <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Tema Tratado</div>
                                                <div className="text-lg font-black text-slate-800">{selectedLogForAtt.topic}</div>
                                            </div>
                                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Actividades Realizadas</div>
                                                <div className="text-sm font-bold text-slate-600 leading-relaxed">{selectedLogForAtt.activities}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 px-2">
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Lista de Asistencia</h3>
                                            <div className="h-[1px] flex-1 bg-slate-100"></div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {attDetailData.map((att: any) => (
                                            <div key={att._id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                                <div className="truncate">
                                                    <div className="text-xs font-black text-slate-700 truncate">
                                                        {att.estudianteId?.apellidos || 'Alumno'}, {att.estudianteId?.nombres || ''}
                                                    </div>
                                                    <div className="text-[9px] text-slate-400 font-mono">{att.estudianteId?.rut}</div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${att.estado === 'presente' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                    }`}>
                                                    {att.estado}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="p-8 border-t bg-slate-50/50">
                            <button onClick={() => setShowAttDetailModal(false)} className="w-full py-4 bg-white text-slate-600 border border-slate-200 shadow-sm rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
                                CERRAR DETALLE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassBookPage;
