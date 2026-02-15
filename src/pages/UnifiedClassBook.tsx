import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import {
    BookOpen, GraduationCap, X,
    Calendar, List, ShieldCheck,
    UserCheck, ClipboardList, Printer, LayoutGrid, UserPlus, AlertCircle,
    ChevronLeft, ChevronRight, Search
} from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { useReactToPrint } from 'react-to-print';

const UnifiedClassBook = () => {
    const { tenant } = useTenant();
    const printRef = useRef<HTMLDivElement>(null);

    // Context & State
    const [activeTab, setActiveTab] = useState<'ficha' | 'asistencia' | 'leccionario' | 'notas' | 'citaciones'>('leccionario');
    const [courses, setCourses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarExpanded, setSidebarExpanded] = useState(true);

    // Sub-states
    const [logs, setLogs] = useState<any[]>([]);
    const [showLogForm, setShowLogForm] = useState(false);
    const [logFormData, setLogFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        topic: '',
        activities: '',
        objectives: [] as string[]
    });

    const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedBlock, setSelectedBlock] = useState('Bloque 1 (08:00 - 09:30)');
    const [attendanceConfirmed, setAttendanceConfirmed] = useState(false);

    const [grades, setGrades] = useState<any[]>([]);
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [showGradeModal, setShowGradeModal] = useState(false);

    // View Mode & Details
    const [attendanceViewMode, setAttendanceViewMode] = useState<'grid' | 'list'>('grid');
    const [showStudentDetailModal, setShowStudentDetailModal] = useState(false);
    const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<any>(null);

    // Signature State
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [signingLogId, setSigningLogId] = useState<string | null>(null);
    const [pin, setPin] = useState('');

    // Citaciones State
    const [citaciones, setCitaciones] = useState<any[]>([]);
    const [showCitacionModal, setShowCitacionModal] = useState(false);
    const [citacionFormData, setCitacionFormData] = useState({
        estudianteId: '',
        apoderadoId: '',
        fecha: new Date().toISOString().split('T')[0],
        hora: '10:00',
        motivo: '',
        modalidad: 'presencial',
        lugar: ''
    });

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Libro de Clases - ${selectedCourse || 'Curso'}`,
    });

    // -------------------------------------------------------------------------
    // Data Fetching
    // -------------------------------------------------------------------------

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const [cRes, sRes] = await Promise.all([api.get('/courses'), api.get('/subjects')]);
                setCourses(cRes.data);
                setSubjects(sRes.data);
            } catch (err) { console.error(err); }
        };
        fetchInitial();
    }, []);

    const refreshTabContent = async () => {
        if (!selectedCourse) return;
        try {
            if (activeTab === 'ficha') {
                const res = await api.get(`/estudiantes?cursoId=${selectedCourse}`);
                setStudents(res.data);
            } else if (activeTab === 'asistencia') {
                const [studRes, attRes] = await Promise.all([
                    api.get(`/estudiantes?cursoId=${selectedCourse}`),
                    api.get(`/attendance?courseId=${selectedCourse}&fecha=${attendanceDate}&bloqueHorario=${selectedBlock}`)
                ]);
                setStudents(studRes.data);
                const amap: Record<string, string> = {};
                studRes.data.forEach((s: any) => {
                    const rec = attRes.data.find((r: any) => (r.estudianteId?._id || r.estudianteId) === s._id);
                    amap[s._id] = rec ? rec.estado : 'presente';
                });
                setAttendanceMap(amap);
            } else if (selectedSubject) {
                if (activeTab === 'leccionario') {
                    const res = await api.get(`/class-logs?courseId=${selectedCourse}&subjectId=${selectedSubject}`);
                    setLogs(res.data);
                } else if (activeTab === 'notas') {
                    const [gradesRes, evalsRes, studRes] = await Promise.all([
                        api.get('/grades'),
                        api.get('/evaluations'),
                        api.get(`/estudiantes?cursoId=${selectedCourse}`)
                    ]);
                    setStudents(studRes.data);
                    setEvaluations(evalsRes.data.filter((e: any) => (e.courseId?._id || e.courseId) === selectedCourse));
                    setGrades(gradesRes.data);
                } else if (activeTab === 'citaciones') {
                    const res = await api.get(`/citaciones?courseId=${selectedCourse}`);
                    setCitaciones(res.data);
                }
            }
        } catch (err) { console.error('REFRESH ERROR:', err); }
    };

    useEffect(() => { refreshTabContent(); }, [selectedCourse, selectedSubject, activeTab, attendanceDate, selectedBlock]);

    // -------------------------------------------------------------------------
    // Handlers
    // -------------------------------------------------------------------------

    const handleSaveAttendance = async () => {
        try {
            const payload = {
                courseId: selectedCourse,
                fecha: attendanceDate,
                bloqueHorario: selectedBlock,
                subjectId: selectedSubject,
                students: Object.entries(attendanceMap).map(([estudianteId, estado]) => ({ estudianteId, estado }))
            };
            await api.post('/attendance/bulk', payload);
            alert('Asistencia legal guardada y validada.');
        } catch (err) { alert('Error al guardar asistencia para este bloque.'); }
    };

    const handleSaveLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!attendanceConfirmed) { alert('Debe confirmar el pase de lista antes de firmar.'); return; }
        try {
            const res = await api.post('/class-logs', { ...logFormData, courseId: selectedCourse, subjectId: selectedSubject });
            // Automatic prompt to sign or just refresh
            alert('Registro guardado. Ahora proceda a firmar digitalmente.');
            setShowLogForm(false);
            setAttendanceConfirmed(false);
            refreshTabContent();
            setSigningLogId(res.data._id);
            setShowSignatureModal(true);
        } catch (err) { alert('Error al registrar actividad pedagógica.'); }
    };

    const handleSignLog = async () => {
        if (!signingLogId || pin.length < 4) return;
        try {
            await api.post(`/class-logs/${signingLogId}/sign`, { pin });
            alert('Registro firmado exitosamente con firma digital legal.');
            setShowSignatureModal(false);
            setSigningLogId(null);
            setPin('');
            refreshTabContent();
        } catch (err) { alert('PIN Incorrecto o Error de Validación de Firma.'); }
    };

    const handleSaveCitacion = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/citaciones', {
                ...citacionFormData,
                courseId: selectedCourse
            });
            alert('Citación programada y notificada al apoderado.');
            setShowCitacionModal(false);
            refreshTabContent();
        } catch (err) { alert('Error al programar la citación.'); }
    };

    const filteredSubjects = selectedCourse ? subjects.filter(s => (s.courseId?._id || s.courseId) === selectedCourse) : [];

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 min-h-screen pb-20 print:p-0 print:max-w-none">
            {/* Header Control */}
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-8 relative overflow-hidden group print:hidden">
                <div className="flex items-center gap-6 relative z-10">
                    <div className="p-5 bg-gradient-to-br from-[#11355a] to-blue-600 text-white rounded-[2.5rem] shadow-2xl transition-transform group-hover:rotate-3">
                        <BookOpen size={40} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-[#11355a] tracking-tighter uppercase leading-none">Mi Libro Digital</h1>
                        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mt-3 flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                            <ShieldCheck size={12} className="text-emerald-500" />
                            Ambiente Oficial • {tenant?.name || 'EinSmart'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto relative z-10">
                    <button onClick={() => setSidebarExpanded(!sidebarExpanded)}
                        className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm flex items-center gap-2 font-black text-[10px] uppercase">
                        {sidebarExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                        <span className="hidden sm:inline">{sidebarExpanded ? 'Contraer' : 'Expandir'}</span>
                    </button>
                    <div className="flex-1 lg:w-60">
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Curso / Nivel</label>
                        <select className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-black text-slate-700 transition-all shadow-sm text-xs"
                            value={selectedCourse} onChange={e => { setSelectedCourse(e.target.value); setSelectedSubject(''); }}>
                            <option value="">-- CURSO --</option>
                            {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 lg:w-60">
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Asignatura</label>
                        <select className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-black text-slate-700 disabled:opacity-50 transition-all shadow-sm text-xs"
                            value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} disabled={!selectedCourse}>
                            <option value="">-- SELECCIONAR --</option>
                            {filteredSubjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Layout Wrapper */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className={`${sidebarExpanded ? 'lg:w-72' : 'lg:w-20'} shrink-0 space-y-3 print:hidden transition-all duration-300`}>
                    {[
                        { id: 'ficha', label: 'Ficha Estudiantes', icon: GraduationCap },
                        { id: 'asistencia', label: 'Lista Digital', icon: UserCheck },
                        { id: 'leccionario', label: 'Leccionario', icon: List },
                        { id: 'notas', label: 'Calificaciones', icon: ClipboardList },
                        { id: 'citaciones', label: 'Citaciones', icon: Calendar }
                    ].map((tab: any) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                            title={tab.label}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all
                            ${activeTab === tab.id ? 'bg-[#11355a] text-white shadow-xl -translate-x-1' : 'bg-white text-slate-400 border border-slate-100 shadow-sm hover:border-blue-200'}`}>
                            <tab.icon size={20} className={activeTab === tab.id ? 'text-blue-400' : 'text-slate-300'} />
                            {sidebarExpanded && <span>{tab.label}</span>}
                        </button>
                    ))}

                    <div className="mt-10 p-8 bg-gradient-to-br from-blue-900 to-[#11355a] rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <h4 className="text-xs font-black uppercase tracking-widest mb-2">Reporte SIGE</h4>
                            <p className="text-[9px] text-blue-200 mb-6 font-bold uppercase leading-relaxed">Genera documentos legales para subvención escolar.</p>
                            <button onClick={() => handlePrint()} className="w-full py-4 bg-white text-[#11355a] rounded-2xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2">
                                <Printer size={16} /> Exportar Libro PDF
                            </button>
                        </div>
                        <Printer size={80} className="absolute -bottom-4 -right-4 text-white/5 group-hover:rotate-12 transition-transform" />
                    </div>
                </div>

                {/* Main Content Area */}
                <div ref={printRef} className="flex-1 animate-in fade-in slide-in-from-right-10 duration-700">
                    {!selectedCourse ? (
                        <div className="bg-white rounded-[4rem] p-40 text-center border-4 border-dashed border-slate-100">
                            <LayoutGrid size={80} className="mx-auto text-slate-100 mb-8" />
                            <h2 className="text-3xl font-black text-slate-300 uppercase tracking-tighter">Seleccione un Curso</h2>
                            <p className="text-slate-300 font-bold uppercase tracking-[0.3em] text-[10px] mt-6">Cargando base de datos segura...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* TAB CONTEXT: FICHA DE VIDA */}
                            {activeTab === 'ficha' && (
                                <div className="space-y-6">
                                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                                        <h3 className="text-xl font-black text-[#11355a] tracking-tighter uppercase">Ficha Estudiantes</h3>
                                        <div className="relative w-full md:w-96">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Buscar por nombre o RUT..."
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                className="w-full pl-12 pr-6 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none font-bold text-slate-700 transition-all text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {students.filter(s =>
                                            s.nombres.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            s.apellidos.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            s.rut?.includes(searchQuery)
                                        ).map((s: any) => (
                                            <div key={s._id} className="bg-white p-6 rounded-2xl shadow-lg border border-slate-50 relative group hover:border-blue-300 transition-all">
                                                <div className="flex gap-4">
                                                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                                                        <span className="text-xl font-black text-slate-300 uppercase">{s.nombres[0]}{s.apellidos[0]}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-black text-[#11355a] text-sm uppercase leading-tight mb-1">{s.apellidos}, {s.nombres}</h4>
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-[10px]">
                                                                <span className="text-slate-400 font-bold uppercase">RUT</span>
                                                                <span className="text-slate-700 font-black">{s.rut || 'No Reg.'}</span>
                                                            </div>
                                                            <div className="flex justify-between text-[10px]">
                                                                <span className="text-slate-400 font-bold uppercase">Edad</span>
                                                                <span className="text-slate-700 font-black">{s.fechaNacimiento ? new Date().getFullYear() - new Date(s.fechaNacimiento).getFullYear() : '--'} Años</span>
                                                            </div>
                                                            <div className="flex justify-between text-[10px]">
                                                                <span className="text-slate-400 font-bold uppercase">Salud</span>
                                                                <span className="text-slate-700 font-black">{s.salud || 'Sin Registro'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-slate-50 flex gap-2">
                                                    <button
                                                        onClick={() => { setSelectedStudentForDetail(s); setShowStudentDetailModal(true); }}
                                                        className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all"
                                                    >
                                                        HOJA DE VIDA
                                                    </button>
                                                    <button className="p-2 border border-slate-100 text-slate-400 rounded-lg hover:text-blue-500 transition-colors">
                                                        <UserPlus size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'asistencia' && (
                                <div className="space-y-8">
                                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-black text-[#11355a] tracking-tighter uppercase">Pase de Lista Digital</h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Sincronización SIGE</span>
                                                <span className="text-slate-400 font-bold text-[10px]">Registro Obligatorio por Bloque</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
                                            <div className="flex bg-slate-50 p-1 rounded-2xl border-2 border-slate-100">
                                                <button
                                                    onClick={() => setAttendanceViewMode('grid')}
                                                    className={`p-3 rounded-xl transition-all ${attendanceViewMode === 'grid' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                    title="Vista Cuadrícula"
                                                >
                                                    <LayoutGrid size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setAttendanceViewMode('list')}
                                                    className={`p-3 rounded-xl transition-all ${attendanceViewMode === 'list' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                    title="Vista Lista"
                                                >
                                                    <List size={18} />
                                                </button>
                                            </div>
                                            <select
                                                value={selectedBlock}
                                                onChange={e => setSelectedBlock(e.target.value)}
                                                className="bg-slate-50 px-6 py-4 rounded-2xl border-2 border-slate-100 font-black text-slate-700 text-xs outline-none focus:border-blue-500"
                                            >
                                                <option>Bloque 1 (08:00 - 09:30)</option>
                                                <option>Bloque 2 (09:45 - 11:15)</option>
                                                <option>Bloque 3 (11:30 - 13:00)</option>
                                                <option>Bloque 4 (14:00 - 15:30)</option>
                                            </select>
                                            <div className="flex items-center gap-4 bg-slate-50 px-6 py-4 rounded-2xl border-2 border-slate-100">
                                                <Calendar size={18} className="text-slate-300" />
                                                <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="bg-transparent font-black text-slate-700 text-xs outline-none" />
                                            </div>
                                            <button onClick={handleSaveAttendance} className="flex-1 xl:flex-none bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:scale-[1.02] transition-all">TERMINAR PASE LISTA</button>
                                        </div>
                                    </div>

                                    {attendanceViewMode === 'grid' ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                            {students.map((s: any) => (
                                                <div key={s._id} className={`bg-white rounded-[3rem] p-6 shadow-xl border-4 transition-all relative overflow-hidden flex flex-col items-center text-center
                                                ${attendanceMap[s._id] === 'ausente' ? 'border-rose-100 bg-rose-50/10' :
                                                        attendanceMap[s._id] === 'atraso' ? 'border-amber-100 bg-amber-50/10' :
                                                            'border-slate-50 hover:border-blue-200'}`}>

                                                    <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6 relative group cursor-pointer"
                                                        onClick={() => setAttendanceMap({ ...attendanceMap, [s._id]: attendanceMap[s._id] === 'presente' ? 'ausente' : 'presente' })}>
                                                        <div className="text-2xl font-black text-slate-300 uppercase">{s.nombres[0]}{s.apellidos[0]}</div>
                                                        {attendanceMap[s._id] === 'presente' && <div className="absolute inset-0 bg-emerald-500/10 rounded-full flex items-center justify-center ring-4 ring-emerald-500/20"><UserCheck size={40} className="text-emerald-500" /></div>}
                                                        {attendanceMap[s._id] === 'ausente' && <div className="absolute inset-0 bg-rose-500/10 rounded-full flex items-center justify-center ring-4 ring-rose-500/30"><X size={40} className="text-rose-500" /></div>}
                                                    </div>

                                                    <h4 className="text-xs font-black text-[#11355a] uppercase tracking-tight mb-2 line-clamp-1">{s.apellidos}, {s.nombres}</h4>

                                                    <div className="flex gap-1 w-full mt-4">
                                                        {[
                                                            { id: 'presente', label: 'P', color: 'emerald' },
                                                            { id: 'ausente', label: 'A', color: 'rose' },
                                                            { id: 'atraso', label: 'T', color: 'amber' },
                                                            { id: 'retiro_anticipado', label: 'R', color: 'indigo' }
                                                        ].map(status => (
                                                            <button
                                                                key={status.id}
                                                                onClick={() => setAttendanceMap({ ...attendanceMap, [s._id]: status.id })}
                                                                className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase transition-all
                                                            ${attendanceMap[s._id] === status.id
                                                                        ? `bg-${status.color}-600 text-white shadow-lg`
                                                                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                                            >
                                                                {status.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-3 bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
                                            {students.map((s: any) => (
                                                <div key={s._id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${attendanceMap[s._id] === 'ausente' ? 'bg-rose-50/30 border-rose-100' : 'bg-white border-slate-50 hover:border-blue-100'}`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs">
                                                            {s.nombres[0]}{s.apellidos[0]}
                                                        </div>
                                                        <span className="font-bold text-slate-700 text-sm uppercase">{s.apellidos}, {s.nombres}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {[
                                                            { id: 'presente', label: 'Presente', color: 'emerald' },
                                                            { id: 'ausente', label: 'Ausente', color: 'rose' },
                                                            { id: 'atraso', label: 'Atrasado', color: 'amber' },
                                                            { id: 'retiro_anticipado', label: 'Retirado', color: 'indigo' }
                                                        ].map(status => (
                                                            <button
                                                                key={status.id}
                                                                onClick={() => setAttendanceMap({ ...attendanceMap, [s._id]: status.id })}
                                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all
                                                                ${attendanceMap[s._id] === status.id
                                                                        ? `bg-${status.color}-500 text-white shadow-lg`
                                                                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                                            >
                                                                {status.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB CONTEXT: LECCIONARIO */}
                            {activeTab === 'leccionario' && (
                                <div className="space-y-8">
                                    <div className="flex justify-between items-center px-4">
                                        <h2 className="text-2xl font-black text-[#11355a] uppercase tracking-tighter">Leccionario Digital (Firmado)</h2>
                                        <button onClick={() => setShowLogForm(true)} disabled={!selectedSubject}
                                            className="bg-[#11355a] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl disabled:opacity-50">NUEVA FIRMA DE CLASE</button>
                                    </div>

                                    {showLogForm && (
                                        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-blue-50 space-y-6 animate-in slide-in-from-top-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Registro de Actividad Pedagógica</h3>
                                                <button onClick={() => setShowLogForm(false)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={32} /></button>
                                            </div>
                                            <form onSubmit={handleSaveLog} className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</label>
                                                        <input type="date" value={logFormData.date} onChange={e => setLogFormData({ ...logFormData, date: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contenido / OA</label>
                                                        <input required value={logFormData.topic} onChange={e => setLogFormData({ ...logFormData, topic: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" placeholder="Ej: OA 04 - Ecuaciones Lineales" />
                                                    </div>
                                                </div>
                                                <textarea rows={3} required value={logFormData.activities} onChange={e => setLogFormData({ ...logFormData, activities: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold resize-none" placeholder="Actividades realizadas..." />
                                                <div className="flex items-center gap-4 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                                                    <input type="checkbox" id="attConf" className="w-6 h-6 rounded-lg accent-blue-600" checked={attendanceConfirmed} onChange={e => setAttendanceConfirmed(e.target.checked)} />
                                                    <label htmlFor="attConf" className="text-sm font-black text-blue-900 italic">Doy fe de que se ha pasado la asistencia en este bloque horario.</label>
                                                </div>
                                                <button type="submit" className="w-full py-6 bg-emerald-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 hover:scale-[1.02] transition-all">FIRMAR Y CERRAR REGISTRO</button>
                                            </form>
                                        </div>
                                    )}

                                    <div className="grid gap-6">
                                        {logs.map(log => (
                                            <div key={log._id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 group hover:border-blue-300 transition-all flex flex-col md:flex-row gap-8 relative overflow-hidden">
                                                {log.isSigned && <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full flex items-end justify-start p-8"><ShieldCheck size={40} className="text-emerald-500/20" /></div>}
                                                <div className="md:w-32 py-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-center flex flex-col items-center justify-center">
                                                    <div className="text-3xl font-black text-[#11355a] leading-none mb-1">{new Date(log.date).getUTCDate()}</div>
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(log.date).toLocaleString('es-CL', { month: 'short', timeZone: 'UTC' }).toUpperCase()}</div>
                                                </div>
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 ${log.isSigned ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                            {log.isSigned ? <ShieldCheck size={12} /> : <AlertCircle size={12} />} {log.isSigned ? 'Firma Digital Válida' : 'Pendiente de Firma'}
                                                        </span>
                                                        {log.isSigned && <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Sello: {log.signatureMetadata?.signedAt ? new Date(log.signatureMetadata.signedAt).toLocaleString() : 'Verificado'}</span>}
                                                    </div>
                                                    <h4 className="text-xl font-black text-[#11355a] tracking-tight">{log.topic}</h4>
                                                    <p className="text-sm font-bold text-slate-500 italic line-clamp-2 leading-relaxed">{log.activities}</p>

                                                    {!log.isSigned && (
                                                        <div className="pt-4 flex gap-2">
                                                            <button
                                                                onClick={() => { setSigningLogId(log._id); setShowSignatureModal(true); }}
                                                                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-blue-900/20"
                                                            >
                                                                FIRMAR AHORA
                                                            </button>
                                                            <button className="px-6 py-2 bg-slate-50 text-slate-400 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-100 transition-all">Editar</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {logs.length === 0 && <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 text-slate-300 font-bold uppercase text-xs tracking-widest">No hay registros aún para este curso.</div>}
                                    </div>
                                </div>
                            )}

                            {/* TAB CONTEXT: NOTAS */}
                            {activeTab === 'notas' && (
                                <div className="space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                                    <div className="flex justify-between items-center border-b border-slate-50 pb-6 mb-2">
                                        <h2 className="text-xl font-black text-[#11355a] uppercase tracking-tighter">
                                            Notas - {courses.find(c => c._id === selectedCourse)?.name || 'Seleccione Curso'}
                                        </h2>
                                        <div className="px-4 py-2 bg-amber-50 rounded-lg border border-amber-100">
                                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Decreto 67</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-end items-center px-4">
                                        <button onClick={() => setShowGradeModal(true)} className="bg-[#11355a] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">INGRESAR NOTA</button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left min-w-[800px]">
                                            <thead>
                                                <tr className="border-b-2 border-slate-50">
                                                    <th className="pb-8 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudiante</th>
                                                    {evaluations.map((ev: any) => (
                                                        <th key={ev._id} className="pb-8 px-4 text-center">
                                                            <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest truncate max-w-[100px]">{ev.title}</div>
                                                            <div className="text-[8px] font-bold text-slate-300">{new Date(ev.date).toLocaleDateString()}</div>
                                                        </th>
                                                    ))}
                                                    <th className="pb-8 px-8 text-center text-[10px] font-black text-slate-900 uppercase tracking-widest">P. Final</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {students.map((s: any) => {
                                                    const sGrades = grades.filter((g: any) => g.estudianteId?._id === s._id || g.estudianteId === s._id);
                                                    const total = sGrades.reduce((acc, curr) => acc + curr.score, 0);
                                                    const avg = sGrades.length > 0 ? (total / sGrades.length).toFixed(1) : '-';
                                                    return (
                                                        <tr key={s._id} className="hover:bg-slate-50/50 transition-all">
                                                            <td className="py-6 px-4 font-black text-[#11355a] text-sm uppercase">{s.apellidos}, {s.nombres}</td>
                                                            {evaluations.map((ev: any) => {
                                                                const gradeItem = sGrades.find((g: any) => (g.evaluationId?._id || g.evaluationId) === ev._id);
                                                                return (
                                                                    <td key={ev._id} className="py-6 px-4 text-center">
                                                                        {gradeItem ? (
                                                                            <span className={`w-12 py-2 inline-block rounded-xl font-black text-sm shadow-sm ${gradeItem.score >= 4 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>{gradeItem.score.toFixed(1)}</span>
                                                                        ) : <span className="text-slate-200">-</span>}
                                                                    </td>
                                                                );
                                                            })}
                                                            <td className="py-6 px-8 text-center">
                                                                <div className={`text-lg font-black ${Number(avg) >= 4 ? 'text-blue-600' : Number(avg) < 4 ? 'text-rose-600' : 'text-slate-100'}`}>{avg}</div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* TAB CONTEXT: CITACIONES */}
                            {activeTab === 'citaciones' && (
                                <div className="space-y-8">
                                    <div className="flex justify-between items-center px-4">
                                        <h2 className="text-2xl font-black text-[#11355a] uppercase tracking-tighter">Citaciones y Reuniones</h2>
                                        <button onClick={() => setShowCitacionModal(true)} className="bg-[#11355a] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all">CREAR CITACIÓN</button>
                                    </div>

                                    <div className="grid gap-6">
                                        {citaciones.map((c: any) => (
                                            <div key={c._id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 flex flex-col md:flex-row gap-8 items-center group hover:border-amber-300 transition-all">
                                                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                                                    <Calendar size={32} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${c.estado === 'confirmada' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                            {c.estado || 'Pendiente'}
                                                        </span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase">{c.modalidad}</span>
                                                    </div>
                                                    <h4 className="text-lg font-black text-[#11355a] uppercase">{c.estudianteId?.apellidos}, {c.estudianteId?.nombres}</h4>
                                                    <p className="text-xs font-bold text-slate-500 italic mt-1">{c.motivo}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xl font-black text-[#11355a]">{new Date(c.fecha).toLocaleDateString()}</div>
                                                    <div className="text-xs font-bold text-slate-400">{c.hora} hrs</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all"><X size={18} /></button>
                                                    <button className="px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Ver Acta</button>
                                                </div>
                                            </div>
                                        ))}
                                        {citaciones.length === 0 && (
                                            <div className="bg-white p-20 rounded-[4rem] border-4 border-dashed border-slate-100 text-center">
                                                <Calendar size={60} className="mx-auto text-slate-100 mb-8" />
                                                <h3 className="text-2xl font-black text-slate-300 uppercase tracking-tighter">Gestión de Agenda</h3>
                                                <p className="text-slate-300 font-bold uppercase tracking-[0.3em] text-[10px] mt-4">No hay citaciones programadas para este curso.</p>
                                            </div>
                                        )}
                                    </div>

                                    {showCitacionModal && (
                                        <div className="fixed inset-0 bg-[#11355a]/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
                                            <div className="bg-white rounded-[4rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 p-12 border-b-[16px] border-amber-500">
                                                <div className="flex justify-between items-center mb-10">
                                                    <h2 className="text-3xl font-black text-[#11355a] uppercase tracking-tighter">Nueva Citación</h2>
                                                    <button onClick={() => setShowCitacionModal(false)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={40} /></button>
                                                </div>

                                                <form onSubmit={handleSaveCitacion} className="space-y-8">
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudiante</label>
                                                            <select required value={citacionFormData.estudianteId} onChange={e => setCitacionFormData({ ...citacionFormData, estudianteId: e.target.value })} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold">
                                                                <option value="">Seleccionar Alumno</option>
                                                                {students.map(s => <option key={s._id} value={s._id}>{s.apellidos}, {s.nombres}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Modalidad</label>
                                                            <select required value={citacionFormData.modalidad} onChange={e => setCitacionFormData({ ...citacionFormData, modalidad: e.target.value })} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold">
                                                                <option value="presencial">Presencial</option>
                                                                <option value="online">Virtual / Meet</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</label>
                                                            <input required type="date" value={citacionFormData.fecha} onChange={e => setCitacionFormData({ ...citacionFormData, fecha: e.target.value })} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hora</label>
                                                            <input required type="time" value={citacionFormData.hora} onChange={e => setCitacionFormData({ ...citacionFormData, hora: e.target.value })} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo de la Reunión</label>
                                                        <textarea required value={citacionFormData.motivo} onChange={e => setCitacionFormData({ ...citacionFormData, motivo: e.target.value })} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold resize-none" rows={3} placeholder="Describa el objetivo de la entrevista..."></textarea>
                                                    </div>
                                                    <button type="submit" className="w-full py-6 bg-amber-500 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-amber-500/20 hover:scale-[1.02] transition-all">PROGRAMAR CITACIÓN Y NOTIFICAR</button>
                                                </form>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* MODALS Area (Minimal Placeholders) */}
                {
                    showGradeModal && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                            <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
                                <div className="bg-[#11355a] p-8 text-white flex justify-between items-center">
                                    <h2 className="text-xl font-bold flex items-center gap-3"><GraduationCap size={24} /> Ingresar Calificación</h2>
                                    <button onClick={() => setShowGradeModal(false)} className="text-white/40 hover:text-white transition-colors"><X size={32} /></button>
                                </div>
                                <div className="p-10 space-y-8">
                                    <p className="text-sm font-bold text-slate-500 italic">Módulo de ingreso rápido en proceso de optimización para tablets.</p>
                                    <button onClick={() => setShowGradeModal(false)} className="w-full py-6 bg-slate-100 text-slate-400 rounded-3xl font-black uppercase text-xs tracking-widest transition-all">Cerrar Ventana</button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Signature PIN Modal */}
                {
                    showSignatureModal && (
                        <div className="fixed inset-0 bg-[#11355a]/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
                            <div className="bg-white rounded-[3.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 p-10 text-center border-b-[12px] border-blue-600">
                                <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
                                    <ShieldCheck size={48} />
                                </div>
                                <h2 className="text-2xl font-black text-[#11355a] uppercase tracking-tighter mb-2">Firma Digital Avanzada</h2>
                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-10 leading-relaxed">
                                    Ingrese su PIN de seguridad docente para validar el cierre legal de este registro pedagógico.
                                </p>

                                <div className="space-y-6">
                                    <input
                                        type="password"
                                        maxLength={4}
                                        value={pin}
                                        onChange={e => setPin(e.target.value)}
                                        className="w-full text-center text-4xl tracking-[1em] font-black py-6 bg-slate-50 border-4 border-slate-100 rounded-[2rem] outline-none focus:border-blue-500 transition-all"
                                        placeholder="****"
                                    />
                                    <div className="flex gap-4">
                                        <button onClick={() => setShowSignatureModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                                        <button
                                            onClick={handleSignLog}
                                            disabled={pin.length < 4}
                                            className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/20 disabled:opacity-50"
                                        >
                                            RECONOCER Y FIRMAR
                                        </button>
                                    </div>
                                </div>
                                <p className="mt-8 text-[8px] font-black text-slate-300 uppercase tracking-tighter">Certificado Digital ID: LCD-CHILE-{tenant?._id?.slice(-8)}</p>
                            </div>
                        </div>
                    )
                }

                {/* Student Detail Modal */}
                {
                    showStudentDetailModal && selectedStudentForDetail && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                            <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
                                <div className="bg-[#11355a] p-8 text-white flex justify-between items-center shrink-0">
                                    <div>
                                        <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                                            <GraduationCap size={24} className="text-blue-300" />
                                            Ficha del Estudiante
                                        </h2>
                                        <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mt-1">Expediente Digital Completo</p>
                                    </div>
                                    <button onClick={() => setShowStudentDetailModal(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"><X size={24} /></button>
                                </div>

                                <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                                    {/* Personal Info */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Información Personal</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-slate-50 rounded-2xl">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase">Nombre Completo</label>
                                                <div className="text-sm font-black text-[#11355a]">{selectedStudentForDetail.nombres} {selectedStudentForDetail.apellidos}</div>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-2xl">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase">RUT</label>
                                                <div className="text-sm font-black text-[#11355a]">{selectedStudentForDetail.rut || 'No Registrado'}</div>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-2xl">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase">Matrícula</label>
                                                <div className="text-sm font-black text-[#11355a]">{selectedStudentForDetail.matricula || 'No Registrada'}</div>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-2xl">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase">Email</label>
                                                <div className="text-sm font-black text-[#11355a] truncate">{selectedStudentForDetail.email}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Apoderado Info */}
                                    {selectedStudentForDetail.guardian && (
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Datos del Apoderado</h3>
                                            <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-[#11355a] uppercase">{selectedStudentForDetail.guardian.nombre} {selectedStudentForDetail.guardian.apellidos}</span>
                                                    <span className="text-[10px] px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-black uppercase">{selectedStudentForDetail.guardian.parentesco || 'Apoderado'}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                                                    <div><span className="font-bold">Tel:</span> {selectedStudentForDetail.guardian.telefono}</div>
                                                    <div><span className="font-bold">Email:</span> {selectedStudentForDetail.guardian.correo}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Quick Stats Placeholder */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-4 bg-emerald-50 rounded-2xl text-center border border-emerald-100">
                                            <div className="text-2xl font-black text-emerald-600">95%</div>
                                            <div className="text-[8px] font-bold text-emerald-400 uppercase">Asistencia</div>
                                        </div>
                                        <div className="p-4 bg-blue-50 rounded-2xl text-center border border-blue-100">
                                            <div className="text-2xl font-black text-blue-600">6.2</div>
                                            <div className="text-[8px] font-bold text-blue-400 uppercase">Promedio</div>
                                        </div>
                                        <div className="p-4 bg-amber-50 rounded-2xl text-center border border-amber-100">
                                            <div className="text-2xl font-black text-amber-600">2</div>
                                            <div className="text-[8px] font-bold text-amber-400 uppercase">Anotaciones</div>
                                        </div>
                                    </div>

                                    <button onClick={() => setShowStudentDetailModal(false)} className="w-full py-4 bg-[#11355a] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">Cerrar Ficha</button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    );
};

export default UnifiedClassBook;
