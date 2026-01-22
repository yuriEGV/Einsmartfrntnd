
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { Plus, Edit, Trash2, Search, ClipboardList } from 'lucide-react';

interface Evaluation {
    _id: string;
    title: string;
    subject: string; // Stored as string in model temporarily, ideally ObjectId but user uses string in GradesPage? 
    // Wait, in GradesPage it showed `evaluationId.subject` as string.
    // The model had `subject: { type: String, required: true }`. 
    // So we will use a text input or dropdown if we want to link to real Subjects.
    // IMPORTANT: To make it robust, we should link to the Subject ID we just created.
    // But for now, to match the existing model, we'll keep it as String or Dropdown selection of Subject Name.
    maxScore: number;
    date: string;
    courseId: { _id: string; name: string };
}

interface Course {
    _id: string;
    name: string;
}

interface Subject {
    _id: string;
    name: string;
    courseId: string | { _id: string }; // Depending on populate
}

const EvaluationsPage = () => {
    const { canEditGrades, isSuperAdmin } = usePermissions();
    // Reusing permissions: canEditGrades usually implies managing evaluations too for teachers.

    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState({
        _id: '',
        title: '',
        subject: '',
        maxScore: 7.0,
        date: new Date().toISOString().split('T')[0],
        courseId: ''
    });

    useEffect(() => {
        fetchData();
        fetchAuxData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await api.get('/evaluations');
            setEvaluations(response.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const fetchAuxData = async () => {
        try {
            const [cRes, sRes] = await Promise.all([
                api.get('/courses'),
                api.get('/subjects')
            ]);
            setCourses(cRes.data);
            setSubjects(sRes.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Prepare payload without _id for creation
            const { _id, ...cleanFormData } = formData;
            const payload = {
                ...cleanFormData,
                subject: formData.subject // Model expects string name currently
            };

            if (modalMode === 'create') {
                await api.post('/evaluations', payload);
            } else {
                // For update, we can include _id in URL or exclude it from body if needed, 
                // but usually PUT bodies are fine. API probably expects updates via ID in URL.
                await api.put(`/evaluations/${formData._id}`, payload);
            }
            setShowModal(false);
            fetchData();
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Error al guardar');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Eliminar evaluación? Se borrarán las notas asociadas.')) return;
        try {
            await api.delete(`/evaluations/${id}`);
            fetchData();
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    // Filter subjects based on selected course in modal
    const availableSubjects = subjects.filter(s => {
        if (!formData.courseId) return false;
        // Handle if courseId is populated or string
        const sCourseId = typeof s.courseId === 'object' ? (s.courseId as any)._id : s.courseId;
        return sCourseId === formData.courseId;
    });

    const filteredEvals = evaluations.filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const canManage = canEditGrades || isSuperAdmin;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <ClipboardList className="text-[#11355a]" />
                    Gestión de Evaluaciones
                </h1>
                {canManage && (
                    <button
                        onClick={() => {
                            setModalMode('create');
                            setFormData({ _id: '', title: '', subject: '', maxScore: 7.0, date: new Date().toISOString().split('T')[0], courseId: '' });
                            setShowModal(true);
                        }}
                        className="bg-[#11355a] text-white px-4 py-2 rounded flex items-center gap-2 hover:opacity-90 transition"
                    >
                        <Plus size={18} /> Nueva Evaluación
                    </button>
                )}
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border flex items-center gap-2">
                <Search className="text-gray-400" />
                <input
                    placeholder="Buscar evaluación..."
                    className="flex-1 outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? <p>Cargando...</p> : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredEvals.map(ev => (
                        <div key={ev._id} className="bg-white p-5 rounded-lg shadow border hover:shadow-md transition group">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">{ev.title}</h3>
                                    <p className="text-sm text-gray-500 font-medium">{(ev.courseId as any)?.name || 'Sin Curso'}</p>
                                </div>
                                {canManage && (
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => {
                                            setModalMode('edit');
                                            setFormData({
                                                _id: ev._id,
                                                title: ev.title,
                                                subject: ev.subject,
                                                maxScore: ev.maxScore,
                                                date: new Date(ev.date).toISOString().split('T')[0],
                                                courseId: (ev.courseId as any)._id
                                            });
                                            setShowModal(true);
                                        }} className="text-gray-400 hover:text-blue-600"><Edit size={18} /></button>
                                        <button onClick={() => handleDelete(ev._id)} className="text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1 text-sm text-gray-600 mt-3">
                                <div className="flex justify-between">
                                    <span className="font-bold text-blue-600">{ev.subject}</span>
                                    <span className="bg-gray-100 px-2 rounded text-xs py-0.5">{new Date(ev.date).toLocaleDateString()}</span>
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
                            {modalMode === 'create' ? 'Nueva Evaluación' : 'Editar Evaluación'}
                        </h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Título</label>
                                <input
                                    required
                                    placeholder="Ej: Prueba 1 - Números"
                                    className="w-full border p-2 rounded"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    maxLength={40}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Curso</label>
                                <select
                                    required
                                    className="w-full border p-2 rounded bg-white"
                                    value={formData.courseId}
                                    onChange={e => setFormData({ ...formData, courseId: e.target.value, subject: '' })}
                                >
                                    <option value="">Seleccionar Curso...</option>
                                    {courses.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Asignatura (Ramo)</label>
                                <select
                                    required
                                    className="w-full border p-2 rounded bg-white"
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                    disabled={!formData.courseId}
                                >
                                    <option value="">Seleccionar Asignatura...</option>
                                    {availableSubjects.map(s => (
                                        <option key={s._id} value={s.name}>{s.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-400 mt-1">Se muestran los ramos creados para este curso.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Fecha</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border p-2 rounded"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Escala</label>
                                    <input
                                        type="number"
                                        disabled
                                        value="7.0"
                                        className="w-full border p-2 rounded bg-gray-100 text-gray-500"
                                    />
                                </div>
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

export default EvaluationsPage;
