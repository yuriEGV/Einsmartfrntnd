import { useState, useEffect } from 'react';
import api from '../services/api';
import curriculumService from '../services/curriculumService';
import type { CurriculumMaterial } from '../services/curriculumService';
import { usePermissions } from '../hooks/usePermissions';
import { useTenant } from '../context/TenantContext';
import { BookOpen, Plus, Edit, Trash2, Search, File, X, Save, Target } from 'lucide-react';

interface Course {
    _id: string;
    name: string;
}

interface Subject {
    _id: string;
    name: string;
    courseId: string;
}

const CurriculumMaterialPage = () => {
    const permissions = usePermissions();
    const { tenant } = useTenant();
    
    const [materials, setMaterials] = useState<CurriculumMaterial[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [currentMaterialId, setCurrentMaterialId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<CurriculumMaterial>>({
        title: '',
        description: '',
        courseId: '',
        subjectId: '',
        objectives: [],
        content: '',
        fileUrl: '',
        fileName: ''
    });
    const [file, setFile] = useState<File | null>(null);
    const [newObjective, setNewObjective] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [materialsRes, coursesRes, subjectsRes] = await Promise.all([
                curriculumService.getAll(),
                api.get('/courses'),
                api.get('/subjects')
            ]);
            setMaterials(materialsRes.data);
            setCourses(coursesRes.data);
            setSubjects(subjectsRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.courseId || !formData.objectives || formData.objectives.length === 0) {
            alert('Por favor complete: título, curso y al menos un objetivo.');
            return;
        }

        setLoading(true);
        try {
            const submitData = new FormData();
            submitData.append('title', formData.title || '');
            submitData.append('description', formData.description || '');
            submitData.append('courseId', formData.courseId || '');
            if (formData.subjectId) submitData.append('subjectId', formData.subjectId);
            submitData.append('objectives', JSON.stringify(formData.objectives));
            submitData.append('content', formData.content || '');
            
            if (file) {
                submitData.append('file', file);
            }

            if (modalMode === 'create') {
                await curriculumService.create(submitData);
            } else {
                await curriculumService.update(currentMaterialId || '', submitData);
            }

            alert(`Material ${modalMode === 'create' ? 'creado' : 'actualizado'} exitosamente`);
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (err) {
            console.error('Error:', err);
            alert(`Error al ${modalMode === 'create' ? 'crear' : 'actualizar'} material`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Confirma que desea eliminar este material curricular?')) return;
        
        try {
            await curriculumService.delete(id);
            alert('Material eliminado exitosamente');
            fetchData();
        } catch (err) {
            console.error('Error:', err);
            alert('Error al eliminar material');
        }
    };

    const openEditModal = (material: CurriculumMaterial) => {
        setModalMode('edit');
        setCurrentMaterialId(material._id || null);
        setFormData(material);
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            courseId: '',
            subjectId: '',
            objectives: [],
            content: '',
            fileUrl: '',
            fileName: ''
        });
        setFile(null);
        setNewObjective('');
    };

    const filteredMaterials = materials.filter(m => {
        const matchesSearch = m.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCourse = !selectedCourse || m.courseId === selectedCourse;
        const matchesSubject = !selectedSubject || m.subjectId === selectedSubject;
        return matchesSearch && matchesCourse && matchesSubject;
    });

    const availableSubjects = selectedCourse 
        ? subjects.filter(s => s.courseId === selectedCourse)
        : [];

    if (!permissions.isSuperAdmin && !permissions.user?.role?.includes('sostenedor') && !permissions.user?.role?.includes('admin') && !permissions.user?.role?.includes('teacher')) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center">
                <Target size={64} className="text-rose-500 mb-6" />
                <h1 className="text-2xl font-black text-gray-800 uppercase">Acceso Restringido</h1>
                <p className="text-gray-500">Solo administradores y docentes pueden acceder a esta sección.</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-black text-[#11355a] tracking-tight flex items-center gap-3">
                        <BookOpen size={40} className="text-blue-600" />
                        Material Complementario
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg">Gestiona objetivos y contenido curricular para cada curso y asignatura.</p>
                </div>
                <button
                    onClick={() => {
                        setModalMode('create');
                        resetForm();
                        setShowModal(true);
                    }}
                    className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                >
                    <Plus size={24} /> NUEVO MATERIAL
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Buscar</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por título..."
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all font-bold"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Curso</label>
                        <select
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all font-bold"
                            value={selectedCourse}
                            onChange={e => {
                                setSelectedCourse(e.target.value);
                                setSelectedSubject('');
                            }}
                        >
                            <option value="">Todos los cursos</option>
                            {courses.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Asignatura</label>
                        <select
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all font-bold"
                            value={selectedSubject}
                            onChange={e => setSelectedSubject(e.target.value)}
                            disabled={!selectedCourse}
                        >
                            <option value="">Todas las asignaturas</option>
                            {availableSubjects.map(s => (
                                <option key={s._id} value={s._id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Materials List */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#11355a]"></div>
                </div>
            ) : filteredMaterials.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold">No hay material curricular disponible.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredMaterials.map(material => (
                        <div key={material._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all overflow-hidden group">
                            <div 
                                className="p-6 text-white"
                                style={{ backgroundColor: tenant?.theme?.primaryColor || '#11355a' }}
                            >
                                <h3 className="font-black text-lg mb-2">{material.title}</h3>
                                <p className="text-sm opacity-90 line-clamp-2">{material.description}</p>
                            </div>

                            <div className="p-6">
                                <div className="mb-4">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Objetivos</p>
                                    <div className="space-y-1">
                                        {(material.objectives || []).slice(0, 3).map((obj, idx) => (
                                            <p key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                                                <span className="text-blue-600 font-bold mt-0.5">•</span>
                                                <span>{obj}</span>
                                            </p>
                                        ))}
                                        {(material.objectives || []).length > 3 && (
                                            <p className="text-xs text-blue-600 font-bold">
                                                +{(material.objectives || []).length - 3} más
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {material.fileName && (
                                    <div className="mb-4 p-2 bg-gray-50 rounded-lg flex items-center gap-2">
                                        <File size={16} className="text-blue-600" />
                                        <span className="text-xs font-bold text-gray-600 truncate">{material.fileName}</span>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEditModal(material)}
                                        className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Edit size={16} /> Editar
                                    </button>
                                    <button
                                        onClick={() => material._id && handleDelete(material._id)}
                                        className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg font-bold text-sm hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={16} /> Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div
                            className="p-6 text-white flex justify-between items-center"
                            style={{ backgroundColor: tenant?.theme?.primaryColor || '#11355a' }}
                        >
                            <h2 className="text-2xl font-black flex items-center gap-3">
                                <BookOpen size={28} />
                                {modalMode === 'create' ? 'Nuevo Material' : 'Editar Material'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="hover:bg-white/20 p-2 rounded-lg transition">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Título del Material</label>
                                <input
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold"
                                    value={formData.title || ''}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Ej: Objetivos de Matemáticas - Unidad 1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Descripción</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold"
                                    rows={3}
                                    value={formData.description || ''}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descripción breve del material..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Curso</label>
                                    <select
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold"
                                        value={formData.courseId || ''}
                                        onChange={e => setFormData({ ...formData, courseId: e.target.value })}
                                    >
                                        <option value="">Seleccionar Curso...</option>
                                        {courses.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Asignatura (Opcional)</label>
                                    <select
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold"
                                        value={formData.subjectId || ''}
                                        onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
                                        disabled={!formData.courseId}
                                    >
                                        <option value="">Sin asignatura específica</option>
                                        {availableSubjects.map(s => (
                                            <option key={s._id} value={s._id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Objetivos de Aprendizaje</label>
                                <div className="space-y-2 mb-3">
                                    {(formData.objectives || []).map((obj, idx) => (
                                        <div key={idx} className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg border-2 border-blue-100">
                                            <span className="text-blue-600 font-black">{idx + 1}.</span>
                                            <span className="flex-1 text-gray-700 font-bold">{obj}</span>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({
                                                    ...formData,
                                                    objectives: (formData.objectives || []).filter((_, i) => i !== idx)
                                                })}
                                                className="text-red-600 hover:bg-red-100 p-1 rounded transition"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Agregar un objetivo..."
                                        className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold"
                                        value={newObjective}
                                        onChange={e => setNewObjective(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (newObjective.trim()) {
                                                setFormData({
                                                    ...formData,
                                                    objectives: [...(formData.objectives || []), newObjective]
                                                });
                                                setNewObjective('');
                                            }
                                        }}
                                        className="bg-blue-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Contenido (Texto opcional)</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold"
                                    rows={4}
                                    value={formData.content || ''}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Contenido detallado del material..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Adjuntar Archivo (Opcional)</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.txt,.xlsx,.pptx"
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all font-bold"
                                        onChange={e => setFile(e.target.files?.[0] || null)}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Formatos: PDF, Word, Excel, PowerPoint (máx. 10MB)</p>
                                </div>
                                {file && (
                                    <div className="mt-2 p-2 bg-green-50 rounded-lg flex items-center gap-2">
                                        <File size={16} className="text-green-600" />
                                        <span className="text-xs font-bold text-green-600">{file.name}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 text-gray-600 font-black hover:bg-gray-100 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Save size={20} />
                                    {modalMode === 'create' ? 'Crear Material' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CurriculumMaterialPage;
