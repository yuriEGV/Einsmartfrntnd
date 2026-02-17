import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useReactToPrint } from 'react-to-print'; // Importar useReactToPrint
import { DollarSign, Printer, PlusCircle, AlertCircle } from 'lucide-react';

interface PayrollPayment {
    _id: string;
    userId: { _id: string; name: string; email: string; role: string };
    amount: number;
    currency: string;
    paymentDate: string;
    period: string;
    concept?: string;
    status: string;
    createdAt: string;
}


const PayrollPage: React.FC = () => {
    const [payments, setPayments] = useState<PayrollPayment[]>([]);
    // const [users, setUsers] = useState<UserData[]>([]); // Unused
    // const [loading, setLoading] = useState(true); // Unused
    const [error, setError] = useState<string | null>(null);
    const [totalAmount, setTotalAmount] = useState<number>(0);
    const { user, isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();


    const componentRef = useRef<HTMLDivElement>(null); // Referencia para el componente a imprimir
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: 'Lista de Pagos de Nómina',
    });

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || !(user?.role === 'admin' || user?.role === 'sostenedor'))) {
            navigate('/login');
            return;
        }

        const fetchPayrollData = async () => {
            try {
                // Obtener pagos de nómina
                let result: any = { payments: [], totalAmount: 0 };
                if (user?.role === 'admin' || user?.role === 'sostenedor') {
                    const response = await api.get(`/payroll?tenantId=${user?.tenantId}`);
                    result = response.data;
                }
                setPayments(result.payments || []);
                setTotalAmount(result.totalAmount || 0);

            } catch (err) {
                console.error('Error fetching payroll data:', err);
                setError('Error al cargar los datos de nómina o usuarios.');
            } finally {
                // setLoading(false);
            }
        };

        if (isAuthenticated && (user?.role === 'admin' || user?.role === 'sostenedor')) {
            fetchPayrollData();
        }
    }, [isAuthenticated, isLoading, user, navigate]);

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este pago de nómina?')) {
            try {
                await api.delete(`/payroll/${id}`);
                setPayments(payments.filter(payment => payment._id !== id));
            } catch (err) {
                console.error('Error deleting payroll payment:', err);
                setError('Error al eliminar el pago de nómina.');
            }
        }
    };

    if (isLoading || !isAuthenticated || !(user?.role === 'admin' || user?.role === 'sostenedor')) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-[#11355a] flex items-center gap-4 tracking-tighter">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-inner">
                            <PlusCircle size={32} />
                        </div>
                        Gestión de Nómina y Haberes
                    </h1>
                    <p className="text-slate-400 font-bold ml-1">Estadísticas y control de pagos a docentes y personal.</p>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <button
                        onClick={() => navigate('/payroll/new')}
                        className="flex-1 md:flex-none bg-[#11355a] text-white px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-blue-900/20 hover:bg-blue-900 transition-all flex items-center justify-center gap-2"
                    >
                        <PlusCircle size={14} /> Registrar Pago
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-1 md:flex-none border-2 border-slate-100 text-slate-600 px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                        <Printer size={14} /> Imprimir Nómina
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-2 border-red-100 text-red-600 px-6 py-4 rounded-2xl font-bold flex items-center gap-3 animate-pulse">
                    <AlertCircle size={20} />
                    {error}
                </div>
            ) || null}

            {/* Resumen Estadístico */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-[#11355a] to-blue-900 p-6 rounded-[2rem] text-white shadow-xl shadow-blue-900/20 relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <DollarSign size={120} />
                    </div>
                    <p className="text-blue-200 text-xs font-black uppercase tracking-[0.2em] mb-1">Total Pagos Nómina</p>
                    <h3 className="text-4xl font-black font-mono tracking-tighter">
                        ${totalAmount.toLocaleString()}
                    </h3>
                    <p className="text-blue-300 text-[10px] font-bold mt-2 uppercase">Periodo: {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-50 shadow-xl shadow-slate-200/50 flex flex-col justify-center">
                    <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-1">N° de Operaciones</p>
                    <h3 className="text-4xl font-black text-slate-800 font-mono tracking-tighter">
                        {payments.length}
                    </h3>
                </div>

                <div className="bg-[#f8fafc] p-6 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center text-center">
                    <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Institución</p>
                        <p className="text-slate-800 font-black uppercase tracking-tighter">{user?.tenantName || 'Sistema Central'}</p>
                    </div>
                </div>
            </div>

            {payments.length === 0 ? (
                <div className="bg-slate-50 rounded-[3rem] p-20 text-center border-4 border-dashed border-slate-100">
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em]">No hay pagos de nómina registrados.</p>
                </div>
            ) : (
                <div ref={componentRef} className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-50 overflow-hidden p-8">
                    <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100 print:mb-4">
                        <h2 className="text-2xl font-black text-[#11355a] uppercase tracking-tighter">Listado Detallado de Haberes</h2>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Total Consolidado</p>
                            <p className="text-xl font-black text-emerald-600 font-mono">${totalAmount.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border-0">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="py-4 px-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                                    <th className="py-4 px-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol</th>
                                    <th className="py-4 px-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
                                    <th className="py-4 px-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Período</th>
                                    <th className="py-4 px-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Pago</th>
                                    <th className="py-4 px-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {payments.map((payment) => (
                                    <tr key={payment._id} className="hover:bg-slate-50/30 transition-colors">
                                        <td className="py-4 px-4">
                                            <div className="font-bold text-slate-800">{payment.userId?.name || payment.userId?._id}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{payment.userId?.email}</div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                {payment.userId?.role}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="font-black text-[#11355a] font-mono tracking-tighter text-lg">
                                                ${payment.amount.toLocaleString()} <span className="text-[10px] text-slate-400 ml-1">{payment.currency}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-slate-600 font-bold">{payment.period}</td>
                                        <td className="py-4 px-4 text-slate-500 font-medium">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                        <td className="py-4 px-4 text-right print:hidden">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/payroll/edit/${payment._id}`)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(payment._id)}
                                                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrollPage;
