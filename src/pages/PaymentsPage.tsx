import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { useTenant } from '../context/TenantContext';
import TenantLogo from '../components/TenantLogo';
import { DollarSign, Search, CreditCard, CheckCircle, Clock, AlertCircle, School } from 'lucide-react';

interface Payment {
    _id: string;
    estudianteId: { nombres: string; apellidos: string; rut: string };
    concepto: string;
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

const mockTariffs: Tariff[] = [
    { _id: '1', name: 'Matrícula', amount: 150000, active: true },
    { _id: '2', name: 'Mensualidad Enero', amount: 250000, active: true },
    { _id: '3', name: 'Mensualidad Febrero', amount: 250000, active: true },
    { _id: '4', name: 'Mensualidad Marzo', amount: 250000, active: true },
    { _id: '5', name: 'Mensualidad Abril', amount: 250000, active: true },
    { _id: '6', name: 'Mensualidad Mayo', amount: 250000, active: true },
    { _id: '7', name: 'Mensualidad Junio', amount: 250000, active: true },
    { _id: '8', name: 'Mensualidad Julio', amount: 250000, active: true },
    { _id: '9', name: 'Mensualidad Agosto', amount: 250000, active: true },
    { _id: '10', name: 'Mensualidad Septiembre', amount: 250000, active: true },
    { _id: '11', name: 'Mensualidad Octubre', amount: 250000, active: true },
    { _id: '12', name: 'Mensualidad Noviembre', amount: 250000, active: true },
    { _id: '13', name: 'Mensualidad Diciembre', amount: 250000, active: true }
];

const PaymentsPage = () => {
    const permissions = usePermissions();
    const { tenant } = useTenant();

    const [payments, setPayments] = useState<Payment[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [tariffs, setTariffs] = useState<Tariff[]>(mockTariffs);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
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
                api.get('/payments'),
                api.get('/estudiantes'),
                api.get('/tariffs')
            ]);
            setPayments(payRes.data);
            setStudents(studRes.data);
            if (tarRes.data && Array.isArray(tarRes.data) && tarRes.data.length > 0) {
                setTariffs(tarRes.data);
            } else {
                setTariffs(mockTariffs);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setTariffs(mockTariffs);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignPayment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const selectedTariff = tariffs.find(t => t._id === formData.tariffId);
            if (!selectedTariff) {
                alert('Por favor selecciona una tarifa válida');
                return;
            }
            
            await api.post('/payments', {
                estudianteId: formData.estudianteId,
                concepto: selectedTariff.name,
                amount: selectedTariff.amount,
                provider: 'manual'
            });
            setShowModal(false);
            fetchData();
            alert('Cobro asignado correctamente');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al asignar cobro');
        }
    };

    const handlePayOnline = async (_paymentId: string) => {
        try {
            alert("Funcionalidad de pago directo desde lista en desarrollo. Por favor genere el cobro nuevamente con opción MercadoPago.");
        } catch (error) {
            console.error(error);
        }
    };

    const filteredPayments = payments.filter(p =>
        (p.estudianteId?.nombres + ' ' + p.estudianteId?.apellidos).toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.concepto?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            {!permissions.isSostenedor && <Navigate to="/" replace />}
            
            {permissions.isSostenedor && (
            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    {tenant?.logo && <TenantLogo size="small" showName={false} />}
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-[#11355a] flex items-center gap-3">
                            <DollarSign size={32} />
                            Pagos y Cobranza
                        </h1>
                        <p className="text-gray-500 font-medium">Registro de pagos y deudas estudiantiles.</p>
                    </div>
                </div>
                {permissions.user?.role !== 'student' && (
                    <button onClick={() => { setFormData({ estudianteId: '', tariffId: '' }); setShowModal(true); }} className="bg-[#11355a] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20">
                        <CreditCard size={20} />
                        Asignar Cobro
                    </button>
                )}
            </div>

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
            ) : filteredPayments.length > 0 ? (
                <>
                <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                        </tbody>
                    </table>
                </div>

                <div className="md:hidden space-y-3">
                    {filteredPayments.map(p => (
                        <div key={p._id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                            <div className="mb-3">
                                <p className="font-bold text-gray-900">{p.estudianteId?.nombres} {p.estudianteId?.apellidos}</p>
                                <p className="text-xs text-gray-500">{p.estudianteId?.rut}</p>
                            </div>
                            <div className="mb-3 grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Concepto</p>
                                    <p className="font-bold text-gray-900 text-sm">{p.concepto}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Monto</p>
                                    <p className="font-bold text-[#11355a] text-sm">${p.amount?.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="mb-3">
                                {p.status === 'approved' && <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold"><CheckCircle size={14} /> PAGADO</span>}
                                {p.status === 'pending' && <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold"><Clock size={14} /> PENDIENTE</span>}
                                {p.status === 'rejected' && <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold"><AlertCircle size={14} /> RECHAZADO</span>}
                            </div>
                            <p className="text-xs text-gray-500 mb-3">{new Date(p.createdAt).toLocaleDateString()}</p>
                            {p.status === 'pending' && (
                                <button onClick={() => handlePayOnline(p._id)} className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">
                                    Pagar Online
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                </>
            ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                    <AlertCircle size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-bold">No hay registros de pagos.</p>
                </div>
            )}

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
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none font-bold"
                                    value={formData.tariffId}
                                    onChange={e => setFormData({ ...formData, tariffId: e.target.value })}
                                >
                                    <option value="">-- Seleccionar Tarifa --</option>
                                    {tariffs && tariffs.length > 0 ? (
                                        tariffs.filter(t => t.active !== false).map(t => (
                                            <option key={t._id} value={t._id}>{t.name} (${t.amount.toLocaleString()})</option>
                                        ))
                                    ) : (
                                        <option disabled>No hay tarifas disponibles</option>
                                    )}
                                </select>
                                {formData.tariffId && (
                                    <p className="text-xs text-green-600 font-bold mt-1">
                                        ✓ Monto: ${tariffs.find(t => t._id === formData.tariffId)?.amount.toLocaleString() || 0}
                                    </p>
                                )}
                            </div>

                            <button type="submit" className="w-full bg-[#11355a] text-white py-3 rounded-xl font-bold mt-4 hover:bg-blue-800 transition-colors">
                                Generar Cobro
                            </button>
                        </form>
                    </div>
                </div>
            )}
            </div>
            )}
        </>
    );
};

export default PaymentsPage;
