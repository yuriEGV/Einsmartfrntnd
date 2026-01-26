
import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    BookOpen, ClipboardList,
    Calendar,
    UserCheck, BarChart3, AlertCircle,
    LayoutGrid, List, Search, Save,
    Trash2, X, ShieldCheck
} from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';

const UnifiedClassBook = () => {
    const { isStaff, user } = usePermissions();
    const isStudent = user?.role === 'student';
    // UI State
    const [activeTab, setActiveTab] = useState<'leccionario' | 'asistencia' | 'notas' | 'evaluaciones'>('leccionario');
    const [loading, setLoading] = useState(true);

    // Shared Context
    const [courses, setCourses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [students, setStudents] = useState<any[]>([]);

    // Leccionario State
    const [logs, setLogs] = useState<any[]>([]);
    const [showLogForm, setShowLogForm] = useState(false);
    const [logFormData, setLogFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        topic: '',
        activities: '',
        objectives: [] as string[]
    });

    // Attendance State
    const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

    // Grades State
    const [grades, setGrades] = useState<any[]>([]);
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [showGradeModal, setShowGradeModal] = useState(false);
    const [gradeFormData, setGradeFormData] = useState({
        _id: '',
        estudianteId: '',
        evaluationId: '',
        score: 4.0,
        comments: ''
    });

    // Evaluations State
    const [showEvalModal, setShowEvalModal] = useState(false);
    const [evalFormData, setEvalFormData] = useState({
        _id: '',
        title: '',
        date: new Date().toISOString().split('T')[0],
        category: 'planificada' as 'planificada' | 'sorpresa',
        questions: [] as string[]
    });

    // Question Bank Filters
    const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'multiple_choice' | 'open' | 'true_false'>('all');

    const [bankQuestions, setBankQuestions] = useState<any[]>([]);
    const [searchQuestion, setSearchQuestion] = useState('');
    const [classStartTime, setClassStartTime] = useState<number | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [showQuestionForm, setShowQuestionForm] = useState(false);
    const [newQuestionData, setNewQuestionData] = useState({
        questionText: '',
        type: 'multiple_choice',
        difficulty: 'medium',
        options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }]
    });

    // -------------------------------------------------------------------------
    // Data Fetching
    // -------------------------------------------------------------------------

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const [cRes, sRes] = await Promise.all([
                    api.get('/courses'),
                    api.get('/subjects')
                ]);
                setCourses(cRes.data);
                setSubjects(sRes.data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchInitial();
    }, []);

    const refreshTabContent = async () => {
        if (!selectedCourse || !selectedSubject) return;
        setLoading(true);
        try {
            if (activeTab === 'leccionario') {
                const res = await api.get(`/class-logs?courseId=${selectedCourse}&subjectId=${selectedSubject}`);
                setLogs(res.data);
            } else if (activeTab === 'asistencia') {
                const [studRes, attRes] = await Promise.all([
                    api.get(`/estudiantes?cursoId=${selectedCourse}`),
                    api.get(`/attendance?courseId=${selectedCourse}&fecha=${attendanceDate}`)
                ]);
                setStudents(studRes.data);
                const amap: Record<string, string> = {};
                studRes.data.forEach((s: any) => {
                    const rec = attRes.data.find((r: any) => r.estudianteId?._id === s._id || r.estudianteId === s._id);
                    amap[s._id] = rec ? rec.estado : 'presente';
                });
                setAttendanceMap(amap);
            } else if (activeTab === 'notas') {
                const [gradesRes, evalsRes, studRes] = await Promise.all([
                    api.get('/grades'),
                    api.get('/evaluations'),
                    api.get(`/estudiantes?cursoId=${selectedCourse}`)
                ]);
                console.log('DEBUG VISIBILITY - Students found:', studRes.data.length);
                setStudents(studRes.data);
                setEvaluations(evalsRes.data.filter((e: any) =>
                    (typeof e.courseId === 'object' ? e.courseId._id : e.courseId) === selectedCourse
                ));
                setGrades(gradesRes.data);
            } else if (activeTab === 'evaluaciones') {
                const res = await api.get(`/evaluations?courseId=${selectedCourse}`);
                let filtered = res.data.filter((e: any) =>
                    (typeof e.courseId === 'object' ? e.courseId._id : e.courseId) === selectedCourse
                );
                if (isStudent) {
                    filtered = filtered.filter((e: any) => e.category !== 'surprise' && e.category !== 'sorpresa');
                }
                setEvaluations(filtered);
            }
        } catch (err) {
            console.error('REFRESH TAB ERROR:', err);
        }
        finally { setLoading(false); }
    };

    useEffect(() => {
        let interval: any;
        if (classStartTime) {
            interval = setInterval(() => {
                setElapsedSeconds(Math.floor((Date.now() - classStartTime) / 1000));
            }, 1000);
        } else {
            setElapsedSeconds(0);
        }
        return () => clearInterval(interval);
    }, [classStartTime]);

    useEffect(() => { refreshTabContent(); }, [selectedCourse, selectedSubject, activeTab, attendanceDate]);

    // -------------------------------------------------------------------------
    // Actions
    // -------------------------------------------------------------------------

    const handleStartClass = async () => {
        try {
            const res = await api.post('/class-logs/start', { courseId: selectedCourse, subjectId: selectedSubject });
            if (res.data.startTime) {
                setClassStartTime(new Date(res.data.startTime).getTime());
            } else {
                setClassStartTime(Date.now());
            }
            // Stealth: No alerts
        } catch (err) { console.error('Error starting stealth timer', err); }
    };

    const handleSaveLog = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/class-logs', {
                ...logFormData,
                courseId: selectedCourse,
                subjectId: selectedSubject,
                startTime: classStartTime ? new Date(classStartTime).toISOString() : undefined
            });
            // Automatic signature upon creation
            await api.post(`/class-logs/${res.data._id}/sign`);

            setClassStartTime(null); // Stop timer
            alert('Clase registrada y firmada digitalmente. Cronómetro detenido.');
            setShowLogForm(false);
            refreshTabContent();
        } catch (err) { alert('Error al procesar el registro'); }
    };

    const handleSignLog = async (id: string, logStartTime?: string) => {
        if (!window.confirm('¿Firmar registro?')) return;
        try {
            await api.post(`/class-logs/${id}/sign`);
            if (logStartTime && new Date(logStartTime).getTime() === classStartTime) {
                setClassStartTime(null);
            }
            refreshTabContent();
        } catch (err) { alert('Error al firmar'); }
    };

    const openEvalModal = async (ev?: any) => {
        if (ev) {
            setEvalFormData({
                _id: ev._id,
                title: ev.title,
                date: new Date(ev.date).toISOString().split('T')[0],
                category: ev.category || 'planificada',
                questions: ev.questions || []
            });
        } else {
            setEvalFormData({
                _id: '',
                title: '',
                date: new Date().toISOString().split('T')[0],
                category: 'planificada',
                questions: []
            });
        }

        setShowQuestionForm(false); // Reset form
        // Fetch bank questions for context (Subject and Grade)
        try {
            const res = await api.get(`/questions?subjectId=${selectedSubject}`);
            setBankQuestions(res.data);
        } catch (err) { console.error(err); }

        setShowEvalModal(true);
    };

    const handleSaveAttendance = async () => {
        try {
            const payload = {
                courseId: selectedCourse,
                fecha: attendanceDate,
                students: Object.entries(attendanceMap).map(([estudianteId, estado]) => ({ estudianteId, estado }))
            };
            await api.post('/attendance/bulk', payload);
            alert('Asistencia guardada');
        } catch (err) { alert('Error'); }
    };

    const handleSaveGrade = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (gradeFormData._id) {
                await api.put(`/grades/${gradeFormData._id}`, { score: gradeFormData.score, comments: gradeFormData.comments });
            } else {
                const { _id, ...clean } = gradeFormData;
                await api.post('/grades', clean);
            }
            setShowGradeModal(false);
            refreshTabContent();
        } catch (err) { alert('Error'); }
    };

    const handleSaveEval = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                title: evalFormData.title,
                date: evalFormData.date,
                category: evalFormData.category,
                courseId: selectedCourse,
                subjectId: selectedSubject,
                questions: evalFormData.questions
            };
            if (evalFormData._id) {
                await api.put(`/evaluations/${evalFormData._id}`, payload);
            } else {
                await api.post('/evaluations', payload);
            }
            setShowEvalModal(false);
            refreshTabContent();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error al guardar la evaluación');
        }
    };

    const handleAddQuestionToBank = async () => {
        try {
            const res = await api.post('/questions', {
                ...newQuestionData,
                subjectId: selectedSubject,
                grade: courses.find(c => (typeof c._id === 'object' ? (c._id as any)._id : c._id) === selectedCourse)?.level || 'Sin Nivel'
            });
            setBankQuestions([res.data, ...bankQuestions]);
            setEvalFormData({ ...evalFormData, questions: [...evalFormData.questions, res.data._id] });
            setShowQuestionForm(false);
            setNewQuestionData({
                questionText: '',
                type: 'multiple_choice',
                difficulty: 'medium',
                options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }]
            });
        } catch (err: any) {
            console.error(err);
            alert(`Error al crear pregunta: ${err.response?.data?.message || err.message}`);
        }
    };

    // -------------------------------------------------------------------------
    // Render Helpers
    // -------------------------------------------------------------------------

    const filteredSubjects = selectedCourse
        ? subjects.filter(s => (typeof s.courseId === 'object' ? s.courseId._id : s.courseId) === selectedCourse)
        : [];

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 min-h-screen pb-20">
            {/* Master Control Panel */}
            <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-blue-900/5 border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-8 relative overflow-hidden group">
                <div className="flex items-center gap-6 relative z-10">
                    <div className="p-5 bg-gradient-to-br from-[#11355a] to-blue-600 text-white rounded-[2.5rem] shadow-2xl shadow-blue-900/30 group-hover:rotate-3 transition-transform">
                        <BookOpen size={40} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-[#11355a] tracking-tighter uppercase leading-none">Mi Libro Digital</h1>
                        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mt-3 flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 italic">
                            <ShieldCheck size={12} className="text-emerald-500" />
                            Entorno Seguro • Maritimo Pro 4.0
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto relative z-10">
                    <div className="flex-1 lg:w-72">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Curso / Nivel</label>
                        <select
                            className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-blue-500 outline-none font-black text-slate-700 transition-all hover:border-blue-200 shadow-sm"
                            value={selectedCourse}
                            onChange={e => { setSelectedCourse(e.target.value); setSelectedSubject(''); }}
                        >
                            <option value="">-- ELIGIR CURSO --</option>
                            {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 lg:w-72">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Asignatura</label>
                        <select
                            className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-blue-500 outline-none font-black text-slate-700 transition-all hover:border-blue-200 disabled:opacity-50 shadow-sm"
                            value={selectedSubject}
                            onChange={e => setSelectedSubject(e.target.value)}
                            disabled={!selectedCourse}
                        >
                            <option value="">-- SELECCIONAR --</option>
                            {filteredSubjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Smart Navigation */}
            <div className="flex flex-wrap items-center justify-center gap-3">
                {[
                    { id: 'leccionario', label: 'Leccionario', icon: List, color: 'blue' },
                    { id: 'asistencia', label: 'Asistencia', icon: UserCheck, color: 'emerald' },
                    { id: 'notas', label: 'Libro de Notas', icon: ClipboardList, color: 'indigo' },
                    { id: 'evaluaciones', label: 'Planificación', icon: Calendar, color: 'amber' }
                ].map((tab: any) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`group flex items-center gap-4 px-10 py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] transition-all
                        ${activeTab === tab.id
                                ? 'bg-[#11355a] text-white shadow-2xl shadow-blue-900/40 -translate-y-1'
                                : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-100 shadow-xl shadow-blue-900/5'}`}
                    >
                        <tab.icon size={20} className={activeTab === tab.id ? 'text-blue-400' : 'group-hover:text-blue-500'} />
                        {tab.label}
                    </button>
                ))}

                {classStartTime && (
                    <div className="flex items-center gap-4 bg-orange-50 px-8 py-5 rounded-[2rem] shadow-xl border border-orange-200 animate-pulse ml-4">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="text-xl font-mono font-black text-orange-900">
                            {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
                        </div>
                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">En curso</span>
                    </div>
                )}
            </div>

            {/* Content Logic */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 animate-pulse">
                    <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Cargando información segura...</p>
                </div>
            ) : !selectedCourse || !selectedSubject ? (
                <div className="bg-white rounded-[4rem] p-40 text-center border-4 border-dashed border-slate-100">
                    <LayoutGrid size={80} className="mx-auto text-slate-100 mb-8" />
                    <h2 className="text-3xl font-black text-slate-300 uppercase tracking-tighter">Seleccione Curso & Asignatura</h2>
                    <p className="text-slate-300 font-bold uppercase tracking-[0.3em] text-[10px] mt-6 bg-slate-50 inline-block px-10 py-4 rounded-full border border-slate-100">
                        Se cargará la información sincronizada para esta combinación específica.
                    </p>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                    {/* LECCIONARIO TAB */}
                    {activeTab === 'leccionario' && (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center px-4">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-2xl font-black text-[#11355a] uppercase tracking-tighter">Historial del Leccionario</h2>
                                </div>
                                <button onClick={() => { setShowLogForm(true); handleStartClass(); }} className="bg-[#11355a] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-blue-900/20">
                                    NUEVA ENTRADA
                                </button>
                            </div>

                            {showLogForm && (
                                <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-blue-50 space-y-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-black text-slate-800 tracking-tighter uppercase">Nuevo Registro Pedagógico</h3>
                                        <button onClick={() => setShowLogForm(false)} className="text-slate-400 hover:text-rose-500"><X size={32} /></button>
                                    </div>
                                    <form onSubmit={handleSaveLog} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fecha de la Clase</label>
                                                <input type="date" value={logFormData.date} onChange={e => setLogFormData({ ...logFormData, date: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tema / Título</label>
                                                <input required placeholder="Ej: Introducción al Álgebra" value={logFormData.topic} onChange={e => setLogFormData({ ...logFormData, topic: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Desarrollo de Actividades</label>
                                            <textarea rows={4} required placeholder="Describa lo realizado en clase..." value={logFormData.activities} onChange={e => setLogFormData({ ...logFormData, activities: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold resize-none" />
                                        </div>
                                        <button type="submit" className="w-full py-6 bg-emerald-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 transition-all uppercase">FIRMAs Y GUARDAR EN LIBRO</button>
                                    </form>
                                </div>
                            )}

                            <div className="grid gap-6">
                                {logs.map(log => (
                                    <div key={log._id} className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-slate-50 flex flex-col md:flex-row gap-8 group hover:border-blue-200 transition-all">
                                        <div className="md:w-32 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-center">
                                            <div className="text-3xl font-black text-slate-800 leading-none mb-1">{new Date(log.date).getDate() + 1}</div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(log.date).toLocaleString('es-CL', { month: 'short' }).toUpperCase()}</div>
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-3">
                                                {log.isSigned ? (
                                                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1"><ShieldCheck size={12} /> Firmado Digitalmente</span>
                                                ) : (
                                                    <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-1"><AlertCircle size={12} /> Pendiente de Firma</span>
                                                )}
                                            </div>
                                            <h4 className="text-xl font-black text-slate-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{log.topic}</h4>
                                            <p className="text-sm font-bold text-slate-500 leading-relaxed italic line-clamp-2">{log.activities}</p>
                                        </div>
                                        <div className="md:w-48 flex flex-col justify-center gap-2">
                                            {!log.isSigned && (
                                                <button onClick={() => handleSignLog(log._id, log.startTime)} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">Firmar Libro</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {logs.length === 0 && <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 text-slate-300 font-bold uppercase text-xs tracking-widest">Aún no hay registros en este curso</div>}
                            </div>
                        </div>
                    )}

                    {/* ASISTENCIA TAB */}
                    {activeTab === 'asistencia' && (
                        <div className="space-y-8">
                            <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-50 space-y-10">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Pase de Lista Diario</h3>
                                        <p className="text-slate-400 font-bold text-xs">Control de asistencia institucional.</p>
                                    </div>
                                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Fecha:</span>
                                        <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="bg-transparent font-black text-slate-700 outline-none" />
                                    </div>
                                    <button onClick={handleSaveAttendance} className="bg-emerald-600 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:scale-105 transition-all">GUARDAR ASISTENCIA</button>
                                </div>

                                <div className="overflow-x-auto rounded-3xl border border-slate-100">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudiante</th>
                                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {students.map((s: any) => (
                                                <tr key={s._id} className="hover:bg-blue-50/20 transition-all">
                                                    <td className="px-10 py-6 font-black text-slate-700 uppercase tracking-tight text-sm">{s.apellidos}, {s.nombres}</td>
                                                    <td className="px-10 py-6 flex justify-center gap-2">
                                                        {['presente', 'ausente', 'justificado'].map(status => (
                                                            <button
                                                                key={status}
                                                                onClick={() => setAttendanceMap({ ...attendanceMap, [s._id]: status })}
                                                                className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all
                                                                ${attendanceMap[s._id] === status
                                                                        ? status === 'presente' ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-lg' :
                                                                            status === 'ausente' ? 'bg-rose-50 border-rose-500 text-rose-600 shadow-lg' : 'bg-amber-50 border-amber-500 text-amber-600 shadow-lg'
                                                                        : 'bg-white border-slate-100 text-slate-300 hover:border-slate-300'}`}
                                                            >
                                                                {status}
                                                            </button>
                                                        ))}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* NOTAS TAB */}
                    {activeTab === 'notas' && (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center px-4">
                                <h2 className="text-2xl font-black text-[#11355a] uppercase tracking-tighter">Planilla de Calificaciones</h2>
                                <button onClick={() => { setGradeFormData({ _id: '', estudianteId: '', evaluationId: '', score: 4.0, comments: '' }); setShowGradeModal(true); }} className="bg-[#11355a] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-blue-900/20">
                                    INGRESAR NOTA
                                </button>
                            </div>

                            <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-x-auto p-10">
                                <table className="w-full text-left min-w-[800px]">
                                    <thead>
                                        <tr className="border-b-2 border-slate-100">
                                            <th className="pb-8 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudiante</th>
                                            {evaluations.map((ev: any) => (
                                                <th key={ev._id} className="pb-8 px-4 text-center">
                                                    <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest truncate max-w-[120px]" title={ev.title}>{ev.title}</div>
                                                    <div className="text-[8px] font-bold text-slate-400">{new Date(ev.date).toLocaleDateString()}</div>
                                                </th>
                                            ))}
                                            <th className="pb-8 px-8 text-center text-[10px] font-black text-slate-800 uppercase tracking-widest">Prom.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {students.map((s: any) => {
                                            const studentGrades = grades.filter((g: any) => g.estudianteId?._id === s._id || g.estudianteId === s._id);
                                            const total = studentGrades.reduce((acc, curr) => acc + curr.score, 0);
                                            const avg = studentGrades.length > 0 ? (total / studentGrades.length).toFixed(1) : '-';

                                            return (
                                                <tr key={s._id} className="hover:bg-slate-50/50 transition-all">
                                                    <td className="py-6 px-4 font-black text-slate-700 text-sm uppercase truncate max-w-[200px]">{s.apellidos}, {s.nombres}</td>
                                                    {evaluations.map((ev: any) => {
                                                        const gradeItem = studentGrades.find((g: any) => (g.evaluationId?._id || g.evaluationId) === ev._id);
                                                        return (
                                                            <td key={ev._id} className="py-6 px-4 text-center">
                                                                {gradeItem ? (
                                                                    <button onClick={() => {
                                                                        setGradeFormData({
                                                                            _id: gradeItem._id,
                                                                            estudianteId: s._id,
                                                                            evaluationId: ev._id,
                                                                            score: gradeItem.score,
                                                                            comments: gradeItem.comments || ''
                                                                        });
                                                                        setShowGradeModal(true);
                                                                    }} className={`w-12 py-2 rounded-xl font-black text-sm shadow-sm transition-all hover:scale-110 ${gradeItem.score >= 4 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                                                        {gradeItem.score.toFixed(1)}
                                                                    </button>
                                                                ) : (
                                                                    <button onClick={() => {
                                                                        setGradeFormData({ _id: '', estudianteId: s._id, evaluationId: ev._id, score: 4.0, comments: '' });
                                                                        setShowGradeModal(true);
                                                                    }} className="w-12 py-2 bg-slate-50 text-slate-300 rounded-xl hover:bg-blue-50 hover:text-blue-500 transition-all">+</button>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="py-6 px-8 text-center">
                                                        <div className={`text-lg font-black ${Number(avg) >= 4 ? 'text-blue-600' : Number(avg) < 4 ? 'text-rose-600' : 'text-slate-200'}`}>
                                                            {avg}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* EVALUACIONES TAB */}
                    {activeTab === 'evaluaciones' && (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center px-4">
                                <h2 className="text-2xl font-black text-[#11355a] uppercase tracking-tighter">Cronograma de Evaluaciones</h2>
                                {isStaff && (
                                    <button onClick={() => openEvalModal()} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-emerald-900/20 uppercase">
                                        PROGRAMAR PRUEBA
                                    </button>
                                )}
                            </div>

                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {evaluations.map((ev: any) => (
                                    <div key={ev._id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 group hover:border-amber-200 transition-all">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-amber-50 transition-colors">
                                                <Calendar className="text-slate-400 group-hover:text-amber-500" />
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</div>
                                                <div className="text-sm font-black text-slate-800">{new Date(ev.date).toLocaleDateString('es-CL', { day: '2-digit', month: 'long' })}</div>
                                            </div>
                                        </div>
                                        <h4 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">{ev.title}</h4>
                                        <div className="flex items-center gap-2 mb-8">
                                            {ev.category === 'sorpresa' ? (
                                                <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-rose-100">Evaluación Sorpresa</span>
                                            ) : (
                                                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100">Evaluación Planificada</span>
                                            )}
                                        </div>
                                        <div className="flex gap-2 pt-6 border-t border-slate-50">
                                            <button onClick={() => openEvalModal(ev)} className="flex-1 py-3 bg-slate-50 text-blue-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-50 transition-colors">Editar</button>
                                            <button onClick={async () => { if (window.confirm('¿Eliminar?')) { await api.delete(`/evaluations/${ev._id}`); refreshTabContent(); } }} className="px-4 py-3 bg-slate-50 text-rose-400 rounded-xl hover:bg-rose-50 transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                                {evaluations.length === 0 && <div className="col-span-full text-center py-20 bg-white rounded-[3rem] border border-slate-100 text-slate-300 font-bold uppercase text-xs tracking-widest">Sin evaluaciones programadas</div>}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* MODALS Area */}
            {showGradeModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="bg-[#11355a] p-8 text-white flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-3"><GraduationCap size={24} /> {gradeFormData._id ? 'Modificar Nota' : 'Ingresar Calificación'}</h2>
                            <button onClick={() => setShowGradeModal(false)} className="text-white/40 hover:text-white"><X size={32} /></button>
                        </div>
                        <form onSubmit={handleSaveGrade} className="p-10 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Evaluación Seleccionada</label>
                                    <select disabled={!!gradeFormData._id} required value={gradeFormData.evaluationId} onChange={e => setGradeFormData({ ...gradeFormData, evaluationId: e.target.value })} className="w-full px-6 py-4 bg-slate-100 border-2 border-slate-100 rounded-2xl outline-none font-black text-slate-500">
                                        <option value="">Seleccione Evaluación...</option>
                                        {evaluations.map((ev: any) => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Estudiante</label>
                                    <select disabled={!!gradeFormData._id} required value={gradeFormData.estudianteId} onChange={e => setGradeFormData({ ...gradeFormData, estudianteId: e.target.value })} className="w-full px-6 py-4 bg-slate-100 border-2 border-slate-100 rounded-2xl outline-none font-black text-slate-500">
                                        <option value="">Seleccione Alumno...</option>
                                        {students.map((s: any) => <option key={s._id} value={s._id}>{s.apellidos}, {s.nombres}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Nota (1.0 - 7.0)</label>
                                    <input type="number" step="0.1" min="1" max="7" required value={gradeFormData.score} onChange={e => setGradeFormData({ ...gradeFormData, score: parseFloat(e.target.value) })} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black text-[#11355a] text-center text-2xl" />
                                </div>
                            </div>
                            <div className="bg-blue-50 p-6 rounded-[1.5rem] border border-blue-100 text-[10px] text-blue-700 font-bold leading-relaxed flex items-start gap-4">
                                <AlertCircle size={20} className="shrink-0" />
                                Esta acción notificará al apoderado de forma automática y quedará registrada en el sistema de auditoría oficial.
                            </div>
                            <button type="submit" className="w-full py-6 bg-[#11355a] text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-900/30 hover:scale-[1.02] transition-all">PUBLICAR CALIFICACIÓN</button>
                        </form>
                    </div>
                </div>
            )}

            {showEvalModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="bg-emerald-600 p-8 text-white flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-3"><Calendar size={24} /> {evalFormData._id ? 'Editar Evaluación' : 'Programar Nueva Prueba'}</h2>
                            <button onClick={() => setShowEvalModal(false)} className="text-white/40 hover:text-white"><X size={32} /></button>
                        </div>
                        <form onSubmit={handleSaveEval} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Título de la Evaluación</label>
                                <input required placeholder="Ej: Control de Lecture #2" value={evalFormData.title} onChange={e => setEvalFormData({ ...evalFormData, title: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 outline-none font-bold" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fecha</label>
                                    <input type="date" required value={evalFormData.date} onChange={e => setEvalFormData({ ...evalFormData, date: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 outline-none font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tipo / Categoría</label>
                                    <select value={evalFormData.category} onChange={e => setEvalFormData({ ...evalFormData, category: e.target.value as any })} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 outline-none font-bold">
                                        <option value="planificada">Evaluación Planificada</option>
                                        <option value="sorpresa">Evaluación Sorpresa</option>
                                    </select>
                                </div>
                            </div>

                            {/* Question Bank Selection - Redesigned & UX Enhanced */}
                            <div className="space-y-4 pt-6 border-t border-slate-100">
                                <div className="flex items-center justify-between ml-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Banco de Preguntas
                                        <span className="text-emerald-600 font-bold ml-2">{evalFormData.questions.length} seleccionadas</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowQuestionForm(!showQuestionForm)}
                                        className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all border-2 ${showQuestionForm ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:shadow-lg'}`}
                                    >
                                        {showQuestionForm ? <X size={12} /> : '+'}
                                        {showQuestionForm ? 'Cancelar' : 'Crear Pregunta'}
                                    </button>
                                </div>

                                {showQuestionForm && (
                                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-indigo-100 space-y-5 animate-in slide-in-from-top-4 duration-500 shadow-2xl shadow-indigo-900/5">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic ml-2">Enunciado de la Pregunta</label>
                                                <div className="flex gap-2 mb-1">
                                                    {(['easy', 'medium', 'hard'] as const).map(d => (
                                                        <button
                                                            key={d}
                                                            type="button"
                                                            onClick={() => setNewQuestionData({ ...newQuestionData, difficulty: d })}
                                                            className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter border-2 transition-all ${newQuestionData.difficulty === d ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}
                                                        >
                                                            {d === 'easy' ? 'Fácil' : d === 'medium' ? 'Medio' : 'Difícil'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <textarea
                                                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 outline-none focus:border-indigo-500 transition-all text-sm font-bold bg-white"
                                                placeholder="Ej: ¿Cuál es el resultado de la siguiente operación...?"
                                                rows={3}
                                                value={newQuestionData.questionText}
                                                onChange={e => setNewQuestionData({ ...newQuestionData, questionText: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {newQuestionData.options.map((opt, i) => (
                                                <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-2xl border-2 border-slate-100 group focus-within:border-indigo-200 transition-all">
                                                    <span className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 group-focus-within:bg-indigo-50 group-focus-within:text-indigo-500">{String.fromCharCode(65 + i)}</span>
                                                    <input
                                                        className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-slate-700"
                                                        placeholder={`Opción ${String.fromCharCode(65 + i)}`}
                                                        value={opt.text}
                                                        onChange={e => {
                                                            const opts = [...newQuestionData.options];
                                                            opts[i].text = e.target.value;
                                                            setNewQuestionData({ ...newQuestionData, options: opts });
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const opts = newQuestionData.options.map((o, idx) => ({ ...o, isCorrect: i === idx }));
                                                            setNewQuestionData({ ...newQuestionData, options: opts });
                                                        }}
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${opt.isCorrect ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30 rotate-0' : 'bg-slate-50 border-slate-100 text-slate-300 hover:border-emerald-200 hover:text-emerald-400'}`}
                                                    >
                                                        <ShieldCheck size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleAddQuestionToBank}
                                            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/20 active:scale-95"
                                        >
                                            Guardar en Repositorio y Vincular
                                        </button>
                                    </div>
                                )}

                                {/* Improved Search and Filters */}
                                <div className="space-y-4">
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                            <input
                                                placeholder="Buscador inteligente de preguntas..."
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black text-slate-600 placeholder:text-slate-300 outline-none focus:border-indigo-400 transition-all font-bold"
                                                value={searchQuestion}
                                                onChange={e => setSearchQuestion(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-4 items-center p-2 bg-slate-50 rounded-[2rem] border-2 border-slate-100">
                                            <div className="flex gap-1 items-center px-2 mr-2 border-r border-slate-200">
                                                <List size={14} className="text-slate-400" />
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtros</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {(['all', 'easy', 'medium', 'hard'] as const).map(d => (
                                                    <button
                                                        key={d}
                                                        type="button"
                                                        onClick={() => setDifficultyFilter(d)}
                                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all ${difficultyFilter === d ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        {d === 'all' ? 'Toda Dificultad' : d === 'easy' ? 'Fácil' : d === 'medium' ? 'Medio' : 'Difícil'}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="w-[1px] h-6 bg-slate-200 mx-2"></div>
                                            <div className="flex gap-2">
                                                {(['all', 'multiple_choice', 'open', 'true_false'] as const).map(t => (
                                                    <button
                                                        key={t}
                                                        type="button"
                                                        onClick={() => setTypeFilter(t)}
                                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all ${typeFilter === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        {t === 'all' ? 'Todos los Tipos' : t === 'multiple_choice' ? 'Alternativas' : t === 'open' ? 'Abierta' : 'V/F'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar p-2">
                                    {bankQuestions
                                        .filter(q => {
                                            const matchesText = q.questionText.toLowerCase().includes(searchQuestion.toLowerCase());
                                            const matchesDiff = difficultyFilter === 'all' || q.difficulty === difficultyFilter;
                                            const matchesType = typeFilter === 'all' || q.type === typeFilter;
                                            return matchesText && matchesDiff && matchesType;
                                        })
                                        .sort((a, b) => {
                                            const subA = (a.subjectId?.name || '').toLowerCase();
                                            const subB = (b.subjectId?.name || '').toLowerCase();
                                            if (subA !== subB) return subA.localeCompare(subB);

                                            const gradeA = (a.grade || a.subjectId?.grade || '').toLowerCase();
                                            const gradeB = (b.grade || b.subjectId?.grade || '').toLowerCase();
                                            if (gradeA !== gradeB) return gradeA.localeCompare(gradeB);

                                            return a.questionText.localeCompare(b.questionText);
                                        })
                                        .map(q => {
                                            const isSelected = evalFormData.questions.includes(q._id);
                                            return (
                                                <div
                                                    key={q._id}
                                                    className={`group p-5 rounded-[2rem] border-2 transition-all relative overflow-hidden ${isSelected ? 'bg-indigo-50/50 border-indigo-500 shadow-xl shadow-indigo-900/5' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
                                                >
                                                    <div className="flex items-start justify-between gap-4 relative z-10">
                                                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => {
                                                            const newQs = isSelected
                                                                ? evalFormData.questions.filter(id => id !== q._id)
                                                                : [...evalFormData.questions, q._id];
                                                            setEvalFormData({ ...evalFormData, questions: newQs });
                                                        }} >
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 font-bold">{q.subjectId?.name || 'S/A'}</span>
                                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border font-bold ${q.difficulty === 'hard' ? 'text-rose-500 bg-rose-50 border-rose-100' : q.difficulty === 'medium' ? 'text-amber-500 bg-amber-50 border-amber-100' : 'text-emerald-500 bg-emerald-50 border-emerald-100'}`}>
                                                                    {q.difficulty}
                                                                </span>
                                                            </div>
                                                            <div className="text-sm font-black text-slate-700 leading-relaxed mb-3 pr-4">{q.questionText}</div>
                                                            <div className="text-[8px] font-black text-indigo-300 uppercase italic opacity-0 group-hover:opacity-100 transition-opacity">Ver Opciones ↑</div>

                                                            {/* Options Preview - More Friendly Grid */}
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-0 group-hover:opacity-100 max-h-0 group-hover:max-h-80 transition-all duration-500 overflow-hidden">
                                                                {q.options?.map((opt: any, i: number) => (
                                                                    <div key={i} className={`flex items-center gap-3 p-2 rounded-xl border ${opt.isCorrect ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                                                        <div className={`w-2 h-2 rounded-full ${opt.isCorrect ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                                                        <span className="text-[10px] font-bold">{opt.text}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newQs = isSelected
                                                                    ? evalFormData.questions.filter(id => id !== q._id)
                                                                    : [...evalFormData.questions, q._id];
                                                                setEvalFormData({ ...evalFormData, questions: newQs });
                                                            }}
                                                            className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-200 group-hover:border-indigo-200 group-hover:text-indigo-300'}`}
                                                        >
                                                            <ShieldCheck size={24} />
                                                        </button>
                                                    </div>
                                                    {isSelected && <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rotate-45 translate-x-16 -translate-y-16"></div>}
                                                </div>
                                            );
                                        })
                                    }
                                </div>
                            </div>

                            <div className="bg-emerald-50 p-6 rounded-[1.5rem] border border-emerald-100 text-[10px] text-emerald-700 font-bold leading-relaxed">
                                {evalFormData.category === 'planificada'
                                    ? 'Las evaluaciones planificadas aparecen en el calendario de alumnos y se notifican con antelación.'
                                    : 'Las evaluaciones sorpresa lanzan alertas instantáneas al realizarse y no aparecen en el calendario previo.'}
                            </div>
                            <button type="submit" className="w-full py-6 bg-emerald-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-900/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                                <Save size={20} />
                                {evalFormData._id ? 'ACTUALIZAR EVALUACIÓN' : 'PUBLICAR EVALUACIÓN'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const GraduationCap = ({ size }: { size: number }) => <BarChart3 size={size} />; // Placeholder as icon name was used but BarChart is better

export default UnifiedClassBook;
