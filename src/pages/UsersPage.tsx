
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { Plus, Edit, Trash2, Search, Shield, Save } from 'lucide-react';

interface UserData {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'sostenedor' | 'teacher' | 'student' | 'apoderado';
    rut?: string;
    password?: string;
    profileId?: string;
}

const UsersPage = () => {
    const { canManageUsers, isSuperAdmin, user: currentUser } = usePermissions();
    const [users, setUsers] = useState<UserData[]>([]);
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [currentUserData, setCurrentUserData] = useState<Partial<UserData & { tenantId?: string }>>({});
    const [password, setPassword] = useState('');

    useEffect(() => {
        fetchUsers();
        if (isSuperAdmin) fetchTenants();
    }, [isSuperAdmin]);

    const fetchTenants = async () => {
        try {
            const res = await api.get('/tenants');
            setTenants(res.data);
        } catch (err) {
            console.error('Error fetching tenants:', err);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = { ...currentUserData };
            if (password) payload.password = password;

            if (modalMode === 'create') {
                await api.post('/users', payload);
            } else {
                await api.put(`/users/${currentUserData._id}`, payload);
            }
            setShowModal(false);
            setPassword('');
            fetchUsers();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al guardar usuario');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">Admin</span>;
            case 'sostenedor': return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-bold">Sostenedor</span>;
            case 'teacher': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">Profesor</span>;
            case 'student': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">Estudiante</span>;
            case 'apoderado': return <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-bold">Apoderado</span>;
            default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">Usuario</span>;
        }
    };

    if (!canManageUsers) {
        return <div className="p-6 text-red-600">No tienes permisos para ver esta página.</div>;
    }

    return (
        <div className="p-4 md:p-10 space-y-6 md:space-y-10 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100/50">
                            <Shield size={32} className="text-[#11355a] md:w-10 md:h-10" />
                        </div>
                        Usuarios
                    </h1>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2 ml-1">
                        Control de accesos y permisos globales
                    </p>
                </div>
                <button
                    onClick={() => {
                        setModalMode('create');
                        setCurrentUserData({ role: 'teacher' });
                        setPassword('');
                        setShowModal(true);
                    }}
                    className="w-full md:w-auto bg-[#11355a] text-white px-8 py-4 rounded-[1.5rem] flex items-center justify-center gap-3 hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/20 active:scale-95 font-black uppercase text-xs tracking-widest"
                >
                    <Plus size={20} /> NUEVO USUARIO
                </button>
            </div>

            {/* Enhanced Search Bar */}
            <div className="bg-white p-2 rounded-[1.5rem] shadow-xl shadow-blue-900/5 border border-slate-50 flex items-center gap-2 group focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
                <div className="p-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Search size={22} />
                </div>
                <input
                    type="text"
                    placeholder="Buscar usuarios por nombre o correo..."
                    className="flex-1 outline-none text-slate-700 font-extrabold text-sm md:text-base bg-transparent py-4 placeholder:text-slate-300 placeholder:font-bold"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Hybrid View: Table for Desktop, Cards for Mobile */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 animate-pulse">
                    <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Actualizando base de datos...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Desktop Table */}
                    <div className="hidden md:block bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-slate-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                                <tr>
                                    <th className="px-10 py-6">Usuario Identificado</th>
                                    <th className="px-10 py-6">Nivel de Acceso</th>
                                    <th className="px-10 py-6">Correo Electrónico</th>
                                    <th className="px-10 py-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredUsers.map(user => (
                                    <tr key={user._id} className="hover:bg-indigo-50/30 transition-all group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-[#11355a] text-white flex items-center justify-center font-black text-lg shadow-lg border-2 border-white">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="font-black text-slate-700 uppercase tracking-tighter text-sm">
                                                    {user.name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">{getRoleBadge(user.role)}</td>
                                        <td className="px-10 py-6 text-slate-500 font-bold text-sm tracking-tight">{user.email}</td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setModalMode('edit');
                                                        setCurrentUserData(user);
                                                        setPassword('');
                                                        setShowModal(true);
                                                    }}
                                                    className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                {currentUser?._id !== user._id && (
                                                    <button
                                                        onClick={() => handleDelete(user._id)}
                                                        className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden grid gap-4">
                        {filteredUsers.map((user, idx) => (
                            <div
                                key={user._id}
                                className="bg-white p-6 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-50 flex flex-col gap-5 relative overflow-hidden active:scale-[0.98] transition-all"
                                style={{ animationDelay: `${idx * 40}ms` }}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 -z-0 opacity-50"></div>

                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-[#11355a] text-white flex items-center justify-center font-black text-xl shadow-lg border-2 border-white">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-lg font-black text-slate-800 tracking-tighter uppercase truncate max-w-[140px]">
                                                {user.name}
                                            </div>
                                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mt-1">Identificador Único</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => {
                                                setModalMode('edit');
                                                setCurrentUserData(user);
                                                setPassword('');
                                                setShowModal(true);
                                            }}
                                            className="p-3 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-xl active:bg-blue-50 transition-all"
                                        >
                                            <Edit size={20} />
                                        </button>
                                        {currentUser?._id !== user._id && (
                                            <button
                                                onClick={() => handleDelete(user._id)}
                                                className="p-3 text-slate-400 hover:text-rose-500 bg-slate-50 rounded-xl active:bg-rose-50 transition-all"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 pt-4 border-t border-slate-50 relative z-10">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Nivel de Acceso</span>
                                        {getRoleBadge(user.role)}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Correo Electrónico</span>
                                        <span className="text-xs font-bold text-slate-500 truncate max-w-[180px]">{user.email}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredUsers.length === 0 && !loading && (
                        <div className="py-24 text-center bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100">
                            <Shield size={64} className="mx-auto text-slate-200 mb-6" />
                            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Sin resultados</h3>
                            <p className="text-xs font-bold text-slate-300 mt-2">No se encontraron usuarios que coincidan con tu búsqueda.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Refined Premium Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[999] md:pl-[300px] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-[0_0_80px_rgba(0,0,0,0.3)] border-8 border-white animate-in zoom-in-95 duration-500 max-h-[95vh] overflow-y-auto custom-scrollbar">
                        <div
                            className="p-10 text-white relative overflow-hidden"
                            style={{ backgroundColor: '#11355a' }}
                        >
                            <div className="relative z-10">
                                <h2 className="text-3xl font-black tracking-tighter uppercase leading-none mb-2">
                                    {modalMode === 'create' ? 'Nuevo Acceso' : 'Perfil de Usuario'}
                                </h2>
                                <p className="text-blue-300 font-extrabold uppercase text-[10px] tracking-[0.3em]">
                                    {modalMode === 'create' ? 'CONFIGURAR CREDENCIALES INICIALES' : 'GESTIÓN DE PERMISOS Y DATOS'}
                                </p>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                        </div>

                        <form onSubmit={handleSave} className="p-10 space-y-6 bg-slate-50/30">
                            <div className="space-y-5">
                                <div className="group text-start">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 text-start">NOMBRE COMPLETO</label>
                                    <input
                                        required
                                        className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:shadow-xl focus:shadow-indigo-500/5 transition-all outline-none font-black text-slate-700"
                                        placeholder="Ej: Juan Pérez"
                                        value={currentUserData.name || ''}
                                        onChange={e => setCurrentUserData({ ...currentUserData, name: e.target.value })}
                                    />
                                </div>
                                <div className="group text-start">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 text-start">CORREO ELECTRÓNICO</label>
                                    <input
                                        required
                                        type="email"
                                        placeholder="ejemplo@einsmart.com"
                                        className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:shadow-xl focus:shadow-indigo-500/5 transition-all outline-none font-black text-slate-700"
                                        value={currentUserData.email || ''}
                                        onChange={e => setCurrentUserData({ ...currentUserData, email: e.target.value })}
                                    />
                                </div>
                                <div className="group text-start">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 text-start">NIVEL DE PRIVILEGIOS</label>
                                    <div className="relative">
                                        <select
                                            className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 transition-all outline-none font-black text-slate-700 appearance-none bg-no-repeat"
                                            value={currentUserData.role || 'teacher'}
                                            onChange={e => setCurrentUserData({ ...currentUserData, role: e.target.value as any })}
                                        >
                                            <option value="admin">Administrador del Sistema</option>
                                            <option value="sostenedor">Sostenedor / Dueño</option>
                                            <option value="teacher">Cuerpo Docente</option>
                                            <option value="student">Estudiante</option>
                                            <option value="apoderado">Apoderado / Tutor</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                                            <Shield size={18} />
                                        </div>
                                    </div>
                                </div>
                                <div className="group text-start">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 text-start">
                                        {modalMode === 'create' ? 'CONTRASEÑA SEGURA' : 'ACTUALIZAR LLAVE DE ACCESO'}
                                    </label>
                                    <input
                                        type="password"
                                        required={modalMode === 'create'}
                                        className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 transition-all outline-none font-black text-slate-700"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder={modalMode === 'create' ? 'Min. 6 caracteres' : 'Dejar en blanco para mantener'}
                                    />
                                </div>
                                <div className="group text-start">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 text-start">VINCULACIÓN DE PERFIL (OPCIONAL)</label>
                                    <input
                                        className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 transition-all outline-none font-bold text-slate-500 text-xs"
                                        value={currentUserData.profileId || ''}
                                        onChange={e => setCurrentUserData({ ...currentUserData, profileId: e.target.value })}
                                        placeholder="UUID de la ficha relacionada"
                                    />
                                    <p className="text-[9px] font-bold text-slate-300 mt-2 ml-1 uppercase tracking-widest leading-relaxed">Conecta el usuario con su ficha de Estudiante o Apoderado.</p>
                                </div>

                                {isSuperAdmin && modalMode === 'create' && (
                                    <div className="group text-start">
                                        <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 ml-1 text-start">ASIGNACIÓN DE INSTITUCIÓN (SUPERADMIN)</label>
                                        <select
                                            className="w-full px-6 py-4 bg-indigo-50 border-2 border-indigo-100 rounded-2xl focus:border-indigo-500 transition-all outline-none font-black text-indigo-900 appearance-none"
                                            value={currentUserData.tenantId || ''}
                                            onChange={e => setCurrentUserData({ ...currentUserData, tenantId: e.target.value })}
                                        >
                                            <option value="">Mi Institución Actual</option>
                                            {tenants.map(t => (
                                                <option key={t._id} value={t._id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="pt-8 flex flex-col md:flex-row gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-5 text-slate-400 font-black hover:bg-slate-100 rounded-2xl transition-all uppercase tracking-widest text-xs"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-5 bg-[#11355a] text-white rounded-2xl font-black hover:bg-blue-900 shadow-2xl shadow-blue-900/20 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                                >
                                    {modalMode === 'create' ? <Plus size={18} /> : <Save size={18} />}
                                    {modalMode === 'create' ? 'CONFIRMAR ALTA' : 'GUARDAR CAMBIOS'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPage;
