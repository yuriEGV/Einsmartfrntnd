
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const api = (await import('../services/api')).default;
            await api.post('/auth/recover-password', { email });
            setSubmitted(true);
        } catch (error) {
            console.error('Error in recovery request:', error);
            // Even if it fails, we usually show the same "submitted" state for security
            // unless we want to handle "user not found" explicitly.
            setSubmitted(true);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-black text-[#11355a] uppercase tracking-tighter">
                    Recuperar Contraseña
                </h2>
                <p className="mt-2 text-center text-sm font-bold text-slate-500 italic">
                    Ingresa tu correo o RUT para recibir instrucciones
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-[2rem] sm:px-10 border border-slate-100">
                    {!submitted ? (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="email" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Identificación (Correo o RUT)
                                </label>
                                <div className="mt-1 relative rounded-xl shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-blue-300" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="text"
                                        required
                                        className="pl-12 block w-full border-2 border-slate-100 rounded-xl shadow-sm py-4 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold placeholder-slate-300"
                                        placeholder="correo@ejemplo.com o 12.345.678-9"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    className="w-full flex justify-center py-4 px-4 border border-transparent rounded-[1.2rem] shadow-xl text-xs font-black text-white bg-[#11355a] hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#11355a] transition-all uppercase tracking-widest"
                                >
                                    Enviar Instrucciones
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="text-center animate-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 mb-6">
                                <CheckCircle size={40} />
                            </div>
                            <h3 className="mt-2 text-xl font-black text-slate-900 uppercase tracking-tighter">Solicitud enviada</h3>
                            <p className="mt-4 text-sm font-bold text-slate-500 leading-relaxed">
                                Si el usuario existe en nuestro sistema, recibirás un enlace de recuperación pronto. <br />
                                <span className="text-blue-500 italic">Revisa también tu carpeta de correo no deseado.</span>
                            </p>
                        </div>
                    )}

                    <div className="mt-6">
                        <Link
                            to="/login"
                            className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver al inicio
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
