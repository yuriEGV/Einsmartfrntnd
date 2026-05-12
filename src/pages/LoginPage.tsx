import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const LoginPage: React.FC = () => {
    const [identifier, setIdentifier] = useState(''); // Can be email or RUT
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            // Determine if it looks like an email or RUT
            const isEmail = identifier.includes('@');
            const credentials = isEmail
                ? { email: identifier, password }
                : { rut: identifier, password };

            await login(credentials);
            navigate('/');
        } catch (err) {
            setError('Credenciales inválidas. Verifique su RUT/Correo y contraseña.');
            console.error(err);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Left Side - Welcome / Branding */}
            <div className="hidden lg:flex w-1/2 bg-[#11355a] text-white flex-col justify-center items-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-900 opacity-50"></div>
                <div className="relative z-10 text-center">
                    <h1 className="text-5xl font-bold mb-6">EINSMART</h1>
                    <p className="text-xl max-w-md mx-auto leading-relaxed">
                        Bienvenido a la intranet multiplataforma de Einsoft.
                        Gestiona tu vida escolar de manera eficiente.
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-gray-800 uppercase tracking-widest">Ingresa tus datos</h2>
                        <p className="text-gray-500 mt-2">Plataforma de Gestión Escolar</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm text-center border border-red-200">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-gray-700 text-sm font-semibold mb-2">
                                RUT / Correo Electrónico
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 border-2 border-blue-400 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-lg placeholder-gray-400"
                                    placeholder="Ej: 12345678-9"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-semibold mb-2">
                                Clave
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="w-full border-2 border-blue-400 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-lg pr-12"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-2"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-[#0066cc] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#0052a3] transition duration-300 shadow-md transform hover:-translate-y-0.5"
                        >
                            Ingresar
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
