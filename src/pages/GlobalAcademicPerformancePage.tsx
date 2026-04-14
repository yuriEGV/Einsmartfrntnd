import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    BarChart3, 
    TrendingUp, 
    Users, 
    AlertTriangle, 
    CheckCircle2, 
    Download, 
    FileText,
    ArrowUpRight,
    Search
} from 'lucide-react';

export default function GlobalAcademicPerformancePage() {
    const [performanceData, setPerformanceData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPerformance();
    }, []);

    const fetchPerformance = async () => {
        try {
            setLoading(true);
            const res = await api.get('/analytics/global-academic');
            setPerformanceData(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = performanceData.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.domain?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const globalAvg = performanceData.length > 0 
        ? (performanceData.reduce((acc, curr) => acc + curr.stats.averageGrade, 0) / performanceData.length).toFixed(2)
        : '0.0';

    const globalAttendance = performanceData.length > 0
        ? (performanceData.reduce((acc, curr) => acc + curr.stats.attendanceRate, 0) / performanceData.length).toFixed(2)
        : '0.0';

    return (
        <div className="space-y-8 p-4 md:p-10 bg-slate-50 min-h-screen animate-in fade-in duration-700">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-3">
                        <BarChart3 className="text-blue-600" size={32} />
                        Rendimiento Académico Global
                    </h1>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Consolidado de Instituciones • Estándares Ministerio de Educación
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest shadow-sm">
                        <Download size={18} /> Exportar Excel
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-slate-800 transition-all uppercase tracking-widest shadow-lg shadow-slate-200">
                        <FileText size={18} /> Reporte Ministerial
                    </button>
                </div>
            </div>

            {/* Global KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><TrendingUp size={24} /></div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">Promedio País (Plataforma)</span>
                    </div>
                    <div>
                        <p className="text-6xl font-black text-slate-800 tracking-tighter">{globalAvg}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <ArrowUpRight size={16} className="text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-500 uppercase">+0.2 vs mes anterior</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><CheckCircle2 size={24} /></div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">Asistencia Promedio</span>
                    </div>
                    <div>
                        <p className="text-6xl font-black text-slate-800 tracking-tighter">{globalAttendance}%</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">Meta Ministerial: 85%</p>
                    </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-[2rem] shadow-2xl shadow-slate-900/20 border border-slate-800 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400"><Users size={24} /></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-black/20 px-3 py-1 rounded-full">Total Matrícula</span>
                    </div>
                    <div className="relative z-10">
                        <p className="text-6xl font-black text-white tracking-tighter">
                            {performanceData.reduce((acc, curr) => acc + curr.stats.studentCount, 0).toLocaleString()}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-tight font-mono">USUARIOS ACTIVOS EN EL CLUSTER</p>
                    </div>
                </div>
            </div>

            {/* Matrix Section */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-transparent overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Matriz de Rendimiento Institucional</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Datos sincronizados en tiempo real
                        </p>
                    </div>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar Institución por nombre o RBD..."
                            className="w-full pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 ring-blue-500/20 transition-all font-bold placeholder:text-slate-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/30">
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Institución</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Matrícula</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Promedio</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Asistencia</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status de Cumplimiento</th>
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-10 py-6"><div className="h-10 bg-slate-100 rounded-xl w-48"></div></td>
                                        <td className="px-6 py-6"><div className="h-10 bg-slate-100 rounded-xl w-12 mx-auto"></div></td>
                                        <td className="px-6 py-6"><div className="h-10 bg-slate-100 rounded-xl w-16 mx-auto"></div></td>
                                        <td className="px-10 py-6 text-right"><div className="h-10 bg-slate-100 rounded-xl w-24 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredData.map((tenant) => (
                                <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black shadow-lg text-lg group-hover:scale-110 transition-transform">
                                                {tenant.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 uppercase text-sm leading-tight">{tenant.name}</p>
                                                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter mt-1">{tenant.domain || 'sin-dominio.cl'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <span className="font-black text-slate-600 text-lg">{tenant.stats.studentCount}</span>
                                        <p className="text-[9px] font-bold text-slate-300 uppercase leading-none mt-1">Alumnos</p>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <span className={`text-xl font-black ${tenant.stats.averageGrade < 4.0 ? 'text-rose-600' : 'text-slate-800'}`}>
                                            {tenant.stats.averageGrade.toFixed(1)}
                                        </span>
                                        <p className="text-[9px] font-bold text-slate-300 uppercase leading-none mt-1">Promedio</p>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className={`font-black text-lg ${tenant.stats.attendanceRate < 85 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                {tenant.stats.attendanceRate}%
                                            </span>
                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-1000 ${tenant.stats.attendanceRate < 85 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${tenant.stats.attendanceRate}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${
                                            tenant.stats.riskProfile === 'Salud Educativa Óptima' 
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                            : 'bg-rose-50 text-rose-700 border-rose-100'
                                        }`}>
                                            {tenant.stats.riskProfile === 'Salud Educativa Óptima' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                                            <span className="text-[9px] font-black uppercase tracking-widest">{tenant.stats.riskProfile}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <button className="p-3 hover:bg-white hover:shadow-lg rounded-xl transition-all text-slate-400 hover:text-blue-600 border border-transparent hover:border-slate-100">
                                            <FileText size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Disclaimer / Info */}
            <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50 flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-2xl text-blue-600"><AlertTriangle size={24} /></div>
                <div>
                    <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight">Nota Legal y Cumplimiento Ministerial</h4>
                    <p className="text-xs text-blue-800/70 mt-1 leading-relaxed max-w-4xl">
                        Esta matriz consolida datos de rendimiento académico bajo los parámetros del **Decreto 67 de Evaluación, Calificación y Promoción Escolar**. 
                        La asistencia se calcula sobre días hábiles registrados. Los promedios son aritméticos y no contemplan ponderaciones específicas de planes de estudio técnicos (TP) a menos que se especifique en el desglose institucional.
                    </p>
                </div>
            </div>

        </div>
    );
}
