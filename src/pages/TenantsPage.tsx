import { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { School, Plus, Search, ShieldCheck, Edit, Trash2, MapPin, Mail, DollarSign, Save } from 'lucide-react';

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
        contactEmail: '',
        logoUrl: ''
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
                await api.post('/tenants', {
                    ...formData,
                    theme: { logoUrl: formData.logoUrl }
                });
            } else {
                // Find existing tenant to preserve colors
                const existingTenant = tenants.find(t => t._id === currentTenantId);
                const existingTheme = (existingTenant as any)?.theme || {};

                await api.put(`/tenants/${currentTenantId}`, {
                    ...formData,
                    theme: {
                        ...existingTheme,
                        logoUrl: formData.logoUrl
                    }
                });
            }
            setShowModal(false);
            setFormData({ name: '', domain: '', paymentType: 'paid', address: '', phone: '', contactEmail: '', logoUrl: '' });
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
            contactEmail: t.contactEmail || '',
            logoUrl: (t as any).theme?.logoUrl || ''
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
                        setModalMode('create');
                        setFormData({ name: '', domain: '', paymentType: 'paid', address: '', phone: '', contactEmail: '', logoUrl: '' });
                        setShowModal(true);
                    }}
                    className="w-full md:w-auto bg-blue-600 text-white px-6 md:px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 text-sm md:text-base"
                >
                    <Plus size={20} /> NUEVA INSTITUCIÓN
                </button>
            </div>

            <div className="bg-white rounded-[2rem] shadow-2xl shadow-blue-900/10 border border-gray-100 overflow-hidden">
                <div className="p-5 md:p-8 border-b bg-slate-50/50 flex items-center gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-5 top-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o dominio..."
                            className="w-full pl-14 pr-6 py-4.5 bg-white border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/5 outline-none transition-all font-black text-slate-700 text-sm md:text-base placeholder:text-gray-300 placeholder:font-bold"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Mobile Card List - Refined Design */}
                <div className="md:hidden divide-y divide-gray-100 bg-white">
                    {loading ? (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="p-8 animate-pulse">
                                <div className="flex gap-4 mb-4">
                                    <div className="w-14 h-14 bg-gray-100 rounded-2xl"></div>
                                    <div className="flex-1 space-y-2 py-1">
                                        <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                                    </div>
                                </div>
                                <div className="h-10 bg-gray-50 rounded-xl"></div>
                            </div>
                        ))
                    ) : (
                        filteredTenants.map(t => (
                            <div key={t._id} className="p-8 space-y-6 hover:bg-slate-50/50 transition-colors active:bg-slate-50">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-[#11355a] to-[#1e4e83] text-white flex items-center justify-center font-black text-xl flex-shrink-0 shadow-lg shadow-blue-900/20 border border-white/10 uppercase">
                                        {t.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="font-black text-slate-800 text-lg truncate pr-2">{t.name}</div>
                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black tracking-widest border uppercase
                                                ${t.status === 'activo' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                {t.status || 'ACTIVO'}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-blue-500 font-black tracking-tighter uppercase opacity-70 truncate">
                                            {t.domain || 'SIN DOMINIO REGISTRADO'}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 bg-slate-50/80 p-5 rounded-2xl border border-slate-100/50">
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <div className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-100"><MapPin size={12} className="text-blue-400" /></div>
                                        <span className="text-[11px] font-extrabold truncate">{t.address || 'Sin dirección física'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <div className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-100"><Mail size={12} className="text-emerald-400" /></div>
                                        <span className="text-[11px] font-extrabold truncate">{t.contactEmail || 'Sin email de contacto'}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-100">
                                            <ShieldCheck size={12} className={t.paymentType === 'paid' ? 'text-amber-500' : 'text-blue-500'} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Plan: <span className={t.paymentType === 'paid' ? 'text-amber-600' : 'text-blue-600'}>{t.paymentType === 'paid' ? 'Institución de Pago' : 'Gratuite'}</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => openEditModal(t)}
                                        className="flex-1 py-4.5 bg-[#11355a] text-white rounded-2xl font-black text-[11px] tracking-[0.2em] shadow-lg shadow-blue-900/10 active:scale-95 transition-all outline-none"
                                    >
                                        EDITAR
                                    </button>
                                    <button
                                        onClick={() => handleDelete(t._id)}
                                        className="py-4.5 px-6 bg-rose-50 text-rose-600 rounded-2xl font-black text-[11px] active:scale-95 transition-all border border-rose-100 hover:bg-rose-100 hover:text-rose-700"
                                        aria-label="Eliminar"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Institución</th>
                                <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Gestión & Ubicación</th>
                                <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Estado</th>
                                <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={4} className="px-10 py-10"><div className="h-8 bg-gray-50 rounded-xl"></div></td>
                                    </tr>
                                ))
                            ) : filteredTenants.map(t => (
                                <tr key={t._id} className="hover:bg-blue-50/20 transition-all group cursor-default">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#11355a] to-[#1e4e83] text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-blue-900/10 border-2 border-white group-hover:scale-110 transition-transform">
                                                {t.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-800 text-xl tracking-tight group-hover:text-blue-900 transition-colors uppercase">{t.name}</div>
                                                <div className="text-xs text-blue-500 font-extrabold font-mono flex items-center gap-1.5 mt-1 opacity-70">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                                    {t.domain || 'sin-dominio.edu'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-slate-500 font-extrabold text-xs">
                                                <MapPin size={14} className="text-slate-300" /> {t.address || 'N/A'}
                                            </div>
                                            <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-wider bg-blue-50 w-fit px-2 py-1 rounded-lg border border-blue-100">
                                                <Mail size={12} /> {t.contactEmail || 'N/A'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-100 flex items-center gap-2 w-fit">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                                ACTIVO
                                            </span>
                                            <span className="text-[9px] font-black text-slate-400 ml-1 uppercase tracking-widest">{t.paymentType === 'paid' ? '💰 Plan Premium' : '✨ Plan Social'}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="flex justify-end gap-3 md:translate-x-4 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100 transition-all duration-300">
                                            <button
                                                onClick={() => openEditModal(t)}
                                                className="p-3.5 bg-slate-50 text-slate-500 rounded-[1.25rem] hover:bg-[#11355a] hover:text-white transition-all shadow-sm border border-slate-100"
                                                title="Editar"
                                            >
                                                <Edit size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(t._id)}
                                                className="p-3.5 bg-rose-50 text-rose-400 rounded-[1.25rem] hover:bg-rose-500 hover:text-white transition-all shadow-sm border border-rose-100"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Creación - Refined for Experience */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[999] md:pl-[300px] animate-in fade-in duration-300">
                    <div className="bg-[#f8fafc] rounded-[3rem] w-full max-w-2xl shadow-[0_0_100px_rgba(0,0,0,0.4)] border-8 border-white animate-in zoom-in-95 duration-500 max-h-[95vh] overflow-y-auto custom-scrollbar flex flex-col">
                        <div
                            className="p-10 text-white relative overflow-hidden flex-shrink-0"
                            style={{ backgroundColor: '#11355a' }}
                        >
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

                            <div className="relative flex items-center gap-6">
                                <div className="bg-white/10 backdrop-blur-md p-5 rounded-[2rem] text-white border border-white/20 shadow-2xl">
                                    {modalMode === 'create' ? <Plus size={40} /> : <Edit size={40} />}
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase leading-none mb-2">
                                        {modalMode === 'create' ? 'Configurar Colegio' : 'Actualizar Datos'}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-1 bg-blue-400 rounded-full"></div>
                                        <p className="text-blue-200 font-black uppercase text-[10px] tracking-[0.3em]">
                                            {modalMode === 'create' ? 'ESTABLECIMIENTO NUEVO' : 'EXPEDIENTE INSTITUCIONAL'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8 flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                                <div className="md:col-span-2 group">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">NOMBRE LEGAL DEL ESTABLECIMIENTO</label>
                                    <input
                                        required
                                        className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:shadow-2xl focus:shadow-blue-500/10 transition-all outline-none font-black text-slate-700 text-lg shadow-inner group-focus-within:border-blue-400"
                                        placeholder="Ej: Escuela de las Artes Maritimas"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">DOMINIO WEB / URL</label>
                                    <div className="relative">
                                        <input
                                            className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-black text-blue-600 shadow-inner"
                                            placeholder="mi-colegio.edu"
                                            value={formData.domain}
                                            onChange={e => setFormData({ ...formData, domain: e.target.value })}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-50 text-blue-500 px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter">SECURE HTTPS</div>
                                    </div>
                                </div>


                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">URL DEL LOGO (IMAGEN)</label>
                                    <input
                                        className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-bold text-slate-700 shadow-inner"
                                        placeholder="https://ejemplo.com/logo.png"
                                        value={formData.logoUrl}
                                        onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                                    />
                                    {formData.logoUrl && (
                                        <div className="mt-2 flex justify-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <img src={formData.logoUrl} alt="Vista previa" className="h-16 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                        </div>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2 text-center md:text-left">SISTEMA DE FINANCIAMIENTO</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paymentType: 'paid' })}
                                            className={`p-6 rounded-[2rem] border-4 flex flex-col items-center gap-3 transition-all duration-300 ${formData.paymentType === 'paid' ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xl shadow-amber-500/10 scale-[1.02]' : 'bg-white border-slate-100 text-slate-400 hover:border-amber-200 hover:bg-amber-50/30'}`}
                                        >
                                            <div className={`p-4 rounded-2xl ${formData.paymentType === 'paid' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-slate-50 text-slate-300'} transition-colors`}>
                                                <DollarSign size={24} />
                                            </div>
                                            <div className="text-center">
                                                <span className="block font-black uppercase tracking-widest text-xs">PAGADO / PARTICULAR</span>
                                                <span className="text-[9px] font-bold opacity-60">Control completo de aranceles y deudas.</span>
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paymentType: 'free' })}
                                            className={`p-6 rounded-[2rem] border-4 flex flex-col items-center gap-3 transition-all duration-300 ${formData.paymentType === 'free' ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xl shadow-blue-500/10 scale-[1.02]' : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200 hover:bg-blue-50/30'}`}
                                        >
                                            <div className={`p-4 rounded-2xl ${formData.paymentType === 'free' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-50 text-slate-300'} transition-colors`}>
                                                <ShieldCheck size={24} />
                                            </div>
                                            <div className="text-center">
                                                <span className="block font-black uppercase tracking-widest text-xs">GRATUITO / ESTATAL</span>
                                                <span className="text-[9px] font-bold opacity-60">Matrículas sin cargos económicos directos.</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">CORREO DE CONTACTO</label>
                                    <input
                                        type="email"
                                        className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-bold text-slate-700 shadow-inner"
                                        placeholder="admin@colegio.cl"
                                        value={formData.contactEmail}
                                        onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                                    />
                                </div>

                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">TELÉFONO DE SOPORTE</label>
                                    <input
                                        className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-bold text-slate-700 shadow-inner"
                                        placeholder="+56 9 1234 5678"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>

                                <div className="md:col-span-2 group">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">DOMICILIO FÍSICO / DIRECCIÓN</label>
                                    <input
                                        className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-bold text-slate-700 shadow-inner"
                                        placeholder="Av. Libertad #456, Viña del Mar, Chile"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-10 flex flex-col md:flex-row gap-5">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-6 text-slate-400 font-black hover:bg-slate-100 rounded-[1.5rem] transition-all uppercase tracking-[0.2em] text-xs"
                                >
                                    CANCELAR OPERACIÓN
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-6 bg-emerald-600 text-white rounded-[1.5rem] font-black hover:bg-emerald-700 hover:scale-[1.02] shadow-2xl shadow-emerald-600/20 transition-all uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3"
                                >
                                    {modalMode === 'create' ? <Plus size={20} /> : <Save size={20} />}
                                    {modalMode === 'create' ? 'PUBLICAR COLEGIO' : 'GUARDAR CAMBIOS'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )}
        </div >
    );
};

export default TenantsPage;
