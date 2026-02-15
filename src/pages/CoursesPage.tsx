
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { Plus, Edit, Trash2, Search, BookOpen, Users, GraduationCap } from 'lucide-react';

interface Course {
    _id: string;
    name: string;
    description: string;
    code: string;
    teacherId?: {
        _id: string;
        name: string;
        email: string;
    };
    careerId?: {
        _id: string;
        name: string;
    };
    createdAt: string;
}

interface Teacher {
    _id: string;
    name: string;
}

interface Career {
    _id: string;
    name: string;
}

const CoursesPage = () => {
    const { canManageCourses, isStudent, isApoderado } = usePermissions();
    const isStudentOrGuardian = isStudent || isApoderado;
    const navigate = useNavigate();
    // const { tenant } = useTenant(); // Not used currently
    const [courses, setCourses] = useState<Course[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [careers, setCareers] = useState<Career[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [currentCourse, setCurrentCourse] = useState<Partial<Course> | null>(null);

    // Subjects Modal
    const [showSubjectsModal, setShowSubjectsModal] = useState(false);
    const [viewingCourseSubjects, setViewingCourseSubjects] = useState<any[]>([]);
    const [viewingCourseName, setViewingCourseName] = useState('');
    const [viewingCourseId, setViewingCourseId] = useState('');
    const [newSubjectData, setNewSubjectData] = useState({
        name: '',
        teacherId: '',
        isComplementary: false
    });

    // Form specific state
    const [formData, setFormData] = useState({
        name: '',
        level: '',
        letter: '',
        description: '',
        teacherId: '',
        careerId: ''
    });

    useEffect(() => {
        fetchCourses();
        if (!isStudentOrGuardian) {
            fetchTeachers();
            fetchCareers();
        }
    }, [isStudentOrGuardian]);

    const fetchCourses = async () => {
        try {
            const response = await api.get('/courses');
            let data = response.data;

            // If Student or Guardian, we should ideally only have their courses if backend filters.
            // If backend doesn't filter, we might need to filter here, but backend /courses usually returns everything.
            // USER: "no tenga la opcion de cambiar de curso que solo pueda ver los datos de su alumno matriculado"
            // Let's assume for now we filter based on what student(s) the user represents.
            if (isStudentOrGuardian) {
                const studentsRes = await api.get('/estudiantes');
                const myStudents = studentsRes.data;
                const myCourseIds = myStudents.map((s: any) => s.courseId?._id || s.courseId);
                data = data.filter((c: any) => myCourseIds.includes(c._id));
            }

            setCourses(data);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeachers = async () => {
        try {
            // Assuming we have an endpoint or query param to get teachers
            const response = await api.get('/users?role=teacher');
            // If /users returns all, we might need to filter on client if API doesn't support query
            // But let's assume /users works for now or returns all and we filter
            // Now backend respects ?role=teacher, so we should get mostly teachers.
            // But we filter strictly on client as well to be safe and exclude Sostenedor/Admin as requested.
            const allUsers = response.data;
            const teacherList = allUsers.filter((u: any) => u.role === 'teacher');
            setTeachers(teacherList);
        } catch (error) {
            console.error('Error fetching teachers:', error);
        }
    };

    const fetchCareers = async () => {
        try {
            const response = await api.get('/careers');
            setCareers(response.data);
        } catch (error) {
            console.error('Error fetching careers:', error);
        }
    };

    const handleOpenModal = (mode: 'create' | 'edit', course?: any) => {
        setModalMode(mode);
        if (mode === 'edit' && course) {
            setCurrentCourse(course);
            setFormData({
                name: course.name,
                level: course.level || '',
                letter: course.letter || '',
                description: course.description,
                teacherId: (course.teacherId && typeof course.teacherId === 'object') ? course.teacherId._id : (course.teacherId || ''),
                careerId: (course.careerId && typeof course.careerId === 'object') ? course.careerId._id : (course.careerId || '')
            });
        } else {
            setCurrentCourse(null);
            setFormData({
                name: '',
                level: '',
                letter: '',
                description: '',
                teacherId: '',
                careerId: ''
            });
        }
        setShowModal(true);
    };

    const handleViewSubjects = async (course: Course) => {
        try {
            setViewingCourseId(course._id);
            setViewingCourseName(course.name);
            const res = await api.get(`/subjects?courseId=${course._id}`);
            setViewingCourseSubjects(res.data);
            setShowSubjectsModal(true);
        } catch (error) {
            console.error(error);
            alert('Error al cargar ramos');
        }
    };

    const handleAssignSubject = async () => {
        try {
            await api.post('/subjects', {
                ...newSubjectData,
                courseId: viewingCourseId
            });
            // Refresh list
            const res = await api.get(`/subjects?courseId=${viewingCourseId}`);
            setViewingCourseSubjects(res.data);
            // Reset form
            setNewSubjectData({ name: '', teacherId: '', isComplementary: false });
        } catch (error) {
            console.error(error);
            alert('Error al asignar ramo');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Enforce format: Level + Letter in Name
            const finalName = `${formData.level}${formData.letter}`;
            const payload = { ...formData, name: finalName };

            if (modalMode === 'create') {
                await api.post('/courses', payload);
            } else {
                if (currentCourse && currentCourse._id) {
                    await api.put(`/courses/${currentCourse._id}`, payload);
                }
            }
            setShowModal(false);
            fetchCourses();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al guardar curso');
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar este curso? Se perderán las asociaciones con matrículas.')) return;
        try {
            await api.delete(`/courses/${id}`);
            fetchCourses();
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    const sortedCourses = [...courses].sort((a: any, b: any) => {
        // Sort by level then letter
        const levelOrder = ["1°", "2°", "3°", "4°", "5°", "6°", "7°", "8°", "I°", "II°", "III°", "IV°"];
        const levelA = levelOrder.indexOf(a.level);
        const levelB = levelOrder.indexOf(b.level);

        if (levelA !== levelB) return levelA - levelB;
        return (a.letter || '').localeCompare(b.letter || '');
    });

    const filteredCourses = sortedCourses.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-10 space-y-6 md:space-y-10 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100/50">
                            <GraduationCap size={32} className="text-[#11355a] md:w-10 md:h-10" />
                        </div>
                        Cursos
                    </h1>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2 ml-1">
                        Organización de niveles y docentes
                    </p>
                </div>
                {canManageCourses && !usePermissions().isTeacher && (
                    <button
                        onClick={() => handleOpenModal('create')}
                        className="w-full md:w-auto bg-[#11355a] text-white px-8 py-4 rounded-[1.5rem] flex items-center justify-center gap-3 hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/20 active:scale-95 font-black uppercase text-xs tracking-widest"
                    >
                        <Plus size={20} /> NUEVO CURSO
                    </button>
                )}
            </div>

            {/* Enhanced Search Bar */}
            < div className="bg-white p-2 rounded-[1.5rem] shadow-xl shadow-blue-900/5 border border-slate-50 flex items-center gap-2 group focus-within:ring-4 focus-within:ring-blue-500/5 transition-all" >
                <div className="p-4 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Search size={22} />
                </div>
                <input
                    type="text"
                    placeholder="Buscar cursos por nombre o código..."
                    className="flex-1 outline-none text-slate-700 font-extrabold text-sm md:text-base bg-transparent py-4 placeholder:text-slate-300 placeholder:font-bold"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div >

            {/* Grid List */}
            {
                loading ? (
                    <div className="flex flex-col items-center justify-center py-24 animate-pulse">
                        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Cargando niveles académicos...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {filteredCourses.map((course, idx) => (
                            <div
                                key={course._id}
                                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group flex flex-col"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#11355a] flex items-center justify-center font-black group-hover:bg-[#11355a] group-hover:text-white transition-all shadow-sm border-2 border-white">
                                            <BookOpen size={28} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-black text-slate-800 text-lg leading-tight uppercase tracking-tighter truncate max-w-[200px]">
                                                {course.name}
                                                {course.careerId?.name && (
                                                    <span className="block text-[10px] text-blue-500 font-black opacity-80 mt-0.5">
                                                        {course.careerId.name}
                                                    </span>
                                                )}
                                            </h3>
                                            <div className="inline-block px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] font-mono font-black text-slate-400 uppercase tracking-tighter mt-1">
                                                ID: {course.code || course._id.slice(-4)}
                                            </div>
                                        </div>
                                    </div>
                                    {!isStudentOrGuardian && (
                                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100">
                                            <button
                                                onClick={() => handleOpenModal('edit', course)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(course._id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <p className="text-slate-500 text-sm font-bold leading-relaxed mb-6 line-clamp-2 min-h-[3rem]">
                                    {course.description || 'Nivel educativo configurado en el sistema.'}
                                </p>

                                <div className="mt-auto space-y-4">
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-sm border border-slate-100 font-black text-xs">
                                            {course.teacherId?.name ? course.teacherId.name.charAt(0) : '?'}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Profesor Jefe</div>
                                            <div className="text-xs font-black text-slate-700 truncate">
                                                {course.teacherId?.name || 'SIN ASIGNAR'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Career display moved to header area but keeping this for legacy if needed or removing it to clean up */}
                                    {/* Removing the redundant career block to make space for the button */}

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleViewSubjects(course)}
                                            className="flex-1 py-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                                        >
                                            <BookOpen size={14} />
                                            Ramos / Malla
                                        </button>
                                        {!isStudentOrGuardian && (
                                            <button
                                                onClick={() => navigate(`/courses/${course._id}/students`)}
                                                className="flex-1 py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2 group/btn"
                                            >
                                                <Users size={14} className="text-slate-300 group-hover/btn:text-blue-400" />
                                                Alumnos
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredCourses.length === 0 && !loading && (
                            <div className="col-span-full py-24 text-center bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100">
                                <GraduationCap size={64} className="mx-auto text-slate-200 mb-6" />
                                <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">No hay niveles registrados</h3>
                                <p className="text-xs font-bold text-slate-300 mt-2">Crea tu primer curso para comenzar a organizar a los alumnos.</p>
                            </div>
                        )}
                    </div>
                )
            }

            {/* Full Screen Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in duration-200">
                        {/* Header - Fixed */}
                        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 bg-white shrink-0">
                            <div>
                                <h2 className="text-xl md:text-2xl font-black text-[#11355a] uppercase tracking-tight">
                                    {modalMode === 'create' ? 'Crear Nuevo Curso' : 'Editar Curso'}
                                </h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden md:block">
                                    {modalMode === 'create' ? 'Configuración de nueva unidad académica' : 'Actualización de parámetros'}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <Users size={24} className="rotate-45" /> {/* Reuse icon as generic close */}
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto bg-slate-50/30">
                            <form id="course-form" onSubmit={handleSave} className="max-w-4xl mx-auto p-4 md:p-10 space-y-8">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                            <GraduationCap size={20} />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-700 uppercase tracking-tight">Datos del Nivel</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="group">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">NIVEL (GRADO)</label>
                                            <select
                                                required
                                                className="w-full px-5 py-3.5 bg-white border-2 border-slate-100 rounded-xl focus:border-blue-500 transition-all outline-none font-bold text-slate-700 appearance-none"
                                                value={formData.level}
                                                onChange={e => setFormData({ ...formData, level: e.target.value })}
                                            >
                                                <option value="">Seleccionar Nivel...</option>
                                                <option value="1°">1° Básico</option>
                                                <option value="2°">2° Básico</option>
                                                <option value="3°">3° Básico</option>
                                                <option value="4°">4° Básico</option>
                                                <option value="5°">5° Básico</option>
                                                <option value="6°">6° Básico</option>
                                                <option value="7°">7° Básico</option>
                                                <option value="8°">8° Básico</option>
                                                <option value="I°">I° Medio</option>
                                                <option value="II°">II° Medio</option>
                                                <option value="III°">III° Medio</option>
                                                <option value="IV°">IV° Medio</option>
                                            </select>
                                        </div>
                                        <div className="group">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">LETRA (PARALELO)</label>
                                            <select
                                                required
                                                className="w-full px-5 py-3.5 bg-white border-2 border-slate-100 rounded-xl focus:border-blue-500 transition-all outline-none font-bold text-slate-700 appearance-none"
                                                value={formData.letter}
                                                onChange={e => setFormData({ ...formData, letter: e.target.value })}
                                            >
                                                <option value="">Seleccionar Letra...</option>
                                                <option value="A">A</option>
                                                <option value="B">B</option>
                                                <option value="C">C</option>
                                                <option value="D">D</option>
                                                <option value="E">E</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">DESCRIPCIÓN</label>
                                        <textarea
                                            required
                                            rows={3}
                                            maxLength={500}
                                            className="w-full px-5 py-3.5 bg-white border-2 border-slate-100 rounded-xl focus:border-blue-500 transition-all outline-none font-bold text-slate-600 resize-none"
                                            placeholder="Características principales del grupo..."
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="group">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">PROFESOR JEFE</label>
                                            <select
                                                required
                                                className="w-full px-5 py-3.5 bg-white border-2 border-slate-100 rounded-xl focus:border-blue-500 transition-all outline-none font-bold text-slate-700 appearance-none"
                                                value={formData.teacherId}
                                                onChange={e => setFormData({ ...formData, teacherId: e.target.value })}
                                            >
                                                <option value="">Asignar Docente...</option>
                                                {teachers.map(t => (
                                                    <option key={t._id} value={t._id}>{t.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="group">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">ESPECIALIDAD / CARRERA</label>
                                            <select
                                                className="w-full px-5 py-3.5 bg-white border-2 border-slate-100 rounded-xl focus:border-blue-500 transition-all outline-none font-bold text-slate-700 appearance-none"
                                                value={formData.careerId}
                                                onChange={e => setFormData({ ...formData, careerId: e.target.value })}
                                            >
                                                <option value="">Sin Especialidad (Plan Común)</option>
                                                {careers.map(c => (
                                                    <option key={c._id} value={c._id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer - Fixed */}
                        <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50 shrink-0 flex flex-col-reverse md:flex-row gap-3 md:justify-end">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-8 py-3.5 border border-gray-200 rounded-xl hover:bg-white font-black text-slate-500 text-xs uppercase tracking-widest w-full md:w-auto"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-10 py-3.5 bg-[#11355a] text-white rounded-xl hover:bg-[#1a4a7c] transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-900/20 w-full md:w-auto"
                            >
                                {modalMode === 'create' ? 'Crear Curso' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                )
            }
            {/* Subjects Modal */}
            {showSubjectsModal && (
                <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95">
                        <div className="p-8 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white shrink-0">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight">Ramos del Curso: {viewingCourseName}</h3>
                                    <p className="text-xs font-bold text-blue-100 uppercase tracking-widest mt-1">Malla Curricular Vigente</p>
                                </div>
                                <button onClick={() => setShowSubjectsModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                    <Trash2 size={24} className="rotate-45" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50">
                            {/* Quick Add Form */}
                            <div className="bg-white p-6 rounded-[2rem] border-2 border-blue-100 shadow-sm space-y-4">
                                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Asignar Nuevo Ramo</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        placeholder="Nombre del Ramo (Ej: Ciencias)"
                                        className="px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-bold text-slate-700 focus:border-blue-500 transition-all text-sm"
                                        value={newSubjectData.name}
                                        onChange={e => setNewSubjectData({ ...newSubjectData, name: e.target.value })}
                                    />
                                    <select
                                        className="px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-bold text-slate-700 focus:border-blue-500 transition-all text-sm appearance-none"
                                        value={newSubjectData.teacherId}
                                        onChange={e => setNewSubjectData({ ...newSubjectData, teacherId: e.target.value })}
                                    >
                                        <option value="">Seleccionar Docente...</option>
                                        {teachers.map((t: any) => (
                                            <option key={t._id} value={t._id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-2 border-slate-200 text-blue-600"
                                            checked={newSubjectData.isComplementary}
                                            onChange={e => setNewSubjectData({ ...newSubjectData, isComplementary: e.target.checked })}
                                        />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Es Complementario</span>
                                    </label>
                                    <button
                                        onClick={handleAssignSubject}
                                        disabled={!newSubjectData.name || !newSubjectData.teacherId}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-200"
                                    >
                                        Asignar ramo
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Malla Curricular Vigente</h4>
                                {viewingCourseSubjects.length > 0 ? viewingCourseSubjects.map((subject: any) => (
                                    <div key={subject._id} className="p-5 bg-white rounded-3xl border-2 border-slate-100 shadow-sm flex items-center justify-between hover:border-blue-200 transition-all animate-in fade-in slide-in-from-bottom-2">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner font-black">
                                                {subject.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-800 uppercase tracking-tight">{subject.name}</div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Docente: {subject.teacherId?.name || 'No asignado'}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {subject.isComplementary && (
                                                <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100">
                                                    Complementario
                                                </span>
                                            )}
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm('¿Desvincular este ramo del curso?')) {
                                                        try {
                                                            await api.delete(`/subjects/${subject._id}`);
                                                            const res = await api.get(`/subjects?courseId=${viewingCourseId}`);
                                                            setViewingCourseSubjects(res.data);
                                                        } catch (err) { alert('Error al eliminar'); }
                                                    }
                                                }}
                                                className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-20 text-center border-4 border-dashed border-slate-200 rounded-[2.5rem]">
                                        <BookOpen size={48} className="mx-auto text-slate-200 mb-4" />
                                        <p className="text-slate-400 font-bold">No hay ramos registrados para este curso.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-6 bg-white border-t flex justify-end">
                            <button
                                onClick={() => setShowSubjectsModal(false)}
                                className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default CoursesPage;
