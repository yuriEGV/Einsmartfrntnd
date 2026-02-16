import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { useReactToPrint } from 'react-to-print';
import {
    ClipboardList,
    Printer,
    AlertCircle,
    CheckCircle,
    User,
    Calendar,
    ChevronLeft,
    GraduationCap,
    TrendingUp,
    TrendingDown,
    Award
} from 'lucide-react';

const HojaDeVidaPage = () => {
    const [annotations, setAnnotations] = useState<any[]>([]);
    const [stats, setStats] = useState({ positivas: 0, negativas: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const permissions = usePermissions();
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [annRes, statsRes] = await Promise.all([
                api.get('/anotaciones'),
                api.get(`/anotaciones/estudiante/stats/${permissions.user?.profileId || ''}`)
            ]);
            setAnnotations(annRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Error fetching hoja de vida:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `HojaDeVida-${new Date().toLocaleDateString()}`,
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors mb-2 group"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver
                    </button>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <ClipboardList size={36} className="text-rose-600" />
                        Hoja de Vida
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Registro histórico de méritos y seguimiento conductual.</p>
                </div>
                <button
                    onClick={handlePrint}
                    className="bg-white text-slate-700 px-6 py-3 rounded-2xl font-black border border-slate-200 flex items-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
                >
                    <Printer size={20} />
                    Imprimir Reporte
                </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-xl hover:shadow-emerald-500/5 transition-all">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        <TrendingUp size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Anotaciones</p>
                        <p className="text-2xl font-black text-emerald-600 leading-none">Positivas: {stats.positivas}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-xl hover:shadow-rose-500/5 transition-all">
                    <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl group-hover:bg-rose-500 group-hover:text-white transition-all">
                        <TrendingDown size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Anotaciones</p>
                        <p className="text-2xl font-black text-rose-600 leading-none">Negativas: {stats.negativas}</p>
                    </div>
                </div>

                <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl shadow-slate-900/20 flex items-center gap-5 overflow-hidden relative group">
                    <div className="flex-1 relative z-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Registros</p>
                        <p className="text-2xl font-black text-white leading-none">{stats.total}</p>
                    </div>
                    <Award size={64} className="text-white/10 absolute -right-2 top-0 group-hover:scale-125 transition-transform" />
                </div>
            </div>

            {/* Content Table / Grid */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden" ref={printRef}>
                {/* Print Only Header */}
                <div className="hidden print:block p-10 text-center border-b-4 border-slate-900 mb-10">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-left">
                            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">HOJA DE VIDA INSTITUCIONAL</h1>
                            <p className="text-blue-600 font-extrabold text-sm uppercase tracking-widest">EinSmart Academic Management System</p>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-black uppercase text-slate-800">EXPEDIENTE DEL ALUMNO</div>
                            <div className="text-slate-500 font-bold">FECHA REPORTE: {new Date().toLocaleDateString()}</div>
                        </div>
                    </div>
                    {/* Student Info in Print */}
                    <div className="grid grid-cols-2 gap-8 text-left py-6 border-y border-slate-100">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudiante</p>
                            <p className="text-lg font-black text-slate-800">{permissions.user?.name}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Perfil</p>
                            <p className="text-lg font-black text-slate-800 uppercase tracking-tighter">{permissions.user?.role}</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tipo</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Detalle de la Observación</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Responsable</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {annotations.map((ann, idx) => (
                                <tr key={ann._id} className="group hover:bg-slate-50/50 transition-colors animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <td className="px-8 py-6">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider border
                                            ${ann.tipo === 'positiva'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                            {ann.tipo === 'positiva' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                            {ann.tipo}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <h4 className="font-black text-slate-800 uppercase text-sm tracking-tight mb-1">{ann.titulo}</h4>
                                        <p className="text-xs text-slate-500 leading-relaxed max-w-md">{ann.descripcion}</p>
                                        {ann.medidas && (
                                            <div className="mt-2 p-2 bg-slate-50 rounded-lg border-l-2 border-slate-200 italic text-[10px] text-slate-400">
                                                <strong>Medida:</strong> {ann.medidas}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                <User size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{ann.creadoPor?.name || 'Profesor'}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">{ann.creadoPor?.role || 'Docente'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Calendar size={14} />
                                            <span className="text-xs font-bold font-mono uppercase tracking-tighter">
                                                {new Date(ann.fechaOcurrencia).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {annotations.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <Award size={48} className="mx-auto text-slate-100 mb-4" />
                                        <p className="text-slate-300 font-black uppercase text-xs tracking-[0.2em]">Sin registros que mostrar</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Tip */}
            <div className="mt-8 bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 flex items-start gap-4">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                    <GraduationCap size={20} />
                </div>
                <div>
                    <h5 className="font-black text-blue-800 text-sm uppercase tracking-tight">Compromiso Educativo</h5>
                    <p className="text-xs text-blue-600/70 font-medium leading-relaxed mt-1">
                        La hoja de vida es una herramienta pedagógica para el acompañamiento integral. Recuerde que la comunicación constante con los docentes es fundamental para el éxito académico de su pupilo.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HojaDeVidaPage;
