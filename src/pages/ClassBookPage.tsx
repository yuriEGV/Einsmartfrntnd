import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import {
    BookOpen, CheckCircle, Clock, ShieldCheck,
    Calendar as CalendarIcon,
    AlertCircle, FileText, X, Search,
    Info,
    Play, Square, Timer as TimerIcon, Plus,
    Table as TableIcon, Edit3, Trash2, SaveAll
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
    startTime?: string;
    effectiveDuration?: number;
    status?: string;
}

const ClassBookPage = () => {
    const [activeTab, setActiveTab] = useState<'leccionario' | 'asistencia' | 'calificaciones' | 'atrasos'>('leccionario');
    const [logs, setLogs] = useState<ClassLog[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Timer State
    const [activeClassLog, setActiveClassLog] = useState<any>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const timerRef = useRef<any>(null);

    // Attendance Integration
    const [classStudents, setClassStudents] = useState<any[]>([]);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});

    // Grades Matrix
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [matrixLoading, setMatrixLoading] = useState(false);
    const [gradeMatrix, setGradeMatrix] = useState<Record<string, Record<string, string>>>({}); // studentId -> evaluationId -> score
    const [isSavingMatrix, setIsSavingMatrix] = useState(false);

    // Tardiness List
    const [tardinessLogs, setTardinessLogs] = useState<any[]>([]);
    const [tardinessLoading, setTardinessLoading] = useState(false);

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

    // Modals
    const [showAttDetailModal, setShowAttDetailModal] = useState(false);
    const [attDetailData, setAttDetailData] = useState<any[]>([]);
    const [loadingAttDetail, setLoadingAttDetail] = useState(false);
    const [selectedLogForAtt, setSelectedLogForAtt] = useState<any>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (formData.courseId) {
            fetchClassStudents();
        } else {
            setClassStudents([]);
            setAttendanceMap({});
        }
    }, [formData.courseId]);

    // Timer Interval
    useEffect(() => {
        if (activeClassLog) {
            timerRef.current = setInterval(() => {
                const start = new Date(activeClassLog.startTime).getTime();
                setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
            }, 1000);
        } else {
            clearInterval(timerRef.current);
            setElapsedSeconds(0);
        }
        return () => clearInterval(timerRef.current);
    }, [activeClassLog]);

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

    const fetchClassStudents = async (courseIdOverride?: string) => {
        const cid = courseIdOverride || formData.courseId || selectedCourse;
        if (!cid) return;

        try {
            const res = await api.get(`/estudiantes?cursoId=${cid}`);
            setClassStudents(res.data);
            const initialAtt: Record<string, string> = {};
            res.data.forEach((s: any) => initialAtt[s._id] = 'presente');
            setAttendanceMap(initialAtt);
        } catch (error) {
            console.error("Error fetching students:", error);
        }
    };

    const fetchEvaluations = async () => {
        if (!selectedCourse || !selectedSubject) return;
        setMatrixLoading(true);
        try {
            const res = await api.get(`/evaluations?courseId=${selectedCourse}&subjectId=${selectedSubject}`);
            setEvaluations(res.data.slice(0, 10)); // Max 10 per request or UX

            // Fetch current grades for this matrix
            const gradesRes = await api.get(`/grades?courseId=${selectedCourse}`);
            const matrix: Record<string, Record<string, string>> = {};
            gradesRes.data.forEach((g: any) => {
                const studentId = typeof g.estudianteId === 'object' ? g.estudianteId._id : g.estudianteId;
                const evaluationId = typeof g.evaluationId === 'object' ? g.evaluationId._id : g.evaluationId;
                if (!matrix[studentId]) matrix[studentId] = {};
                matrix[studentId][evaluationId] = g.score.toString();
            });
            setGradeMatrix(matrix);
        } catch (error) {
            console.error("Error fetching matrix data:", error);
        } finally {
            setMatrixLoading(false);
        }
    };

    const fetchTardiness = async () => {
        if (!selectedCourse) return;
        setTardinessLoading(true);
        try {
            const res = await api.get(`/atrasos?courseId=${selectedCourse}`);
            setTardinessLogs(res.data);
        } catch (error) {
            console.error("Error fetching tardiness:", error);
        } finally {
            setTardinessLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'calificaciones') fetchEvaluations();
        if (activeTab === 'atrasos') fetchTardiness();
        if (activeTab === 'asistencia') fetchClassStudents();
    }, [activeTab, selectedCourse, selectedSubject]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedCourse) params.append('courseId', selectedCourse);
            if (selectedSubject) params.append('subjectId', selectedSubject);
            const res = await api.get(`/class-logs?${params.toString()}`);
            setLogs(res.data);
            
            // Check for active class log
            const active = res.data.find((l: any) => l.status === 'en_curso' || (l.startTime && !l.isSigned));
            setActiveClassLog(active || null);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const startClassTimer = async () => {
        if (!selectedCourse || !selectedSubject) return alert('Seleccione curso y asignatura');
        try {
            const res = await api.post('/class-logs/start', {
                courseId: selectedCourse,
                subjectId: selectedSubject
            });
            setActiveClassLog(res.data);
            await fetchLogs();
        } catch (error) {
            alert('Error al iniciar clase');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/class-logs', formData);
            if (classStudents.length > 0) {
                const attendancePayload = {
                    courseId: formData.courseId,
                    fecha: formData.date,
                    students: Object.entries(attendanceMap).map(([estudianteId, estado]) => ({ estudianteId, estado }))
                };
                await api.post('/attendance/bulk', attendancePayload);
            }
            alert('Registro guardado');
            setShowForm(false);
            fetchLogs();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al guardar');
        }
    };

    const handleBulkGradeSave = async () => {
        setIsSavingMatrix(true);
        try {
            const gradesPayload: any[] = [];
            Object.entries(gradeMatrix).forEach(([estId, evals]) => {
                Object.entries(evals).forEach(([evId, score]) => {
                    if (score) gradesPayload.push({ estudianteId: estId, evaluationId: evId, score });
                });
            });
            await api.post('/grades/bulk', { grades: gradesPayload });
            alert('Calificaciones actualizadas exitosamente');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al guardar calificaciones');
        } finally {
            setIsSavingMatrix(false);
        }
    };

    const handleSign = async (id: string) => {
        const pin = window.prompt('Contraseña / PIN de Firma Digital:');
        if (!pin) return;
        try {
            await api.post(`/class-logs/${id}/sign`, { pin });
            alert('Registro firmado');
            fetchLogs();
            setActiveClassLog(null);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al firmar');
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
            console.error("Error detail:", error);
        } finally {
            setLoadingAttDetail(false);
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const filteredSubjects = formData.courseId
        ? subjects.filter(s => {
            const cid = typeof s.courseId === 'object' ? s.courseId._id : s.courseId;
            return cid === formData.courseId;
        })
        : [];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
            {/* Header with Timer & Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-[#11355a] tracking-tight flex items-center gap-4">
                        <div className="p-4 bg-blue-50 rounded-3xl border border-blue-100 shadow-sm">
                            <BookOpen size={40} className="text-blue-600" />
                        </div>
                        Libro de Clases Digital
                    </h1>
                    <div className="flex items-center gap-4 mt-4">
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                            {(['leccionario', 'calificaciones', 'atrasos'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Class Timer Card */}
                {activeClassLog ? (
                    <div className="bg-[#11355a] text-white p-6 rounded-[2.5rem] shadow-2xl flex items-center gap-6 border-4 border-blue-500/30 animate-pulse">
                        <div className="p-4 bg-blue-500/20 rounded-2xl">
                            <TimerIcon size={32} className="text-blue-400" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-blue-300 uppercase tracking-widest leading-none mb-1">CLASE EN CURSO</div>
                            <div className="text-3xl font-mono font-black">{formatTime(elapsedSeconds)}</div>
                            <div className="text-[9px] font-bold text-white/60 mt-1 uppercase truncate max-w-[150px]">
                                {activeClassLog.courseId?.name} • {activeClassLog.subjectId?.name}
                            </div>
                        </div>
                        <button 
                            onClick={() => handleSign(activeClassLog._id)}
                            className="p-4 bg-rose-500/20 text-rose-400 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-lg"
                            title="Finalizar y Firmar"
                        >
                            <Square size={24} fill="currentColor" />
                        </button>
                    </div>
                ) : (
                    <div className="bg-white p-6 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex items-center gap-6">
                        <div className="p-4 bg-slate-50 text-slate-300 rounded-2xl">
                            <Play size={32} fill="currentColor" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">DOCENTE EN AULA</div>
                            <div className="text-xl font-black text-slate-300">00:00:00</div>
                        </div>
                        <button 
                            onClick={startClassTimer}
                            disabled={!selectedCourse || !selectedSubject}
                            className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-30"
                        >
                            INICIAR CLASE
                        </button>
                    </div>
                )}
            </div>

            {/* Quick Filters */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Institución / Curso</label>
                    <select
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-blue-500 outline-none font-bold"
                        value={selectedCourse}
                        onChange={e => setSelectedCourse(e.target.value)}
                    >
                        <option value="">Seleccionar Curso</option>
                        {courses.sort((a,b) => a.name.localeCompare(b.name)).map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Asignatura</label>
                    <select
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-blue-500 outline-none font-bold"
                        value={selectedSubject}
                        onChange={e => setSelectedSubject(e.target.value)}
                    >
                        <option value="">Todas las asignaturas</option>
                        {subjects.filter(s => !selectedCourse || (typeof s.courseId === 'object' ? s.courseId._id : s.courseId) === selectedCourse).map(s => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={fetchLogs}
                    className="px-6 py-3.5 bg-[#11355a] text-white rounded-xl hover:bg-slate-800 transition-all font-black text-xs uppercase tracking-widest flex items-center gap-2"
                >
                    <Search size={14} /> ACTUALIZAR VISTA
                </button>
                {activeTab === 'leccionario' && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-6 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-black text-xs uppercase tracking-widest flex items-center gap-2"
                    >
                        <Plus size={14} /> NUEVA ENTRADA
                    </button>
                )}
            </div>

            {/* Main Content Area */}
            {activeTab === 'leccionario' && (
                <div className="space-y-6">
                    {showForm && (
                        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden mb-10">
                            <div className="bg-blue-600 p-8 text-white flex justify-between items-center">
                                <h2 className="text-2xl font-black uppercase tracking-tight">Registro Manual Leccionario</h2>
                                <button onClick={() => setShowForm(false)} className="text-white/60 hover:text-white"><X size={24} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-10 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Curso</label>
                                        <select required className="w-full p-4 bg-slate-50 rounded-2xl border" value={formData.courseId} onChange={e => setFormData({...formData, courseId: e.target.value})}>
                                            <option value="">-- Seleccionar --</option>
                                            {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Asignatura</label>
                                        <select required className="w-full p-4 bg-slate-50 rounded-2xl border" value={formData.subjectId} onChange={e => setFormData({...formData, subjectId: e.target.value})}>
                                            <option value="">-- Seleccionar --</option>
                                            {filteredSubjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tema de la Clase</label>
                                    <input required className="w-full p-4 bg-slate-50 rounded-2xl border" placeholder="Ej: Ley de Newton" value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Actividades</label>
                                    <textarea required rows={3} className="w-full p-4 bg-slate-50 rounded-2xl border resize-none" value={formData.activities} onChange={e => setFormData({...formData, activities: e.target.value})} />
                                </div>
                                <button type="submit" className="w-full bg-[#11355a] text-white py-4 rounded-2xl font-black uppercase">Guardar Registro en el Libro</button>
                            </form>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
                    ) : logs.length === 0 ? (
                        <div className="bg-white rounded-[2.5rem] p-20 text-center border-4 border-dashed border-slate-100">
                            <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Sin registros recientes</p>
                        </div>
                    ) : (
                        logs.map(log => (
                            <div key={log._id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 flex flex-col md:flex-row gap-8 group hover:shadow-xl transition-all">
                                <div className="md:w-32 shrink-0 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-3xl">
                                    <CalendarIcon size={20} className="text-blue-500 mb-1" />
                                    <div className="text-xl font-black text-slate-800">{new Date(log.date).getDate()}</div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase">{new Date(log.date).toLocaleString('es', {month:'short'})}</div>
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div className="flex gap-2">
                                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase border border-blue-100">{log.courseId?.name}</span>
                                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase">{log.subjectId?.name}</span>
                                        {log.isSigned ? (
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 border border-emerald-100">
                                                <ShieldCheck size={10} /> FIRMADO
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 border border-amber-100">
                                                <AlertCircle size={10} /> PENDIENTE
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800">{log.topic}</h3>
                                    <p className="text-slate-500 text-sm line-clamp-2">{log.activities}</p>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2">
                                        <div className="w-5 h-5 rounded-full bg-slate-200" /> {log.teacherId?.name}
                                        {log.effectiveDuration && (<>• <Clock size={12}/> {log.effectiveDuration} min</>)}
                                    </div>
                                </div>
                                <div className="md:w-40 flex flex-col justify-center gap-2">
                                    {!log.isSigned && (
                                        <button onClick={() => handleSign(log._id)} className="bg-emerald-600 text-white p-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all">Firmar Libro</button>
                                    )}
                                    <button onClick={() => fetchAttendanceDetail(log)} className="bg-slate-50 text-slate-400 border border-slate-200 p-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-white hover:text-blue-600 transition-all">Asistencia</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'calificaciones' && (
                <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                                <TableIcon size={24} className="text-blue-600" /> Matriz de Calificaciones Global
                            </h2>
                            <p className="text-slate-400 text-[10px] font-bold uppercase mt-1">Ingreso de alto rendimiento • Decreto 67</p>
                        </div>
                        <button 
                            onClick={handleBulkGradeSave}
                            disabled={isSavingMatrix}
                            className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSavingMatrix ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div> : <SaveAll size={18}/>}
                            GUARDAR MATRIZ
                        </button>
                    </div>
                    {matrixLoading ? (
                        <div className="p-20 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div>
                    ) : (evaluations.length === 0 || classStudents.length === 0) ? (
                        <div className="p-20 text-center space-y-4">
                            <Info size={40} className="mx-auto text-slate-200" />
                            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Seleccione Curso y Asignatura con evaluaciones planificadas</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80">
                                        <th className="p-6 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-slate-50 z-10 w-64 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Alumno / Estudiante</th>
                                        {evaluations.map(ev => (
                                            <th key={ev._id} className="p-6 border-b text-center min-w-[120px] group">
                                                <div className="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate max-w-[100px] mx-auto" title={ev.title}>{ev.title}</div>
                                                <div className="text-[8px] font-bold text-slate-400 uppercase">{new Date(ev.date).toLocaleDateString()}</div>
                                            </th>
                                        ))}
                                        {/* Fill up to 10 slots if needed */}
                                        {Array.from({length: Math.max(0, 10 - evaluations.length)}).map((_, i) => (
                                            <th key={`empty-${i}`} className="p-6 border-b text-center min-w-[120px] opacity-20">
                                                <div className="text-[10px] font-black text-slate-300 uppercase">Espacio {evaluations.length + i + 1}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {classStudents.sort((a,b) => a.apellidos.localeCompare(b.apellidos)).map(student => (
                                        <tr key={student._id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="p-6 border-b font-bold text-slate-700 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative group">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-black group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                                                            {student.apellidos[0]}{student.nombres[0]}
                                                        </div>
                                                        <Link to={`/estudiantes?edit=${student._id}`} className="absolute -top-1 -right-1 p-1.5 bg-white border shadow-sm rounded-lg text-blue-600 opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                                                            <Edit3 size={10} />
                                                        </Link>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm truncate w-40">{student.apellidos}, {student.nombres}</div>
                                                        <div className="text-[9px] font-mono text-slate-400">{student.rut}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            {evaluations.map(ev => (
                                                <td key={ev._id} className="p-4 border-b text-center">
                                                    <input 
                                                        type="number" 
                                                        min="1" max="7" step="0.1"
                                                        placeholder="1.0"
                                                        className={`w-16 h-12 text-center rounded-xl border-2 font-black text-lg focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all ${
                                                            parseFloat(gradeMatrix[student._id]?.[ev._id] || '0') >= 4 ? 'bg-blue-50/50 border-blue-100 text-blue-700 focus:border-blue-500' : 
                                                            parseFloat(gradeMatrix[student._id]?.[ev._id] || '0') > 0 ? 'bg-rose-50 border-rose-100 text-rose-600 focus:border-rose-500' :
                                                            'bg-slate-50 border-slate-100 text-slate-400 focus:bg-white focus:border-blue-300'
                                                        }`}
                                                        value={gradeMatrix[student._id]?.[ev._id] || ''}
                                                        onChange={e => setGradeMatrix({
                                                            ...gradeMatrix,
                                                            [student._id]: {
                                                                ...(gradeMatrix[student._id] || {}),
                                                                [ev._id]: e.target.value
                                                            }
                                                        })}
                                                    />
                                                </td>
                                            ))}
                                            {Array.from({length: Math.max(0, 10 - evaluations.length)}).map((_, i) => (
                                                <td key={`empty-td-${i}`} className="p-4 border-b text-center opacity-10">
                                                    <div className="w-16 h-12 mx-auto bg-slate-100 rounded-xl"></div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'atrasos' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 bg-white rounded-[3rem] shadow-sm border border-slate-100 p-8 space-y-6 self-start">
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                            <Clock size={24} className="text-rose-600" /> Registro de Atrasos
                        </h2>
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Seleccionar Alumno</label>
                                <select className="w-full p-4 bg-slate-50 rounded-2xl border font-bold text-sm" onChange={e => {
                                    const student = classStudents.find(s => s._id === e.target.value);
                                    if (student) {
                                        const mins = window.prompt(`Minutos de atraso para ${student.apellidos}:`, "15");
                                        if (mins) {
                                            api.post('/atrasos', {
                                                estudianteId: student._id,
                                                fecha: new Date(),
                                                minutosAtraso: parseInt(mins),
                                                bloque: 'Bloque 1',
                                                motivo: 'Ingreso tardío jornada'
                                            }).then(() => {
                                                alert('Atraso registrado');
                                                fetchTardiness();
                                            });
                                        }
                                    }
                                }}>
                                    <option value="">-- Buscar Estudiante --</option>
                                    {classStudents.sort((a,b) => a.apellidos.localeCompare(b.apellidos)).map(s => (
                                        <option key={s._id} value={s._id}>{s.apellidos}, {s.nombres}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 text-rose-700 space-y-2">
                                <Info size={20}/>
                                <p className="text-xs font-bold leading-relaxed">
                                    Los atrasos registrados impactan automáticamente en el informe legal de asistencia mensual.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                        {tardinessLoading ? (
                            <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div></div>
                        ) : tardinessLogs.length === 0 ? (
                            <div className="bg-white rounded-[3rem] p-20 text-center border-4 border-dashed border-slate-100">
                                <CheckCircle size={48} className="mx-auto text-slate-100 mb-4" />
                                <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Sin atrasos el día de hoy</p>
                            </div>
                        ) : (
                            tardinessLogs.map(t => (
                                <div key={t._id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 font-black">
                                            {t.minutosAtraso}'
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-800 text-sm">{t.estudianteId?.apellidos}, {t.estudianteId?.nombres}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">{t.bloque} • {new Date(t.fecha).toLocaleTimeString()}</div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={async () => {
                                            if (window.confirm('¿Eliminar este registro de atraso?')) {
                                                await api.delete(`/atrasos/${t._id}`);
                                                fetchTardiness();
                                            }
                                        }}
                                        className="p-2 text-slate-300 hover:text-rose-600 transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Attendance Detail Modal (Existing) */}
            {showAttDetailModal && selectedLogForAtt && (
                <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
                        <div className="bg-emerald-600 p-8 text-white flex justify-between items-start">
                            <div className="flex-1">
                                <h2 className="text-xl font-black tracking-tight uppercase">Control de Asistencia Histórico</h2>
                                <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{selectedLogForAtt.courseId?.name} • {new Date(selectedLogForAtt.date).toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => setShowAttDetailModal(false)} className="text-white/40 hover:text-white transition-all"><X size={24} /></button>
                        </div>
                        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {loadingAttDetail ? (
                                <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {attDetailData.map((att: any) => (
                                        <div key={att._id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                            <div className="truncate pr-2">
                                                <div className="text-xs font-black text-slate-700 truncate">{att.estudianteId?.apellidos}, {att.estudianteId?.nombres}</div>
                                                <div className="text-[9px] text-slate-400 font-mono">{att.estudianteId?.rut}</div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${att.estado === 'presente' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {att.estado}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-8 border-t bg-slate-50/50">
                            <button onClick={() => setShowAttDetailModal(false)} className="w-full py-4 bg-white text-slate-600 border border-slate-200 shadow-sm rounded-2xl font-black text-xs uppercase tracking-widest">CERRAR VISOR</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassBookPage;
