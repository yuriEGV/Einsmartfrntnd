import { useState, useEffect } from 'react';
import expenseService from '../services/expenseService';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Plus,
    FileText,
    PieChart,
    AlertCircle,
    Users,
    Calendar,
    Award
} from 'lucide-react';
import api from '../services/api';

const SostenedorDashboard = () => {
    // const permissions = usePermissions(); // Unused
    // const { tenant } = useTenant(); // Unused
    const [expenses, setExpenses] = useState<any[]>([]);
    const [debtStats, setDebtStats] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    // const [loading, setLoading] = useState(true); // Unused for now or we should use it? It is being set but not read.

    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'Mantenimiento',
        date: new Date().toISOString().split('T')[0],
        type: 'Normal'
    });
    const [authorityStats, setAuthorityStats] = useState<any>(null);
    const [classBookMetrics, setClassBookMetrics] = useState<any>(null);

    useEffect(() => {
        fetchData();
        fetchCourses();
        fetchAuthorityStats();
        fetchClassBookMetrics();
    }, []);

    useEffect(() => {
        fetchDebtStats();
    }, [selectedCourse]);

    const fetchData = async () => {
        try {
            const res = await expenseService.getAll();
            setExpenses(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            // setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const res = await api.get('/courses');
            setCourses(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchDebtStats = async () => {
        try {
            const res = await expenseService.getDebtStats(selectedCourse);
            setDebtStats(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchAuthorityStats = async () => {
        try {
            const res = await api.get('/analytics/authority-stats');
            setAuthorityStats(res.data);
        } catch (error) {
            console.error('Error fetching authority stats:', error);
        }
    };

    const fetchClassBookMetrics = async () => {
        try {
            const res = await api.get('/analytics/class-book');
            setClassBookMetrics(res.data);
        } catch (error) {
            console.error('Error fetching class book metrics:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await expenseService.create({
                ...formData,
                amount: Number(formData.amount),
                category: formData.category as any,
                type: formData.type as any
            });
            setModalOpen(false);
            setFormData({
                description: '',
                amount: '',
                category: 'Mantenimiento',
                date: new Date().toISOString().split('T')[0],
                type: 'Normal'
            });
            fetchData();
        } catch (error) {
            alert('Error al guardar gasto');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar gasto?')) return;
        try {
            await expenseService.delete(id);
            fetchData();
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalDebt = debtStats.reduce((acc, curr) => acc + curr.totalDebt, 0);

    return (
        <div className="p-6 md:p-10 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-[#11355a] uppercase tracking-tighter flex items-center gap-3">
                        <TrendingUp size={36} className="text-blue-600" />
                        Finanzas & Gestión
                    </h1>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">Panel de Control Sostenedor</p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-[#11355a] text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-900 transition shadow-xl uppercase text-xs tracking-widest"
                >
                    <Plus size={18} /> Registrar Gasto
                </button>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-[2rem] p-6 text-white shadow-xl shadow-rose-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingDown size={100} />
                    </div>
                    <div className="relative z-10">
                        <p className="font-bold text-rose-100 uppercase tracking-widest text-xs mb-1">Total Gastos (Mes)</p>
                        <h3 className="text-3xl font-black tracking-tight">${totalExpenses.toLocaleString()}</h3>
                        <div className="mt-4 flex gap-2">
                            <span className="bg-white/20 px-2 py-1 rounded-lg text-[10px] font-bold">PME</span>
                            <span className="bg-white/20 px-2 py-1 rounded-lg text-[10px] font-bold">ADECO</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-[#11355a] rounded-[2rem] p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <DollarSign size={100} />
                    </div>
                    <div className="relative z-10">
                        <p className="font-bold text-blue-100 uppercase tracking-widest text-xs mb-1">Deuda Total Estimada</p>
                        <h3 className="text-3xl font-black tracking-tight">${totalDebt.toLocaleString()}</h3>
                        <div className="mt-4 text-xs font-bold text-blue-200">
                            {debtStats[0]?.count || 0} pagos pendientes
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-center items-center text-center">
                    <PieChart size={40} className="text-emerald-500 mb-2" />
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Balance General</p>
                    <p className="text-emerald-600 font-black text-xl">Saludable</p>
                </div>
            </div>

            {/* Academic Stats Section for Authority */}
            {authorityStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Users size={24} /></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matrícula</p>
                            <p className="text-2xl font-black text-slate-800">{authorityStats.studentCount}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Calendar size={24} /></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asistencia Global</p>
                            <p className="text-2xl font-black text-emerald-600">{authorityStats.globalAttendanceRate}%</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Award size={24} /></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Promedio General</p>
                            <p className="text-2xl font-black text-amber-600">{authorityStats.globalGradeAverage}</p>
                        </div>
                    </div>
                    <div className="bg-[#11355a] p-6 rounded-3xl shadow-xl flex items-center gap-4 text-white">
                        <div className="p-4 bg-white/10 rounded-2xl"><TrendingUp size={24} /></div>
                        <div>
                            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Proyección</p>
                            <p className="text-xl font-black text-white italic">Positiva</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-[400px]">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-blue-500" />
                        Evolución de Asistencia
                    </h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[
                                { name: 'Mar', valor: 85 }, { name: 'Abr', valor: 88 }, { name: 'May', valor: 87 },
                                { name: 'Jun', valor: 90 }, { name: 'Jul', valor: 82 }, { name: 'Ago', valor: 91 },
                                { name: 'Sep', valor: 93 }
                            ]}>
                                <defs>
                                    <linearGradient id="colorAsistencia" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#11355a" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#11355a" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#11355a' }}
                                />
                                <Area type="monotone" dataKey="valor" stroke="#11355a" strokeWidth={3} fillOpacity={1} fill="url(#colorAsistencia)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-[400px]">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-2">
                        <Award size={20} className="text-amber-500" />
                        Distribución de Rendimiento
                    </h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { range: '1.0 - 3.9', count: 15, fill: '#f43f5e' },
                                { range: '4.0 - 4.9', count: 45, fill: '#f59e0b' },
                                { range: '5.0 - 5.9', count: 120, fill: '#10b981' },
                                { range: '6.0 - 7.0', count: 80, fill: '#3b82f6' },
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} dy={10} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '16px' }} />
                                <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            {/* Eficiencia de Aula (Aula Efectiva) */}
            {classBookMetrics && (
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                            <Calendar size={20} className="text-blue-500" />
                            Eficiencia de Aula (Aula Efectiva) - Vista Mensual
                        </h3>
                        <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">
                            Cobertura Global: {classBookMetrics.globalCoverage}%
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-slate-50">
                                    <th className="pb-6 pr-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asignatura / Bloque</th>
                                    <th className="pb-6 px-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Bloque 1</th>
                                    <th className="pb-6 px-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Bloque 2</th>
                                    <th className="pb-6 px-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Bloque 3</th>
                                    <th className="pb-6 px-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Bloque 4</th>
                                    <th className="pb-6 px-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Efectivo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {Array.from(new Set(classBookMetrics.classTimeMetrics.map((m: any) => m.subjectName))).map((subject: any) => {
                                    const subjectData = classBookMetrics.classTimeMetrics.filter((m: any) => m.subjectName === subject);
                                    const totalSubjectDuration = subjectData.reduce((acc: number, curr: any) => acc + curr.totalDuration, 0);

                                    return (
                                        <tr key={subject} className="hover:bg-slate-50/50 transition-all">
                                            <td className="py-6 pr-4 font-black text-[#11355a] text-sm uppercase">{subject}</td>
                                            {[1, 2, 3, 4].map(blockNum => {
                                                const blockKey = `Bloque ${blockNum}`;
                                                const blockData = subjectData.filter((m: any) => m.bloqueHorario === blockKey);
                                                const duration = blockData.reduce((acc: number, curr: any) => acc + curr.totalDuration, 0);

                                                return (
                                                    <td key={blockNum} className="py-6 px-4 text-center">
                                                        {duration > 0 ? (
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className="text-sm font-black text-blue-600">{duration}m</span>
                                                                <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-blue-500"
                                                                        style={{ width: `${Math.min(100, (duration / 45) * 100)}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-200 text-xs font-bold">-</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className="py-6 px-4 text-center">
                                                <div className="text-lg font-black text-[#11355a]">{totalSubjectDuration}m</div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tiempo Efectivo Registrado</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Debt Analysis */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        <AlertCircle size={20} className="text-amber-500" />
                        Deuda por Curso
                    </h3>
                    <select
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-xs font-bold text-slate-600 outline-none focus:border-blue-500"
                        value={selectedCourse}
                        onChange={e => setSelectedCourse(e.target.value)}
                    >
                        <option value="">Vista General</option>
                        {courses.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-4">
                    {debtStats.map((stat, idx) => (
                        <div key={idx} className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center group hover:bg-slate-100 transition-colors">
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Moneda</p>
                                <p className="font-black text-lg text-slate-700">{stat._id}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Monto Pendiente</p>
                                <p className="font-black text-lg text-rose-500">${stat.totalDebt.toLocaleString()}</p>
                            </div>
                            <div className="bg-rose-100 px-3 py-1 rounded-lg">
                                <span className="text-xs font-black text-rose-600">{stat.overdueCount} vencidos</span>
                            </div>
                        </div>
                    ))}
                    {debtStats.length === 0 && (
                        <p className="text-center text-slate-400 font-bold text-sm py-10">No hay deuda registrada para el filtro seleccionado.</p>
                    )}
                </div>
            </div>

            {/* Expenses List */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-2">
                    <FileText size={20} className="text-slate-400" />
                    Registro de Gastos
                </h3>

                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {expenses.map(expense => (
                        <div key={expense._id} className="flex justify-between items-center p-4 border border-slate-100 rounded-2xl hover:shadow-md transition-all group">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white
                                        ${expense.category === 'PME' ? 'bg-indigo-500' :
                                        expense.category === 'ADECO' ? 'bg-purple-500' : 'bg-slate-400'}`}>
                                    <DollarSign size={18} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-700 leading-tight">{expense.description}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{expense.category} • {new Date(expense.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-slate-800">${expense.amount.toLocaleString()}</p>
                                <button onClick={() => handleDelete(expense._id)} className="text-xs text-rose-400 hover:text-rose-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Eliminar</button>
                            </div>
                        </div>
                    ))}
                    {expenses.length === 0 && (
                        <p className="text-center text-slate-400 font-bold text-sm py-10">No hay gastos registrados.</p>
                    )}
                </div>
            </div>
            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
                        <h2 className="text-2xl font-black text-[#11355a] mb-6">Nuevo Gasto</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Descripción</label>
                                <input required className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 ring-blue-500"
                                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-1">Monto</label>
                                    <input type="number" required className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 ring-blue-500"
                                        value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-1">Fecha</label>
                                    <input type="date" required className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 ring-blue-500"
                                        value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Categoría</label>
                                <select className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 ring-blue-500"
                                    value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option value="Mantenimiento">Mantenimiento</option>
                                    <option value="Recursos Humanos">Recursos Humanos</option>
                                    <option value="Servicios Básicos">Servicios Básicos</option>
                                    <option value="PME">PME</option>
                                    <option value="ADECO">ADECO</option>
                                    <option value="Otros">Otros</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Tipo de Fondo</label>
                                <select className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 ring-blue-500"
                                    value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="Normal">Normal</option>
                                    <option value="PME">PME</option>
                                    <option value="ADECO">ADECO</option>
                                </select>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-50">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-[#11355a] text-white rounded-xl font-bold shadow-lg hover:bg-blue-900">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SostenedorDashboard;
