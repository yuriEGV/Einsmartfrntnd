import { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { School, Plus, Search, ShieldCheck, Edit, Trash2, MapPin, Mail } from 'lucide-react';

interface Tenant {
    _id: string;
    name: string;
    domain?: string;
    paymentType?: 'paid' | 'free';
    address?: string;
    phone?: string;
    contactEmail?: string;
    status: 'activo' | 'inactivo';
    createdAt: string;
}

const TenantsPage = () => {
    const { isSuperAdmin } = usePermissions();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        domain: '',
        paymentType: 'paid' as 'paid' | 'free',
        address: '',
        phone: '',
        contactEmail: ''
    });

    useEffect(() => {
        if (isSuperAdmin) {
            fetchTenants();
        }
    }, [isSuperAdmin]);

    const fetchTenants = async () => {
        try {
            const res = await api.get('/tenants');
            setTenants(res.data);
        } catch (err) {
            console.error('Error fetching tenants:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (modalMode === 'create') {
                await api.post('/tenants', formData);
            } else {
                await api.put(`/tenants/${currentTenantId}`, formData);
            }
            setShowModal(false);
            setFormData({ name: '', domain: '', paymentType: 'paid', address: '', phone: '', contactEmail: '' });
            fetchTenants();
        } catch (err) {
            alert(`Error al ${modalMode === 'create' ? 'crear' : 'actualizar'} institución`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar esta institución? Esta acción es irreversible.')) return;
        try {
            await api.delete(`/tenants/${id}`);
            fetchTenants();
        } catch (err) {
            alert('Error al eliminar institución');
        }
    };

    const openEditModal = (t: Tenant) => {
        setModalMode('edit');
        setCurrentTenantId(t._id);
        setFormData({
            name: t.name,
            domain: t.domain || '',
            paymentType: t.paymentType || 'paid',
            address: t.address || '',
            phone: t.phone || '',
            contactEmail: t.contactEmail || ''
        });
        setShowModal(true);
    };

    if (!isSuperAdmin) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center">
                <ShieldCheck size={64} className="text-rose-500 mb-6" />
                <h1 className="text-2xl font-black text-gray-800 uppercase">Acceso Restringido</h1>
                <p className="text-gray-500">Solo el Administrador Global puede gestionar instituciones.</p>
            </div>
        );
    }

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.domain?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-2xl md:text-4xl font-black text-[#11355a] tracking-tight flex items-center gap-3">
                        <School size={32} className="text-blue-600 md:w-10 md:h-10" />
                        Instituciones
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm md:text-lg">Gestión global de la plataforma.</p>
                </div>
                <button
                    onClick={() => {
                        setModalMode('create');
                        setFormData({ name: '', domain: '', paymentType: 'paid', address: '', phone: '', contactEmail: '' });
                        setShowModal(true);
                    }}
                    className="w-full md:w-auto bg-blue-600 text-white px-6 md:px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 text-sm md:text-base"
                >
                    <Plus size={20} /> NUEVA INSTITUCIÓN
                </button>
            </div>

            <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden">
                <div className="p-4 md:p-8 border-b bg-gray-50/50 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-4 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="w-full pl-12 pr-6 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition-all font-bold text-sm md:text-base"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Mobile Card List */}
                <div className="md:hidden divide-y divide-gray-100">
                    {loading ? (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="p-6 animate-pulse"><div className="h-20 bg-gray-100 rounded-2xl"></div></div>
                        ))
                    ) : (
                        filteredTenants.map(t => (
                            <div key={t._id} className="p-6 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-[#11355a] text-white flex items-center justify-center font-black text-lg flex-shrink-0">
                                        {t.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="font-black text-gray-800 text-base truncate">{t.name}</div>
                                        <div className="text-[10px] text-gray-400 font-mono italic truncate">{t.domain || 'sin-dominio.edu'}</div>
                                    </div>
                                    <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full text-[9px] font-black border border-emerald-100">ACTIVO</span>
                                </div>
                                <div className="grid grid-cols-1 gap-2 text-xs">
                                    <div className="flex items-center gap-2 text-gray-600 font-bold"><MapPin size={12} /> {t.address || 'N/A'}</div>
                                    <div className="flex items-center gap-2 text-blue-600 font-medium"><Mail size={12} /> {t.contactEmail || 'N/A'}</div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button onClick={() => openEditModal(t)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs">EDITAR</button>
                                    <button onClick={() => handleDelete(t._id)} className="flex-1 py-3 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs">ELIMINAR</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Institución</th>
                                <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Contacto</th>
                                <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado</th>
                                <th className="px-8 py-5 text-right text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={4} className="px-8 py-6"><div className="h-6 bg-gray-100 rounded-lg"></div></td>
                                    </tr>
                                ))
                            ) : filteredTenants.map(t => (
                                <tr key={t._id} className="hover:bg-blue-50/20 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-[#11355a] text-white flex items-center justify-center font-black text-lg">
                                                {t.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-black text-gray-800 text-lg">{t.name}</div>
                                                <div className="text-[10px] text-gray-400 font-mono italic">{t.domain || 'sin-dominio.edu'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="text-xs space-y-1">
                                            <div className="flex items-center gap-2 text-gray-600 font-bold"><MapPin size={12} /> {t.address || 'N/A'}</div>
                                            <div className="flex items-center gap-2 text-blue-600 font-medium"><Mail size={12} /> {t.contactEmail || 'N/A'}</div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                            ACTIVO
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEditModal(t)}
                                                className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(t._id)}
                                                className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Creación */}
            {showModal && (
                <div className="fixed inset-0 bg-blue-900/40 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] p-10 w-full max-w-2xl shadow-2xl border-8 border-white animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="bg-blue-600 p-4 rounded-3xl text-white shadow-lg shadow-blue-500/30">
                                {modalMode === 'create' ? <Plus size={32} /> : <Edit size={32} />}
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-gray-800 tracking-tight">
                                    {modalMode === 'create' ? 'Expandir Plataforma' : 'Editar Institución'}
                                </h2>
                                <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mt-1">
                                    {modalMode === 'create' ? 'Alta de Nueva Institución' : 'Modificar Datos Existentes'}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Nombre Legal del Colegio</label>
                                    <input
                                        required
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none font-bold"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Dominio (ej: mi-colegio.cl)</label>
                                    <input
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-bold text-blue-600"
                                        value={formData.domain}
                                        onChange={e => setFormData({ ...formData, domain: e.target.value })}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Tipo de Colegio (Aranceles)</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paymentType: 'paid' })}
                                            className={`p-4 rounded-2xl border-2 font-bold transition-all ${formData.paymentType === 'paid' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-emerald-300'}`}
                                        >
                                            💵 Colegio de Pago
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paymentType: 'free' })}
                                            className={`p-4 rounded-2xl border-2 font-bold transition-all ${formData.paymentType === 'free' ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-300'}`}
                                        >
                                            ✅ Colegio Gratuito
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 px-1">Los colegios de pago requieren aranceles en matrículas. Los gratuitos no.</p>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Correo de Contacto</label>
                                    <input
                                        type="email"
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-bold"
                                        value={formData.contactEmail}
                                        onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Teléfono Institucional</label>
                                    <input
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-bold"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Dirección Física</label>
                                    <input
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-bold"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-6 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 text-gray-400 font-black hover:bg-gray-50 rounded-2xl transition-all uppercase tracking-widest text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 uppercase tracking-widest text-sm"
                                >
                                    {modalMode === 'create' ? 'Confirmar Alta' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TenantsPage;
