
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { Plus, Edit, Trash2, Search, BookOpen, User, Target, Check, X } from 'lucide-react';

interface Subject {
    _id: string;
    name: string;
    courseId: { _id: string; name: string };
    teacherId: { _id: string; name: string };
}

interface Objective {
    _id: string;
    subjectId: string;
    code: string;
    description: string;
    period: string;
    covered: boolean;
}

interface Course {
    _id: string;
    name: string;
}

interface Teacher {
    _id: string;
    name: string;
}

const SubjectsPage = () => {
    const { canManageSubjects, isSuperAdmin } = usePermissions();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal Asignatura
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState({
        _id: '',
        name: '',
        courseId: '',
        teacherId: ''
    });

    // Modal Objetivos
    const [showObjModal, setShowObjModal] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [objFormData, setObjFormData] = useState({
        _id: '',
        code: '',
        description: '',
        period: 'Anual',
        covered: false
    });
    const [objModalMode, setObjModalMode] = useState<'create' | 'edit'>('create');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [subjRes, courRes, usersRes] = await Promise.all([
                api.get('/subjects'),
                api.get('/courses'),
                api.get('/users?role=teacher')
            ]);

            setSubjects(subjRes.data);
            setCourses(courRes.data);

            const allUsers = usersRes.data;
            const teacherList = Array.isArray(allUsers)
                ? allUsers.filter((u: any) => u.role === 'teacher')
                : [];
            setTeachers(teacherList);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (modalMode === 'create') {
                await api.post('/subjects', formData);
            } else {
                await api.put(`/subjects/${formData._id}`, formData);
            }
            setShowModal(false);
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al guardar asignatura');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Eliminar asignatura?')) return;
        try {
            await api.delete(`/subjects/${id}`);
            fetchData();
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    const filteredSubjects = subjects.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.courseId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const canManage = canManageSubjects || isSuperAdmin;

    const fetchObjectives = async (subjectId: string) => {
        try {
            const res = await api.get(`/objectives?subjectId=${subjectId}`);
            setObjectives(res.data);
        } catch (error) {
            console.error('Error fetching objectives:', error);
        }
    };

    const handleOpenObjectives = (subj: Subject) => {
        setSelectedSubject(subj);
        fetchObjectives(subj._id);
        setShowObjModal(true);
    };

    const handleSaveObjective = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSubject) return;
        try {
            if (objModalMode === 'create') {
                await api.post('/objectives', { ...objFormData, subjectId: selectedSubject._id });
            } else {
                await api.put(`/objectives/${objFormData._id}`, objFormData);
            }
            setObjFormData({ _id: '', code: '', description: '', period: 'Anual', covered: false });
            setObjModalMode('create');
            fetchObjectives(selectedSubject._id);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al guardar objetivo');
        }
    };

    const handleDeleteObjective = async (id: string) => {
        if (!window.confirm('¿Eliminar objetivo?')) return;
        try {
            await api.delete(`/objectives/${id}`);
            if (selectedSubject) fetchObjectives(selectedSubject._id);
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    const toggleCoverage = async (obj: Objective) => {
        try {
            await api.put(`/objectives/${obj._id}`, { covered: !obj.covered });
            if (selectedSubject) fetchObjectives(selectedSubject._id);
        } catch (error) {
            alert('Error al actualizar cobertura');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <BookOpen className="text-[#11355a]" />
                    Gestión de Ramos (Asignaturas)
                </h1>
                {canManage && (
                    <button
                        onClick={() => {
                            setModalMode('create');
                            setFormData({ _id: '', name: '', courseId: '', teacherId: '' });
                            setShowModal(true);
                        }}
                        className="bg-[#11355a] text-white px-4 py-2 rounded flex items-center gap-2 hover:opacity-90 transition"
                    >
                        <Plus size={18} /> Nueva Asignatura
                    </button>
                )}
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border flex items-center gap-2">
                <Search className="text-gray-400" />
                <input
                    placeholder="Buscar por nombre o curso..."
                    className="flex-1 outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? <p>Cargando...</p> : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredSubjects.map(subj => (
                        <div key={subj._id} className="bg-white p-5 rounded-lg shadow border hover:shadow-md transition group">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-gray-800">{subj.name}</h3>
                                {canManage && (
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => {
                                            setModalMode('edit');
                                            setFormData({
                                                _id: subj._id,
                                                name: subj.name,
                                                courseId: subj.courseId?._id,
                                                teacherId: subj.teacherId?._id
                                            });
                                            setShowModal(true);
                                        }} className="text-gray-400 hover:text-blue-600"><Edit size={18} /></button>
                                        <button onClick={() => handleDelete(subj._id)} className="text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                                <p className="font-semibold text-blue-600 bg-blue-50 inline-block px-2 py-0.5 rounded">
                                    {subj.courseId?.name || 'Sin Curso'}
                                </p>
                                <div className="flex items-center gap-2 pt-2 text-gray-500">
                                    <User size={16} />
                                    <span>{subj.teacherId?.name || 'Sin Profesor'}</span>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t flex gap-2">
                                <button
                                    onClick={() => handleOpenObjectives(subj)}
                                    className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-100 transition"
                                >
                                    <Target size={16} /> Objetivos y Cobertura
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Asignatura */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl animate-in fade-in duration-200">
                        <h2 className="text-xl font-bold mb-4 border-b pb-2">
                            {modalMode === 'create' ? 'Nueva Asignatura' : 'Editar Asignatura'}
                        </h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre</label>
                                <input
                                    required
                                    placeholder="Ej: Matemáticas"
                                    className="w-full border p-2 rounded"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Curso</label>
                                <select
                                    required
                                    className="w-full border p-2 rounded bg-white"
                                    value={formData.courseId}
                                    onChange={e => setFormData({ ...formData, courseId: e.target.value })}
                                >
                                    <option value="">Seleccionar Curso...</option>
                                    {courses.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Profesor Asignado</label>
                                <select
                                    required
                                    className="w-full border p-2 rounded bg-white"
                                    value={formData.teacherId}
                                    onChange={e => setFormData({ ...formData, teacherId: e.target.value })}
                                >
                                    <option value="">Seleccionar Profesor...</option>
                                    {teachers.map(t => (
                                        <option key={t._id} value={t._id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-[#11355a] text-white rounded hover:opacity-90">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Objetivos */}
            {showObjModal && selectedSubject && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="bg-[#11355a] p-6 text-white flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Target className="text-blue-300" />
                                    Objetivos de Aprendizaje: {selectedSubject.name}
                                </h2>
                                <p className="text-blue-200 text-xs font-medium uppercase tracking-wider mt-1">
                                    Curso: {selectedSubject.courseId?.name}
                                </p>
                            </div>
                            <button onClick={() => setShowObjModal(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 flex flex-col md:flex-row gap-8 overflow-hidden">
                            {/* Form Side */}
                            <div className="w-full md:w-1/3 flex flex-col gap-6 shrink-0">
                                <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200">
                                    <h3 className="font-black text-gray-800 text-sm uppercase mb-4 flex items-center gap-2">
                                        <Plus size={16} className="text-blue-600" />
                                        {objModalMode === 'create' ? 'Nuevo Objetivo' : 'Editar Objetivo'}
                                    </h3>
                                    <form onSubmit={handleSaveObjective} className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Código (Ej: OA 01)</label>
                                            <input
                                                required
                                                className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition"
                                                value={objFormData.code}
                                                onChange={e => setObjFormData({ ...objFormData, code: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Periodo</label>
                                            <select
                                                className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition"
                                                value={objFormData.period}
                                                onChange={e => setObjFormData({ ...objFormData, period: e.target.value })}
                                            >
                                                <option value="Anual">Anual</option>
                                                <option value="Primer Semestre">1° Semestre</option>
                                                <option value="Segundo Semestre">2° Semestre</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Descripción</label>
                                            <textarea
                                                required
                                                rows={4}
                                                className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition resize-none"
                                                value={objFormData.description}
                                                onChange={e => setObjFormData({ ...objFormData, description: e.target.value })}
                                            />
                                        </div>
                                        <button type="submit" className="w-full bg-[#11355a] text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-800 transition">
                                            {objModalMode === 'create' ? 'Agregar Objetivo' : 'Guardar Cambios'}
                                        </button>
                                        {objModalMode === 'edit' && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setObjModalMode('create');
                                                    setObjFormData({ _id: '', code: '', description: '', period: 'Anual', covered: false });
                                                }}
                                                className="w-full text-gray-500 text-xs font-bold hover:underline"
                                            >
                                                Cancelar Edición
                                            </button>
                                        )}
                                    </form>
                                </div>
                            </div>

                            {/* List Side */}
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                <div className="flex justify-between items-end mb-2">
                                    <h3 className="font-black text-gray-400 text-[10px] uppercase tracking-widest">Listado de Cobertura Curricular</h3>
                                    <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                        Total: {objectives.length} objetivos
                                    </div>
                                </div>
                                {objectives.length === 0 ? (
                                    <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 text-gray-400 italic">
                                        No hay objetivos registrados para esta asignatura.
                                    </div>
                                ) : (
                                    objectives.map(obj => (
                                        <div key={obj._id} className={`p-5 rounded-2xl border-2 transition-all group ${obj.covered ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-white border-gray-50 hover:border-blue-100 hover:shadow-md'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-3 py-1 rounded-lg font-black text-xs ${obj.covered ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                        {obj.code}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{obj.period}</span>
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => {
                                                        setObjModalMode('edit');
                                                        setObjFormData({
                                                            _id: obj._id,
                                                            code: obj.code,
                                                            description: obj.description,
                                                            period: obj.period,
                                                            covered: obj.covered
                                                        });
                                                    }} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"><Edit size={16} /></button>
                                                    <button onClick={() => handleDeleteObjective(obj._id)} className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                            <p className={`text-sm leading-relaxed mb-4 font-medium ${obj.covered ? 'text-emerald-800' : 'text-gray-600'}`}>{obj.description}</p>
                                            <div className="flex justify-between items-center mt-2">
                                                <button
                                                    onClick={() => toggleCoverage(obj)}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border-2 transition-all ${obj.covered
                                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                                        : 'bg-white border-gray-100 text-gray-400 hover:border-emerald-500 hover:text-emerald-500'
                                                        }`}
                                                >
                                                    {obj.covered ? <Check size={14} /> : null}
                                                    {obj.covered ? 'Objetivo Cubierto' : 'Marcar como Cubierto'}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubjectsPage;
