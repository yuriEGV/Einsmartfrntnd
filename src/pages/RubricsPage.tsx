import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, FileText, Loader2 } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { usePermissions } from '../hooks/usePermissions';
import RubricBuilder from '../components/RubricBuilder';


interface Level {
    name: string;
    points: number;
}

interface Descriptor {
    levelName: string;
    text: string;
}

interface Criterion {
    name: string;
    descriptors: Descriptor[];
}

interface Rubric {
    _id?: string;
    title: string;
    description?: string;
    status?: 'draft' | 'submitted' | 'approved' | 'rejected';
    feedback?: string;
    levels: Level[];
    criteria: Criterion[];
    subjectId?: { _id: string; name: string } | string;
    teacherId?: { _id: string; name: string } | string;
    createdAt?: string;
}

const RubricsPage = ({ hideHeader = false }: { hideHeader?: boolean }) => {
    const { isTeacher, isSuperAdmin, isDirector, isUTP } = usePermissions();
    const [rubrics, setRubrics] = useState<Rubric[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showBuilder, setShowBuilder] = useState(false);
    const [editingRubric, setEditingRubric] = useState<Rubric | null>(null);

    const fetchRubrics = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/rubrics`);
            setRubrics(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar rúbricas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRubrics();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Eliminar rúbrica?')) return;

        try {
            await api.delete(`/rubrics/${id}`);
            toast.success('Rúbrica eliminada');
            setRubrics(rubrics.filter(r => r._id !== id));
        } catch (error) {
            console.error(error);
            toast.error('Error al eliminar la rúbrica');
        }
    };

    const handleSubmitForReview = async (id: string) => {
        try {
            await api.post(`/rubrics/${id}/submit`);
            toast.success('Rúbrica enviada para revisión.');
            fetchRubrics();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al enviar');
        }
    };

    const handleReview = async (id: string, status: 'approved' | 'rejected') => {
        const feedback = status === 'rejected' ? window.prompt('Motivo del rechazo:') : '';
        if (status === 'rejected' && feedback === null) return;
        try {
            await api.post(`/rubrics/${id}/review`, { status, feedback });
            toast.success(status === 'approved' ? 'Rúbrica aprobada.' : 'Rúbrica rechazada.');
            fetchRubrics();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al revisar');
        }
    };

    const handleSave = async (rubricData: Rubric) => {
        try {
            if (editingRubric && editingRubric._id) {
                await api.put(`/rubrics/${editingRubric._id}`, rubricData);
                toast.success('Rúbrica actualizada');
            } else {
                await api.post('/rubrics', rubricData);
                toast.success('Rúbrica creada exitosamente');
            }
            setShowBuilder(false);
            setEditingRubric(null);
            fetchRubrics();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al guardar rúbrica');
        }
    };

    const filteredRubrics = rubrics.filter(r =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            {!hideHeader && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Gestión de Rúbricas</h1>
                        <p className="text-slate-500 font-medium">Crea y administra matrices de evaluación para tus planificaciones</p>
                    </div>
                    {(isTeacher || isDirector || isUTP || isSuperAdmin) && (
                        <button
                            onClick={() => {
                                setEditingRubric(null);
                                setShowBuilder(true);
                            }}
                            className="bg-[#11355a] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#1a4a7c] transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95"
                        >
                            <Plus size={20} />
                            Nueva Rúbrica
                        </button>
                    )}
                </div>
            )}

            {/* Builder Modal */}
            {showBuilder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-slate-900/80 backdrop-blur-sm">
                    <div className="w-full max-w-7xl h-full md:h-auto">
                        <RubricBuilder
                            onCancel={() => setShowBuilder(false)}
                            onSave={handleSave}
                            initialData={editingRubric}
                        />
                    </div>
                </div>
            )}

            {/* Search & List */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar rúbricas..."
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 outline-none transition-all font-bold text-slate-600"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {hideHeader && (isTeacher || isDirector || isUTP || isSuperAdmin) && (
                        <button
                            onClick={() => {
                                setEditingRubric(null);
                                setShowBuilder(true);
                            }}
                            className="bg-blue-600 text-white p-3 rounded-2xl hover:bg-blue-700 transition-all shadow-lg"
                            title="Nueva Rúbrica"
                        >
                            <Plus size={20} />
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="py-20 flex justify-center text-slate-400">
                        <Loader2 className="animate-spin" size={40} />
                    </div>
                ) : filteredRubrics.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                            <FileText size={40} />
                        </div>
                        <p className="text-slate-400 font-bold">No se encontraron rúbricas</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRubrics.map(rubric => (
                            <div key={rubric._id} className="group bg-white border border-slate-200 p-6 rounded-2xl hover:shadow-xl hover:border-blue-200 transition-all duration-300 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(rubric._id!);
                                        }}
                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="mb-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">
                                        {typeof rubric.subjectId === 'object' ? rubric.subjectId.name : 'General'}
                                    </span>
                                </div>

                                <h3 className="text-lg font-black text-slate-800 mb-2 line-clamp-1" title={rubric.title}>
                                    {rubric.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    {rubric.status === 'draft' && <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[8px] font-black uppercase">Borrador</span>}
                                    {rubric.status === 'submitted' && <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-[8px] font-black uppercase">En Revisión</span>}
                                    {rubric.status === 'approved' && <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded text-[8px] font-black uppercase">Aprobada</span>}
                                    {rubric.status === 'rejected' && <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-[8px] font-black uppercase">Rechazada</span>}
                                </div>
                                {rubric.status === 'rejected' && rubric.feedback && (
                                    <p className="text-[9px] font-bold text-rose-400 mt-1 italic border-l-2 border-rose-200 pl-2"> feedback: {rubric.feedback}</p>
                                )}
                                <p className="text-sm text-slate-500 line-clamp-2 mb-6 h-10">
                                    {rubric.description || 'Sin descripción'}
                                </p>

                                <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-t border-slate-100 pt-4 mb-4">
                                    <span>{rubric.criteria.length} Criterios</span>
                                    <span>{rubric.levels.length} Niveles</span>
                                </div>

                                <div className="flex flex-wrap gap-2 relative z-10">
                                    {isTeacher && (rubric.status === 'draft' || rubric.status === 'rejected') && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleSubmitForReview(rubric._id!); }}
                                            className="w-full bg-indigo-600 text-white py-2 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg shadow-indigo-200"
                                        >
                                            Enviar a Revisión
                                        </button>
                                    )}
                                    {(isSuperAdmin || isDirector || isUTP) && rubric.status === 'submitted' && (
                                        <div className="flex gap-2 w-full mt-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleReview(rubric._id!, 'approved'); }}
                                                className="flex-1 bg-emerald-600 text-white py-2 rounded-xl font-black uppercase text-[8px] tracking-widest"
                                            >
                                                Aprobar
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleReview(rubric._id!, 'rejected'); }}
                                                className="flex-1 bg-rose-600 text-white py-2 rounded-xl font-black uppercase text-[8px] tracking-widest"
                                            >
                                                Rechazar
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => { setEditingRubric(rubric); setShowBuilder(true); }}
                                    className="absolute inset-0 z-0 bg-transparent border-none cursor-pointer"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RubricsPage;