
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { Plus, Edit, Trash2, Search, BookOpen, User } from 'lucide-react';

interface Subject {
    _id: string;
    name: string;
    courseId: { _id: string; name: string };
    teacherId: { _id: string; name: string };
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

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState({
        _id: '',
        name: '',
        courseId: '',
        teacherId: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [subjRes, courRes, usersRes] = await Promise.all([
                api.get('/subjects'),
                api.get('/courses'),
                api.get('/users?role=teacher') // Assuming this works or filtering manually if needed
            ]);

            setSubjects(subjRes.data);
            setCourses(courRes.data);

            // Filter teachers manually if the endpoint returns all users (though backend now filters too)
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
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
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
        </div>
    );
};

export default SubjectsPage;
