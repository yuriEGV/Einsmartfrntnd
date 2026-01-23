import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createPayrollPayment, getPayrollPaymentById, updatePayrollPayment } from '../services/payrollService';
import { getUsers } from '../services/userService';

interface UserData {
    _id: string;
    name: string;
    email: string;
    role: string;
}

interface PayrollFormProps {
    isEditing?: boolean;
}

const PayrollForm: React.FC<PayrollFormProps> = ({ isEditing = false }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading } = useAuth();

    const [formData, setFormData] = useState({
        userId: '',
        amount: '',
        currency: 'CLP',
        paymentDate: '',
        period: '',
        concept: '',
        status: 'pending',
    });
    const [availableUsers, setAvailableUsers] = useState<UserData[]>([]);
    const [loadingForm, setLoadingForm] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || !(user?.role === 'admin' || user?.role === 'sostenedor'))) {
            navigate('/login');
            return;
        }

        const fetchFormData = async () => {
            try {
                // Obtener usuarios (personal) para el selector
                let fetchedUsers: UserData[] = [];
                if (user?.role === 'admin') {
                    fetchedUsers = await getUsers(user?.tenantId); 
                } else if (user?.role === 'sostenedor') {
                    fetchedUsers = await getUsers(user?.tenantId); 
                }
                fetchedUsers = fetchedUsers.filter(u => 
                    u.role !== 'student' && u.role !== 'apoderado'
                );
                setAvailableUsers(fetchedUsers);

                if (isEditing && id) {
                    const payment = await getPayrollPaymentById(id);
                    setFormData({
                        userId: payment.userId._id,
                        amount: payment.amount.toString(),
                        currency: payment.currency,
                        paymentDate: new Date(payment.paymentDate).toISOString().split('T')[0],
                        period: payment.period,
                        concept: payment.concept || '',
                        status: payment.status,
                    });
                } else {
                    // Si es nuevo, preseleccionar el primer usuario si hay
                    if (fetchedUsers.length > 0) {
                        setFormData(prev => ({ ...prev, userId: fetchedUsers[0]._id }));
                    }
                }
            } catch (err) {
                console.error('Error fetching form data:', err);
                setError('Error al cargar los datos del formulario.');
            } finally {
                setLoadingForm(false);
            }
        };

        if (isAuthenticated && (user?.role === 'admin' || user?.role === 'sostenedor')) {
            fetchFormData();
        }
    }, [isAuthenticated, isLoading, user, navigate, isEditing, id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const dataToSend = {
                ...formData,
                amount: parseFloat(formData.amount), // Convertir a número
            };

            if (isEditing && id) {
                await updatePayrollPayment(id, dataToSend);
            } else {
                await createPayrollPayment(dataToSend);
            }
            navigate('/payroll'); // Volver a la lista después de guardar
        } catch (err: any) {
            console.error('Error saving payroll payment:', err);
            setError(err.response?.data?.message || 'Error al guardar el pago de nómina.');
        }
    };

    if (isLoading || loadingForm || !isAuthenticated || !(user?.role === 'admin' || user?.role === 'sostenedor')) {
        return <div>Cargando formulario...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">{isEditing ? 'Editar Pago de Nómina' : 'Crear Nuevo Pago de Nómina'}</h1>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
            
            <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <div className="mb-4">
                    <label htmlFor="userId" className="block text-gray-700 text-sm font-bold mb-2">Usuario:</label>
                    <select
                        id="userId"
                        name="userId"
                        value={formData.userId}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                    >
                        <option value="">Selecciona un usuario</option>
                        {availableUsers.map(u => (
                            <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                        ))}
                    </select>
                </div>
                <div className="mb-4">
                    <label htmlFor="amount" className="block text-gray-700 text-sm font-bold mb-2">Monto:</label>
                    <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                        min="0"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="currency" className="block text-gray-700 text-sm font-bold mb-2">Moneda:</label>
                    <input
                        type="text"
                        id="currency"
                        name="currency"
                        value={formData.currency}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="paymentDate" className="block text-gray-700 text-sm font-bold mb-2">Fecha de Pago:</label>
                    <input
                        type="date"
                        id="paymentDate"
                        name="paymentDate"
                        value={formData.paymentDate}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="period" className="block text-gray-700 text-sm font-bold mb-2">Período (YYYY-MM):</label>
                    <input
                        type="text"
                        id="period"
                        name="period"
                        value={formData.period}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="YYYY-MM"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="concept" className="block text-gray-700 text-sm font-bold mb-2">Concepto:</label>
                    <input
                        type="text"
                        id="concept"
                        name="concept"
                        value={formData.concept}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2">Estado:</label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                    >
                        <option value="pending">Pendiente</option>
                        <option value="paid">Pagado</option>
                        <option value="cancelled">Cancelado</option>
                    </select>
                </div>
                <div className="flex items-center justify-between">
                    <button
                        type="submit"
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        {isEditing ? 'Guardar Cambios' : 'Crear Pago'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/payroll')}
                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PayrollForm;
