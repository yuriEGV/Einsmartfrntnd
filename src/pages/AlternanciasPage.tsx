import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import api from '../services/api';
import { Briefcase, Plus, Search, Trash2, X, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

interface Alternancia {
    _id: string;
    estudianteId: { _id: string; firstName: string; lastName: string; rut: string };
    empresaInstitucion: string;
    tipo: string;
    fechaInicio: string;
    fechaTermino: string;
    estado: string;
    tutorEmpresa: string;
    profesorSupervisor: { _id: string; name: string };
}

export default function AlternanciasPage() {
    const { user } = useAuth();
    const permissions = usePermissions();
    const [alternancias, setAlternancias] = useState<Alternancia[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [careers, setCareers] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        estudianteId: '',
        careerId: '',
        empresaInstitucion: '',
        tipo: 'empresa',
        fechaInicio: '',
        fechaTermino: '',
        estado: 'activa',
        tutorEmpresa: '',
        profesorSupervisor: '',
        observaciones: ''
    });

    const loadData = async () => {
        try {
            setLoading(true);
            const [altsRes, stdRes, carRes, usersRes] = await Promise.all([
                api.get('/alternancias'),
                api.get('/estudiantes'),
                api.get('/careers').catch(() => ({ data: [] })), // in case tenant doesn't have careers
                api.get('/users').catch(() => ({ data: [] }))
            ]);
            setAlternancias(altsRes.data);
            setStudents(stdRes.data);
            setCareers(carRes.data);
            setUsers(usersRes.data);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/alternancias/${editingId}`, formData);
                toast.success('Alternancia actualizada correctamente');
            } else {
                await api.post('/alternancias', formData);
                toast.success('Alternancia registrada correctamente');
            }
            setIsModalOpen(false);
            setEditingId(null);
            loadData();
            // Reset form
            setFormData({
                estudianteId: '',
                careerId: '',
                empresaInstitucion: '',
                tipo: 'empresa',
                fechaInicio: '',
                fechaTermino: '',
                estado: 'activa',
                tutorEmpresa: '',
                profesorSupervisor: '',
                observaciones: ''
            });
        } catch (error) {
            console.error(error);
            toast.error(editingId ? 'Error al actualizar alternancia' : 'Error al registrar alternancia');
        }
    };

    const handleEdit = (alt: Alternancia) => {
        setFormData({
            estudianteId: alt.estudianteId?._id || '',
            careerId: (alt as any).careerId || '',
            empresaInstitucion: alt.empresaInstitucion || '',
            tipo: alt.tipo || 'empresa',
            fechaInicio: alt.fechaInicio ? new Date(alt.fechaInicio).toISOString().split('T')[0] : '',
            fechaTermino: alt.fechaTermino ? new Date(alt.fechaTermino).toISOString().split('T')[0] : '',
            estado: alt.estado || 'activa',
            tutorEmpresa: alt.tutorEmpresa || '',
            profesorSupervisor: alt.profesorSupervisor?._id || '',
            observaciones: (alt as any).observaciones || ''
        });
        setEditingId(alt._id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Seguro que deseas eliminar este registro?')) return;
        try {
            await api.delete(`/alternancias/${id}`);
            toast.success('Alternancia eliminada');
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('Error al eliminar');
        }
    };

    const filteredAlternancias = alternancias.filter(a =>
        a.estudianteId?.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.estudianteId?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.estudianteId?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.empresaInstitucion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                        <Briefcase className="text-blue-600" /> Alternancias (Educación TP)
                    </h1>
                    <p className="text-slate-500 font-bold text-sm tracking-wide">Gestiona el aprendizaje práctico en entornos reales para estudiantes</p>
                </div>
                {(permissions.isAdmin || user?.role === 'teacher' || user?.role === 'director' || user?.role === 'UTP' || permissions.isSuperAdmin) && (
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData({
                                estudianteId: '',
                                careerId: '',
                                empresaInstitucion: '',
                                tipo: 'empresa',
                                fechaInicio: '',
                                fechaTermino: '',
                                estado: 'activa',
                                tutorEmpresa: '',
                                profesorSupervisor: '',
                                observaciones: ''
                            });
                            setIsModalOpen(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-black uppercase text-xs tracking-widest transition-colors shadow-lg shadow-blue-600/20"
                    >
                        <Plus size={16} /> Nueva Alternancia
                    </button>
                )}
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por alumno, RUT o empresa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700 bg-slate-50"
                    />
                </div>

                {loading ? (
                    <div className="text-center py-10 text-slate-500 font-bold">Cargando alternancias...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="pb-4 font-black text-xs text-slate-400 tracking-widest uppercase">Estudiante</th>
                                    <th className="pb-4 font-black text-xs text-slate-400 tracking-widest uppercase">Institución / Tipo</th>
                                    <th className="pb-4 font-black text-xs text-slate-400 tracking-widest uppercase">Fechas</th>
                                    <th className="pb-4 font-black text-xs text-slate-400 tracking-widest uppercase">Supervisor</th>
                                    <th className="pb-4 font-black text-xs text-slate-400 tracking-widest uppercase">Estado</th>
                                    <th className="pb-4 font-black text-xs text-slate-400 tracking-widest uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAlternancias.map(alt => (
                                    <tr key={alt._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="py-4">
                                            <p className="font-bold text-slate-800 text-sm">{alt.estudianteId?.firstName} {alt.estudianteId?.lastName}</p>
                                            <p className="text-xs font-bold text-slate-500">{alt.estudianteId?.rut}</p>
                                        </td>
                                        <td className="py-4">
                                            <p className="font-bold text-blue-900 text-sm">{alt.empresaInstitucion}</p>
                                            <p className="text-xs font-black tracking-widest uppercase text-blue-400">{alt.tipo}</p>
                                        </td>
                                        <td className="py-4">
                                            <p className="text-xs font-bold text-slate-700">Inicio: {new Date(alt.fechaInicio).toLocaleDateString()}</p>
                                            {alt.fechaTermino && (
                                                <p className="text-xs font-bold text-slate-500">Fin: {new Date(alt.fechaTermino).toLocaleDateString()}</p>
                                            )}
                                        </td>
                                        <td className="py-4 text-sm font-bold text-slate-600">
                                            {alt.profesorSupervisor?.name || '-'}
                                        </td>
                                        <td className="py-4">
                                            <span className={`font-black text-[10px] tracking-widest uppercase px-3 py-1 rounded-full 
                                                ${alt.estado === 'activa' ? 'bg-indigo-100 text-indigo-700' :
                                                    alt.estado === 'completada' ? 'bg-emerald-100 text-emerald-700' :
                                                        'bg-rose-100 text-rose-700'}`}>
                                                {alt.estado}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex gap-2">
                                                {(permissions.isAdmin || user?.role === 'director' || user?.role === 'teacher' || user?.role === 'UTP' || permissions.isSuperAdmin) && (
                                                    <button
                                                        onClick={() => handleEdit(alt)}
                                                        className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                        title="Editar Alternancia"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                )}
                                                {(permissions.isAdmin || user?.role === 'director' || user?.role === 'UTP' || permissions.isSuperAdmin) && (
                                                    <button
                                                        onClick={() => handleDelete(alt._id)}
                                                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                                        title="Eliminar Alternancia"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredAlternancias.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-slate-400 font-bold text-sm">
                                            No hay registros de alternancia.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto w-full h-full">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10 w-full">
                            <h2 className="text-xl font-black uppercase tracking-tighter text-slate-800">
                                {editingId ? 'Editar Alternancia' : 'Registrar Alternancia'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Estudiante</label>
                                    <select
                                        required
                                        value={formData.estudianteId}
                                        onChange={(e) => setFormData({ ...formData, estudianteId: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Seleccione un estudiante...</option>
                                        {students.map(s => (
                                            <option key={s._id} value={s._id}>{s.rut} - {s.firstName} {s.lastName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Carrera (Obligatoria para TP)</label>
                                    <select
                                        required
                                        value={formData.careerId}
                                        onChange={(e) => setFormData({ ...formData, careerId: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Seleccione carrera...</option>
                                        {careers.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Institución / Empresa</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.empresaInstitucion}
                                        onChange={(e) => setFormData({ ...formData, empresaInstitucion: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ej. Empresa SA"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tipo de Alternancia</label>
                                    <select
                                        value={formData.tipo}
                                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="empresa">Empresa</option>
                                        <option value="CFT">Centro de Formación Técnica (CFT)</option>
                                        <option value="IP">Instituto Profesional (IP)</option>
                                        <option value="servicio_publico">Servicio Público</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Fecha Inicio</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.fechaInicio}
                                        onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Fecha Término (Opcional)</label>
                                    <input
                                        type="date"
                                        value={formData.fechaTermino}
                                        onChange={(e) => setFormData({ ...formData, fechaTermino: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tutor en Institución</label>
                                    <input
                                        type="text"
                                        value={formData.tutorEmpresa}
                                        onChange={(e) => setFormData({ ...formData, tutorEmpresa: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nombre del Tutor"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Profesor Supervisor</label>
                                    <select
                                        value={formData.profesorSupervisor}
                                        onChange={(e) => setFormData({ ...formData, profesorSupervisor: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Seleccione profesor...</option>
                                        {users.filter(u => u.role === 'teacher').map(u => (
                                            <option key={u._id} value={u._id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Estado</label>
                                <select
                                    value={formData.estado}
                                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="activa">Activa</option>
                                    <option value="completada">Completada</option>
                                    <option value="cancelada">Cancelada</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Observaciones</label>
                                <textarea
                                    value={formData.observaciones}
                                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                    placeholder="Detalles sobre convenios, horarios, etc."
                                />
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row gap-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest text-xs">
                                    Cancelar
                                </button>
                                <button type="submit" className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-600/20 transition-all uppercase tracking-widest text-xs">
                                    {editingId ? 'Actualizar Alternancia' : 'Guardar Alternancia'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
