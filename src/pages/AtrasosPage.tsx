import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import api from '../services/api';
import { Clock, Plus, Search, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Atraso {
    _id: string;
    estudianteId: { _id: string; nombres: string; apellidos: string; rut: string; fotoUrl?: string };
    fecha: string;
    bloque: string;
    minutosAtraso: number;
    motivo: string;
    estado: string;
    registradoPor: { _id: string; name: string };
    createdAt: string;
}

const BLOQUES = ['Bloque 1', 'Bloque 2', 'Bloque 3', 'Bloque 4', 'Bloque 5'];

export default function AtrasosPage() {
    const { user } = useAuth();
    const permissions = usePermissions();
    const [atrasos, setAtrasos] = useState<Atraso[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        estudianteId: '',
        fecha: new Date().toISOString().split('T')[0],
        bloque: 'Bloque 1',
        minutosAtraso: 0,
        motivo: '',
        estado: 'injustificado'
    });

    const loadData = async () => {
        try {
            setLoading(true);
            const [atrasosRes, studentsRes] = await Promise.all([
                api.get('/atrasos'),
                api.get('/estudiantes')
            ]);
            setAtrasos(atrasosRes.data);
            setStudents(studentsRes.data);
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
            await api.post('/atrasos', formData);
            toast.success('Atraso registrado correctamente');
            setIsModalOpen(false);
            loadData();
            setFormData({ ...formData, estudianteId: '', minutosAtraso: 0, motivo: '' });
        } catch (error) {
            console.error(error);
            toast.error('Error al registrar atraso');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Seguro que deseas eliminar este registro?')) return;
        try {
            await api.delete(`/atrasos/${id}`);
            toast.success('Atraso eliminado');
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('Error al eliminar');
        }
    };

    const filteredAtrasos = atrasos.filter(a =>
        a.estudianteId?.rut?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.estudianteId?.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.estudianteId?.apellidos?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                        <Clock className="text-blue-600" /> Registro de Atrasos
                    </h1>
                    <p className="text-slate-500 font-bold text-sm tracking-wide">Gestiona los atrasos de los estudiantes por bloque</p>
                </div>
                {(permissions.isAdmin || user?.role === 'teacher' || user?.role === 'director') && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-black uppercase text-xs tracking-widest transition-colors shadow-lg shadow-blue-600/20"
                    >
                        <Plus size={16} /> Registrar Atraso
                    </button>
                )}
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por RUT o nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700 bg-slate-50"
                    />
                </div>

                {loading ? (
                    <div className="text-center py-10 text-slate-500 font-bold">Cargando atrasos...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="pb-4 font-black text-xs text-slate-400 tracking-widest uppercase">Estudiante</th>
                                    <th className="pb-4 font-black text-xs text-slate-400 tracking-widest uppercase">Fecha / Bloque</th>
                                    <th className="pb-4 font-black text-xs text-slate-400 tracking-widest uppercase">Minutos</th>
                                    <th className="pb-4 font-black text-xs text-slate-400 tracking-widest uppercase">Estado</th>
                                    <th className="pb-4 font-black text-xs text-slate-400 tracking-widest uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAtrasos.map(atraso => (
                                    <tr key={atraso._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="py-4">
                                            <p className="font-bold text-slate-800 text-sm">{atraso.estudianteId?.nombres} {atraso.estudianteId?.apellidos}</p>
                                            <p className="text-xs font-bold text-slate-500">{atraso.estudianteId?.rut}</p>
                                        </td>
                                        <td className="py-4">
                                            <p className="font-bold text-slate-800 text-sm">{new Date(atraso.fecha).toLocaleDateString()}</p>
                                            <p className="text-xs font-bold text-slate-500">{atraso.bloque}</p>
                                        </td>
                                        <td className="py-4">
                                            <span className="font-bold text-rose-500 text-sm bg-rose-50 px-3 py-1 rounded-full">{atraso.minutosAtraso} min</span>
                                        </td>
                                        <td className="py-4">
                                            <span className={`font-black text-[10px] tracking-widest uppercase px-3 py-1 rounded-full ${atraso.estado === 'justificado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {atraso.estado}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            {(permissions.isAdmin || user?.role === 'director' || atraso.registradoPor?._id === user?._id) && (
                                                <button
                                                    onClick={() => handleDelete(atraso._id)}
                                                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filteredAtrasos.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-slate-400 font-bold text-sm">
                                            No se encontraron atrasos registrados.
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-black uppercase tracking-tighter text-slate-800">Registrar Atraso</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Custom Dropdown for Students */}
                            <div className="relative">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Estudiante</label>
                                <div
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm bg-white cursor-pointer flex justify-between items-center"
                                    onClick={() => {
                                        const list = document.getElementById('student-dropdown');
                                        if (list) list.classList.toggle('hidden');
                                    }}
                                >
                                    <span>
                                        {formData.estudianteId
                                            ? (() => {
                                                const s = students.find(s => s._id === formData.estudianteId);
                                                return s ? `${s.rut || 'S/R'} - ${s.nombres} ${s.apellidos}` : 'Estudiante seleccionado';
                                            })()
                                            : 'Seleccione un estudiante...'
                                        }
                                    </span>
                                    <span className="text-slate-400">▼</span>
                                </div>
                                <div id="student-dropdown" className="hidden absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                                    <div className="sticky top-0 bg-white p-2 border-b border-slate-100">
                                        <input
                                            type="text"
                                            placeholder="Buscar por RUT o nombre..."
                                            className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm outline-none focus:border-blue-500"
                                            onChange={(e) => {
                                                const val = e.target.value.toLowerCase();
                                                const items = document.querySelectorAll('.student-dropdown-item');
                                                items.forEach(item => {
                                                    const text = item.textContent?.toLowerCase() || '';
                                                    (item as HTMLElement).style.display = text.includes(val) ? 'flex' : 'none';
                                                });
                                            }}
                                        />
                                    </div>
                                    {students.map(s => (
                                        <div
                                            key={s._id}
                                            className="student-dropdown-item flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 transition-colors"
                                            onClick={() => {
                                                setFormData({ ...formData, estudianteId: s._id });
                                                document.getElementById('student-dropdown')?.classList.add('hidden');
                                            }}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black overflow-hidden shrink-0 border-2 border-slate-100">
                                                {s.fotoUrl ? (
                                                    <img src={s.fotoUrl} alt={s.nombres} className="w-full h-full object-cover" />
                                                ) : (
                                                    s.nombres?.charAt(0) || '?'
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-700 text-sm">{s.nombres} {s.apellidos}</div>
                                                <div className="text-[10px] font-bold text-slate-400">{s.rut || 'S/N RUT'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Fecha</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.fecha}
                                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Bloque</label>
                                    <select
                                        value={formData.bloque}
                                        onChange={(e) => setFormData({ ...formData, bloque: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm focus:ring-2 focus:ring-blue-500"
                                    >
                                        {BLOQUES.map(b => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Minutos de atraso</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={formData.minutosAtraso}
                                        onChange={(e) => setFormData({ ...formData, minutosAtraso: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Estado</label>
                                    <select
                                        value={formData.estado}
                                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="injustificado">Injustificado</option>
                                        <option value="justificado">Justificado</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Motivo/Observación</label>
                                <textarea
                                    value={formData.motivo}
                                    onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                    placeholder="Opcional..."
                                />
                            </div>
                            <div className="flex justify-end pt-4 mt-6 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-3 font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-xl mr-3 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 font-black text-xs uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-lg shadow-blue-600/20"
                                >
                                    Guardar Atraso
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
