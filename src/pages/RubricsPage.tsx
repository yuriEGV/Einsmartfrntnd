import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, FileText, Loader2 } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import RubricBuilder from '../components/RubricBuilder';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    description: string;
    levels: Level[];
    criteria: Criterion[];
    subjectId?: { _id: string; name: string } | string;
    teacherId?: { _id: string; name: string } | string;
    createdAt?: string;
}

const RubricsPage = () => {
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
        if (!window.confirm('¿Estás seguro de eliminar esta rúbrica? Esto podría afectar a las planificaciones asociadas.')) return;

        try {
            await api.delete(`/rubrics/${id}`);
            toast.success('Rúbrica eliminada');
            setRubrics(rubrics.filter(r => r._id !== id));
        } catch (error) {
            console.error(error);
            toast.error('Error al eliminar la rúbrica');
        }
    };

    const handleSave = () => {
        setShowBuilder(false);
        fetchRubrics();
    };

    const filteredRubrics = rubrics.filter(r =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Gestión de Rúbricas</h1>
                    <p className="text-slate-500 font-medium">Crea y administra matrices de evaluación para tus planificaciones</p>
                </div>
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
            </div>

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
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por título o descripción..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-medium outline-none transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
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
                                <p className="text-sm text-slate-500 line-clamp-2 mb-6 h-10">
                                    {rubric.description || 'Sin descripción'}
                                </p>

                                <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-t border-slate-100 pt-4">
                                    <span>{rubric.criteria.length} Criterios</span>
                                    <span>{rubric.levels.length} Niveles</span>
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