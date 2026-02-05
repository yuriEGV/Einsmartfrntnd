
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import {
    Plus, Search, Edit2, Trash2, X, Check,
    Briefcase, AlertCircle, Loader2,
    Info
} from 'lucide-react';

interface Career {
    _id: string;
    name: string;
    description: string;
    type: 'cientifico-humanista' | 'tecnico-profesional';
    code?: string;
    teachers?: { _id: string; name: string }[];
    headTeacher?: { _id: string; name: string };
    createdAt: string;
}

interface User {
    _id: string;
    name: string;
    email: string;
}

const CareersPage = () => {
    const permissions = usePermissions();
    const [careers, setCareers] = useState<Career[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCareer, setEditingCareer] = useState<Career | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'cientifico-humanista',
        code: '',
        teachers: [] as string[],
        headTeacher: ''
    });
    const [availableTeachers, setAvailableTeachers] = useState<User[]>([]);

    useEffect(() => {
        fetchCareers();
    }, []);

    const fetchCareers = async () => {
        try {
            setLoading(true);
            const [res, teachersRes] = await Promise.all([
                api.get('/careers'),
                api.get('/users?role=teacher')
            ]);
            setCareers(res.data);
            setAvailableTeachers(teachersRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCareer) {
                await api.put(`/careers/${editingCareer._id}`, formData);
            } else {
                await api.post('/careers', formData);
            }
            setShowModal(false);
            setEditingCareer(null);
            setShowModal(false);
            setEditingCareer(null);
            setFormData({ name: '', description: '', type: 'cientifico-humanista', code: '', teachers: [], headTeacher: '' });
            fetchCareers();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al guardar carrera');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar esta carrera?')) return;
        try {
            await api.delete(`/careers/${id}`);
            fetchCareers();
        } catch (error) {
            console.error('Error deleting career:', error);
        }
    };

    const openEdit = (career: Career) => {
        setEditingCareer(career);
        setFormData({
            name: career.name,
            description: career.description || '',
            type: career.type,
            code: career.code || '',
            teachers: career.teachers?.map(t => t._id) || [],
            headTeacher: career.headTeacher?._id || ''
        });
        setShowModal(true);
    };

    const filteredCareers = careers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!permissions.isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Acceso Denegado</h2>
                <p className="text-slate-500 font-bold max-w-md mt-2">Solo administradores y directores pueden gestionar el catálogo de carreras.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-10 animate-in fade-in duration-500">
            {/* Header section with rich aesthetics */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                        <Briefcase size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Gestión de Carreras</h1>
                        <p className="text-slate-400 font-bold text-sm tracking-widest uppercase mt-2">Especialidades Técnico-Profesionales</p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        setEditingCareer(null);
                        setFormData({ name: '', description: '', type: 'cientifico-humanista', code: '', teachers: [], headTeacher: '' });
                        setShowModal(true);
                    }}
                    className="bg-[#11355a] text-white px-8 py-4 rounded-[1.5rem] flex items-center gap-3 font-black uppercase text-xs tracking-widest hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/20 active:scale-95 self-start md:self-center"
                >
                    <Plus size={20} /> Nueva Carrera
                </button>
            </div>

            {/* Content with search and statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
                <div className="lg:col-span-3">
                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar carrera por nombre o código..."
                            className="w-full pl-16 pr-6 py-6 bg-white rounded-[2rem] border-none shadow-sm focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-600 transition-all placeholder:text-slate-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm flex flex-col items-center justify-center border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Carreras</span>
                    <span className="text-3xl font-black text-indigo-600">{careers.length}</span>
                </div>
            </div>

            {/* Careers Listing */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] shadow-sm">
                    <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Cargando catálogo...</p>
                </div>
            ) : filteredCareers.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[3rem] shadow-sm flex flex-col items-center border border-slate-100">
                    <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-6">
                        <Info size={40} />
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No se encontraron carreras registradas</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredCareers.map((career) => (
                        <div key={career._id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group overflow-hidden relative">
                            {/* Accent Decoration */}
                            <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-5 transition-transform group-hover:scale-150 duration-700 ${career.type === 'tecnico-profesional' ? 'bg-orange-500' : 'bg-indigo-500'}`}></div>

                            <div className="flex items-start justify-between mb-6 relative z-10">
                                <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${career.type === 'tecnico-profesional'
                                    ? 'bg-orange-50 text-orange-600 border border-orange-100'
                                    : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                    }`}>
                                    {career.type === 'tecnico-profesional' ? 'Técnico Profesional' : 'Científico Humanista'}
                                </div>
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">#{career.code || 'S/N'}</span>
                            </div>

                            <h3 className="text-xl font-black text-slate-800 tracking-tighter uppercase mb-3 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                {career.name}
                            </h3>
                            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8 line-clamp-2 min-h-[40px]">
                                {career.description || 'Sin descripción detallada para esta especialidad.'}
                            </p>

                            {/* Teachers Info */}
                            <div className="mb-6 space-y-2">
                                {career.headTeacher && (
                                    <div className="flex items-center gap-2">
                                        <div className="px-2 py-1 bg-purple-50 text-purple-600 rounded-md text-[9px] font-black uppercase tracking-widest border border-purple-100">Jefe Carrera</div>
                                        <span className="text-xs font-bold text-slate-600">{career.headTeacher.name}</span>
                                    </div>
                                )}
                                {career.teachers && career.teachers.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {career.teachers.map(t => (
                                            <span key={t._id} className="text-[10px] bg-slate-50 text-slate-500 px-2 py-1 rounded-lg border border-slate-100 font-bold">
                                                {t.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-50 relative z-10">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openEdit(career)}
                                        className="p-3 bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all"
                                        title="Editar"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(career._id)}
                                        className="p-3 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Registrada el</span>
                                    <span className="text-[10px] font-bold text-slate-500">{new Date(career.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))
                    }
                </div >
            )}

            {/* Professional Modal Component */}
            {
                showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowModal(false)} />
                        <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                            {/* Modal Header */}
                            <div className="p-10 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                                        <Briefcase size={24} />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">
                                        {editingCareer ? 'Editar Carrera' : 'Nueva Especialidad'}
                                    </h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-3 text-slate-400 hover:text-slate-800 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <form onSubmit={handleSubmit} className="p-10 overflow-y-auto custom-scrollbar">
                                <div className="space-y-8">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Nombre de la Especialidad</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-6 py-5 bg-slate-50 rounded-[1.5rem] border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700 shadow-inner"
                                            placeholder="Ej: Técnico en Programación"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Tipo de Formación</label>
                                            <select
                                                className="w-full px-6 py-5 bg-slate-50 rounded-[1.5rem] border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700 shadow-inner appearance-none"
                                                value={formData.type}
                                                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                            >
                                                <option value="cientifico-humanista">Científico Humanista</option>
                                                <option value="tecnico-profesional">Técnico Profesional</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Código Identificador (Opcional)</label>
                                            <input
                                                type="text"
                                                className="w-full px-6 py-5 bg-slate-50 rounded-[1.5rem] border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700 shadow-inner"
                                                placeholder="Ej: TP-PROG-2024"
                                                value={formData.code}
                                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Jefe de Carrera</label>
                                            <select
                                                className="w-full px-6 py-5 bg-slate-50 rounded-[1.5rem] border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700 shadow-inner appearance-none"
                                                value={formData.headTeacher}
                                                onChange={e => setFormData({ ...formData, headTeacher: e.target.value })}
                                            >
                                                <option value="">-- Seleccionar --</option>
                                                {availableTeachers.map(t => (
                                                    <option key={t._id} value={t._id}>{t.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Docentes Asociados</label>
                                            <div className="w-full px-6 py-5 bg-slate-50 rounded-[1.5rem] border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700 shadow-inner max-h-40 overflow-y-auto">
                                                {availableTeachers.map(t => (
                                                    <div key={t._id} className="flex items-center gap-3 mb-2">
                                                        <input
                                                            type="checkbox"
                                                            id={`teacher-${t._id}`}
                                                            checked={formData.teachers.includes(t._id)}
                                                            onChange={e => {
                                                                const newTeachers = e.target.checked
                                                                    ? [...formData.teachers, t._id]
                                                                    : formData.teachers.filter(id => id !== t._id);
                                                                setFormData({ ...formData, teachers: newTeachers });
                                                            }}
                                                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                        />
                                                        <label htmlFor={`teacher-${t._id}`} className="text-xs text-slate-600 cursor-pointer select-none">{t.name}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Descripción Breve</label>
                                        <textarea
                                            className="w-full px-6 py-5 bg-slate-50 rounded-[1.5rem] border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700 shadow-inner resize-none h-32"
                                            placeholder="Describa el perfil de egreso o los objetivos de esta carrera..."
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full mt-12 bg-indigo-600 text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 group"
                                >
                                    <Check size={20} className="group-hover:scale-125 transition-transform" />
                                    {editingCareer ? 'Actualizar Datos' : 'Registrar Carrera'}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default CareersPage;
