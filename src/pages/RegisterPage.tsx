
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const RegisterPage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        rut: '',
        password: '',
        tenantId: '', // Ideally this would be selected from a list or pre-filled
        role: 'student'
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        let value = e.target.value;
        if (e.target.name === 'email') value = value.trim().toLowerCase();
        if (e.target.name === 'rut') value = value.trim();

        setFormData({
            ...formData,
            [e.target.name]: value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/auth/registro', formData);
            alert('Registro exitoso. Ahora puedes iniciar sesión.');
            navigate('/login');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al registrarse');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center text-[#11355a] mb-6">Registro de Usuario</h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Nombre Completo</label>
                        <input
                            type="text"
                            name="name"
                            required
                            maxLength={100}
                            className="w-full px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-[#11355a] font-bold"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">RUT (Ej: 12345678-9)</label>
                        <input
                            type="text"
                            name="rut"
                            maxLength={12}
                            required
                            pattern="^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$"
                            title="Formato: 12.345.678-9"
                            className="w-full px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-[#11355a] font-mono"
                            value={formData.rut}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Correo Electrónico</label>
                        <input
                            type="email"
                            name="email"
                            className="w-full px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-[#11355a]"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Contraseña</label>
                        <input
                            type="password"
                            name="password"
                            required
                            className="w-full px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-[#11355a]"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">ID del Colegio (Tenant ID)</label>
                        <input
                            type="text"
                            name="tenantId"
                            required
                            maxLength={50}
                            placeholder="Solicita esto a tu administrador"
                            className="w-full px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-[#11355a] font-mono text-xs uppercase"
                            value={formData.tenantId}
                            onChange={handleChange}
                        />
                        <p className="text-xs text-gray-500 mt-1">Este es un código único entregado por tu institución.</p>
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Soy:</label>
                        <select
                            name="role"
                            className="w-full px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-[#11355a]"
                            value={formData.role}
                            onChange={handleChange}
                        >
                            <option value="student">Estudiante</option>
                            {/* <option value="teacher">Profesor</option> */}
                            {/* <option value="admin">Sostenedor (Requiere verificación)</option> */}
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#11355a] text-white font-bold py-2 px-4 rounded hover:bg-[#0d2a46] transition duration-300"
                    >
                        Registrarse
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <Link to="/login" className="text-sm text-blue-600 hover:underline">
                        ¿Ya tienes cuenta? Inicia sesión
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
