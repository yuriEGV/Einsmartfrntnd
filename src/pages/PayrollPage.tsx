import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPayrollPayments, deletePayrollPayment } from '../services/payrollService';

import { useReactToPrint } from 'react-to-print'; // Importar useReactToPrint

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
                let fetchedPayments: PayrollPayment[] = [];
                if (user?.role === 'admin') {
                    fetchedPayments = await getPayrollPayments(user?.tenantId); // Admins pueden ver todos si desean, o filtrar por tenant
                } else if (user?.role === 'sostenedor') {
                    fetchedPayments = await getPayrollPayments(user?.tenantId); // Sostenedores solo ven los de su tenant
                }
                setPayments(fetchedPayments);

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
                await deletePayrollPayment(id);
                setPayments(payments.filter(payment => payment._id !== id));
            } catch (err) {
                console.error('Error deleting payroll payment:', err);
                setError('Error al eliminar el pago de nómina.');
            }
        }
    };

    if (isLoading || !isAuthenticated || !(user?.role === 'admin' || user?.role === 'sostenedor')) {
        return <div>Cargando...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Gestión de Pagos de Nómina</h1>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

            <button
                onClick={() => navigate('/payroll/new')}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4 mr-2"
            >
                Crear Nuevo Pago de Nómina
            </button>
            <button
                onClick={handlePrint}
                className="bg-gray-600 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded mb-4"
            >
                Imprimir Lista
            </button>

            {payments.length === 0 ? (
                <p>No hay pagos de nómina registrados.</p>
            ) : (
                <div ref={componentRef} className="overflow-x-auto p-4">
                    <h2 className="text-xl font-bold mb-4 print-only">Lista de Pagos de Nómina</h2>
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border-b">Usuario</th>
                                <th className="py-2 px-4 border-b">Rol</th>
                                <th className="py-2 px-4 border-b">Monto</th>
                                <th className="py-2 px-4 border-b">Período</th>
                                <th className="py-2 px-4 border-b">Fecha de Pago</th>
                                <th className="py-2 px-4 border-b">Concepto</th>
                                <th className="py-2 px-4 border-b">Estado</th>
                                <th className="py-2 px-4 border-b">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment) => (
                                <tr key={payment._id}>
                                    <td className="py-2 px-4 border-b">{payment.userId?.name || payment.userId?._id}</td>
                                    <td className="py-2 px-4 border-b">{payment.userId?.role}</td>
                                    <td className="py-2 px-4 border-b">{payment.amount} {payment.currency}</td>
                                    <td className="py-2 px-4 border-b">{payment.period}</td>
                                    <td className="py-2 px-4 border-b">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                    <td className="py-2 px-4 border-b">{payment.concept || 'N/A'}</td>
                                    <td className="py-2 px-4 border-b">{payment.status}</td>
                                    <td className="py-2 px-4 border-b">
                                        <button
                                            onClick={() => navigate(`/payroll/edit/${payment._id}`)}
                                            className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded mr-2"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(payment._id)}
                                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PayrollPage;
