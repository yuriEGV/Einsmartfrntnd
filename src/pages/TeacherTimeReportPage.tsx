import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Clock, ShieldCheck, FileText, Search, Printer, ChevronDown, ChevronUp, BookOpen, AlertTriangle, Calendar, MapPin, Target, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import api from '../services/api';

interface SessionAtraso {
    studentName: string;
    minutosAtraso: number;
    bloque: string;
}

interface ClassSession {
    _id: string;
    date: string;
    topic: string;
    activities: string;
    objectives: string[];
    courseName: string;
    courseLetter: string;
    subjectName: string;
    bloqueHorario: string;
    effectiveDuration: number;
    status: string;
    signedAt: string;
    atrasos: SessionAtraso[];
    atrasosCount: number;
}

interface CourseData {
    courseName: string;
    subjectName: string;
    minutos: number;
    horasEfectivas: number;
    clases: number;
}

interface TeacherData {
    _id: { teacherId: string; teacherName: string };
    totalMinutosAllCourses: number;
    totalClasesAllCourses: number;
    horasEfectivasTotal: number;
    courses: CourseData[];
    sessions: ClassSession[];
}

const TeacherTimeReportPage = () => {
    const { user } = useAuth();
    const { tenant } = useTenant();
    const printRef = useRef<HTMLDivElement>(null);
    
    const [reportData, setReportData] = useState<TeacherData[]>([]);
    const [loading, setLoading] = useState(false);
    const [dateFilter, setDateFilter] = useState('month');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedTeachers, setExpandedTeachers] = useState<Set<string>>(new Set());

    useEffect(() => {
        const today = new Date();
        if (dateFilter === 'today') {
            setStartDate(today.toISOString().split('T')[0]);
            setEndDate(today.toISOString().split('T')[0]);
        } else if (dateFilter === 'week') {
            const start = new Date(today);
            start.setDate(today.getDate() - today.getDay() + 1);
            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(today.toISOString().split('T')[0]);
        } else if (dateFilter === 'month') {
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            setStartDate(start.toISOString().split('T')[0]);
            const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            setEndDate(end.toISOString().split('T')[0]);
        } else if (dateFilter === 'year') {
            const start = new Date(today.getFullYear(), 0, 1);
            setStartDate(start.toISOString().split('T')[0]);
            const end = new Date(today.getFullYear(), 11, 31);
            setEndDate(end.toISOString().split('T')[0]);
        }
    }, [dateFilter]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            const res = await api.get(`/reports/teacher-time?${params.toString()}`);
            setReportData(res.data);
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (startDate && endDate) fetchReport();
    }, [startDate, endDate]);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Reporte de Horas Aula Profesores - ${tenant?.name || 'EinSmart'}`,
    });

    const formatTime = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = Math.round(minutes % 60);
        return `${h}h ${m}m`;
    };

    const toggleTeacher = (id: string) => {
        setExpandedTeachers(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const filteredData = reportData.filter(d =>
        (d._id.teacherName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const statusLabel = (s: string) => {
        const map: Record<string, { label: string; color: string; bg: string }> = {
            'realizada': { label: 'Realizada', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
            'interrumpida': { label: 'Interrumpida', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
            'atrasada': { label: 'Con Atraso', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
            'no_realizada': { label: 'No Realizada', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
        };
        return map[s] || { label: s, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' };
    };

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 min-h-screen pb-20 print:p-0 print:max-w-none">
            {/* Header */}
            <div className="bg-white p-6 md:p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-8 relative overflow-hidden group print:hidden">
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-blue-500/5 to-indigo-500/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="p-5 bg-gradient-to-br from-[#11355a] to-[#2563eb] text-white rounded-[2rem] shadow-2xl shadow-blue-900/30 transition-transform group-hover:rotate-3">
                        <Clock size={40} />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-[#11355a] tracking-tighter uppercase leading-none">Horas Aula Profesores</h1>
                        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mt-3 flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 w-fit">
                            <ShieldCheck size={12} className="text-emerald-500" />
                            Reporte Directivo Oficial
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap flex-col sm:flex-row items-center gap-3 relative z-10 bg-slate-50 p-2 rounded-[2rem] border border-slate-200">
                    <select 
                        value={dateFilter} 
                        onChange={e => setDateFilter(e.target.value)}
                        className="bg-white px-5 py-3.5 rounded-xl font-black text-slate-700 text-xs shadow-sm border border-slate-100 outline-none focus:border-blue-500 transition-colors"
                    >
                        <option value="today">Hoy</option>
                        <option value="week">Esta Semana</option>
                        <option value="month">Este Mes</option>
                        <option value="year">Este Año</option>
                        <option value="custom">Personalizado</option>
                    </select>

                    {dateFilter === 'custom' && (
                        <div className="flex items-center gap-2">
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                className="bg-white px-4 py-3 rounded-xl font-bold text-slate-600 text-xs border border-slate-100 shadow-sm outline-none w-[130px]" />
                            <span className="text-slate-400 font-black text-[10px] uppercase">a</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                className="bg-white px-4 py-3 rounded-xl font-bold text-slate-600 text-xs border border-slate-100 shadow-sm outline-none w-[130px]" />
                        </div>
                    )}

                    <button onClick={() => fetchReport()} className="p-3.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-colors shadow-sm" title="Actualizar Datos">
                        <Search size={18} />
                    </button>
                    <button onClick={() => handlePrint()} className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md">
                        <Printer size={16} /> Exportar PDF
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 relative group overflow-hidden">
                <div ref={printRef} className="p-6 md:p-8 min-h-[500px]">
                    {/* Print Header */}
                    <div className="hidden print:block border-b-2 border-[#11355a] pb-6 mb-8 text-[#11355a]">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4 items-center">
                                <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                <div>
                                    <h1 className="text-2xl font-black uppercase tracking-widest">{tenant?.name || 'Institución'}</h1>
                                    <h2 className="text-sm font-bold opacity-80 mt-1 uppercase">Reporte Consolidado Horas Aula DOCENTES</h2>
                                    <span className="inline-block mt-2 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-lg">OFICIAL</span>
                                </div>
                            </div>
                            <div className="text-right text-xs max-w-xs ml-8 hidden sm:block font-bold">
                                <p>RBD: {tenant?.rbd || 'N/A'}</p>
                                <p>Generado por: {user?.name}</p>
                                <p>Fecha Impresión: {new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                <p className="mt-2 pt-2 border-t border-[#11355a]/20">Periodo Reportado: {startDate} - {endDate}</p>
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="flex justify-between items-center mb-8 print:hidden">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" placeholder="Buscar Profesor..."
                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-slate-700 text-sm"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-20 text-slate-400 space-x-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="font-black text-sm uppercase tracking-widest">Cargando datos del periodo...</span>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-3xl mx-10">
                            <FileText size={48} className="mx-auto mb-4 text-slate-200" />
                            No se encontraron registros de aula efectiva <br /> en el periodo seleccionado.
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {filteredData.map((profesor, idx) => {
                                const isExpanded = expandedTeachers.has(profesor._id.teacherId);
                                return (
                                    <div key={idx} className="bg-white rounded-[2rem] border-2 border-slate-100 overflow-hidden shadow-lg hover:shadow-xl transition-all break-inside-avoid print:shadow-none print:border-slate-300">
                                        {/* Teacher Header */}
                                        <div
                                            className="p-6 md:p-8 cursor-pointer hover:bg-slate-50/50 transition-colors print:cursor-default"
                                            onClick={() => toggleTeacher(profesor._id.teacherId)}
                                        >
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 bg-gradient-to-br from-[#11355a] to-[#2563eb] rounded-2xl shadow-lg shadow-blue-900/20 flex items-center justify-center text-white font-black text-xl uppercase">
                                                        {profesor._id.teacherName ? profesor._id.teacherName[0] : 'U'}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{profesor._id.teacherName || 'Usuario Desconocido'}</h3>
                                                        <p className="text-[10px] font-bold text-slate-400 tracking-wider mt-0.5">
                                                            {profesor.courses.length} {profesor.courses.length === 1 ? 'curso asignado' : 'cursos asignados'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 flex-wrap">
                                                    {/* Clases Impartidas */}
                                                    <div className="text-center bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 min-w-[100px]">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Clases</p>
                                                        <p className="text-2xl font-black text-slate-800 tabular-nums">{profesor.totalClasesAllCourses}</p>
                                                    </div>

                                                    {/* Aula Efectiva Total - Beautified */}
                                                    <div className="relative bg-gradient-to-br from-[#11355a] to-[#1e40af] px-6 py-3 rounded-2xl text-white min-w-[140px] overflow-hidden shadow-lg shadow-blue-900/20">
                                                        <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>
                                                        <p className="text-[8px] font-black text-blue-200 uppercase tracking-widest mb-1 relative z-10">Aula Efectiva</p>
                                                        <p className="text-2xl font-black tabular-nums relative z-10 tracking-tight">{formatTime(profesor.totalMinutosAllCourses || 0)}</p>
                                                    </div>

                                                    {/* Expand/Collapse */}
                                                    <button className="p-3 bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-100 text-slate-400 hover:text-blue-600 transition-all print:hidden">
                                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Course Summary Pills */}
                                            <div className="flex flex-wrap gap-3 mt-5">
                                                {profesor.courses.map((cur, cidx) => (
                                                    <div key={cidx} className="flex items-center gap-3 bg-slate-50 pl-4 pr-2 py-2 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                                                        <div>
                                                            <p className="text-[11px] font-black text-slate-700 leading-tight">{cur.courseName}</p>
                                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{cur.subjectName} • {cur.clases} ses.</p>
                                                        </div>
                                                        <div className="bg-white px-3 py-1.5 rounded-lg text-[11px] font-black text-blue-700 border border-blue-100 tabular-nums shadow-sm">
                                                            {formatTime(cur.minutos || 0)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Expanded Sessions Detail */}
                                        {(isExpanded || true) && (
                                            <div className={`border-t-2 border-slate-100 transition-all duration-500 ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden print:max-h-none print:opacity-100'}`}>
                                                <div className="p-6 md:p-8 bg-slate-50/30">
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                                                        <Calendar size={14} className="text-blue-500" />
                                                        Detalle de Sesiones Realizadas ({profesor.sessions?.length || 0})
                                                    </h4>
                                                    
                                                    {(!profesor.sessions || profesor.sessions.length === 0) ? (
                                                        <p className="text-center py-8 text-slate-300 font-bold text-sm uppercase tracking-wider">Sin sesiones detalladas disponibles</p>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            {profesor.sessions.map((session, sidx) => {
                                                                const st = statusLabel(session.status);
                                                                return (
                                                                    <div key={session._id || sidx} className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group/session">
                                                                        {/* Session Header */}
                                                                        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                                                                            <div className="flex items-start gap-4 flex-1">
                                                                                {/* Date Badge */}
                                                                                <div className="flex-shrink-0 w-16 py-3 bg-gradient-to-b from-[#11355a] to-[#1e3a5f] rounded-xl text-center text-white shadow-md">
                                                                                    <div className="text-2xl font-black leading-none">{new Date(session.date).getUTCDate()}</div>
                                                                                    <div className="text-[8px] font-black uppercase tracking-wider mt-1 text-blue-200">{new Date(session.date).toLocaleString('es-CL', { month: 'short', timeZone: 'UTC' }).toUpperCase()}</div>
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    {/* Topic */}
                                                                                    <h5 className="text-sm md:text-base font-black text-[#11355a] tracking-tight leading-snug mb-1.5">
                                                                                        {session.topic || 'Sin tema registrado'}
                                                                                    </h5>
                                                                                    {/* Meta Badges */}
                                                                                    <div className="flex flex-wrap gap-2">
                                                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-[9px] font-black uppercase tracking-wider rounded-lg border border-blue-100">
                                                                                            <BookOpen size={10} /> {session.subjectName}
                                                                                        </span>
                                                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-600 text-[9px] font-black uppercase tracking-wider rounded-lg border border-slate-200">
                                                                                            <MapPin size={10} /> {session.courseName} {session.courseLetter}
                                                                                        </span>
                                                                                        {session.bloqueHorario && (
                                                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 text-violet-600 text-[9px] font-black uppercase tracking-wider rounded-lg border border-violet-100">
                                                                                                <Clock size={10} /> {session.bloqueHorario}
                                                                                            </span>
                                                                                        )}
                                                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border ${st.bg} ${st.color}`}>
                                                                                            {st.label}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Duration Badge */}
                                                                            <div className="flex-shrink-0 text-center">
                                                                                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 px-5 py-3 rounded-xl border border-emerald-200">
                                                                                    <p className="text-[7px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Duración</p>
                                                                                    <p className="text-lg font-black text-emerald-700 tabular-nums tracking-tight">{formatTime(session.effectiveDuration)}</p>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Activities */}
                                                                        {session.activities && (
                                                                            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 mb-3">
                                                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                                                    <Target size={10} className="text-blue-400" /> Actividades Realizadas
                                                                                </p>
                                                                                <p className="text-xs font-bold text-slate-600 leading-relaxed">{session.activities}</p>
                                                                            </div>
                                                                        )}

                                                                        {/* Objectives */}
                                                                        {session.objectives && session.objectives.length > 0 && (
                                                                            <div className="flex flex-wrap gap-1.5 mb-3">
                                                                                {session.objectives.map((obj, oi) => (
                                                                                    <span key={oi} className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-lg border border-indigo-100">
                                                                                        {obj}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        )}

                                                                        {/* Late Students */}
                                                                        {session.atrasosCount > 0 && (
                                                                            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100">
                                                                                <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                                                    <AlertTriangle size={10} /> Alumnos con Atraso ({session.atrasosCount})
                                                                                </p>
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {session.atrasos.map((a, ai) => (
                                                                                        <div key={ai} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-amber-100 shadow-sm">
                                                                                            <User size={10} className="text-amber-500 flex-shrink-0" />
                                                                                            <span className="text-[10px] font-bold text-slate-700">{a.studentName}</span>
                                                                                            <span className="text-[9px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md">{a.minutosAtraso} min</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Signature Info */}
                                                                        {session.signedAt && (
                                                                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                                                                                <ShieldCheck size={12} className="text-emerald-400" />
                                                                                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-wider">
                                                                                    Firma Digital • {new Date(session.signedAt).toLocaleString('es-CL')}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Print Footer */}
                    <div className="hidden print:flex flex-col mt-20 break-inside-avoid px-10">
                        <div className="flex justify-between mb-8 text-[#11355a]">
                            <p className="font-bold text-sm">Resumen Validado por la Dirección y/o Inspectoría General</p>
                        </div>
                        <div className="flex justify-end gap-32">
                            <div className="text-center w-64 border-t-2 border-[#11355a] pt-4 text-[#11355a]">
                                <p className="font-black uppercase tracking-widest text-sm">Director / Inspector</p>
                                <p className="text-xs mt-1">(Firma y Timbre Oficial)</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherTimeReportPage;
