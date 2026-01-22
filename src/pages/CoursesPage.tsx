
import React, { useState, useEffect } from 'react';
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
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <GraduationCap className="text-[#11355a]" />
                    Gestión de Cursos
                </h1>
                <button
                    onClick={() => handleOpenModal('create')}
                    className="bg-[#11355a] text-white px-4 py-2 rounded flex items-center gap-2 hover:opacity-90 transition"
                >
                    <Plus size={18} /> Nuevo Curso
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex items-center gap-2 border">
                <Search className="text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o código..."
                    className="flex-1 outline-none text-gray-700"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List */}
            {loading ? (
                <p>Cargando...</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCourses.map(course => (
                        <div key={course._id} className="bg-white p-5 rounded-lg shadow border hover:shadow-md transition group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 p-3 rounded-lg text-blue-800 font-bold">
                                        <BookOpen size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-lg">{course.name}</h3>
                                        <p className="text-xs text-gray-400 font-mono bg-gray-50 px-1 inline-block rounded">
                                            {course.code}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleOpenModal('edit', course)}
                                        className="text-gray-400 hover:text-blue-600"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(course._id)}
                                        className="text-gray-400 hover:text-red-600"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">
                                    {course.description}
                                </p>

                                <div className="flex items-center gap-2 text-sm text-gray-500 pt-3 border-t">
                                    <Users size={16} className="text-blue-400" />
                                    <span className="font-medium">Profesor Jefe:</span>
                                    <span className="truncate flex-1" title={course.teacherId?.name || 'Vacante'}>
                                        {course.teacherId?.name || 'Sin asignar'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold mb-4 border-b pb-2">
                            {modalMode === 'create' ? 'Crear Nuevo Curso' : 'Editar Curso'}
                        </h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre del Curso</label>
                                <input
                                    required
                                    placeholder="Ej: 1° Básico A"
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-100 outline-none border-gray-300"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Descripción</label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Breve descripción del grupo..."
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-100 outline-none border-gray-300"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Profesor Jefe</label>
                                <select
                                    required
                                    className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-blue-100 outline-none border-gray-300"
                                    value={formData.teacherId}
                                    onChange={e => setFormData({ ...formData, teacherId: e.target.value })}
                                >
                                    <option value="">Seleccionar Profesor...</option>
                                    {teachers.map(t => (
                                        <option key={t._id} value={t._id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-gray-400 mt-1">
                                    Encargado principal del curso.
                                </p>
                            </div>

                            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#11355a] text-white rounded hover:opacity-90 transition-opacity font-medium"
                                    disabled={loading}
                                >
                                    {modalMode === 'create' ? 'Crear Curso' : 'Guardar Cambios'}
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
