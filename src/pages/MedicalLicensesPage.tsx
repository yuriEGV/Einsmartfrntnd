import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { 
    Plus, Calendar, 
    Loader2,
    Trash2, Check, X
} from 'lucide-react';

interface MedicalLicense {
    _id: string;
    userId: { _id: string; name: string; role: string } | string;
    userName?: string;  // Campo plano retornado por el backend como fallback
    userType: 'Estudiante' | 'Funcionario';
    fechaInicio: string;
    fechaFin: string;
    diasReposo: number;
    tipo: string;
    estado: 'Pendiente' | 'Aprobado' | 'Rechazado';
    documentoUrl?: string;
    esElectronica: boolean;
    fechaEntrega?: string;
    observaciones?: string;
    createdAt: string;
}

const getUserName = (license: MedicalLicense): string => {
    // Prioridad: campo plano userName > objeto userId.name > fallback
    if (license.userName) return license.userName;
    const userId = license.userId;
    if (!userId) return 'Usuario desconocido';
    if (typeof userId === 'object' && userId.name) return userId.name;
    // Si es string y parece un ObjectId largo, mostrar texto amigable
    if (typeof userId === 'string' && userId.length > 20) return 'Usuario (ID no resuelto)';
    if (typeof userId === 'string') return userId;
    return 'Sin nombre';
};

