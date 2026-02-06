
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { useTenant } from '../context/TenantContext';
import { DollarSign, Plus, Trash2, Edit, CreditCard } from 'lucide-react';

interface Tariff {
    _id: string;
    name: string;
    description?: string;
    amount: number;
    currency: string;
    active: boolean;
}

const TariffsPage = () => {
    const { isSostenedor, isSuperAdmin, canManagePayments } = usePermissions();
    const { tenant } = useTenant();
    const canManage = isSostenedor || isSuperAdmin || canManagePayments; // Or restricted to Sostenedor usually

    if (tenant && tenant.paymentType !== 'paid') {
        return <Navigate to="/" replace />;
    }

    const [tariffs, setTariffs] = useState<Tariff[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState<{
        _id: string;
        name: string;
        description: string;
        amount: number;
        currency: string;
        active: boolean;
    }>({
        _id: '',
        name: '',
        description: '',
        amount: 0,
        currency: 'CLP',
        active: true
    });

    const [showBulkModal, setShowBulkModal] = useState(false);
    const [courses, setCourses] = useState<any[]>([]);
    const [bulkData, setBulkData] = useState({
        courseId: '',
        tariffId: '',
        dueDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchTariffs();
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await api.get('/courses');
            setCourses(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchTariffs = async () => {
        try {
            const response = await api.get('/tariffs');
            setTariffs(response.data);
        } catch (error) {
            console.error('Error fetching tariffs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (modalMode === 'create') {
                const { _id, ...cleanData } = formData;
                await api.post('/tariffs', cleanData);
            } else {
                await api.put(`/tariffs/${formData._id}`, formData);
            }
            setShowModal(false);
            fetchTariffs();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al guardar tarifa');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Eliminar esta tarifa?')) return;
        try {
            await api.delete(`/tariffs/${id}`);
            fetchTariffs();
        } catch (error) {
            console.error(error);
        }
    };

    const handleBulkAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bulkData.courseId || !bulkData.tariffId) return;

        setLoading(true);
        try {
            const res = await api.post('/payments/bulk-assign', bulkData);
            alert(res.data.message);
            setShowBulkModal(false);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error en asignación masiva');
        } finally {
            setLoading(false);
        }
    };

    if (!canManage) {
        return <div className="p-8 text-center text-gray-500">No tienes permisos para gestionar tarifas.</div>;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-[#11355a] flex items-center gap-3">
                        <DollarSign size={32} />
                        Gestión de Tarifas y Aranceles
                    </h1>
                    <p className="text-gray-500 font-medium">Define los cobros del establecimiento (Matrícula, Mensualidad, etc.)</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            setBulkData({ ...bulkData, tariffId: tariffs[0]?._id || '' });
                            setShowBulkModal(true);
                        }}
                        className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10"
                    >
                        Asignar a Curso
                    </button>
                    <button
                        onClick={() => {
                            setModalMode('create');
                            setFormData({ _id: '', name: '', description: '', amount: 0, currency: 'CLP', active: true });
                            setShowModal(true);
                        }}
                        className="bg-[#11355a] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20"
                    >
                        <Plus size={20} />
                        Nueva Tarifa
                    </button>
                </div>
            </div>

            {loading && tariffs.length === 0 ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#11355a]"></div>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {tariffs.map(tariff => (
                        <div key={tariff._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                                    <CreditCard size={24} />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => {
                                        setModalMode('edit');
                                        setFormData({ ...tariff, description: tariff.description || '' });
                                        setShowModal(true);
                                    }} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(tariff._id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-800 mb-1">{tariff.name}</h3>
                            <p className="text-sm text-gray-500 mb-4 h-10 overflow-hidden">{tariff.description || 'Sin descripción'}</p>

                            <div className="flex items-end justify-between border-t pts-4 mt-auto">
                                <div>
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Valor</div>
                                    <div className="text-2xl font-black text-[#11355a]">
                                        ${tariff.amount.toLocaleString()} <span className="text-xs font-bold text-gray-400">{tariff.currency}</span>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${tariff.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {tariff.active ? 'ACTIVA' : 'INACTIVA'}
                                </div>
                            </div>
                        </div>
                    ))}
                    {tariffs.length === 0 && !loading && (
                        <div className="col-span-full p-12 text-center text-gray-400 font-medium bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            No hay tarifas configuradas. Crea una para comenzar a recibir pagos.
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[999] flex items-center justify-center p-4 md:pl-[300px] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-md shadow-[0_0_80px_rgba(0,0,0,0.3)] border-8 border-white overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="bg-[#11355a] p-10 text-white relative overflow-hidden">
                            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none mb-2">
                                {modalMode === 'create' ? 'Nueva Tarifa' : 'Costo del Servicio'}
                            </h2>
                            <p className="text-blue-300 font-extrabold uppercase text-[10px] tracking-[0.3em]">GESTIÓN DE ARANCELES</p>
                            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all">✕</button>
                        </div>
                        <form onSubmit={handleSave} className="p-10 space-y-6 bg-slate-50/30">
                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">NOMBRE DE LA TARIFA</label>
                                <input
                                    required
                                    placeholder="Ej: Mensualidad Marzo 2026"
                                    className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-black text-slate-700"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">VALOR MONETARIO ($)</label>
                                <input
                                    required
                                    type="number"
                                    className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-black text-slate-700"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none h-24 resize-none"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="active"
                                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                                    checked={formData.active}
                                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                />
                                <label htmlFor="active" className="text-sm font-bold text-gray-700">Tarifa Activa</label>
                            </div>

                            <button type="submit" className="w-full bg-[#11355a] text-white py-3 rounded-xl font-bold mt-4 hover:bg-blue-800 transition-colors">
                                Guardar Tarifa
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Assign Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Asignar Cobro a Curso</h2>
                            <button onClick={() => setShowBulkModal(false)} className="text-white/60 hover:text-white font-bold">✕</button>
                        </div>
                        <form onSubmit={handleBulkAssign} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Seleccionar Tarifa</label>
                                <select
                                    required
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none font-bold"
                                    value={bulkData.tariffId}
                                    onChange={e => setBulkData({ ...bulkData, tariffId: e.target.value })}
                                >
                                    <option value="">Seleccione una tarifa...</option>
                                    {tariffs.map(t => (
                                        <option key={t._id} value={t._id}>{t.name} (${t.amount.toLocaleString()})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Curso Destino</label>
                                <select
                                    required
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none font-bold"
                                    value={bulkData.courseId}
                                    onChange={e => setBulkData({ ...bulkData, courseId: e.target.value })}
                                >
                                    <option value="">Seleccione un curso...</option>
                                    {courses.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Fecha de Vencimiento</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none font-bold"
                                    value={bulkData.dueDate}
                                    onChange={e => setBulkData({ ...bulkData, dueDate: e.target.value })}
                                />
                            </div>

                            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 mt-4">
                                <p className="text-xs text-emerald-700 font-bold">
                                    Esto generará cobros individuales para todos los alumnos matriculados en el curso seleccionado.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black mt-2 hover:bg-emerald-700 transition-colors shadow-lg active:scale-95 disabled:bg-gray-300"
                            >
                                {loading ? 'PROCESANDO...' : 'CONFIRMAR ASIGNACIÓN MASIVA'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TariffsPage;
