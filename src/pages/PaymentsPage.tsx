
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { useTenant } from '../context/TenantContext';
import { DollarSign, Search, CreditCard, CheckCircle, Clock, AlertCircle, School } from 'lucide-react';

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
    const permissions = usePermissions();
    const { tenant } = useTenant();
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
                {permissions.user?.role !== 'student' && (
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
                )}
            </div>

            {/* Institutional Fee Reference Card */}
            <div className="bg-gradient-to-r from-[#11355a] to-blue-900 rounded-3xl p-8 mb-8 text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                    <School size={120} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-blue-300 mb-2">Información Institucional</h2>
                        <h3 className="text-3xl font-black mb-1">Arancel Anual {tenant?.academicYear || new Date().getFullYear()}</h3>
                        <p className="text-blue-100/80 font-medium">Este es el valor oficial fijado por la administración para el periodo académico actual.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center min-w-[200px]">
                        <span className="block text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">Valor Anual</span>
                        <span className="text-4xl font-black text-emerald-400 font-mono tracking-tighter">
                            ${tenant?.annualFee?.toLocaleString() || '0'}
                        </span>
                    </div>
                </div>
            </div>

            {permissions.user?.role !== 'student' && (
                <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border flex items-center gap-2 max-w-md">
                    <Search className="text-gray-400" />
                    <input
                        placeholder="Buscar por estudiante o concepto..."
                        className="flex-1 outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            )}

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
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[999] flex items-center justify-center p-4 md:pl-[300px] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-md shadow-[0_0_80px_rgba(0,0,0,0.3)] border-8 border-white overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="bg-[#11355a] p-10 text-white relative overflow-hidden">
                            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none mb-2">Asignar Cobro</h2>
                            <p className="text-blue-300 font-extrabold uppercase text-[10px] tracking-[0.3em]">FINANZAS Y RECAUDACIÓN</p>
                            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all">✕</button>
                        </div>
                        <form onSubmit={handleAssignPayment} className="p-10 space-y-6 bg-slate-50/30">
                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">ESTUDIANTE DESTINATARIO</label>
                                <select
                                    required
                                    className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-black text-slate-700 appearance-none bg-no-repeat"
                                    value={formData.estudianteId}
                                    onChange={e => setFormData({ ...formData, estudianteId: e.target.value })}
                                >
                                    <option value="">-- Seleccionar --</option>
                                    {students.map(s => (
                                        <option key={s._id} value={s._id}>{s.nombres} {s.apellidos}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">MOTIVO / CONCEPTO DEL COBRO</label>
                                <select
                                    required
                                    className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-black text-slate-700 appearance-none bg-no-repeat"
                                    value={formData.tariffId}
                                    onChange={e => setFormData({ ...formData, tariffId: e.target.value })}
                                >
                                    <option value="">-- Seleccionar --</option>
                                    <optgroup label="Tarifas Especiales">
                                        {tariffs.filter(t => t.active ?? true).map(t => (
                                            <option key={t._id} value={t._id}>{t.name} (${t.amount})</option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>

                            <button type="submit" className="w-full bg-[#11355a] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-blue-900/20 hover:bg-blue-900 transition-all">
                                GENERAR COBRO ELECTRÓNICO
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentsPage;
