import { useState, useEffect } from 'react';
import expenseService from '../services/expenseService';
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

    useEffect(() => {
        fetchData();
        fetchCourses();
        fetchAuthorityStats();
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
