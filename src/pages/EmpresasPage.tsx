import { useState, useEffect } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import api from '../services/api';
import { validarRUT, formatearRUT } from '../utils/rutValidator';
import { toast } from 'react-hot-toast';
import {
    Building2, Plus, Search, X, Edit, Trash2,
    FileText, Phone, Mail, MapPin, Calendar,
    ShieldCheck, AlertCircle, Clock, CheckCircle2,
    Briefcase
} from 'lucide-react';

interface Empresa {
    _id: string;
    rut: string;
    razonSocial: string;
    direccion: string;
    telefono: string;
    emailContacto: string;
    rubro: string;
    estado: string;
    convenioNumero: string;
    convenioFechaInicio: string;
    convenioFechaTermino: string;
    convenioEstado: string;
    createdAt: string;
    updatedAt: string;
}

const initialForm = {
    rut: '',
    razonSocial: '',
    direccion: '',
    telefono: '',
    emailContacto: '',
    rubro: '',
    estado: 'Activo',
    convenioNumero: '',
    convenioFechaInicio: '',
    convenioFechaTermino: '',
    convenioEstado: 'Vigente'
};

export default function EmpresasPage() {
    const permissions = usePermissions();
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState<string>('all');
    const [filterConvenio, setFilterConvenio] = useState<string>('all');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState(initialForm);
    const [rutFeedback, setRutFeedback] = useState<{ isValid: boolean; message: string } | null>(null);

    // Detail modal
    const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const canManage = permissions.isSuperAdmin || permissions.isDirector || permissions.isUTP;

    const loadEmpresas = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/empresas');
            setEmpresas(data);
        } catch (error) {
            console.error('Error loading empresas:', error);
            toast.error('Error al cargar empresas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEmpresas();
    }, []);

    const handleRutChange = (value: string) => {
        setFormData({ ...formData, rut: value });
        if (value.length > 7) {
            if (validarRUT(value)) {
                setRutFeedback({ isValid: true, message: '✓ RUT Válido y Operativo' });
            } else {
                setRutFeedback({ isValid: false, message: '✕ RUT Erróneo o mal ingresado' });
            }
        } else {
            setRutFeedback(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validarRUT(formData.rut)) {
            setRutFeedback({ isValid: false, message: 'RUT de Empresa Inválido.' });
            return;
        }

        try {
            const payload = {
                ...formData,
                rut: formatearRUT(formData.rut)
            };

            if (editingId) {
                await api.put(`/empresas/${editingId}`, payload);
                toast.success('Empresa actualizada exitosamente');
            } else {
                await api.post('/empresas', payload);
                toast.success('Empresa registrada exitosamente');
            }

            setIsModalOpen(false);
            setEditingId(null);
            setFormData(initialForm);
            setRutFeedback(null);
            loadEmpresas();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar empresa');
        }
    };

    const handleEdit = (empresa: Empresa) => {
        setFormData({
            rut: empresa.rut || '',
            razonSocial: empresa.razonSocial || '',
            direccion: empresa.direccion || '',
            telefono: empresa.telefono || '',
            emailContacto: empresa.emailContacto || '',
            rubro: empresa.rubro || '',
            estado: empresa.estado || 'Activo',
            convenioNumero: empresa.convenioNumero || '',
            convenioFechaInicio: empresa.convenioFechaInicio ? new Date(empresa.convenioFechaInicio).toISOString().split('T')[0] : '',
            convenioFechaTermino: empresa.convenioFechaTermino ? new Date(empresa.convenioFechaTermino).toISOString().split('T')[0] : '',
            convenioEstado: empresa.convenioEstado || 'Vigente'
        });
        setEditingId(empresa._id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Seguro que deseas eliminar esta empresa? Esta acción no se puede deshacer.')) return;
        try {
            await api.delete(`/empresas/${id}`);
            toast.success('Empresa eliminada exitosamente');
            loadEmpresas();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al eliminar empresa');
        }
    };

    const getConvenioStatus = (empresa: Empresa) => {
        if (!empresa.convenioFechaTermino) return { label: 'Sin Convenio', color: 'bg-slate-100 text-slate-500' };
        const endDate = new Date(empresa.convenioFechaTermino);
        const now = new Date();
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) return { label: 'Vencido', color: 'bg-rose-100 text-rose-600' };
        if (daysRemaining < 90) return { label: `Vence en ${daysRemaining}d`, color: 'bg-amber-100 text-amber-700' };
        return { label: 'Vigente', color: 'bg-emerald-100 text-emerald-600' };
    };

    const filteredEmpresas = empresas.filter(e => {
        const matchesSearch =
            e.razonSocial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.rut?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.rubro?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesEstado = filterEstado === 'all' || e.estado === filterEstado;

        let matchesConvenio = true;
        if (filterConvenio !== 'all') {
            const status = getConvenioStatus(e);
            if (filterConvenio === 'vigente') matchesConvenio = status.label === 'Vigente' || status.label.startsWith('Vence');
            else if (filterConvenio === 'vencido') matchesConvenio = status.label === 'Vencido';
            else if (filterConvenio === 'sin') matchesConvenio = status.label === 'Sin Convenio';
        }

        return matchesSearch && matchesEstado && matchesConvenio;
    });

    // Stats
    const totalEmpresas = empresas.length;
    const conveniosVigentes = empresas.filter(e => {
        const s = getConvenioStatus(e);
        return s.label === 'Vigente' || s.label.startsWith('Vence');
    }).length;
    const conveniosVencidos = empresas.filter(e => getConvenioStatus(e).label === 'Vencido').length;
    const porVencer = empresas.filter(e => getConvenioStatus(e).label.startsWith('Vence')).length;

    return (
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#002447] uppercase tracking-tighter flex items-center gap-3">
                        <div className="p-2.5 bg-[#002447]/5 text-[#2DAAB8] rounded-xl">
                            <Building2 size={24} />
                        </div>
                        Empresas y Convenios
                    </h1>
                    <p className="text-slate-500 font-bold text-sm tracking-wide mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#2DAAB8] animate-pulse"></span>
                        Gestión de Empresas Receptoras y Convenios de Alternancia
                    </p>
                </div>
                {canManage && (
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData(initialForm);
                            setRutFeedback(null);
                            setIsModalOpen(true);
                        }}
                        className="bg-[#002447] hover:bg-[#003666] text-white px-8 py-4 rounded-[1.5rem] flex items-center gap-3 font-black uppercase text-xs tracking-[0.2em] transition-all shadow-2xl shadow-[#002447]/30 active:scale-95 border-b-4 border-[#00152b]"
                    >
                        <Plus size={18} /> Registrar Empresa
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-5 border border-white shadow-xl shadow-[#002447]/5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Empresas</p>
                    <p className="text-3xl font-black text-[#002447]">{totalEmpresas}</p>
                </div>
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-5 border border-white shadow-xl shadow-emerald-500/5">
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Convenios Vigentes</p>
                    <p className="text-3xl font-black text-emerald-600">{conveniosVigentes}</p>
                </div>
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-5 border border-white shadow-xl shadow-amber-500/5">
                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Por Vencer (&lt;90d)</p>
                    <p className="text-3xl font-black text-amber-600">{porVencer}</p>
                </div>
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-5 border border-white shadow-xl shadow-rose-500/5">
                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Convenios Vencidos</p>
                    <p className="text-3xl font-black text-rose-600">{conveniosVencidos}</p>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 bg-white/60 backdrop-blur-xl rounded-2xl p-1.5 shadow-2xl shadow-[#002447]/5 border border-white/80 flex items-center gap-3 focus-within:ring-4 ring-[#2DAAB8]/10 transition-all">
                    <div className="p-2.5 bg-[#002447] rounded-xl text-[#2DAAB8]">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por Razón Social, RUT o Rubro..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full py-3 bg-transparent focus:outline-none text-sm font-black text-[#002447] placeholder:text-slate-300"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={filterEstado}
                        onChange={(e) => setFilterEstado(e.target.value)}
                        className="bg-white/80 backdrop-blur-xl rounded-2xl px-5 py-3 border border-white/80 text-xs font-black text-[#002447] uppercase tracking-wider shadow-lg focus:outline-none focus:ring-4 ring-[#2DAAB8]/10"
                    >
                        <option value="all">Todos los Estados</option>
                        <option value="Activo">Activas</option>
                        <option value="Inactivo">Inactivas</option>
                    </select>
                    <select
                        value={filterConvenio}
                        onChange={(e) => setFilterConvenio(e.target.value)}
                        className="bg-white/80 backdrop-blur-xl rounded-2xl px-5 py-3 border border-white/80 text-xs font-black text-[#002447] uppercase tracking-wider shadow-lg focus:outline-none focus:ring-4 ring-[#2DAAB8]/10"
                    >
                        <option value="all">Todos los Convenios</option>
                        <option value="vigente">Vigentes</option>
                        <option value="vencido">Vencidos</option>
                        <option value="sin">Sin Convenio</option>
                    </select>
                </div>
            </div>

            {/* Table / Cards */}
            {loading ? (
                <div className="py-20 text-center animate-pulse flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-slate-100 border-t-[#2DAAB8] rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-bold mt-4 uppercase tracking-widest text-[10px]">Cargando Registro de Empresas...</p>
                </div>
            ) : filteredEmpresas.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center">
                    <Building2 size={48} className="text-slate-200 mb-4" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No se encontraron empresas</p>
                    <p className="text-slate-300 text-xs mt-1">Ajusta los filtros o registra una nueva empresa</p>
                </div>
            ) : (
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-2xl shadow-[#002447]/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-[#002447] to-[#004080] text-white">
                                    <th className="text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest">Empresa</th>
                                    <th className="text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest">RUT</th>
                                    <th className="text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest">Rubro</th>
                                    <th className="text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest">Contacto</th>
                                    <th className="text-center px-6 py-4 text-[9px] font-black uppercase tracking-widest">Estado</th>
                                    <th className="text-center px-6 py-4 text-[9px] font-black uppercase tracking-widest">Convenio</th>
                                    <th className="text-center px-6 py-4 text-[9px] font-black uppercase tracking-widest">Vigencia</th>
                                    {canManage && <th className="text-center px-6 py-4 text-[9px] font-black uppercase tracking-widest">Acciones</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmpresas.map((empresa, idx) => {
                                    const convenioStatus = getConvenioStatus(empresa);
                                    return (
                                        <tr
                                            key={empresa._id}
                                            className={`border-b border-slate-50 hover:bg-[#2DAAB8]/5 transition-colors cursor-pointer ${idx % 2 === 0 ? 'bg-white/50' : 'bg-slate-50/30'}`}
                                            onClick={() => { setSelectedEmpresa(empresa); setIsDetailOpen(true); }}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-[#002447] to-[#004080] rounded-xl flex items-center justify-center text-white shadow-md">
                                                        <Building2 size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-[#002447] text-sm">{empresa.razonSocial}</p>
                                                        {empresa.direccion && <p className="text-[9px] text-slate-400 font-bold mt-0.5 flex items-center gap-1"><MapPin size={10} /> {empresa.direccion}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono font-black text-xs text-slate-600">{empresa.rut}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-slate-500">{empresa.rubro || '—'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    {empresa.emailContacto && <p className="text-[10px] text-slate-500 flex items-center gap-1"><Mail size={10} /> {empresa.emailContacto}</p>}
                                                    {empresa.telefono && <p className="text-[10px] text-slate-500 flex items-center gap-1"><Phone size={10} /> {empresa.telefono}</p>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider ${empresa.estado === 'Activo' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    {empresa.estado}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-[10px] font-bold text-slate-500">{empresa.convenioNumero || '—'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider ${convenioStatus.color}`}>
                                                    {convenioStatus.label}
                                                </span>
                                            </td>
                                            {canManage && (
                                                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(empresa)}
                                                            className="p-2 bg-[#2DAAB8]/10 hover:bg-[#2DAAB8] rounded-xl text-[#2DAAB8] hover:text-white transition-all"
                                                            title="Editar"
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(empresa._id)}
                                                            className="p-2 bg-rose-50 hover:bg-rose-500 rounded-xl text-rose-400 hover:text-white transition-all"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#002447]/60 backdrop-blur-md p-4 animate-in fade-in">
                    <div className="bg-white/95 backdrop-blur-2xl rounded-3xl w-full max-w-3xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col border-2 border-white">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-[#002447] to-[#004080] text-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-[#2DAAB8] rounded-xl shadow-lg shadow-[#2DAAB8]/20">
                                    <Building2 size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tighter">
                                        {editingId ? 'Editar Empresa' : 'Registrar Nueva Empresa'}
                                    </h2>
                                    <p className="text-[10px] font-bold text-white/50 tracking-[0.2em] uppercase mt-1">Convenio de Alternancia Dual</p>
                                </div>
                            </div>
                            <button onClick={() => { setIsModalOpen(false); setRutFeedback(null); }} className="p-3 hover:bg-white/10 rounded-full transition-colors text-white">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="overflow-y-auto p-8 custom-scrollbar">
                            <form onSubmit={handleSubmit} className="space-y-10">
                                {/* Section: Datos de la Empresa */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b-2 border-slate-50 pb-4">
                                        <Building2 className="text-[#2DAAB8]" size={20} />
                                        <h3 className="font-black text-[#002447] uppercase tracking-widest text-xs">Datos de la Empresa</h3>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RUT Empresa</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.rut}
                                                onChange={(e) => handleRutChange(e.target.value)}
                                                placeholder="76.123.456-7"
                                                className={`w-full px-5 py-4 rounded-xl border-2 font-black text-[#002447] text-xs shadow-inner outline-none transition-all ${
                                                    rutFeedback
                                                        ? rutFeedback.isValid
                                                            ? 'border-emerald-300 bg-emerald-50/30 focus:border-emerald-500'
                                                            : 'border-rose-300 bg-rose-50/30 focus:border-rose-500'
                                                        : 'border-slate-50 bg-slate-50/50 focus:border-[#2DAAB8]'
                                                }`}
                                            />
                                            {rutFeedback && (
                                                <p className={`text-[10px] font-black ml-1 ${rutFeedback.isValid ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {rutFeedback.message}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Razón Social</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.razonSocial}
                                                onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                                                placeholder="Nombre legal de la empresa"
                                                className="w-full px-5 py-4 rounded-xl border-2 border-slate-50 focus:border-[#2DAAB8] bg-slate-50/50 font-black text-[#002447] text-xs shadow-inner outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rubro / Sector</label>
                                            <input
                                                type="text"
                                                value={formData.rubro}
                                                onChange={(e) => setFormData({ ...formData, rubro: e.target.value })}
                                                placeholder="Ej: Gastronomía, Mecánica Industrial..."
                                                className="w-full px-5 py-4 rounded-xl border-2 border-slate-50 focus:border-[#2DAAB8] bg-slate-50/50 font-black text-[#002447] text-xs shadow-inner outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado</label>
                                            <select
                                                value={formData.estado}
                                                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                                className="w-full px-5 py-4 rounded-xl border-2 border-slate-50 focus:border-[#2DAAB8] bg-slate-50/50 font-black text-[#002447] text-xs shadow-inner outline-none transition-all"
                                            >
                                                <option value="Activo">Activo</option>
                                                <option value="Inactivo">Inactivo</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección</label>
                                            <input
                                                type="text"
                                                value={formData.direccion}
                                                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                                placeholder="Dirección completa"
                                                className="w-full px-5 py-4 rounded-xl border-2 border-slate-50 focus:border-[#2DAAB8] bg-slate-50/50 font-black text-[#002447] text-xs shadow-inner outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                                            <input
                                                type="text"
                                                value={formData.telefono}
                                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                                placeholder="+56 9 1234 5678"
                                                className="w-full px-5 py-4 rounded-xl border-2 border-slate-50 focus:border-[#2DAAB8] bg-slate-50/50 font-black text-[#002447] text-xs shadow-inner outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email de Contacto</label>
                                            <input
                                                type="email"
                                                value={formData.emailContacto}
                                                onChange={(e) => setFormData({ ...formData, emailContacto: e.target.value })}
                                                placeholder="contacto@empresa.cl"
                                                className="w-full px-5 py-4 rounded-xl border-2 border-slate-50 focus:border-[#2DAAB8] bg-slate-50/50 font-black text-[#002447] text-xs shadow-inner outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Convenio */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b-2 border-slate-50 pb-4">
                                        <FileText className="text-[#2DAAB8]" size={20} />
                                        <h3 className="font-black text-[#002447] uppercase tracking-widest text-xs">Convenio de Colaboración</h3>
                                    </div>

                                    <div className="bg-[#2DAAB8]/5 p-5 rounded-2xl border border-[#2DAAB8]/10">
                                        <div className="flex items-center gap-2 mb-4">
                                            <ShieldCheck size={16} className="text-[#2DAAB8]" />
                                            <p className="text-[10px] font-black text-[#2DAAB8] uppercase tracking-widest">Acuerdo de Formación Dual</p>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">N° de Convenio</label>
                                                <input
                                                    type="text"
                                                    value={formData.convenioNumero}
                                                    onChange={(e) => setFormData({ ...formData, convenioNumero: e.target.value })}
                                                    placeholder="CONV-2026-001"
                                                    className="w-full px-5 py-4 rounded-xl border-2 border-[#2DAAB8]/20 focus:border-[#2DAAB8] bg-white font-black text-[#002447] text-xs shadow-inner outline-none transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado del Convenio</label>
                                                <select
                                                    value={formData.convenioEstado}
                                                    onChange={(e) => setFormData({ ...formData, convenioEstado: e.target.value })}
                                                    className="w-full px-5 py-4 rounded-xl border-2 border-[#2DAAB8]/20 focus:border-[#2DAAB8] bg-white font-black text-[#002447] text-xs shadow-inner outline-none transition-all"
                                                >
                                                    <option value="Vigente">Vigente</option>
                                                    <option value="Vencido">Vencido</option>
                                                    <option value="Pendiente">Pendiente</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha de Inicio</label>
                                                <input
                                                    type="date"
                                                    value={formData.convenioFechaInicio}
                                                    onChange={(e) => setFormData({ ...formData, convenioFechaInicio: e.target.value })}
                                                    className="w-full px-5 py-4 rounded-xl border-2 border-[#2DAAB8]/20 focus:border-[#2DAAB8] bg-white font-black text-[#002447] text-xs shadow-inner outline-none transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha de Término</label>
                                                <input
                                                    type="date"
                                                    value={formData.convenioFechaTermino}
                                                    onChange={(e) => setFormData({ ...formData, convenioFechaTermino: e.target.value })}
                                                    className="w-full px-5 py-4 rounded-xl border-2 border-[#2DAAB8]/20 focus:border-[#2DAAB8] bg-white font-black text-[#002447] text-xs shadow-inner outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => { setIsModalOpen(false); setRutFeedback(null); }}
                                        className="flex-1 py-4 rounded-2xl border-2 border-slate-100 text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#002447] to-[#004080] text-white font-black uppercase text-xs tracking-widest shadow-2xl shadow-[#002447]/30 hover:shadow-[#002447]/50 transition-all active:scale-[0.98] border-b-4 border-[#00152b]"
                                    >
                                        {editingId ? 'Actualizar Empresa' : 'Registrar Empresa'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {isDetailOpen && selectedEmpresa && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#002447]/60 backdrop-blur-md p-4 animate-in fade-in">
                    <div className="bg-white/95 backdrop-blur-2xl rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border-2 border-white">
                        {/* Detail Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-[#002447] to-[#004080] text-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-[#2DAAB8] rounded-xl shadow-lg shadow-[#2DAAB8]/20">
                                    <Building2 size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tighter">{selectedEmpresa.razonSocial}</h2>
                                    <p className="text-[10px] font-bold text-white/50 tracking-[0.2em] uppercase mt-1">{selectedEmpresa.rut}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsDetailOpen(false)} className="p-3 hover:bg-white/10 rounded-full transition-colors text-white">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Detail Body */}
                        <div className="overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            {/* Company Info */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Briefcase size={12} /> Rubro</p>
                                    <p className="font-black text-[#002447] text-sm">{selectedEmpresa.rubro || 'No especificado'}</p>
                                </div>
                                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><CheckCircle2 size={12} /> Estado</p>
                                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase ${selectedEmpresa.estado === 'Activo' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                        {selectedEmpresa.estado}
                                    </span>
                                </div>
                                {selectedEmpresa.direccion && (
                                    <div className="col-span-2 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><MapPin size={12} /> Dirección</p>
                                        <p className="font-bold text-slate-700 text-sm">{selectedEmpresa.direccion}</p>
                                    </div>
                                )}
                                {selectedEmpresa.telefono && (
                                    <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Phone size={12} /> Teléfono</p>
                                        <p className="font-bold text-slate-700 text-sm">{selectedEmpresa.telefono}</p>
                                    </div>
                                )}
                                {selectedEmpresa.emailContacto && (
                                    <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Mail size={12} /> Email</p>
                                        <p className="font-bold text-slate-700 text-sm">{selectedEmpresa.emailContacto}</p>
                                    </div>
                                )}
                            </div>

                            {/* Convenio Section */}
                            <div className="space-y-4">
                                <h3 className="font-black text-[#002447] uppercase tracking-widest text-xs flex items-center gap-2 border-b-2 border-slate-50 pb-3">
                                    <FileText size={16} className="text-[#2DAAB8]" /> Convenio de Colaboración
                                </h3>

                                {selectedEmpresa.convenioNumero ? (
                                    <div className="bg-[#2DAAB8]/5 p-6 rounded-2xl border border-[#2DAAB8]/10 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">N° Convenio</p>
                                                <p className="font-black text-[#002447] text-lg">{selectedEmpresa.convenioNumero}</p>
                                            </div>
                                            <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider ${getConvenioStatus(selectedEmpresa).color}`}>
                                                {getConvenioStatus(selectedEmpresa).label}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={10} /> Inicio</p>
                                                <p className="font-bold text-slate-700 text-sm mt-1">
                                                    {selectedEmpresa.convenioFechaInicio ? new Date(selectedEmpresa.convenioFechaInicio).toLocaleDateString('es-CL') : '—'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Clock size={10} /> Término</p>
                                                <p className="font-bold text-slate-700 text-sm mt-1">
                                                    {selectedEmpresa.convenioFechaTermino ? new Date(selectedEmpresa.convenioFechaTermino).toLocaleDateString('es-CL') : '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                                        <AlertCircle size={24} className="text-slate-300 mx-auto mb-2" />
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sin Convenio Registrado</p>
                                        <p className="text-[10px] text-slate-300 mt-1">Edita esta empresa para agregar un convenio</p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            {canManage && (
                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => { setIsDetailOpen(false); handleEdit(selectedEmpresa); }}
                                        className="flex-1 py-4 rounded-2xl bg-[#2DAAB8]/10 hover:bg-[#2DAAB8] text-[#2DAAB8] hover:text-white font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2"
                                    >
                                        <Edit size={16} /> Editar Empresa
                                    </button>
                                    <button
                                        onClick={() => { setIsDetailOpen(false); handleDelete(selectedEmpresa._id); }}
                                        className="py-4 px-8 rounded-2xl bg-rose-50 hover:bg-rose-500 text-rose-400 hover:text-white font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
