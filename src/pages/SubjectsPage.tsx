import React, { useState, useEffect } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import api from '../services/api';
import { Library, Plus, Search, Trash2, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Subject {
    _id: string;
    name: string;
    description: string;
    courseId: { _id: string; name: string; letter: string; level: string };
    teacherId: { _id: string; name: string };
    isComplementary: boolean;
    isTechnical: boolean;
}

export default function SubjectsPage() {
    const permissions = usePermissions();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourseFilter, setSelectedCourseFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        courseId: '',
        teacherId: '',
        isComplementary: false,
        isTechnical: false
    });

    const loadData = async () => {
        try {
            setLoading(true);
            const [subjRes, crsRes, tchrRes] = await Promise.all([
                api.get('/subjects'),
                api.get('/courses?all=true'),
                api.get('/users?role=teacher')
            ]);
            setSubjects(subjRes.data);
            setCourses(crsRes.data);
            setTeachers(tchrRes.data);
        } catch (error) {
            console.error('Error loading subjects data:', error);
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
                await api.put(`/subjects/${editingId}`, formData);
                toast.success('Asignatura actualizada correctamente');
            } else {
                await api.post('/subjects', formData);
                toast.success('Asignatura creada correctamente');
            }
            setIsModalOpen(false);
            loadData();
            resetForm();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al guardar la asignatura');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Seguro que deseas eliminar esta asignatura?')) return;
        try {
            await api.delete(`/subjects/${id}`);
            toast.success('Asignatura eliminada');
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('Error al eliminar');
        }
    };

    const handleEdit = (subject: Subject) => {
        setFormData({
            name: subject.name,
            description: subject.description || '',
            courseId: subject.courseId?._id || '',
            teacherId: subject.teacherId?._id || '',
            isComplementary: subject.isComplementary || false,
            isTechnical: subject.isTechnical || false
        });
        setEditingId(subject._id);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            courseId: '',
            teacherId: '',
            isComplementary: false,
            isTechnical: false
        });
        setEditingId(null);
    };

    const filteredSubjects = subjects.filter(s => {
        const matchesSearch = 
            s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.courseId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.teacherId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCourse = !selectedCourseFilter || s.courseId?._id === selectedCourseFilter;
        
        return matchesSearch && matchesCourse;
    });

    const groupedSubjects = filteredSubjects.reduce((acc, sub) => {
        const key = sub.courseId?.name || 'Sin Curso Asignado';
        if (!acc[key]) acc[key] = [];
        acc[key].push(sub);
        return acc;
    }, {} as Record<string, Subject[]>);

    return (
        <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                            <Library size={28} />
                        </div>
                        Gestión de Asignaturas
                    </h1>
                    <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">Crea, modifica y vincula las asignaturas a cursos y docentes.</p>
                </div>
                {permissions.canManageSubjects && (
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-1"
                    >
                        <Plus size={18} /> Nueva Asignatura
                    </button>
                )}
            </div>

            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar asignatura o profesor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 rounded-2xl border-2 border-slate-100 focus:outline-none focus:border-blue-500 text-sm font-bold text-slate-700 bg-slate-50 transition-colors"
                        />
                    </div>
                    <div className="md:w-72">
                        <select
                            value={selectedCourseFilter}
                            onChange={(e) => setSelectedCourseFilter(e.target.value)}
                            className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:outline-none focus:border-blue-500 text-sm font-bold text-slate-700 bg-slate-50 transition-colors appearance-none"
                        >
                            <option value="">Todos los Cursos</option>
                            {courses.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-blue-300">
                        <Library size={48} className="animate-pulse mb-4" />
                        <span className="font-black tracking-widest uppercase text-sm">Cargando Malla...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="p-4 font-black text-[10px] text-slate-400 tracking-widest uppercase">Asignatura</th>
                                    <th className="p-4 font-black text-[10px] text-slate-400 tracking-widest uppercase">Descripción</th>
                                    <th className="p-4 font-black text-[10px] text-slate-400 tracking-widest uppercase">Profesor a Cargo</th>
                                    <th className="p-4 font-black text-[10px] text-slate-400 tracking-widest uppercase">Tipo</th>
                                    <th className="p-4 font-black text-[10px] text-slate-400 tracking-widest uppercase text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(groupedSubjects).map(([name, group]) => (
                                    <React.Fragment key={name}>
                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                            <td colSpan={5} className="p-4 pb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black shadow-inner">
                                                        {name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-black text-slate-800 text-sm uppercase tracking-wide">{name}</span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest bg-white text-slate-400 px-2 py-1 rounded-md border border-slate-200">
                                                        {group.length} {group.length === 1 ? 'Vinculación' : 'Vinculaciones'}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                        {group.map(sub => (
                                            <tr key={sub._id} className="border-b border-slate-50 hover:bg-blue-50/50 transition-colors group/row">
                                                <td className="p-4 pl-14">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-xs text-slate-400">
                                                            {sub.name.charAt(0)}
                                                        </div>
                                                        <span className="font-bold text-slate-700 text-sm uppercase">{sub.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <p className="text-xs font-bold text-slate-400 line-clamp-1 italic">{sub.description || 'Sin descripción'}</p>
                                                </td>
                                                <td className="p-4">
                                                    <p className="font-bold text-slate-700 text-sm">{sub.teacherId?.name || 'Pendiente'}</p>
                                                </td>
                                                <td className="p-4 space-x-2">
                                                    {sub.isComplementary && <span className="text-[9px] font-black uppercase tracking-widest bg-purple-100 text-purple-700 px-2 py-1 rounded-md">Complementaria</span>}
                                                    {sub.isTechnical && <span className="text-[9px] font-black uppercase tracking-widest bg-orange-100 text-orange-700 px-2 py-1 rounded-md">Técnica</span>}
                                                    {!sub.isComplementary && !sub.isTechnical && <span className="text-[9px] font-black uppercase tracking-widest bg-blue-100 text-blue-700 px-2 py-1 rounded-md">Troncal</span>}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEdit(sub)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Editar">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button onClick={() => handleDelete(sub._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Eliminar">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                                {filteredSubjects.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-400 font-bold text-sm">
                                            No hay asignaturas registradas
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {
                isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h2 className="text-xl font-black uppercase tracking-tighter text-slate-800 flex items-center gap-2">
                                    <Library className="text-blue-600" size={20} />
                                    {editingId ? 'Editar Asignatura' : 'Crear Asignatura'}
                                </h2>
                                <button
                                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                                    className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-xl transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 relative">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre de la Asignatura</label>
                                        <input
                                            type="text"
                                            list="subject-names"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 font-bold text-sm focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                                            placeholder="Selecciona o escribe una asignatura..."
                                        />
                                        <datalist id="subject-names">
                                            {Array.from(new Set(subjects.map(s => s.name))).map(name => (
                                                <option key={name} value={name} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descripción Corta</label>
                                        <input
                                            type="text"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 font-bold text-sm focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                                            placeholder="Opcional..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Curso Asociado</label>
                                        <select
                                            required
                                            value={formData.courseId}
                                            onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 font-bold text-sm focus:border-blue-500 focus:ring-0 outline-none transition-colors bg-white"
                                        >
                                            <option value="">Seleccione un curso...</option>
                                            {courses.map(c => (
                                                <option key={c._id} value={c._id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Profesor Asignado</label>
                                        <select
                                            required
                                            value={formData.teacherId}
                                            onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 font-bold text-sm focus:border-blue-500 focus:ring-0 outline-none transition-colors bg-white"
                                        >
                                            <option value="">Seleccione profesor...</option>
                                            {teachers.map(t => (
                                                <option key={t._id} value={t._id}>{t.name} ({t.rut})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={formData.isComplementary}
                                                onChange={(e) => setFormData({ ...formData, isComplementary: e.target.checked })}
                                                className="peer sr-only"
                                            />
                                            <div className="w-5 h-5 rounded border-2 border-slate-300 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                                            </div>
                                        </div>
                                        <span className="text-xs font-black text-slate-600 uppercase tracking-wider group-hover:text-blue-600 transition-colors">Es Complementaria</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={formData.isTechnical}
                                                onChange={(e) => setFormData({ ...formData, isTechnical: e.target.checked })}
                                                className="peer sr-only"
                                            />
                                            <div className="w-5 h-5 rounded border-2 border-slate-300 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                                            </div>
                                        </div>
                                        <span className="text-xs font-black text-slate-600 uppercase tracking-wider group-hover:text-blue-600 transition-colors">Es Técnica (TP)</span>
                                    </label>
                                </div>

                                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => { setIsModalOpen(false); resetForm(); }}
                                        className="px-6 py-3 font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-8 py-3 font-black text-xs uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5"
                                    >
                                        Guardar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