const MedicalLicensesPage = () => {
    const permissions = usePermissions();
    const [licenses, setLicenses] = useState<MedicalLicense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filterType, setFilterType] = useState<'all' | 'Estudiante' | 'Funcionario'>('all');

    const [formData, setFormData] = useState({
        userId: '',
        userType: 'Estudiante' as 'Estudiante' | 'Funcionario',
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaFin: new Date().toISOString().split('T')[0],
        tipo: 'Médica',
        esElectronica: true,
        observaciones: '',
        diasReposo: 1
    });

    const calculateDays = (start: string, end: string) => {
        const d1 = new Date(start);
        const d2 = new Date(end);
        const diff = d2.getTime() - d1.getTime();
        return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
    };

    const handleDateChange = (field: 'fechaInicio' | 'fechaFin', value: string) => {
        const newFormData = { ...formData, [field]: value };
        newFormData.diasReposo = calculateDays(newFormData.fechaInicio, newFormData.fechaFin);
        setFormData(newFormData);
    };

    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        fetchLicenses();
        fetchUsers();
    }, []);

    const fetchLicenses = async () => {
        setLoading(true);
        try {
            const res = await api.get('/medical-licenses');
            setLicenses(res.data);
        } catch (error) {
            console.error('Error fetching licenses:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/medical-licenses', formData);
            alert('Licencia registrada con éxito');
            setShowModal(false);
            fetchLicenses();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al registrar licencia');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar esta licencia?')) return;
        try {
            await api.delete(`/medical-licenses/${id}`);
            fetchLicenses();
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    const handleStatusUpdate = async (id: string, estado: 'Aprobado' | 'Rechazado') => {
        try {
            await api.put(`/medical-licenses/${id}`, { estado });
            fetchLicenses();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al actualizar estado');
        }
    };

    const filteredLicenses = licenses.filter((l: MedicalLicense) => 
        (filterType === 'all' || l.userType === filterType)
    );

    if (loading && licenses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando Licencias...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-[#11355a] tracking-tight flex items-center gap-4">
                        <div className="p-4 bg-rose-50 rounded-3xl border border-rose-100 shadow-sm">
                            <Plus size={40} className="text-rose-600" />
                        </div>
                        Gestión de Licencias Médicas
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg font-medium">Control centralizado de licencias para alumnos y funcionarios.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-[#11355a] text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-900 transition-all shadow-xl active:scale-95"
                >
                    <Plus size={24} /> NUEVA LICENCIA
                </button>
            </div>

            <div className="flex gap-4">
                <button onClick={() => setFilterType('all')} className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest border transition-all ${filterType === 'all' ? 'bg-[#11355a] text-white' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>Todos</button>
                <button onClick={() => setFilterType('Estudiante')} className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest border transition-all ${filterType === 'Estudiante' ? 'bg-[#11355a] text-white' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>Alumnos</button>
                <button onClick={() => setFilterType('Funcionario')} className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest border transition-all ${filterType === 'Funcionario' ? 'bg-[#11355a] text-white' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>Funcionarios</button>
            </div>

            <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-50 overflow-hidden">
                <div className="divide-y divide-slate-50">
                    {filteredLicenses.length === 0 ? (
                        <div className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">No hay licencias registradas.</div>
                    ) : (
                        filteredLicenses.map(license => (
                            <div key={license._id} className="p-8 hover:bg-slate-50/50 transition-all flex flex-col md:flex-row items-center gap-8">
                                <div className="w-24 h-24 bg-rose-50 rounded-3xl border-2 border-rose-100 flex flex-col items-center justify-center text-center shadow-sm shrink-0">
                                    <div className="text-2xl font-black text-rose-800">{license.diasReposo}</div>
                                    <div className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Días</div>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${license.userType === 'Estudiante' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                            {license.userType}
                                        </span>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Desde {new Date(license.fechaInicio).toLocaleDateString()} hasta {new Date(license.fechaFin).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{getUserName(license)}</h3>
                                    <p className="text-sm font-bold text-slate-500 italic">{license.tipo} - {license.observaciones || 'Sin observaciones'}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
                                        license.estado === 'Aprobado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                        license.estado === 'Rechazado' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                        'bg-slate-50 text-slate-400 border-slate-100'
                                    }`}>
                                        {license.estado}
                                    </div>
                                    
                                    {license.estado === 'Pendiente' && permissions.isAdmin && (
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleStatusUpdate(license._id, 'Aprobado')}
                                                className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"
                                                title="Aprobar"
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleStatusUpdate(license._id, 'Rechazado')}
                                                className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all"
                                                title="Rechazar"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    )}

                                    <button onClick={() => handleDelete(license._id)} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal for new license */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[999] flex items-center justify-center p-4 md:pl-[300px]">
                    <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl border-8 border-white overflow-hidden scroll-y">
                        <div className="bg-[#11355a] p-10 text-white relative">
                            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none mb-2">Registrar Licencia</h2>
                            <p className="text-blue-300 font-extrabold uppercase text-[10px] tracking-[0.3em]">MÓDULO DE SALUD</p>
                            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-10 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tipo de Usuario</label>
                                    <select 
                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:border-blue-500"
                                        value={formData.userType}
                                        onChange={e => setFormData({ ...formData, userType: e.target.value as any, userId: '' })}
                                    >
                                        <option value="Estudiante">Estudiante</option>
                                        <option value="Funcionario">Funcionario</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Usuario</label>
                                    <select 
                                        required
                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:border-blue-500"
                                        value={formData.userId}
                                        onChange={e => setFormData({ ...formData, userId: e.target.value })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {users.filter(u => 
                                            formData.userType === 'Estudiante' ? u.role === 'student' : u.role !== 'student' && u.role !== 'apoderado'
                                        ).map(u => (
                                            <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fecha Inicio</label>
                                    <input 
                                        type="date" 
                                        required
                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:border-blue-500"
                                        value={formData.fechaInicio}
                                        onChange={e => handleDateChange('fechaInicio', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fecha Fin</label>
                                    <input 
                                        type="date" 
                                        required
                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:border-blue-500"
                                        value={formData.fechaFin}
                                        onChange={e => handleDateChange('fechaFin', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100 flex items-center justify-between shadow-sm">
                                <div>
                                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-1">Total de Reposo</p>
                                    <p className="text-2xl font-black text-rose-800 uppercase tracking-tighter">{formData.diasReposo} Días Naturales</p>
                                </div>
                                <Calendar className="text-rose-200" size={40} />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tipo de Licencia</label>
                                    <select 
                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:border-blue-500"
                                        value={formData.tipo}
                                        onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                                    >
                                        <option value="Médica">Médica</option>
                                        <option value="Administrativa">Administrativa</option>
                                        <option value="Especial">Especial</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">¿Es Electrónica (LME)?</label>
                                    <div className="flex gap-4 mt-2">
                                        <button 
                                            type="button"
                                            onClick={() => setFormData({ ...formData, esElectronica: true })}
                                            className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all ${formData.esElectronica ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-400 border-slate-100'}`}
                                        >Sí</button>
                                        <button 
                                            type="button"
                                            onClick={() => setFormData({ ...formData, esElectronica: false })}
                                            className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all ${!formData.esElectronica ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-slate-400 border-slate-100'}`}
                                        >No</button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Observaciones</label>
                                <textarea 
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-600 outline-none focus:border-blue-500 resize-none"
                                    rows={3}
                                    placeholder="Detalles adicionales..."
                                    value={formData.observaciones}
                                    onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="w-full bg-[#11355a] text-white py-6 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:bg-blue-900 transition-all">Guardar Licencia</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicalLicensesPage;
