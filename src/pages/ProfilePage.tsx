
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/authService';
import { User, Lock, Save, ShieldCheck, AlertCircle } from 'lucide-react';

const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (formData.password && formData.password !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
            return;
        }

        setLoading(true);
        try {
            if (!formData.password) {
                setMessage({ type: 'error', text: 'Debes ingresar una nueva contraseña para actualizar' });
                setLoading(false);
                return;
            }

            const dataToUpdate: any = { password: formData.password };
            await updateProfile(dataToUpdate);

            setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Error al actualizar perfil' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-[#11355a] flex items-center gap-3">
                        <User size={32} />
                        Mi Perfil
                    </h1>
                    <p className="text-gray-500 font-medium">Gestiona la seguridad de tu cuenta.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Info Card */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                        <div className="p-10">
                            <h2 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                                <ShieldCheck className="text-blue-500" />
                                Información de la Cuenta
                            </h2>

                            {message && (
                                <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                                    {message.type === 'success' ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
                                    <span className="font-bold text-sm">{message.text}</span>
                                </div>
                            )}

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            disabled
                                            className="w-full px-6 py-4 bg-slate-100 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-400 cursor-not-allowed"
                                        />
                                        <p className="text-[9px] text-slate-400 ml-1 italic">El nombre solo puede ser modificado por un administrador</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            disabled
                                            className="w-full px-6 py-4 bg-slate-100 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-400 cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-slate-100">
                                    <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <Lock size={16} className="text-blue-500" />
                                        Cambiar Contraseña
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nueva Contraseña</label>
                                            <input
                                                type="password"
                                                name="password"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={handleChange}
                                                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700 shadow-inner"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Contraseña</label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                placeholder="••••••••"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700 shadow-inner"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-4 italic font-medium">
                                        * Ingresa tu nueva contraseña y confírmala para actualizarla.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-[#11355a] text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/10 flex items-center gap-3 active:scale-95 disabled:opacity-50"
                            >
                                {loading ? 'Guardando...' : (
                                    <>
                                        <Save size={18} />
                                        Guardar Cambios
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Status Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#11355a] rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>

                        <div className="relative z-10">
                            <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-3xl font-black mb-6 border-4 border-white/20 shadow-2xl">
                                {user?.name?.substring(0, 1) || 'A'}
                            </div>

                            <h3 className="text-xl font-black truncate">{user?.name}</h3>
                            <div className="text-[10px] font-black uppercase text-blue-300 tracking-widest mt-1 opacity-70">
                                Rol: {user?.role}
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-blue-300 font-bold uppercase text-[10px]">Estado:</span>
                                    <span className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                        Activo
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-blue-300 font-bold uppercase text-[10px]">Seguridad:</span>
                                    <span className="text-white font-black text-[10px]">Nativa SHA-256</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-lg">
                        <div className="flex items-center gap-3 text-slate-800 font-bold mb-4">
                            <AlertCircle size={20} className="text-blue-500" />
                            Consejo
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                            Te recomendamos cambiar tu contraseña periódicamente y no compartir tu acceso con terceros para mantener la integridad de los datos académicos.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
