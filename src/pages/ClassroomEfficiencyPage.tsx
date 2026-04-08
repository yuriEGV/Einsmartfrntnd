import { useState, useEffect } from 'react';
import { Clock, TrendingUp, AlertTriangle, CheckCircle2, Search, Printer, User, BookOpen, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import api from '../services/api';

const ClassroomEfficiencyPage = () => {
    const { tenant } = useTenant();
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<any>(null);
    const [dateRange, setDateRange] = useState('month');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/analytics/class-book?range=${dateRange}`);
            setMetrics(res.data);
        } catch (error) {
            console.error('Error fetching efficiency metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, [dateRange]);

    const formatPercent = (val: number) => `${val?.toFixed(1)}%`;

    const filteredTeachers = metrics?.teacherEfficiency?.filter((t: any) => 
        t.teacherName.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header Section */}
            <div className="bg-[#11355a] p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group border border-white/10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] shadow-2xl">
                            <Clock size={42} className="text-blue-300" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Eficiencia en Aula</h1>
                            <p className="text-blue-200/60 font-black text-[10px] uppercase tracking-[0.3em] mt-3">Métrica de Desempeño Docente Consolidada</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-black/20 p-2 rounded-[2rem] border border-white/5">
                        {['week', 'month', 'year'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                    dateRange === range ? 'bg-white text-[#11355a] shadow-xl' : 'text-blue-100 hover:bg-white/5'
                                }`}
                            >
                                {range === 'week' ? 'Semana' : range === 'month' ? 'Mes' : 'Año'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Global Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 group hover:border-blue-500 transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Cobertura Global</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-4xl font-black text-slate-800">{formatPercent(metrics?.globalCoverage || 0)}</h2>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><TrendingUp size={24} /></div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full mt-6 overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${metrics?.globalCoverage || 0}%` }}></div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 hover:border-emerald-500 transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Clases Firmadas</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-4xl font-black text-slate-800">{metrics?.stats?.totalRealized || 0}</h2>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle2 size={24} /></div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-300 mt-4 italic uppercase">Registradas en el Libro Digital</p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 hover:border-rose-500 transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tiempo Perdido</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-4xl font-black text-rose-600">{metrics?.stats?.totalLostGlobal || 0}m</h2>
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><AlertTriangle size={24} /></div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-300 mt-4 italic uppercase">Atrasos e Interrupciones</p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 hover:border-indigo-500 transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Eficiencia Promedio</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-4xl font-black text-slate-800">
                            {formatPercent(metrics?.teacherEfficiency?.reduce((a: any, b: any) => a + b.efficiency, 0) / (metrics?.teacherEfficiency?.length || 1))}
                        </h2>
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><BookOpen size={24} /></div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-300 mt-4 italic uppercase">Realizado vs Perdido</p>
                </div>
            </div>

            {/* Teacher Performance Ranking */}
            <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
                <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h3 className="text-2xl font-black text-[#11355a] tracking-tight uppercase">Ranking de Eficiencia Docente</h3>
                        <p className="text-slate-400 font-bold text-xs mt-1">Comparativa de tiempo efectivo por profesor</p>
                    </div>

                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar docente..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-slate-700 transition-all text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Docente</th>
                                <th className="px-6 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Clases Firmadas</th>
                                <th className="px-6 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiempo Efectivo</th>
                                <th className="px-6 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiempo Perdido</th>
                                <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Eficiencia</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="mt-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">Cargando Ranking...</p>
                                    </td>
                                </tr>
                            ) : filteredTeachers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest italic border-2 border-dashed border-slate-50 rounded-3xl m-10">
                                        <AlertCircle size={48} className="mx-auto mb-4 opacity-30" />
                                        No se encontraron docentes registrados
                                    </td>
                                </tr>
                            ) : (
                                filteredTeachers.map((teacher: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl flex items-center justify-center font-black text-[#11355a] text-lg border border-slate-200 group-hover:scale-110 transition-transform">
                                                    {teacher.teacherName[0]}
                                                </div>
                                                <span className="font-black text-slate-700 text-sm uppercase tracking-tight">{teacher.teacherName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full font-black text-[10px] uppercase">{teacher.signedClasses}</span>
                                        </td>
                                        <td className="px-6 py-6 text-center font-bold text-slate-600 text-sm">{teacher.totalEffectiveMinutes}m</td>
                                        <td className="px-6 py-6 text-center">
                                            <span className={`font-bold text-sm ${teacher.totalLostMinutes > 0 ? 'text-rose-500' : 'text-slate-300'}`}>
                                                {teacher.totalLostMinutes}m
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`text-lg font-black ${
                                                    teacher.efficiency >= 90 ? 'text-emerald-500' : 
                                                    teacher.efficiency >= 70 ? 'text-amber-500' : 'text-rose-500'
                                                }`}>
                                                    {formatPercent(teacher.efficiency)}
                                                </span>
                                                <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full ${
                                                        teacher.efficiency >= 90 ? 'bg-emerald-500' : 
                                                        teacher.efficiency >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                                                    }`} style={{ width: `${teacher.efficiency}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-end gap-4">
                <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-3 px-10 py-5 bg-[#11355a] text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-[#0a233d] transition-all shadow-2xl active:scale-95"
                >
                    <Printer size={18} /> Exportar Reporte PDF
                </button>
            </div>
        </div>
    );
};

export default ClassroomEfficiencyPage;
