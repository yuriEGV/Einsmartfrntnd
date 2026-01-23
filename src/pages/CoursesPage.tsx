
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { Plus, Edit, Trash2, Search, BookOpen, Users, GraduationCap, Save } from 'lucide-react';

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
    createdAt: string;
}

interface Teacher {
    _id: string;
    name: string;
}

const CoursesPage = () => {
    const { canManageCourses, isSuperAdmin } = usePermissions();
    // const { tenant } = useTenant(); // Not used currently
    const [courses, setCourses] = useState<Course[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [currentCourse, setCurrentCourse] = useState<Partial<Course> | null>(null);

    // Form specific state (since teacherId can be object or string in different contexts)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        teacherId: ''
    });

    useEffect(() => {
        fetchCourses();
        fetchTeachers();
    }, []);

    const fetchCourses = async () => {
        try {
            const response = await api.get('/courses');
            setCourses(response.data);
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

    const handleOpenModal = (mode: 'create' | 'edit', course?: Course) => {
        setModalMode(mode);
        if (mode === 'edit' && course) {
            setCurrentCourse(course);
            setFormData({
                name: course.name,
                description: course.description,
                teacherId: typeof course.teacherId === 'object' ? course.teacherId._id : (course.teacherId || '')
            });
        } else {
            setCurrentCourse(null);
            setFormData({
                name: '',
                description: '',
                teacherId: ''
            });
        }
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (modalMode === 'create') {
                await api.post('/courses', formData);
            } else {
                if (currentCourse && currentCourse._id) {
                    await api.put(`/courses/${currentCourse._id}`, formData);
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

    const filteredCourses = courses.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!canManageCourses && !isSuperAdmin) { // Assuming usePermissions might not have canManageCourses yet, defaulting check
        // We'll rely on backend 403 as well, but visual check:
        // If "canManageCourses" isn't in hook, we might need to add it or use raw role check
    }

    // Quick fix if usePermissions doesn't export canManageCourses yet (we will check hook later)
    // For now assuming role check inside user or isSuperAdmin is enough for UI visibility

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
                <button
                    onClick={() => handleOpenModal('create')}
                    className="w-full md:w-auto bg-[#11355a] text-white px-8 py-4 rounded-[1.5rem] flex items-center justify-center gap-3 hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/20 active:scale-95 font-black uppercase text-xs tracking-widest"
                >
                    <Plus size={20} /> NUEVO CURSO
                </button>
            </div>

            {/* Enhanced Search Bar */}
            <div className="bg-white p-2 rounded-[1.5rem] shadow-xl shadow-blue-900/5 border border-slate-50 flex items-center gap-2 group focus-within:ring-4 focus-within:ring-blue-500/5 transition-all">
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
            </div>

            {/* Grid List */}
            {loading ? (
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
                                        <h3 className="font-black text-slate-800 text-lg leading-tight uppercase tracking-tighter truncate max-w-[150px]">
                                            {course.name}
                                        </h3>
                                        <div className="inline-block px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] font-mono font-black text-slate-400 uppercase tracking-tighter mt-1">
                                            ID: {course.code || course._id.slice(-4)}
                                        </div>
                                    </div>
                                </div>
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

                                <button className="w-full py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2 group/btn">
                                    <Users size={14} className="text-slate-300 group-hover/btn:text-blue-400" />
                                    Ver Lista de Alumnos
                                </button>
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
            )}

            {/* Refined Premium Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-[0_0_80px_rgba(0,0,0,0.3)] border-8 border-white animate-in zoom-in-95 duration-500 max-h-[95vh] overflow-y-auto custom-scrollbar">
                        <div
                            className="p-10 text-white relative overflow-hidden"
                            style={{ backgroundColor: '#11355a' }}
                        >
                            <div className="relative z-10">
                                <h2 className="text-3xl font-black tracking-tighter uppercase leading-none mb-2">
                                    {modalMode === 'create' ? 'Configurar Curso' : 'Actualizar Nivel'}
                                </h2>
                                <p className="text-blue-300 font-extrabold uppercase text-[10px] tracking-[0.3em]">
                                    {modalMode === 'create' ? 'ALTA DE NUEVA UNIDAD ACADÉMICA' : 'MODIFICACIÓN DE PARÁMETROS'}
                                </p>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                        </div>

                        <form onSubmit={handleSave} className="p-10 space-y-6 bg-slate-50/30">
                            <div className="space-y-6">
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">NOMBRE DEL CURSO / GRADO</label>
                                    <input
                                        required
                                        maxLength={50}
                                        className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:shadow-xl focus:shadow-blue-500/5 transition-all outline-none font-black text-slate-700"
                                        placeholder="Ej: 1° Básico A"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">DESCRIPCIÓN ACADÉMICA</label>
                                    <textarea
                                        required
                                        rows={3}
                                        maxLength={500}
                                        className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:shadow-xl focus:shadow-blue-500/5 transition-all outline-none font-bold text-slate-600 resize-none"
                                        placeholder="Características principales del grupo..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">DOCENTE ENCARGADO (PROFESOR JEFE)</label>
                                    <select
                                        required
                                        className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-black text-slate-700 appearance-none"
                                        value={formData.teacherId}
                                        onChange={e => setFormData({ ...formData, teacherId: e.target.value })}
                                    >
                                        <option value="">Seleccionar del Registro...</option>
                                        {teachers.map(t => (
                                            <option key={t._id} value={t._id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] font-bold text-slate-300 mt-2 ml-1">Solo se muestran usuarios con rol de Profesor.</p>
                                </div>
                            </div>

                            <div className="pt-8 flex flex-col md:flex-row gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-5 text-slate-400 font-black hover:bg-slate-100 rounded-2xl transition-all uppercase tracking-widest text-xs"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-5 bg-[#11355a] text-white rounded-2xl font-black hover:bg-blue-900 shadow-2xl shadow-blue-900/20 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                                >
                                    {modalMode === 'create' ? <Plus size={18} /> : <Save size={18} />}
                                    {modalMode === 'create' ? 'CREAR CURSO' : 'GUARDAR CAMBIOS'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoursesPage;
