
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { Plus, Edit, Trash2, Search, Shield } from 'lucide-react';

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
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Shield className="text-[#11355a]" />
                    Gestión de Usuarios
                </h1>
                <button
                    onClick={() => {
                        setModalMode('create');
                        setCurrentUserData({ role: 'teacher' }); // Default
                        setPassword('');
                        setShowModal(true);
                    }}
                    className="bg-[#11355a] text-white px-4 py-2 rounded flex items-center gap-2 hover:opacity-90 transition"
                >
                    <Plus size={18} /> Nuevo Usuario
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex items-center gap-2 border">
                <Search className="text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o correo..."
                    className="flex-1 outline-none text-gray-700"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List */}
            {loading ? (
                <p>Cargando...</p>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden border">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                            <tr>
                                <th className="p-4">Usuario</th>
                                <th className="p-4">Rol</th>
                                <th className="p-4">Email</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredUsers.map(user => (
                                <tr key={user._id} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-800">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            {user.name}
                                        </div>
                                    </td>
                                    <td className="p-4">{getRoleBadge(user.role)}</td>
                                    <td className="p-4 text-gray-600 text-sm">{user.email}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setModalMode('edit');
                                                    setCurrentUserData(user);
                                                    setPassword('');
                                                    setShowModal(true);
                                                }}
                                                className="text-gray-400 hover:text-blue-600"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            {currentUser?._id !== user._id && (
                                                <button
                                                    onClick={() => handleDelete(user._id)}
                                                    className="text-gray-400 hover:text-red-600"
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
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">
                            {modalMode === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}
                        </h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                                <input
                                    required
                                    className="w-full border p-2 rounded"
                                    value={currentUserData.name || ''}
                                    onChange={e => setCurrentUserData({ ...currentUserData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full border p-2 rounded"
                                    value={currentUserData.email || ''}
                                    onChange={e => setCurrentUserData({ ...currentUserData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Rol</label>
                                <select
                                    className="w-full border p-2 rounded bg-white"
                                    value={currentUserData.role || 'teacher'}
                                    onChange={e => setCurrentUserData({ ...currentUserData, role: e.target.value as any })}
                                >
                                    <option value="admin">Administrador</option>
                                    <option value="sostenedor">Sostenedor</option>
                                    <option value="teacher">Profesor</option>
                                    <option value="student">Estudiante</option>
                                    <option value="apoderado">Apoderado</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {modalMode === 'create' ? 'Contraseña' : 'Cambiar Contraseña (Opcional)'}
                                </label>
                                <input
                                    type="password"
                                    required={modalMode === 'create'}
                                    className="w-full border p-2 rounded"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder={modalMode === 'create' ? '******' : 'Dejar en blanco para mantener'}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Enlazar Perfil (ID de Estudiante/Apoderado)</label>
                                <input
                                    className="w-full border p-2 rounded"
                                    value={currentUserData.profileId || ''}
                                    onChange={e => setCurrentUserData({ ...currentUserData, profileId: e.target.value })}
                                    placeholder="ID de base de datos (opcional)"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Vincula este usuario con su ficha real para recibir notificaciones.</p>
                            </div>
                            {isSuperAdmin && modalMode === 'create' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-blue-600 font-bold">Asignar a Institución (SuperAdmin)</label>
                                    <select
                                        className="w-full border-2 border-blue-100 p-2 rounded bg-white font-bold"
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
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#11355a] text-white rounded hover:opacity-90"
                                >
                                    Guardar
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
