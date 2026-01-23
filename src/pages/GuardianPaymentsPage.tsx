import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { useTenant } from '../context/TenantContext';
import TenantLogo from '../components/TenantLogo';
import { DollarSign, FileText, Printer, CheckCircle, Clock } from 'lucide-react';

interface Payment {
    _id: string;
        estudianteId: { nombres: string; apellidos: string; rut: string; _id: string };
    concepto: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

interface Student {
    _id: string;
    nombres: string;
    apellidos: string;
    rut: string;
}

const GuardianPaymentsPage = () => {
    const permissions = usePermissions();
    const { tenant } = useTenant();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<string>('');

    useEffect(() => {
        if (permissions.user?.role === 'apoderado') {
            fetchData();
        }
    }, [permissions.user?.role]);

    const fetchData = async () => {
        try {
            // Obtener solo los estudiantes del apoderado logueado
            const [payRes, studRes] = await Promise.all([
                api.get('/payments'),
                api.get(`/apoderados/${permissions.user?._id}/estudiantes`) // Endpoint para obtener estudiantes del apoderado
                    .catch(() => api.get('/estudiantes')) // Fallback si el endpoint específico no existe
            ]);
            
            // Filtrar: solo estudiantes que pertenecen al apoderado
            const myStudents = studRes.data;
            const myStudentIds = myStudents.map((s: any) => s._id);

            // Normalizar estudianteId para que siempre tenga _id
            const normalizedPayments = payRes.data.map((p: any) => {
                if (!p.estudianteId._id && p.estudianteId.rut) {
                    // Buscar el estudiante por rut y asignar el _id si existe
                    const student = myStudents.find((s: any) => s.rut === p.estudianteId.rut);
                    if (student) {
                        return {
                            ...p,
                            estudianteId: {
                                ...p.estudianteId,
                                _id: student._id
                            }
                        };
                    }
                }
                return p;
            });

            // Filtrar pagos: solo los de mis estudiantes
            const myPayments = normalizedPayments.filter((p: any) => myStudentIds.includes(p.estudianteId._id));

            setPayments(myPayments);
            setStudents(myStudents);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handlePayOnline = async (paymentId: string) => {
        try {
            const response = await api.post(`/payments/${paymentId}/checkout`, {});
            if (response.data.checkoutUrl) {
                window.location.href = response.data.checkoutUrl;
            }
        } catch (error) {
            console.error('Error initiating payment:', error);
            alert('Error al iniciar el pago. Por favor intenta más tarde.');
        }
    };
    // Solo apoderados pueden acceder - redirigir si no lo son
    if (permissions.user?.role !== 'apoderado') {
        return <Navigate to="/" replace />;
    }

    const filteredPayments = selectedStudent
        ? payments.filter(p => {
            if (typeof p.estudianteId._id !== 'undefined') {
                return p.estudianteId._id === selectedStudent;
            } else {
                return p.estudianteId.rut === selectedStudent;
            }
        })
        : payments;

    const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const approvedAmount = filteredPayments
        .filter(p => p.status === 'approved')
        .reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = filteredPayments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {tenant?.logo && <TenantLogo size="small" showName={false} />}
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-[#11355a] flex items-center gap-3">
                            <DollarSign size={32} />
                            Mis Pagos y Deudas
                        </h1>
                        <p className="text-gray-500 font-medium">Consulta el estado de tus pagos y realiza nuevos pagos en línea.</p>
                    </div>
                </div>
                <button
                    onClick={handlePrint}
                    className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg whitespace-nowrap"
                >
                    <Printer size={20} />
                    Imprimir
                </button>
            </div>

            {/* Student Filter */}
            {students.length > 1 && (
                <div className="mb-8 p-4 bg-white rounded-xl border-2 border-gray-100">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Seleccionar Alumno</label>
                    <select
                        value={selectedStudent}
                        onChange={e => setSelectedStudent(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold"
                    >
                        <option value="">Ver todos los alumnos</option>
                        {students.map(s => (
                            <option key={s._id} value={s._id}>
                                {s.nombres} {s.apellidos}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-2xl shadow-xl border-l-4 border-blue-500 p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-gray-500 text-sm font-bold mb-1">TOTAL</p>
                            <p className="text-3xl font-black text-gray-800">${totalAmount.toLocaleString()}</p>
                        </div>
                        <DollarSign size={32} className="text-blue-500 opacity-20" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border-l-4 border-green-500 p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-gray-500 text-sm font-bold mb-1">PAGADO</p>
                            <p className="text-3xl font-black text-green-600">${approvedAmount.toLocaleString()}</p>
                        </div>
                        <CheckCircle size={32} className="text-green-500 opacity-20" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border-l-4 border-orange-500 p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-gray-500 text-sm font-bold mb-1">DEUDA</p>
                            <p className="text-3xl font-black text-orange-600">${pendingAmount.toLocaleString()}</p>
                        </div>
                        <Clock size={32} className="text-orange-500 opacity-20" />
                    </div>
                </div>
            </div>

            {/* Payments Table */}
            {!loading ? (
                filteredPayments.length > 0 ? (
                    <>
                    {/* Tabla para desktop */}
                    <div className="hidden md:block bg-white rounded-2xl shadow-xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-[#11355a] text-white">
                                <tr>
                                    <th className="px-6 py-4 text-left font-bold">Estudiante</th>
                                    <th className="px-6 py-4 text-left font-bold">Concepto</th>
                                    <th className="px-6 py-4 text-right font-bold">Monto</th>
                                    <th className="px-6 py-4 text-center font-bold">Estado</th>
                                    <th className="px-6 py-4 text-left font-bold">Fecha</th>
                                    <th className="px-6 py-4 text-center font-bold">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPayments.map((payment, idx) => (
                                    <tr
                                        key={payment._id}
                                        className={`border-b last:border-b-0 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-800">{payment.estudianteId.nombres}</div>
                                            <div className="text-xs text-gray-500">{payment.estudianteId.rut}</div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-700">{payment.concepto}</td>
                                        <td className="px-6 py-4 text-right font-black text-gray-800">${payment.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            {payment.status === 'approved' && (
                                                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">✓ Pagado</span>
                                            )}
                                            {payment.status === 'pending' && (
                                                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold">⏱ Pendiente</span>
                                            )}
                                            {payment.status === 'rejected' && (
                                                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold">✕ Rechazado</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(payment.createdAt).toLocaleDateString('es-CL')}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {payment.status === 'pending' && (
                                                <button
                                                    onClick={() => handlePayOnline(payment._id)}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all"
                                                >
                                                    Pagar
                                                </button>
                                            )}
                                            {payment.status === 'approved' && (
                                                <span className="text-green-600 font-bold text-xs">Pagado</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Cards para mobile */}
                    <div className="md:hidden space-y-3">
                        {filteredPayments.map((payment) => (
                            <div key={payment._id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                                <div className="mb-3">
                                    <p className="font-bold text-gray-900">{payment.estudianteId.nombres}</p>
                                    <p className="text-xs text-gray-500">{payment.estudianteId.rut}</p>
                                </div>
                                <div className="mb-3">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Concepto</p>
                                    <p className="font-bold text-gray-900">{payment.concepto}</p>
                                </div>
                                <div className="mb-3 grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Monto</p>
                                        <p className="font-black text-gray-800">${payment.amount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Fecha</p>
                                        <p className="text-sm text-gray-600">{new Date(payment.createdAt).toLocaleDateString('es-CL')}</p>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    {payment.status === 'approved' && (
                                        <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">✓ Pagado</span>
                                    )}
                                    {payment.status === 'pending' && (
                                        <span className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold">⏱ Pendiente</span>
                                    )}
                                    {payment.status === 'rejected' && (
                                        <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold">✕ Rechazado</span>
                                    )}
                                </div>
                                {payment.status === 'pending' && (
                                    <button
                                        onClick={() => handlePayOnline(payment._id)}
                                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all"
                                    >
                                        Pagar Ahora
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    </>
                ) : (
                    <div className="text-center py-12 bg-white rounded-2xl">
                        <FileText size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-bold">No hay registros de pago</p>
                    </div>
                )
            ) : (
                <div className="text-center py-12">Cargando...</div>
            )}

            {/* Print Styles */}
            <style>{`
                @media print {
                    body { background: white; }
                    .p-6, .max-w-7xl, button, [class*="hover:"] { 
                        box-shadow: none !important;
                    }
                    button { display: none !important; }
                }
            `}</style>
        </div>
    );
};

export default GuardianPaymentsPage;
