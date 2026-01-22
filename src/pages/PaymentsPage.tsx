
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { DollarSign, Search, CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Payment {
    _id: string;
    estudianteId: { nombres: string; apellidos: string; rut: string };
    concepto: string; // From Tariff name
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    providerPaymentId?: string;
    createdAt: string;
}

interface Student {
    _id: string;
    nombres: string;
    apellidos: string;
    rut: string;
}

interface Tariff {
    _id: string;
    name: string;
    amount: number;
    active?: boolean;
}

const PaymentsPage = () => {
    // const { isSostenedor, isSuperAdmin, canManagePayments } = usePermissions();
    usePermissions();
    // Assuming PaymentsPage is visible to Admin/Sostenedor/Parents(future).
    // For now manage payments (assigning debts or paying).

    const [payments, setPayments] = useState<Payment[]>([]); // History
    const [students, setStudents] = useState<Student[]>([]);
    const [tariffs, setTariffs] = useState<Tariff[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Create Payment (Assign Debt)
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        estudianteId: '',
        tariffId: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [payRes, studRes, tarRes] = await Promise.all([
                api.get('/payments'), // List assigned payments/debts
                api.get('/estudiantes'),
                api.get('/tariffs')
            ]);
            setPayments(payRes.data);
            setStudents(studRes.data);
            setTariffs(tarRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // This creates a pending payment (debt)
            await api.post('/payments', {
                ...formData,
                provider: 'manual' // Just creating the record first
            });
            setShowModal(false);
            fetchData();
            alert('Cobro asignado correctamente');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al asignar cobro');
        }
    };

    const handlePayOnline = async (_paymentId: string) => {
        // This triggers MP checkout flow
        // In a real app we would redirect to MP URL returned by backend
        try {
            // Find payment details to retry/initiate
            // Re-calling create or dedicated pay endpoint?
            // Since we already have the ID, we might need an endpoint like POST /payments/:id/checkout
            // For now, let's assume we create a NEW intent or use existing.
            // Simpler: Just allow paying assigned debts.

            // NOT IMPLEMENTED: The backend 'createPayment' creates and returns checkout info immediately.
            // If we are listing existing pending payments, we need a way to "resume" or "pay" them.
            // For this MVP, let's assume we Create & Pay in one step or we just show the link if available.

            alert("Funcionalidad de pago directo desde lista en desarrollo. Por favor genere el cobro nuevamente con opción MercadoPago.");
        } catch (error) {
            console.error(error);
        }
    };

    // Filter
    const filteredPayments = payments.filter(p =>
        (p.estudianteId?.nombres + ' ' + p.estudianteId?.apellidos).toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.concepto?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-[#11355a] flex items-center gap-3">
                        <DollarSign size={32} />
                        Pagos y Cobranza
                    </h1>
                    <p className="text-gray-500 font-medium">Registro de pagos y deudas estudiantiles.</p>
                </div>
                <button
                    onClick={() => {
                        setFormData({ estudianteId: '', tariffId: '' });
                        setShowModal(true);
                    }}
                    className="bg-[#11355a] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20"
                >
                    <CreditCard size={20} />
                    Asignar Cobro
                </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border flex items-center gap-2 max-w-md">
                <Search className="text-gray-400" />
                <input
                    placeholder="Buscar por estudiante o concepto..."
                    className="flex-1 outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#11355a]"></div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Estudiante</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Concepto</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Monto</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {filteredPayments.map(p => (
                                <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-gray-800">
                                            {p.estudianteId?.nombres} {p.estudianteId?.apellidos}
                                        </div>
                                        <div className="text-xs text-gray-400">{p.estudianteId?.rut}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-700">{p.concepto}</td>
                                    <td className="px-6 py-4 text-center font-bold text-[#11355a]">${p.amount?.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center">
                                        {p.status === 'approved' && <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold"><CheckCircle size={14} /> PAGADO</span>}
                                        {p.status === 'pending' && <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold"><Clock size={14} /> PENDIENTE</span>}
                                        {p.status === 'rejected' && <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold"><AlertCircle size={14} /> RECHAZADO</span>}
                                    </td>
                                    <td className="px-6 py-4 text-center text-xs text-gray-500">
                                        {new Date(p.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {p.status === 'pending' && (
                                            <button onClick={() => handlePayOnline(p._id)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700 transition-colors">
                                                Pagar Online
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredPayments.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">No hay registros de pagos.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Assign Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="bg-[#11355a] p-6 text-white flex justify-between items-center">
                            <h2 className="text-xl font-bold">Asignar Cobro a Estudiante</h2>
                            <button onClick={() => setShowModal(false)} className="text-white/60 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleAssignPayment} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Estudiante</label>
                                <select
                                    required
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                    value={formData.estudianteId}
                                    onChange={e => setFormData({ ...formData, estudianteId: e.target.value })}
                                >
                                    <option value="">-- Seleccionar --</option>
                                    {students.map(s => (
                                        <option key={s._id} value={s._id}>{s.nombres} {s.apellidos}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Tarifa / Concepto</label>
                                <select
                                    required
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                    value={formData.tariffId}
                                    onChange={e => setFormData({ ...formData, tariffId: e.target.value })}
                                >
                                    <option value="">-- Seleccionar --</option>
                                    {tariffs.filter(t => t.active ?? true).map(t => (
                                        <option key={t._id} value={t._id}>{t.name} (${t.amount})</option>
                                    ))}
                                </select>
                            </div>

                            <button type="submit" className="w-full bg-[#11355a] text-white py-3 rounded-xl font-bold mt-4 hover:bg-blue-800 transition-colors">
                                Generar Cobro
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentsPage;
