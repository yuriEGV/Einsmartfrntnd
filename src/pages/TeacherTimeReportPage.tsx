import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Clock, ShieldCheck, FileText, Search, Printer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import api from '../services/api';

const TeacherTimeReportPage = () => {
    const { user } = useAuth();
    const { tenant } = useTenant();
    const printRef = useRef<HTMLDivElement>(null);
    
    const [reportData, setReportData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [dateFilter, setDateFilter] = useState('month'); // today, week, month, year, custom
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // Set default dates based on filter
        const today = new Date();
        if (dateFilter === 'today') {
            setStartDate(today.toISOString().split('T')[0]);
            setEndDate(today.toISOString().split('T')[0]);
        } else if (dateFilter === 'week') {
            const start = new Date(today);
            start.setDate(today.getDate() - today.getDay() + 1); // Monday
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
            let url = '/reports/teacher-time';
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            
            const res = await api.get(`${url}?${params.toString()}`);
            setReportData(res.data);
        } catch (error) {
            console.error('Error fetching report:', error);
            alert('Error al obtener el reporte.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (startDate && endDate) {
            fetchReport();
        }
    }, [startDate, endDate]);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Reporte de Horas Aula Profesores - ${tenant?.name || 'EinSmart'}`,
    });

    const formatTime = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    const filteredData = reportData.filter(d => 
        (d._id.teacherName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 min-h-screen pb-20 print:p-0 print:max-w-none">
            {/* Header */}
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-8 relative overflow-hidden group print:hidden">
                <div className="flex items-center gap-6 relative z-10">
                    <div className="p-5 bg-gradient-to-br from-indigo-900 to-blue-600 text-white rounded-[2.5rem] shadow-2xl transition-transform group-hover:rotate-3">
                        <Clock size={40} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-[#11355a] tracking-tighter uppercase leading-none">Horas Aula Profesores</h1>
                        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mt-3 flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 w-fit">
                            <ShieldCheck size={12} className="text-emerald-500" />
                            Reporte Directivo Oficial
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap flex-col sm:flex-row items-center gap-4 relative z-10 bg-slate-50 p-2 rounded-[2rem] border border-slate-200">
                    <select 
                        value={dateFilter} 
                        onChange={e => setDateFilter(e.target.value)}
                        className="bg-white px-6 py-4 rounded-xl font-black text-slate-700 text-xs shadow-sm border border-slate-100 outline-none focus:border-blue-500 transition-colors"
                    >
                        <option value="today">Hoy</option>
                        <option value="week">Esta Semana</option>
                        <option value="month">Este Mes</option>
                        <option value="year">Este Año</option>
                        <option value="custom">Personalizado</option>
                    </select>

                    {dateFilter === 'custom' && (
                        <div className="flex items-center gap-2">
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="bg-white px-4 py-3 rounded-xl font-bold text-slate-600 text-xs border border-slate-100 shadow-sm outline-none w-[130px]"
                            />
                            <span className="text-slate-400 font-black text-[10px] uppercase">a</span>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="bg-white px-4 py-3 rounded-xl font-bold text-slate-600 text-xs border border-slate-100 shadow-sm outline-none w-[130px]"
                            />
                        </div>
                    )}

                    <button 
                        onClick={() => fetchReport()}
                        className="p-4 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-colors shadow-sm"
                        title="Actualizar Datos"
                    >
                        <Search size={18} />
                    </button>
                    <button 
                        onClick={() => handlePrint()}
                        className="flex items-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md"
                    >
                        <Printer size={16} /> Exportar PDF
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 relative group overflow-hidden">
                <div ref={printRef} className="p-8 min-h-[500px]">
                    {/* Formato de Impresión Print Header */}
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

                    <div className="flex justify-between items-center mb-8 print:hidden">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text"
                                placeholder="Buscar Profesor..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
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
                        <div className="space-y-6">
                            {filteredData.map((profesor: any, idx) => (
                                <div key={idx} className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 hover:border-blue-200 transition-colors shadow-sm break-inside-avoid">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4 mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center font-black text-[#11355a] text-lg uppercase print:border-slate-300">
                                                {profesor._id.teacherName ? profesor._id.teacherName[0] : 'U'}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{profesor._id.teacherName || 'Usuario Desconocido'}</h3>
                                                <p className="text-xs font-bold text-slate-400 tracking-wider">Profesor Titular/Básico</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-center bg-white px-4 py-2 rounded-xl border border-slate-100 print:bg-transparent print:border-none print:text-left print:p-0">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Clases Impartidas</p>
                                                <p className="text-xl font-black text-slate-700">{profesor.totalClasesAllCourses}</p>
                                            </div>
                                            <div className="text-center bg-blue-50 px-6 py-2 rounded-xl border-2 border-blue-100 print:bg-transparent print:border-none print:text-left print:p-0">
                                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Aula Efectiva Total</p>
                                                <p className="text-xl font-black text-blue-700">{formatTime(profesor.totalMinutosAllCourses || 0)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {profesor.courses.map((cur: any, cidx: number) => (
                                            <div key={cidx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center print:border-slate-300">
                                                <div>
                                                    <p className="text-xs font-black text-slate-700">{cur.courseName || 'Curso N/A'}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 mt-1">{cur.clases} sesiones</p>
                                                </div>
                                                <div className="bg-slate-50 px-3 py-1 rounded-lg text-xs font-black text-slate-600 border border-slate-200">
                                                    {formatTime(cur.minutos || 0)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Footer Oficial para Firma - Solo Visible en Impresión */}
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
