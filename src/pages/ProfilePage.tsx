
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/authService';
import api from '../services/api';
import { User, Lock, Save, ShieldCheck, AlertCircle, Eye, EyeOff, BookOpen, Award, FileText, TrendingUp, Clock, GraduationCap } from 'lucide-react';

const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        confirmPassword: ''
    });
    const [pinData, setPinData] = useState({
        currentPin: '',
        newPin: '',
        confirmPin: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [showConf, setShowConf] = useState(false);
    const [showCurPin, setShowCurPin] = useState(false);
    const [showNewPin, setShowNewPin] = useState(false);
    const [showConfPin, setShowConfPin] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [activeTab, setActiveTab] = useState<'security' | 'academic'>('security');
    const [studentData, setStudentData] = useState<any>(null);
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        const fetchStudentData = async () => {
            if (user?.role !== 'student' && user?.role !== 'apoderado') return;
            if (!user?.profileId) return;

            setLoadingData(true);
            try {
                let studentId = user.profileId;
                if (user.role === 'apoderado') {
                    const apoRes = await api.get(`/apoderados/${user.profileId}`);
                    studentId = apoRes.data.estudianteId?._id || apoRes.data.estudianteId;
                }
                const res = await api.get(`/reports/student/${studentId}?period=anual`);
                setStudentData(res.data);
            } catch (error) {
                console.error("Error fetching student data:", error);
            } finally {
                setLoadingData(false);
            }
        };

        fetchStudentData();
    }, [user]);

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

    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPinData({ ...pinData, [e.target.name]: e.target.value });
    };

    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!pinData.currentPin || !pinData.newPin || !pinData.confirmPin) {
            setMessage({ type: 'error', text: 'Todos los campos del PIN son obligatorios' });
            return;
        }

        if (pinData.newPin !== pinData.confirmPin) {
            setMessage({ type: 'error', text: 'Los PINs no coinciden' });
            return;
        }

        if (!/^\d{4}$/.test(pinData.newPin)) {
            setMessage({ type: 'error', text: 'El PIN debe ser de 4 dígitos' });
            return;
        }

        setLoading(true);
        try {
            await api.put('/users/update-pin', pinData);
            setMessage({ type: 'success', text: 'PIN actualizado correctamente' });
            setPinData({ currentPin: '', newPin: '', confirmPin: '' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Error al actualizar PIN' });
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
                    <p className="text-gray-500 font-medium">Gestiona tu cuenta y revisa tu información.</p>
                </div>
            </div>

            {/* Tabs (Only for student/guardian) */}
            {(user?.role === 'student' || user?.role === 'apoderado') && (
                <div className="flex gap-4 mb-8 bg-white p-2 rounded-[1.5rem] border border-slate-100 shadow-sm w-fit">
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                            activeTab === 'security'
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-slate-400 hover:bg-slate-50'
                        }`}
                    >
                        <ShieldCheck size={16} />
                        Seguridad
                    </button>
                    <button
                        onClick={() => setActiveTab('academic')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                            activeTab === 'academic'
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-slate-400 hover:bg-slate-50'
                        }`}
                    >
                        <GraduationCap size={16} />
                        Resumen Académico
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {activeTab === 'security' ? (
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
                                            <div className="relative">
                                                <input
                                                    type={showPass ? "text" : "password"}
                                                    name="password"
                                                    placeholder="••••••••"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700 shadow-inner pr-14"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPass(!showPass)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors p-2"
                                                >
                                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Contraseña</label>
                                            <div className="relative">
                                                <input
                                                    type={showConf ? "text" : "password"}
                                                    name="confirmPassword"
                                                    placeholder="••••••••"
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700 shadow-inner pr-14"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConf(!showConf)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors p-2"
                                                >
                                                    {showConf ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-4 italic font-medium">
                                        * Ingresa tu nueva contraseña y confírmala para actualizarla.
                                    </p>
                                </div>

                                {/* PIN Change Section - Only for Teachers */}
                                {user?.role === 'teacher' && (
                                    <div className="pt-8 border-t border-slate-100">
                                        <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <ShieldCheck size={16} className="text-blue-500" />
                                            Cambiar PIN de Firma Digital
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PIN Actual</label>
                                                <div className="relative">
                                                    <input
                                                        type={showCurPin ? "text" : "password"}
                                                        name="currentPin"
                                                        placeholder="••••"
                                                        maxLength={4}
                                                        value={pinData.currentPin}
                                                        onChange={handlePinChange}
                                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700 shadow-inner text-center text-2xl tracking-widest pr-12"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCurPin(!showCurPin)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors"
                                                    >
                                                        {showCurPin ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nuevo PIN</label>
                                                <div className="relative">
                                                    <input
                                                        type={showNewPin ? "text" : "password"}
                                                        name="newPin"
                                                        placeholder="••••"
                                                        maxLength={4}
                                                        value={pinData.newPin}
                                                        onChange={handlePinChange}
                                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700 shadow-inner text-center text-2xl tracking-widest pr-12"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewPin(!showNewPin)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors"
                                                    >
                                                        {showNewPin ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar PIN</label>
                                                <div className="relative">
                                                    <input
                                                        type={showConfPin ? "text" : "password"}
                                                        name="confirmPin"
                                                        placeholder="••••"
                                                        maxLength={4}
                                                        value={pinData.confirmPin}
                                                        onChange={handlePinChange}
                                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700 shadow-inner text-center text-2xl tracking-widest pr-12"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfPin(!showConfPin)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors"
                                                    >
                                                        {showConfPin ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-4 italic font-medium">
                                            * El PIN de 4 dígitos es necesario para firmar el libro de clases digitalmente. No use PINs secuenciales (1234, 4321, etc.).
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handlePinSubmit}
                                            disabled={loading}
                                            className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2 active:scale-95 disabled:opacity-50"
                                        >
                                            {loading ? 'Actualizando...' : (
                                                <>
                                                    <ShieldCheck size={16} />
                                                    Actualizar PIN
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
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
                    ) : (
                        // Academic Matrix
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {loadingData ? (
                                <div className="p-12 text-center text-slate-400 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <p className="font-bold text-sm">Cargando información académica...</p>
                                </div>
                            ) : studentData ? (
                                <div className="space-y-6">
                                    {/* Stats Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                                <TrendingUp size={24} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Promedio Global</p>
                                                <p className="text-2xl font-black text-[#11355a] leading-none mt-1">{studentData.overallAverage?.toFixed(1) || '--'}</p>
                                            </div>
                                        </div>
                                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                                            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                                                <Award size={24} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anotaciones</p>
                                                <p className="text-2xl font-black text-[#11355a] leading-none mt-1">{studentData.annotations?.length || 0}</p>
                                            </div>
                                        </div>
                                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                                            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                                                <Clock size={24} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atrasos Totales</p>
                                                <p className="text-2xl font-black text-[#11355a] leading-none mt-1">{studentData.atrasos?.length || 0}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Grades Table */}
                                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                                        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                                            <h3 className="text-sm font-black text-[#11355a] uppercase tracking-widest flex items-center gap-2">
                                                <BookOpen size={16} className="text-blue-500" /> Rendimiento por Asignatura
                                            </h3>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-white border-b border-slate-100">
                                                        <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Asignatura</th>
                                                        <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Evals.</th>
                                                        <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Promedio</th>
                                                        <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Progreso</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {studentData.gradesBySubject?.map((sub: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                                                            <td className="p-4 font-black text-[#11355a] text-xs uppercase">{sub.subject}</td>
                                                            <td className="p-4 text-center text-xs font-bold text-slate-400">{sub.totalEvaluations}</td>
                                                            <td className="p-4 text-center">
                                                                <span className={`px-3 py-1 rounded-full font-black text-xs ${
                                                                    sub.average >= 4.0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                                }`}>
                                                                    {sub.average?.toFixed(1) || '--'}
                                                                </span>
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="w-20 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
                                                                    <div className={`h-full rounded-full ${sub.average >= 4.0 ? 'bg-blue-500' : 'bg-rose-400'}`} style={{ width: `${(sub.average / 7) * 100}%` }}></div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {(!studentData.gradesBySubject || studentData.gradesBySubject.length === 0) && (
                                                        <tr><td colSpan={4} className="p-8 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">Sin calificaciones registradas</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Split view: Annotations and Tardiness */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Annotations */}
                                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
                                            <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                                                <h3 className="text-sm font-black text-[#11355a] uppercase tracking-widest flex items-center gap-2">
                                                    <FileText size={16} className="text-amber-500" /> Últimas Anotaciones
                                                </h3>
                                            </div>
                                            <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-80">
                                                {studentData.annotations?.slice(0, 5).map((a: any, i: number) => (
                                                    <div key={i} className={`p-4 rounded-2xl border flex flex-col gap-2 ${
                                                        a.tipo === 'positiva' ? 'border-emerald-100 bg-emerald-50/30' : 'border-rose-100 bg-rose-50/30'
                                                    }`}>
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-xs font-black text-[#11355a] uppercase leading-tight pr-2">{a.titulo}</span>
                                                            <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-widest whitespace-nowrap ${
                                                                a.tipo === 'positiva' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                            }`}>{a.tipo}</span>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-slate-500 leading-relaxed">{a.descripcion}</p>
                                                        <div className="text-[8px] text-slate-400 font-bold uppercase mt-1 flex justify-between">
                                                            <span>{new Date(a.fecha).toLocaleDateString()}</span>
                                                            <span>{a.autor}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!studentData.annotations || studentData.annotations.length === 0) && (
                                                    <div className="text-center text-xs text-slate-400 font-bold p-8 uppercase tracking-widest">Sin anotaciones</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Atrasos */}
                                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
                                            <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                                                <h3 className="text-sm font-black text-[#11355a] uppercase tracking-widest flex items-center gap-2">
                                                    <Clock size={16} className="text-rose-500" /> Atrasos Recientes
                                                </h3>
                                            </div>
                                            <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-80">
                                                {studentData.atrasos?.slice(0, 5).map((a: any, i: number) => (
                                                    <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-2">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-xs font-black text-[#11355a] uppercase">{new Date(a.fecha).toLocaleDateString()}</span>
                                                            <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">{a.bloque}</span>
                                                        </div>
                                                        <div className="flex justify-between items-end">
                                                            <span className="text-[10px] font-bold text-slate-500 max-w-[60%] line-clamp-2">{a.motivo || 'Sin justificación'}</span>
                                                            <span className="text-[10px] font-black text-slate-700 px-2 py-1 bg-white rounded-lg border border-slate-100">{a.minutosAtraso} min</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!studentData.atrasos || studentData.atrasos.length === 0) && (
                                                    <div className="text-center text-xs text-slate-400 font-bold p-8 uppercase tracking-widest">Sin atrasos registrados</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-12 text-center text-slate-400 font-bold text-sm bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                                    <AlertCircle size={32} className="mx-auto text-slate-300 mb-4" />
                                    No se pudo cargar la información académica.
                                </div>
                            )}
                        </div>
                    )}
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
