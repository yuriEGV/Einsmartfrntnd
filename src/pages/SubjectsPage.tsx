
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { Plus, Edit, Trash2, Search, BookOpen, User, Target, Check, X, Printer, Save, ChevronRight } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';

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
    const [viewMode, setViewMode] = useState<'folders' | 'list'>('folders');
    const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null);

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

    // Print Ref
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Cobertura Curricular - ${selectedSubject?.name || 'Asignatura'}`,
    });

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

    // Grouping by Name
    const groupedSubjects = filteredSubjects.reduce((acc, subj) => {
        const key = subj.name.trim().toUpperCase();
        if (!acc[key]) acc[key] = [];
        acc[key].push(subj);
        return acc;
    }, {} as Record<string, Subject[]>);

    const folderKeys = Object.keys(groupedSubjects).sort();

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

            {loading ? <p className="text-center py-20 text-gray-400 font-bold animate-pulse">Cargando Asignaturas...</p> : (
                <>
                    {viewMode === 'folders' && !searchTerm ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in">
                            {folderKeys.map(name => (
                                <button
                                    key={name}
                                    onClick={() => {
                                        setSelectedFolderName(name);
                                        setViewMode('list');
                                    }}
                                    className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:translate-y-[-5px] transition-all group text-left flex flex-col h-full relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:scale-125 transition-transform" />

                                    <div className="mb-4 p-4 bg-blue-50 text-blue-600 rounded-2xl w-fit group-hover:bg-blue-600 group-hover:text-white transition-colors relative z-10">
                                        <BookOpen size={32} />
                                    </div>

                                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-1 relative z-10 line-clamp-2">
                                        {name}
                                    </h3>

                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest relative z-10">
                                        {groupedSubjects[name].length} {groupedSubjects[name].length === 1 ? 'Curso' : 'Cursos'}
                                    </p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {viewMode === 'list' && !searchTerm && (
                                <button
                                    onClick={() => {
                                        setViewMode('folders');
                                        setSelectedFolderName(null);
                                    }}
                                    className="flex items-center gap-2 text-slate-500 font-bold hover:text-[#11355a] transition-colors mb-4"
                                >
                                    <ChevronRight className="rotate-180" size={20} />
                                    Volver a Carpetas
                                </button>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 animate-in fade-in">
                                {(searchTerm ? filteredSubjects : groupedSubjects[selectedFolderName || ''] || []).map(subj => (
                                    <div key={subj._id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-black text-xl text-slate-800 leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight">{subj.name}</h3>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100/50">
                                                        {subj.courseId?.name || 'Común'}
                                                    </span>
                                                </div>
                                            </div>
                                            {canManage && (
                                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100">
                                                    <button onClick={() => {
                                                        setModalMode('edit');
                                                        setFormData({
                                                            _id: subj._id,
                                                            name: subj.name,
                                                            courseId: subj.courseId?._id,
                                                            teacherId: subj.teacherId?._id
                                                        });
                                                        setShowModal(true);
                                                    }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                                        <Edit size={18} />
                                                    </button>
                                                    <button onClick={() => handleDelete(subj._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-auto space-y-4">
                                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-sm">
                                                    <User size={20} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Docente Guía</p>
                                                    <p className="text-sm font-black text-slate-700 truncate">{subj.teacherId?.name || 'No asignado'}</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleOpenObjectives(subj)}
                                                className="w-full bg-[#11355a] text-white py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/10 active:scale-95 uppercase tracking-widest"
                                            >
                                                <Target size={18} className="text-blue-300" />
                                                Planificación y Cobertura
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal Asignatura */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[999] md:pl-[300px] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-[0_0_80px_rgba(0,0,0,0.3)] border-8 border-white animate-in zoom-in-95 duration-500 max-h-[95vh] overflow-y-auto custom-scrollbar">
                        <div className="p-10 text-white relative overflow-hidden bg-[#11355a]">
                            <div className="relative z-10">
                                <h2 className="text-3xl font-black tracking-tighter uppercase leading-none mb-2">
                                    {modalMode === 'create' ? 'Nueva Asignatura' : 'Editar Asignatura'}
                                </h2>
                                <p className="text-blue-300 font-extrabold uppercase text-[10px] tracking-[0.3em]">
                                    GESTIÓN DE RAMOS Y DOCENCIA
                                </p>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                        </div>
                        <form onSubmit={handleSave} className="p-10 space-y-6 bg-slate-50/30">
                            <div className="space-y-5">
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">NOMBRE DE LA ASIGNATURA</label>
                                    <input
                                        required
                                        className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:shadow-xl focus:shadow-blue-500/5 transition-all outline-none font-black text-slate-700"
                                        placeholder="Ej: Matemáticas"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">CURSO ASIGNADO</label>
                                    <select
                                        required
                                        className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-black text-slate-700 appearance-none bg-no-repeat"
                                        value={formData.courseId}
                                        onChange={e => setFormData({ ...formData, courseId: e.target.value })}
                                    >
                                        <option value="">Seleccionar Curso...</option>
                                        {courses.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">PROFESOR JEFE / TITULAR</label>
                                    <select
                                        required
                                        className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-black text-slate-700 appearance-none bg-no-repeat"
                                        value={formData.teacherId}
                                        onChange={e => setFormData({ ...formData, teacherId: e.target.value })}
                                    >
                                        <option value="">Seleccionar Profesor...</option>
                                        {teachers.map(t => (
                                            <option key={t._id} value={t._id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-8 flex flex-col md:flex-row gap-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 text-slate-400 font-black hover:bg-slate-100 rounded-2xl transition-all uppercase tracking-widest text-xs">CANCELAR</button>
                                <button type="submit" className="flex-[2] py-5 bg-[#11355a] text-white rounded-2xl font-black hover:bg-blue-900 shadow-2xl shadow-blue-900/20 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                                    <Save size={18} /> GUARDAR ASIGNATURA
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Objetivos */}
            {showObjModal && selectedSubject && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[999] md:pl-[300px] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-5xl shadow-[0_0_80px_rgba(0,0,0,0.3)] border-8 border-white animate-in zoom-in-95 duration-500 max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="p-8 text-white relative overflow-hidden bg-[#11355a] shrink-0">
                            <div className="relative z-10 flex justify-between items-center">
                                <div>
                                    <h2 className="text-3xl font-black tracking-tighter uppercase leading-none mb-2 flex items-center gap-3">
                                        <Target className="text-blue-400" />
                                        Planes y Programas
                                    </h2>
                                    <p className="text-blue-300 font-extrabold uppercase text-[10px] tracking-[0.3em]">
                                        ASIGNATURA: {selectedSubject.name} | CURSO: {selectedSubject.courseId?.name}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handlePrint()}
                                        className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl transition-all flex items-center gap-2 border border-white/10 font-black text-[10px] uppercase tracking-widest"
                                    >
                                        <Printer size={16} /> Imprimir Reporte
                                    </button>
                                    <button onClick={() => setShowObjModal(false)} className="bg-white/10 hover:bg-red-500/40 p-3 rounded-2xl transition-all border border-white/10">
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                        </div>

                        <div className="p-8 flex flex-col md:flex-row gap-8 overflow-hidden bg-slate-50/30 flex-1">
                            {/* Form Side - NOW MORE BALANCED AND CENTERED IN FEEL */}
                            <div className="w-full md:w-[350px] flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar pr-2">
                                <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100">
                                    <h3 className="font-black text-slate-800 text-xs uppercase mb-6 flex items-center gap-2 pb-4 border-b">
                                        <Plus size={18} className="text-blue-600" />
                                        {objModalMode === 'create' ? 'Agregar Objetivo' : 'Actualizar OA'}
                                    </h3>
                                    <form onSubmit={handleSaveObjective} className="space-y-5">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">CÓDIGO IDENTIFICADOR</label>
                                            <input
                                                required
                                                className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none font-black text-slate-700 text-sm"
                                                placeholder="Ej: OA 01"
                                                value={objFormData.code}
                                                onChange={e => setObjFormData({ ...objFormData, code: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">TEMPORALIDAD</label>
                                            <select
                                                className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none font-black text-slate-700 text-sm appearance-none"
                                                value={objFormData.period}
                                                onChange={e => setObjFormData({ ...objFormData, period: e.target.value })}
                                            >
                                                <option value="Anual">Anual</option>
                                                <option value="Primer Semestre">1° Semestre</option>
                                                <option value="Segundo Semestre">2° Semestre</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">DESCRIPCIÓN DEL APRENDIZAJE</label>
                                            <textarea
                                                required
                                                rows={4}
                                                className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none font-bold text-slate-600 text-sm resize-none"
                                                placeholder="Describa el objetivo de aprendizaje..."
                                                value={objFormData.description}
                                                onChange={e => setObjFormData({ ...objFormData, description: e.target.value })}
                                            />
                                        </div>
                                        <button type="submit" className="w-full bg-[#11355a] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-blue-900 transition-all flex items-center justify-center gap-2">
                                            {objModalMode === 'create' ? <Plus size={16} /> : <Save size={16} />}
                                            {objModalMode === 'create' ? 'AGREGAR A MATRIZ' : 'ACTUALIZAR DATOS'}
                                        </button>
                                        {objModalMode === 'edit' && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setObjModalMode('create');
                                                    setObjFormData({ _id: '', code: '', description: '', period: 'Anual', covered: false });
                                                }}
                                                className="w-full text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
                                            >
                                                Cancelar Edición
                                            </button>
                                        )}
                                    </form>
                                </div>
                            </div>

                            {/* List Side */}
                            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">MATRIZ DE COBERTURA CURRICULAR</h3>
                                    <div className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                                        LISTADOS: {objectives.length} OA REGISTRADOS
                                    </div>
                                </div>
                                {objectives.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border-4 border-dashed border-slate-100 text-slate-300">
                                        <Target size={48} className="mb-4 opacity-20" />
                                        <p className="font-black uppercase text-xs tracking-widest">Sin planificación registrada</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {objectives.map(obj => (
                                            <div key={obj._id} className={`p-6 rounded-[2rem] border-2 transition-all group relative overflow-hidden ${obj.covered ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-white border-slate-50 hover:shadow-xl hover:shadow-blue-900/5'}`}>
                                                <div className="flex justify-between items-start relative z-10">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <span className={`px-4 py-1.5 rounded-xl font-black text-xs shadow-sm ${obj.covered ? 'bg-emerald-500 text-white' : 'bg-[#11355a] text-white'}`}>
                                                                {obj.code}
                                                            </span>
                                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{obj.period}</span>
                                                        </div>
                                                        <p className={`text-sm leading-relaxed mb-6 font-bold ${obj.covered ? 'text-emerald-800' : 'text-slate-600'}`}>{obj.description}</p>
                                                        <div className="flex gap-4">
                                                            <button
                                                                onClick={() => toggleCoverage(obj)}
                                                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border-2 transition-all ${obj.covered
                                                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                                                    : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-500 hover:text-emerald-500'
                                                                    }`}
                                                            >
                                                                {obj.covered ? <Check size={14} /> : null}
                                                                {obj.covered ? 'COBERTURA LOGRADA' : 'MARCAR CUMPLIMIENTO'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2 ml-4">
                                                        <button onClick={() => {
                                                            setObjModalMode('edit');
                                                            setObjFormData({
                                                                _id: obj._id,
                                                                code: obj.code,
                                                                description: obj.description,
                                                                period: obj.period,
                                                                covered: obj.covered
                                                            });
                                                        }} className="p-3 text-blue-400 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all shadow-sm bg-white border border-slate-50"><Edit size={16} /></button>
                                                        <button onClick={() => handleDeleteObjective(obj._id)} className="p-3 text-rose-300 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all shadow-sm bg-white border border-slate-50"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
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
