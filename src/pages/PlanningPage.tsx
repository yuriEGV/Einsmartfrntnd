
import { useState, useEffect, type FormEvent } from 'react';
import {
    Plus,
    Search,
    CheckCircle,
    XCircle,
    Clock,
    ChevronRight,
    BookOpen,
    FileText,
    Check,
    X,
    MessageSquare,
    AlertCircle,
    Table
} from 'lucide-react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { toast } from 'react-hot-toast';
import RubricBuilder from '../components/RubricBuilder';

// Remove API_URL as api service handles it
// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Planning {
    _id: string;
    title: string;
    type: string;
    subjectId?: {
        name: string;
        _id: string;
    };
    teacherId?: {
        name: string;
        _id: string;
    };
    status: string;
    description: string;
    activities: string;
    strategies: string;
    feedback?: string;
    updatedAt: string;
    unitNumber?: number | string;
    rubricId?: any;
}

interface Rubric {
    _id: string;
    title: string;
    description?: string;
    levels: { name: string; points: number }[];
    criteria: { name: string; descriptors: { levelName: string; text: string }[] }[];
}

const PlanningPage = ({ hideHeader = false }: { hideHeader?: boolean }) => {
    const { canApprovePlanning, isTeacher } = usePermissions();
    const [plannings, setPlannings] = useState<Planning[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedPlanning, setSelectedPlanning] = useState<Planning | null>(null);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [rubrics, setRubrics] = useState<Rubric[]>([]);
    const [showRubricBuilder, setShowRubricBuilder] = useState(false);
    const [viewingRubric, setViewingRubric] = useState<Rubric | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        type: 'unidad',
        subjectId: '',
        description: '',
        activities: '',
        strategies: '',
        objectives: [] as string[],
        unitNumber: '',
        rubricId: ''
    });

    const [reviewData, setReviewData] = useState({
        status: 'approved',
        feedback: ''
    });

    useEffect(() => {
        fetchPlannings();
        fetchSubjects();
        fetchRubrics();
    }, []);

    const fetchRubrics = async () => {
        try {
            const res = await api.get('/rubrics');
            setRubrics(res.data);
        } catch (error) {
            console.error('Error fetching rubrics:', error);
        }
    };

    const fetchPlannings = async () => {
        try {
            const res = await api.get('/planning');
            setPlannings(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar planificaciones');
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async () => {
        try {
            const res = await api.get('/subjects');
            setSubjects(res.data);
        } catch (error) {
            console.error('Error subjects:', error);
        }
    };

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/planning', formData);
            toast.success('Planificación creada');
            setShowCreateModal(false);
            setFormData({
                title: '',
                type: 'unidad',
                subjectId: '',
                description: '',
                activities: '',
                strategies: '',
                objectives: [] as string[],
                unitNumber: '',
                rubricId: ''
            });
            fetchPlannings();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error al crear');
        }
    };

    const handleSubmitForReview = async (id: string) => {
        try {
            await api.post(`/planning/${id}/submit`);
            toast.success('Planificación enviada a revisión');
            fetchPlannings();
        } catch (error) {
            console.error(error);
            toast.error('Error al enviar');
        }
    };

    const handleReview = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedPlanning) return;
        try {
            await api.post(`/planning/${selectedPlanning._id}/review`, reviewData);
            toast.success('Revisión completada');
            setShowReviewModal(false);
            fetchPlannings();
        } catch (error) {
            console.error(error);
            toast.error('Error al procesar revisión');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <span className="px-2 py-1 flex items-center gap-1 text-xs font-semibold rounded-full bg-green-100 text-green-700"><CheckCircle size={14} /> Aprobado</span>;
            case 'rejected': return <span className="px-2 py-1 flex items-center gap-1 text-xs font-semibold rounded-full bg-red-100 text-red-700"><XCircle size={14} /> Rechazado</span>;
            case 'submitted': return <span className="px-2 py-1 flex items-center gap-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700"><Clock size={14} /> Pendiente</span>;
            default: return <span className="px-2 py-1 flex items-center gap-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700"><FileText size={14} /> Borrador</span>;
        }
    };

    const filteredPlannings = plannings.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.subjectId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50">
            {!hideHeader && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Planificaciones Didácticas</h1>
                        <p className="text-gray-500 mt-1">Gestión pedagógica y aprobación de contenidos.</p>
                    </div>
                    {isTeacher && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 bg-[#11355a] text-white px-6 py-3 rounded-xl hover:bg-[#1a4a7c] transition-all shadow-lg shadow-blue-900/10"
                        >
                            <Plus size={20} /> Nueva Planificación
                        </button>
                    )}
                </div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por título o asignatura..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    {['all', 'draft', 'submitted', 'approved', 'rejected'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${statusFilter === status
                                ? 'bg-[#11355a] text-white shadow-md'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {status === 'all' ? 'Ver Todo' :
                                status === 'draft' ? 'Borradores' :
                                    status === 'submitted' ? 'Pendientes' :
                                        status === 'approved' ? 'Aprobados' : 'Rechazados'}
                        </button>
                    ))}
                </div>
                {hideHeader && isTeacher && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-[#11355a] text-white p-2 rounded-lg hover:bg-[#1a4a7c] transition-all shadow-lg"
                        title="Nueva Planificación"
                    >
                        <Plus size={20} />
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                </div>
            ) : filteredPlannings.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-100">
                    <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <BookOpen size={40} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">No se encontraron planificaciones</h3>
                    <p className="text-gray-500 mt-2 max-w-md mx-auto">
                        Comienza creando una nueva planificación para organizar tus contenidos pedagógicos.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredPlannings.map((p) => (
                        <div key={p._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-blue-50 text-blue-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                                                {p.type}
                                            </span>
                                            {getStatusBadge(p.status)}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#11355a] transition-colors line-clamp-1">
                                            {p.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 font-medium">
                                            {p.subjectId?.name || 'Asignatura no especificada'}
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        {p.rubricId && (
                                            <button
                                                onClick={() => setViewingRubric(p.rubricId)}
                                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                                title="Ver Rúbrica"
                                            >
                                                <Table size={20} />
                                            </button>
                                        )}
                                        {canApprovePlanning && p.status === 'submitted' && (
                                            <button
                                                onClick={() => { setSelectedPlanning(p); setShowReviewModal(true); }}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Evaluar Planificación"
                                            >
                                                <AlertCircle size={20} />
                                            </button>
                                        )}
                                        {isTeacher && p.status === 'draft' && (
                                            <button
                                                onClick={() => handleSubmitForReview(p._id)}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                title="Enviar a Revisión"
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <p className="text-gray-600 text-sm line-clamp-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    {p.description || 'Sin descripción detallada.'}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-white text-xs font-bold uppercase">
                                            {p.teacherId?.name?.charAt(0) || 'P'}
                                        </div>
                                        <div className="text-xs">
                                            <p className="font-semibold text-gray-900">{p.teacherId?.name}</p>
                                            <p className="text-gray-400">Profesor</p>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-gray-400">
                                        Actualizado: {new Date(p.updatedAt).toLocaleDateString()}
                                    </p>
                                </div>

                                {p.feedback && (
                                    <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 flex gap-2">
                                        <MessageSquare size={14} className="shrink-0" />
                                        <span><strong>Feedback:</strong> {p.feedback}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Nueva Planificación</h2>
                                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 p-2">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Título</label>
                                        <input
                                            required
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="Título de la unidad o clase"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Tipo</label>
                                        <select
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            <option value="unidad">Unidad Didáctica</option>
                                            <option value="clase">Clase Específica</option>
                                            <option value="anual">Planificación Anual</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Asignatura</label>
                                        <select
                                            required
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                            value={formData.subjectId}
                                            onChange={e => {
                                                setFormData({ ...formData, subjectId: e.target.value });
                                            }}
                                        >
                                            <option value="">Seleccionar Asignatura</option>
                                            {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.courseId?.name})</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Unidad N° (Opcional)</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                            value={formData.unitNumber}
                                            onChange={e => setFormData({ ...formData, unitNumber: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Descripción / Resumen</label>
                                    <textarea
                                        rows={3}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Actividades</label>
                                        <textarea
                                            rows={4}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                            placeholder="Detalle de actividades a realizar..."
                                            value={formData.activities}
                                            onChange={e => setFormData({ ...formData, activities: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Estrategias / Metodología</label>
                                        <textarea
                                            rows={4}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                            placeholder="Métodos y recursos didácticos..."
                                            value={formData.strategies}
                                            onChange={e => setFormData({ ...formData, strategies: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700 flex justify-between">
                                        Rúbrica de Evaluación (Opcional)
                                        <button
                                            type="button"
                                            onClick={() => setShowRubricBuilder(true)}
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            + Crear Nueva Rúbrica
                                        </button>
                                    </label>
                                    <select
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.rubricId}
                                        onChange={e => setFormData({ ...formData, rubricId: e.target.value })}
                                    >
                                        <option value="">Seleccionar Rúbrica existente</option>
                                        {rubrics.map(r => <option key={r._id} value={r._id}>{r.title}</option>)}
                                    </select>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-6 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-8 py-2.5 bg-[#11355a] text-white rounded-xl hover:bg-[#1a4a7c] transition-all font-bold shadow-lg shadow-blue-900/10"
                                    >
                                        Guardar como Borrador
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Rubric Builder Modal */}
            {showRubricBuilder && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
                    <div className="w-full max-w-5xl shadow-2xl animate-in zoom-in-95 duration-200">
                        <RubricBuilder
                            onCancel={() => setShowRubricBuilder(false)}
                            onSave={async (newRubric) => {
                                try {
                                    const res = await api.post('/rubrics', newRubric);
                                    toast.success('Rúbrica guardada');
                                    fetchRubrics();
                                    setFormData({ ...formData, rubricId: res.data._id });
                                    setShowRubricBuilder(false);
                                } catch (error) {
                                    toast.error('Error al guardar rúbrica');
                                }
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Rubric Viewer Modal */}
            {viewingRubric && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl p-8">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{viewingRubric.title}</h2>
                                <p className="text-gray-500">{viewingRubric.description}</p>
                            </div>
                            <button onClick={() => setViewingRubric(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#11355a] text-white">
                                    <tr>
                                        <th className="p-4 border-b font-semibold min-w-[200px]">Criterio</th>
                                        {viewingRubric.levels.map((level, i) => (
                                            <th key={i} className="p-4 border-b font-semibold text-center min-w-[150px]">
                                                {level.name} ({level.points} pts)
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {viewingRubric.criteria.map((criterion, cIndex) => (
                                        <tr key={cIndex}>
                                            <td className="p-4 font-bold text-gray-900 bg-gray-50/50">{criterion.name}</td>
                                            {criterion.descriptors.map((descriptor, dIndex) => (
                                                <td key={dIndex} className="p-4 text-sm text-gray-600">{descriptor.text}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Review Modal */}
            {showReviewModal && selectedPlanning && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in duration-200">
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Evaluar Planificación</h2>
                                <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-2xl mb-6">
                                <p className="text-sm text-blue-900 font-bold mb-1">{selectedPlanning.title}</p>
                                <p className="text-xs text-blue-700">Asignatura: {selectedPlanning.subjectId?.name}</p>
                            </div>

                            <form onSubmit={handleReview} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Estado de la Revisión</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setReviewData({ ...reviewData, status: 'approved' })}
                                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${reviewData.status === 'approved'
                                                ? 'border-green-500 bg-green-50 text-green-700 font-bold'
                                                : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <Check size={18} /> Aprobar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setReviewData({ ...reviewData, status: 'rejected' })}
                                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${reviewData.status === 'rejected'
                                                ? 'border-red-500 bg-red-50 text-red-700 font-bold'
                                                : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <X size={18} /> Rechazar
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Retroalimentación / Comentarios</label>
                                    <textarea
                                        rows={4}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        placeholder="Escribe tus observaciones para el docente..."
                                        value={reviewData.feedback}
                                        onChange={e => setReviewData({ ...reviewData, feedback: e.target.value })}
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowReviewModal(false)}
                                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all font-medium"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-[#11355a] text-white rounded-xl hover:bg-[#1a4a7c] transition-all font-bold shadow-lg"
                                    >
                                        Finalizar Revisión
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanningPage;
