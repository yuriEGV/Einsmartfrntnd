import { useState, useEffect } from 'react';
import api from '../services/api';
import { Activity, School, Users, Server, ShieldCheck, Box, Cpu, HardDrive, BarChart3, RefreshCcw } from 'lucide-react';

export default function EinsmartDashboardPage({ stats }: { stats: any }) {
    const [health, setHealth] = useState<any>(null);
    const [trends, setTrends] = useState<any[]>([]);

    useEffect(() => {
        fetchHealth();
        fetchTrends();
        const interval = setInterval(fetchHealth, 30000); // Pool every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchHealth = async () => {
        try {
            const res = await api.get('/analytics/system-health');
            setHealth(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchTrends = async () => {
        try {
            const res = await api.get('/analytics/global-trends');
            setTrends(res.data);
        } catch (e) {
            console.error(e);
        }
    };
    return (
        <div className="space-y-6 md:space-y-10 p-4 md:p-10 animate-in fade-in duration-700 bg-slate-50 min-h-full">
            
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 bg-white md:bg-transparent p-5 md:p-0 rounded-3xl shadow-sm md:shadow-none border md:border-none">
                <div className="space-y-1">
                    <h1 className="text-xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight uppercase">
                        <span className="block md:inline text-emerald-600 opacity-90">Einsmart</span> Overlord
                    </h1>
                    <p className="text-[10px] md:text-sm text-slate-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        Mesa de Control y Topología
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                
                <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 hover:-translate-y-1 transition-all group">
                    <div className="flex items-center justify-between mb-6">
                        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><School size={24} /></div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">Clientes</span>
                    </div>
                    <p className="text-5xl font-black text-slate-800 tracking-tighter">{stats?.tenantCount || 0}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">Colegios en el Nodo</p>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 hover:-translate-y-1 transition-all group">
                    <div className="flex items-center justify-between mb-6">
                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><Users size={24} /></div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">Matrícula</span>
                    </div>
                    <p className="text-5xl font-black text-slate-800 tracking-tighter">{stats?.studentCount?.toLocaleString() || 0}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">Estudiantes Sincronizados</p>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 hover:-translate-y-1 transition-all group">
                    <div className="flex items-center justify-between mb-6">
                        <div className="p-3 bg-purple-50 rounded-2xl text-purple-600"><Box size={24} /></div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">Cursos</span>
                    </div>
                    <p className="text-5xl font-black text-slate-800 tracking-tighter">{stats?.courseCount || 0}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">Cursos Aislados</p>
                </div>

                <div className="bg-slate-900 p-6 md:p-8 rounded-3xl shadow-2xl shadow-slate-900/50 hover:shadow-emerald-900/40 border border-slate-800 hover:-translate-y-1 transition-all group flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-emerald-400"><Server size={24} /></div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest bg-black/20 px-3 py-1 rounded-full border border-emerald-500/20">Uptime</span>
                            <button onClick={fetchHealth} className="p-1 hover:rotate-180 transition-transform duration-500 text-emerald-500/50">
                                <RefreshCcw size={14} />
                            </button>
                        </div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-2xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
                            <ShieldCheck className={health?.system.dbStatus === 'Conectado' ? "text-emerald-400" : "text-rose-400"} size={28} /> 
                            {health?.system.dbStatus === 'Conectado' ? 'Salud Óptima' : 'Alerta de Nodo'}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">
                            Einsmart activo • {health?.system.uptime || 0}h en línea
                        </p>
                    </div>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Health Metrics Card */}
                <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                        <Cpu size={16} className="text-blue-500" /> Rendimiento de Infraestructura
                    </h3>
                    
                    <div className="space-y-8">
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Carga de CPU (1m)</span>
                                <span className="text-sm font-black text-slate-800">{(health?.system.cpuLoad * 10 || 0).toFixed(1)}%</span>
                            </div>
                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500 transition-all duration-1000" 
                                    style={{ width: `${Math.min(health?.system.cpuLoad * 10, 100) || 0}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Uso de Memoria</span>
                                <span className="text-sm font-black text-slate-800">{health?.system.memoryUsage || 0}%</span>
                            </div>
                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-emerald-500 transition-all duration-1000" 
                                    style={{ width: `${health?.system.memoryUsage || 0}%` }}
                                ></div>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                {health?.system.totalMemGB} GB RAM TOTAL
                            </p>
                        </div>

                        <div className="pt-4 border-t border-slate-50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-50 rounded-2xl text-slate-400"><HardDrive size={20} /></div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-800 uppercase leading-none">Status de DB</p>
                                    <p className="text-[9px] font-bold text-emerald-500 uppercase mt-1">Sincronizado & Seguro</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Growth Trends Card */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                        <BarChart3 size={16} className="text-purple-500" /> Censo de Alumnos (Último Año)
                    </h3>
                    
                    <div className="h-[200px] flex items-end justify-between gap-3 px-2">
                        {trends.length > 0 ? trends.map((t, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-3 group">
                                <div className="relative w-full">
                                    <div 
                                        className="w-full bg-slate-100 rounded-t-xl group-hover:bg-purple-100 transition-all duration-500 cursor-help"
                                        style={{ height: `${(t.value / Math.max(...trends.map(x => x.value), 1) * 160) || 10}px` }}
                                    >
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[8px] px-2 py-1 rounded font-black whitespace-nowrap">
                                            {t.value} ALUMNOS
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter rotate-45 origin-left">{t.name}</span>
                            </div>
                        )) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                <BarChart3 size={40} className="mb-2 opacity-20" />
                                <p className="text-[10px] uppercase font-black tracking-widest">Calculando Probabilidades...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Panel de Topología / Salud de Clúster */}

            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-slate-800 font-black uppercase tracking-[0.1em] text-sm flex items-center gap-2">
                        <Activity size={18} className="text-emerald-500" /> Monitoreo de Colegios
                    </h2>
                    <a href="/tenants" className="text-xs font-black text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-xl">Ver Todos</a>
                </div>
                <div className="p-10 text-center py-20 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-50 via-white to-white">
                    <Server size={64} className="text-slate-200 mb-6 drop-shadow-xl" />
                    <h3 className="text-xl font-black text-slate-700 uppercase tracking-tighter mb-2">Cluster Saludable</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-sm leading-relaxed">
                        El aislamiento Múltiple Tenant está activo. Los colegios están operando de forma autónoma con datos blindados. No hay anomalías transaccionales.
                    </p>
                </div>
            </div>

        </div>
    );
}
