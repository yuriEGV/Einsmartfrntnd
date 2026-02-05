
import { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { UserCog, Search, Edit, Save, X, Phone, Mail, User as UserIcon } from 'lucide-react';

interface Student {
    _id: string;
    nombres: string;
    apellidos: string;
}

interface Guardian {
    _id: string;
    nombres: string;
    apellidos: string;
    rut: string;
    email: string;
    telefono: string;
    parentesco: string;
    tipo: 'principal' | 'secundario';
    estudianteId: Student | string;
    financialStatus?: 'solvente' | 'moroso' | 'exento';
}

const GuardiansPage = () => {
    const { isSostenedor, isSuperAdmin, isDirector, isTeacher } = usePermissions();
    const canManage = isSostenedor || isSuperAdmin || isDirector || isTeacher;

    const [guardians, setGuardians] = useState<Guardian[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [selectedGuardian, setSelectedGuardian] = useState<Guardian | null>(null);
    const [formData, setFormData] = useState({
        nombres: '',
        apellidos: '',
        rut: '',
        email: '',
        telefono: '',
        parentesco: '',
        tipo: 'principal'
    });

    useEffect(() => {
        fetchGuardians();
    }, []);

    const fetchGuardians = async () => {
        setLoading(true);
        try {
            const res = await api.get('/apoderados');
            setGuardians(res.data);
        } catch (error) {
            console.error('Error fetching guardians:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (guardian: Guardian) => {
        setSelectedGuardian(guardian);
        setFormData({
            nombres: guardian.nombres || '',
            apellidos: guardian.apellidos || '',
            rut: guardian.rut || '',
            email: guardian.email || '',
            telefono: guardian.telefono || '',
            parentesco: guardian.parentesco || '',
            tipo: guardian.tipo || 'principal'
        });
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGuardian) return;

        try {
            await api.put(`/apoderados/${selectedGuardian._id}`, formData);
            alert('Datos del apoderado actualizados');
            setShowModal(false);
            fetchGuardians();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al actualizar apoderado');
        }
    };

    const filteredGuardians = guardians.filter(g => {
        const fullName = `${g.nombres || ''} ${g.apellidos || ''}`.toLowerCase();
        const rut = (g.rut || '').toLowerCase();
        const studentName = (g.estudianteId && typeof g.estudianteId === 'object')
            ? `${g.estudianteId.nombres || ''} ${g.estudianteId.apellidos || ''}`.toLowerCase()
            : '';

        return fullName.includes(searchTerm.toLowerCase()) ||
            rut.includes(searchTerm.toLowerCase()) ||
            studentName.includes(searchTerm.toLowerCase());
    });

    if (!canManage) {
        return <div className="p-8 text-center text-gray-500">No tienes permisos para acceder a esta sección.</div>;
    }

    return (
        <div className="p-4 md:p-10 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100/50">
                            <UserCog size={32} className="text-indigo-600" />
                        </div>
                        Gestión de Apoderados
                    </h1>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2 ml-1">
                        ADMINISTRACIÓN DE PERFILES Y CONTACTOS
                    </p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-4 max-w-2xl">
                <Search className="text-slate-300 ml-2" />
                <input
                    type="text"
                    placeholder="Buscar por nombre, RUT o estudiante..."
                    className="flex-1 outline-none font-bold text-slate-700 placeholder:text-slate-300"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center p-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredGuardians.map(g => (
                        <div key={g._id} className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 group hover:border-indigo-200 transition-all flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-400 text-xl border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm italic">
                                    {(g.nombres || 'A').charAt(0)}
                                </div>
                                <button
                                    onClick={() => handleEdit(g)}
                                    className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                >
                                    <Edit size={20} />
                                </button>
                            </div>

                            <div className="flex-1 space-y-4">
                                <div>
                                    <h3 className="font-black text-slate-800 text-lg uppercase leading-none mb-1 group-hover:text-indigo-600 transition-colors">
                                        {g.nombres} {g.apellidos}
                                    </h3>
                                    <div className="text-[10px] font-black text-indigo-500 font-mono tracking-widest uppercase opacity-60">RUT: {g.rut}</div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <Mail size={16} className="text-slate-300" />
                                        <span className="text-xs font-bold truncate">{g.email || 'Sin correo'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <Phone size={16} className="text-slate-300" />
                                        <span className="text-xs font-bold">{g.telefono || 'Sin teléfono'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <UserIcon size={16} className="text-slate-300" />
                                        <span className="text-xs font-bold uppercase tracking-tight">
                                            Estudiante: {(g.estudianteId && typeof g.estudianteId === 'object') ? `${g.estudianteId.nombres} ${g.estudianteId.apellidos}` : 'No cargado'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <div className="flex gap-2">
                                    <span className={`px-2 py-1 rounded-lg ${g.tipo === 'principal' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500'}`}>
                                        {g.tipo}
                                    </span>
                                    <span className={g.parentesco ? 'px-2 py-1 bg-slate-50 rounded-lg' : ''}>{g.parentesco}</span>
                                </div>
                                <div className={`px-3 py-1 rounded-full font-black tracking-tighter ${g.financialStatus === 'moroso' ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/20' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'}`}>
                                    {g.financialStatus || 'solvente'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[999] flex items-center justify-center p-4 md:pl-[300px] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-[0_0_80px_rgba(0,0,0,0.3)] border-8 border-white overflow-hidden animate-in zoom-in-95 duration-500 max-h-[90vh] overflow-y-auto">
                        <div className="bg-indigo-600 p-10 text-white relative overflow-hidden">
                            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none mb-2">Editar Perfil</h2>
                            <p className="text-indigo-200 font-extrabold uppercase text-[10px] tracking-[0.3em]">INFORMACIÓN DEL APODERADO</p>
                            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSave} className="p-10 space-y-6 bg-slate-50/30">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombres</label>
                                    <input
                                        required
                                        className="w-full px-5 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-slate-700 text-sm transition-all"
                                        value={formData.nombres}
                                        onChange={e => setFormData({ ...formData, nombres: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Apellidos</label>
                                    <input
                                        required
                                        className="w-full px-5 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-slate-700 text-sm transition-all"
                                        value={formData.apellidos}
                                        onChange={e => setFormData({ ...formData, apellidos: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RUT</label>
                                <input
                                    required
                                    className="w-full px-5 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-slate-700 text-sm transition-all"
                                    value={formData.rut}
                                    onChange={e => setFormData({ ...formData, rut: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-5 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-slate-700 text-sm transition-all"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                                <input
                                    className="w-full px-5 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-slate-700 text-sm transition-all"
                                    value={formData.telefono}
                                    onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Parentesco</label>
                                    <select
                                        className="w-full px-5 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-slate-700 text-sm"
                                        value={formData.parentesco}
                                        onChange={e => setFormData({ ...formData, parentesco: e.target.value })}
                                    >
                                        <option value="Padre">Padre</option>
                                        <option value="Madre">Madre</option>
                                        <option value="Abuelo/a">Abuelo/a</option>
                                        <option value="Tío/a">Tío/a</option>
                                        <option value="Tutor Legal">Tutor Legal</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prioridad</label>
                                    <select
                                        className="w-full px-5 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-slate-700 text-sm"
                                        value={formData.tipo}
                                        onChange={e => setFormData({ ...formData, tipo: e.target.value as 'principal' | 'secundario' })}
                                    >
                                        <option value="principal">Principal</option>
                                        <option value="secundario">Secundario</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-indigo-900/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4">
                                <Save size={18} />
                                Guardar Cambios
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GuardiansPage;
