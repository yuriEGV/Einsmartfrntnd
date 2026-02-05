
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Lock, ShieldCheck, AlertTriangle } from 'lucide-react';

const ForcePasswordReset: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { user, setUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            return setError('La contraseña debe tener al menos 6 caracteres.');
        }

        if (password !== confirmPassword) {
            return setError('Las contraseñas no coinciden.');
        }

        setLoading(true);
        try {
            await api.put(`/users/profile/reset-password`, { password });

            // Actualizar el estado local del usuario
            const updatedUser = { ...user, mustChangePassword: false };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            alert('Contraseña actualizada exitosamente.');
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al actualizar la contraseña.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#11355a] flex items-center justify-center p-4 z-[1000]">
            <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="p-10 bg-blue-600 text-white text-center relative overflow-hidden">
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                            <Lock size={32} />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tight leading-none mb-2">Actualizar Contraseña</h2>
                        <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest opacity-80">Seguridad Requerida</p>
                    </div>
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                </div>

                <div className="p-10">
                    <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 mb-8">
                        <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                        <p className="text-xs font-bold text-amber-700 leading-relaxed">
                            Por motivos de seguridad, debes cambiar tu contraseña genérica antes de continuar usando el sistema.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 animate-in shake">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">NUEVA CONTRASEÑA</label>
                            <input
                                type="password"
                                required
                                disabled={loading}
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">CONFIRMAR CONTRASEÑA</label>
                            <input
                                type="password"
                                required
                                disabled={loading}
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#11355a] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-blue-900 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <ShieldCheck size={18} />
                                    <span>ACTUALIZAR Y CONTINUAR</span>
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={logout}
                            className="w-full text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors"
                        >
                            Cerrar Sesión
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForcePasswordReset;
