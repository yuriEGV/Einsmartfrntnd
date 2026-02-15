import { useState, useEffect } from 'react';
import api from '../services/api';
import curriculumService, { type CurriculumMaterial } from '../services/curriculumService';
import {
    BookOpen, Plus, Search,
    Trash2, X, Save, File,
    Edit, Target
} from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useTenant } from '../context/TenantContext';
import TestWizard from '../components/TestWizard';

interface Course {
    _id: string;
    name: string;
}

interface Subject {
    _id: string;
    name: string;
    courseId: string;
}

const CurriculumMaterialPage = ({ hideHeader = false }: { hideHeader?: boolean }) => {
    const permissions = usePermissions();
    const { tenant } = useTenant();
    const [showWizard, setShowWizard] = useState(false);

    // Mock data for courses and subjects if API fails
    const mockCourses: Course[] = [
        { _id: '1', name: '1° Básico' },
        { _id: '2', name: '2° Básico' },
        { _id: '3', name: '3° Básico' },
        { _id: '4', name: '4° Básico' },
        { _id: '5', name: '5° Básico' },
        { _id: '6', name: '6° Básico' },
        { _id: '7', name: '7° Básico' },
        { _id: '8', name: '8° Básico' },
        { _id: '9', name: '1° Medio' },
        { _id: '10', name: '2° Medio' },
        { _id: '11', name: '3° Medio' },
        { _id: '12', name: '4° Medio' }
    ];

    const mockSubjects: Subject[] = [
        { _id: 's1', name: 'Matemática', courseId: '1' },
        { _id: 's2', name: 'Lenguaje', courseId: '1' },
        { _id: 's3', name: 'Ciencias Naturales', courseId: '1' },
        { _id: 's4', name: 'Historia', courseId: '1' },
        { _id: 's5', name: 'Educación Física', courseId: '1' },
        { _id: 's6', name: 'Artes', courseId: '1' },
        { _id: 's7', name: 'Inglés', courseId: '1' },
        { _id: 's8', name: 'Tecnología', courseId: '1' }
    ];

    const [materials, setMaterials] = useState<CurriculumMaterial[]>([]);
    const [courses, setCourses] = useState<Course[]>(mockCourses);
    const [subjects, setSubjects] = useState<Subject[]>(mockSubjects);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');

    // Temp states for non-reactive filter
    const [tempSearch, setTempSearch] = useState('');
    const [tempCourse, setTempCourse] = useState('');
    const [tempSubject, setTempSubject] = useState('');

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
            setCourses(coursesRes.data && coursesRes.data.length > 0 ? coursesRes.data : mockCourses);
            setSubjects(subjectsRes.data && subjectsRes.data.length > 0 ? subjectsRes.data : mockSubjects);
        } catch (err) {
            console.error('Error fetching data:', err);
            // Use mock data as fallback
            setMaterials([]);
            setCourses(mockCourses);
            setSubjects(mockSubjects);
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

    const filteredMaterials = (materials || []).filter(m => {
        const matchesSearch = m.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCourse = !selectedCourse || m.courseId === selectedCourse;
        const matchesSubject = !selectedSubject || m.subjectId === selectedSubject;
        return matchesSearch && matchesCourse && matchesSubject;
    });

    const handleSearch = () => {
        setSearchTerm(tempSearch);
        setSelectedCourse(tempCourse);
        setSelectedSubject(tempSubject);
    };

    const availableSubjects = tempCourse
        ? (subjects || []).filter(s => {
            if (!s.courseId) return false;
            const sCourseId = typeof s.courseId === 'object' ? (s.courseId as any)._id : s.courseId;
            return sCourseId === tempCourse;
        })
        : [];

    const modalSubjects = formData.courseId
        ? (subjects || []).filter(s => {
            if (!s.courseId) return false;
            const sCourseId = typeof s.courseId === 'object' ? (s.courseId as any)._id : s.courseId;
            return sCourseId === formData.courseId;
        })
        : [];

    if (!permissions.canManageSubjects) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center">
                <Target size={64} className="text-rose-500 mb-6" />
                <h1 className="text-2xl font-black text-gray-800 uppercase">Acceso Restringido</h1>
                <p className="text-gray-500">Solo administradores y docentes pueden acceder a esta sección.</p>
            </div>
        );
    }

    return (
        <div className={`${hideHeader ? 'p-0' : 'p-8 max-w-7xl mx-auto'}`}>
            {!hideHeader && (
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-[#11355a] tracking-tight flex items-center gap-3">
                            <BookOpen size={40} className="text-blue-600" />
                            Material Complementario
                        </h1>
                        <p className="text-gray-500 mt-2 text-lg">Gestiona objetivos y contenido curricular para cada curso y asignatura.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowWizard(true)}
                            className="bg-white text-[#11355a] border-2 border-[#11355a]/10 px-6 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-50 transition-all shadow-xl shadow-blue-900/5 active:scale-95"
                        >
                            <Target size={24} className="text-[#11355a]" />
                            <span className="text-xs uppercase tracking-widest">Crear Evaluación</span>
                        </button>
                        <button
                            onClick={() => {
                                setModalMode('create');
                                resetForm();
                                setShowModal(true);
                            }}
                            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                        >
                            <Plus size={24} />
                            <span className="text-xs uppercase tracking-widest">Nuevo Material</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Buscar</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por título..."
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all font-bold"
                                value={tempSearch}
                                onChange={e => setTempSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Curso</label>
                        <select
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all font-bold"
                            value={tempCourse}
                            onChange={e => {
                                setTempCourse(e.target.value);
                                setTempSubject('');
                            }}
                        >
                            <option value="">Todos los cursos</option>
                            {Array.from(new Set((courses || []).map(c => c?.name).filter(Boolean)))
                                .sort()
                                .map(name => {
                                    const course = (courses || []).find(c => c.name === name);
                                    return (
                                        <option key={course?._id} value={course?._id}>{name}</option>
                                    );
                                })
                            }
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Asignatura</label>
                        <select
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all font-bold"
                            value={tempSubject}
                            onChange={e => setTempSubject(e.target.value)}
                            disabled={!tempCourse}
                        >
                            <option value="">Todas las asignaturas</option>
                            {availableSubjects.map(s => (
                                <option key={s._id} value={s._id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <button
                            onClick={handleSearch}
                            className="w-full bg-[#11355a] text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2"
                        >
                            <Search size={16} /> BUSCAR
                        </button>
                    </div>
                    {hideHeader && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowWizard(true)}
                                className="flex-1 bg-white text-[#11355a] border-2 border-[#11355a]/10 p-3 rounded-xl hover:bg-blue-50 transition-all shadow-lg"
                                title="Crear Evaluación"
                            >
                                <Target size={20} />
                            </button>
                            <button
                                onClick={() => {
                                    setModalMode('create');
                                    resetForm();
                                    setShowModal(true);
                                }}
                                className="flex-1 bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg"
                                title="Nuevo Material"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    )}
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
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[999] md:pl-[300px] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-[0_0_80px_rgba(0,0,0,0.3)] border-8 border-white animate-in zoom-in-95 duration-500 max-h-[95vh] overflow-y-auto custom-scrollbar">
                        <div
                            className="p-10 text-white relative overflow-hidden"
                            style={{ backgroundColor: tenant?.theme?.primaryColor || '#11355a' }}
                        >
                            <div className="relative z-10">
                                <h2 className="text-3xl font-black tracking-tighter uppercase leading-none mb-2 flex items-center gap-3">
                                    <BookOpen size={28} />
                                    {modalMode === 'create' ? 'Nueva Planificación' : 'Editar Recurso'}
                                </h2>
                                <p className="text-blue-300 font-extrabold uppercase text-[10px] tracking-[0.3em]">
                                    {modalMode === 'create' ? 'COBERTURA Y MATERIAL ACADÉMICO' : 'GESTIÓN DE CONTENIDO CURRICULAR'}
                                </p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all">
                                <X size={24} />
                            </button>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-6 bg-slate-50/30">
                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">TÍTULO DEL MATERIAL / UNIDAD</label>
                                <input
                                    required
                                    className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:shadow-xl focus:shadow-blue-500/5 transition-all outline-none font-black text-slate-700"
                                    value={formData.title || ''}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Ej: Planificación Anual Matemática 2026"
                                />
                            </div>

                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">DESCRIPCIÓN DE LA ACTIVIDAD</label>
                                <textarea
                                    className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-bold text-slate-600 resize-none"
                                    rows={3}
                                    value={formData.description || ''}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Detalles sobre el material o planificación..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">CURSO <span className="text-red-600">*</span></label>
                                    <select
                                        required
                                        className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-black text-slate-700 appearance-none bg-no-repeat"
                                        value={formData.courseId || ''}
                                        onChange={e => setFormData({ ...formData, courseId: e.target.value, subjectId: '' })}
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {courses && courses.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">ASIGNATURA (OPCIONAL)</label>
                                    <select
                                        className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-black text-slate-700 appearance-none bg-no-repeat"
                                        value={formData.subjectId || ''}
                                        onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
                                        disabled={!formData.courseId}
                                    >
                                        <option value="">-- General --</option>
                                        {modalSubjects && modalSubjects.map(s => (
                                            <option key={s._id} value={s._id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">OBJETIVOS DE APRENDIZAJE (OA)</label>
                                <div className="space-y-2 mb-4">
                                    {(formData.objectives || []).map((obj, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-white p-4 rounded-xl border-2 border-slate-50 shadow-sm">
                                            <div className="w-6 h-6 bg-[#11355a] text-white rounded-lg flex items-center justify-center font-black text-[10px]">{idx + 1}</div>
                                            <span className="flex-1 text-slate-600 font-bold text-sm">{obj}</span>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({
                                                    ...formData,
                                                    objectives: (formData.objectives || []).filter((_, i) => i !== idx)
                                                })}
                                                className="text-rose-400 hover:text-rose-600 p-1"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Ej: OA 01 - Cálculo numérico..."
                                        className="flex-1 px-6 py-3 bg-white border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none font-bold text-sm"
                                        value={newObjective}
                                        onChange={e => setNewObjective(e.target.value)}
                                        onKeyPress={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (newObjective.trim()) {
                                                    setFormData({
                                                        ...formData,
                                                        objectives: [...(formData.objectives || []), newObjective.trim()]
                                                    });
                                                    setNewObjective('');
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (newObjective.trim()) {
                                                setFormData({
                                                    ...formData,
                                                    objectives: [...(formData.objectives || []), newObjective.trim()]
                                                });
                                                setNewObjective('');
                                            }
                                        }}
                                        className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/10"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">ADJUNTAR EXPEDIENTE (PDF/DOCX)</label>
                                <div className="relative border-2 border-dashed border-slate-200 rounded-[2rem] p-8 text-center bg-white hover:border-blue-400 transition-colors cursor-pointer group-hover:bg-blue-50/10">
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.txt,.xlsx,.pptx"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={e => setFile(e.target.files?.[0] || null)}
                                    />
                                    <div className="flex flex-col items-center gap-2">
                                        <File className="text-slate-300" size={32} />
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                            {file ? file.name : 'Seleccionar o Arrastrar Archivo'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 flex flex-col md:flex-row gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-5 text-slate-400 font-black hover:bg-slate-100 rounded-2xl transition-all uppercase tracking-widest text-xs"
                                >
                                    DESCARTAR
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] py-5 bg-[#11355a] text-white rounded-2xl font-black hover:bg-blue-900 shadow-2xl shadow-blue-900/20 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:bg-slate-300"
                                >
                                    <Save size={18} />
                                    {modalMode === 'create' ? 'PUBLICAR PLANIFICACIÓN' : 'ACTUALIZAR DATOS'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Test Wizard Integration */}
            <TestWizard
                isOpen={showWizard}
                onClose={() => setShowWizard(false)}
                initialCourseId={selectedCourse}
                initialSubjectId={selectedSubject}
            />
        </div>
    );
};

export default CurriculumMaterialPage;
