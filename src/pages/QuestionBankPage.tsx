
import { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import TestWizard from '../components/TestWizard';
import {
    Database, Plus, Search, Trash2, Edit, Save,
    X, CheckCircle, HelpCircle, Sparkles
} from 'lucide-react';

interface Question {
    _id: string;
    questionText: string;
    type: 'multiple_choice' | 'open' | 'true_false';
    difficulty: 'easy' | 'medium' | 'hard';
    subjectId: { _id: string; name: string };
    grade: string;
    tags: string[];
    options: { text: string; isCorrect: boolean }[];
}

const QuestionBankPage = ({ hideHeader = false }: { hideHeader?: boolean }) => {
    const permissions = usePermissions();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showWizard, setShowWizard] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        _id: '',
        questionText: '',
        subjectId: '',
        grade: '',
        type: 'multiple_choice' as const,
        difficulty: 'medium' as const,
        options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
        ],
        tags: [] as string[]
    });

    useEffect(() => {
        fetchInitialData();
        fetchQuestions();
    }, []);

    const fetchInitialData = async () => {
        try {
            const res = await api.get('/subjects');
            setSubjects(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterSubject) params.append('subjectId', filterSubject);
            if (filterDifficulty) params.append('difficulty', filterDifficulty);

            const res = await api.get(`/questions?${params.toString()}`);
            setQuestions(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (formData._id) {
                await api.put(`/questions/${formData._id}`, formData);
            } else {
                await api.post('/questions', formData);
            }
            setShowModal(false);
            fetchQuestions();
        } catch (error) {
            alert('Error al guardar la pregunta');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Eliminar esta pregunta del banco?')) return;
        try {
            await api.delete(`/questions/${id}`);
            fetchQuestions();
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    const filteredQuestions = questions
        .filter(q => q.questionText.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            const subA = (a.subjectId?.name || '').toLowerCase();
            const subB = (b.subjectId?.name || '').toLowerCase();
            if (subA !== subB) return subA.localeCompare(subB);

            const gradeA = (a.grade || '').toLowerCase();
            const gradeB = (b.grade || '').toLowerCase();
            if (gradeA !== gradeB) return gradeA.localeCompare(gradeB);

            return a.questionText.localeCompare(b.questionText);
        });

    return (
        <div className={`${hideHeader ? 'p-0' : 'p-8 max-w-7xl mx-auto space-y-8'} animate-in fade-in duration-500`}>
            {!hideHeader && (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-[#11355a] tracking-tight flex items-center gap-4">
                            <div className="p-4 bg-indigo-50 rounded-3xl border border-indigo-100">
                                <Database size={40} className="text-indigo-600" />
                            </div>
                            Banco de Preguntas
                        </h1>
                        <p className="text-gray-500 mt-2 text-lg font-medium">Repositorio institucional de evaluaciones formativas y sumativas.</p>
                    </div>
                    {(permissions.canManageSubjects || permissions.isDirector || permissions.isSostenedor) && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowWizard(true)}
                                className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20"
                            >
                                <Sparkles size={24} /> CREAR EVALUACIÓN
                            </button>
                            <button
                                onClick={() => {
                                    setFormData({
                                        _id: '',
                                        questionText: '',
                                        subjectId: '',
                                        grade: '',
                                        type: 'multiple_choice' as any,
                                        difficulty: 'medium' as any,
                                        options: [
                                            { text: '', isCorrect: false },
                                            { text: '', isCorrect: false },
                                            { text: '', isCorrect: false },
                                            { text: '', isCorrect: false }
                                        ],
                                        tags: []
                                    });
                                    setShowModal(true);
                                }}
                                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
                            >
                                <Plus size={24} /> NUEVA PREGUNTA
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Buscador</label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                            placeholder="Buscar preguntas..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 outline-none font-bold"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Asignatura</label>
                    <select
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 outline-none font-bold"
                        value={filterSubject}
                        onChange={e => setFilterSubject(e.target.value)}
                    >
                        <option value="">Todas</option>
                        {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Dificultad</label>
                    <select
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 outline-none font-bold"
                        value={filterDifficulty}
                        onChange={e => setFilterDifficulty(e.target.value)}
                    >
                        <option value="">Todas</option>
                        <option value="easy">Fácil</option>
                        <option value="medium">Media</option>
                        <option value="hard">Difícil</option>
                    </select>
                </div>
                <button
                    onClick={fetchQuestions}
                    className="bg-indigo-50 text-indigo-600 py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-100 transition-all"
                >
                    Filtrar Resultados
                </button>
            </div>

            {/* Questions List */}
            {loading ? (
                <div className="flex justify-center p-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredQuestions.map(q => (
                        <div key={q._id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
                            <div className="flex justify-between items-start gap-6">
                                <div className="flex-1 space-y-4">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="flex flex-col gap-1 min-w-[80px]">
                                            <div className="flex gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full transition-all ${q.difficulty === 'easy' ? 'w-1/3 bg-emerald-500' : q.difficulty === 'medium' ? 'w-2/3 bg-amber-500' : 'w-full bg-rose-500'}`} />
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-lg font-black text-[8px] uppercase tracking-widest text-center ${q.difficulty === 'easy' ? 'text-emerald-600' :
                                                q.difficulty === 'medium' ? 'text-amber-600' :
                                                    'text-rose-600'
                                                }`}>
                                                {q.difficulty === 'easy' ? 'Nivel Fácil' : q.difficulty === 'medium' ? 'Nivel Medio' : 'Nivel Difícil'}
                                            </span>
                                        </div>
                                        <span className="px-4 py-1.5 bg-slate-50 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest border border-slate-100">
                                            {q.subjectId?.name}
                                        </span>
                                        <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-indigo-100">
                                            {q.type.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 leading-tight">
                                        {q.questionText}
                                    </h3>
                                    {q.type === 'multiple_choice' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 opacity-60 group-hover:opacity-100 transition-all duration-500 max-h-24 group-hover:max-h-96 overflow-hidden">
                                            {q.options.map((opt, i) => (
                                                <div key={i} className={`p-4 rounded-xl border-2 flex items-center justify-between ${opt.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-black' : 'bg-slate-50 border-slate-100 text-slate-500 font-bold'}`}>
                                                    <span className="text-sm">{opt.text}</span>
                                                    {opt.isCorrect && <CheckCircle size={16} />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="text-[10px] font-black text-indigo-300 uppercase italic opacity-0 group-hover:opacity-100 transition-opacity">↑ Vista Previa de Opciones</div>
                                </div>
                                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={() => {
                                            setFormData({
                                                _id: q._id,
                                                questionText: q.questionText,
                                                subjectId: q.subjectId?._id || '',
                                                grade: q.grade,
                                                type: q.type as any,
                                                difficulty: q.difficulty as any,
                                                options: [...q.options],
                                                tags: [...q.tags]
                                            });
                                            setShowModal(true);
                                        }}
                                        className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                                    >
                                        <Edit size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(q._id)}
                                        className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredQuestions.length === 0 && (
                        <div className="bg-white p-20 text-center rounded-[3rem] border-4 border-dashed border-slate-100">
                            <HelpCircle size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No se encontraron preguntas registradas</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[999] flex items-center justify-center p-4 md:pl-[300px] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl border-8 border-white overflow-hidden animate-in zoom-in-95 duration-500 max-h-[90vh] overflow-y-auto">
                        <div className="bg-indigo-600 p-10 text-white relative">
                            <h2 className="text-3xl font-black tracking-tighter uppercase">{formData._id ? 'Editar Pregunta' : 'Nueva Pregunta'}</h2>
                            <p className="text-indigo-200 font-black text-[10px] uppercase tracking-widest mt-1">BANCO DE EVALUACIONES</p>
                            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-all"><X size={32} /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-10 space-y-8 bg-slate-50/30">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asignatura</label>
                                    <select
                                        required
                                        className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold"
                                        value={formData.subjectId}
                                        onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.courseId?.name})</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grado/Nivel</label>
                                    <input
                                        placeholder="Ej: 8° Básico"
                                        className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold"
                                        value={formData.grade}
                                        onChange={e => setFormData({ ...formData, grade: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Enunciado de la Pregunta</label>
                                <textarea
                                    required
                                    rows={3}
                                    className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold resize-none"
                                    value={formData.questionText}
                                    onChange={e => setFormData({ ...formData, questionText: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dificultad</label>
                                    <div className="flex gap-2">
                                        {['easy', 'medium', 'hard'].map(d => (
                                            <button
                                                key={d}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, difficulty: d as any })}
                                                className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${formData.difficulty === d ? 'bg-indigo-600 text-white' : 'bg-white border-2 border-slate-100 text-slate-400'
                                                    }`}
                                            >
                                                {d === 'easy' ? 'Fácil' : d === 'medium' ? 'Media' : 'Dificil'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Pregunta</label>
                                    <select
                                        className="w-full px-5 py-3.5 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                    >
                                        <option value="multiple_choice">Selección Múltiple</option>
                                        <option value="true_false">Verdadero/Falso</option>
                                        <option value="open">Abierta/Ensayo</option>
                                    </select>
                                </div>
                            </div>

                            {formData.type === 'multiple_choice' && (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                                        Opciones de Respuesta
                                        <span className="text-indigo-600 underline text-[8px]">Marcar la correcta</span>
                                    </label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {formData.options.map((opt, i) => (
                                            <div key={i} className="flex gap-3">
                                                <input
                                                    className="flex-1 px-5 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-sm"
                                                    value={opt.text}
                                                    onChange={e => {
                                                        const newOpts = [...formData.options];
                                                        newOpts[i].text = e.target.value;
                                                        setFormData({ ...formData, options: newOpts });
                                                    }}
                                                    placeholder={`Opción ${String.fromCharCode(65 + i)}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newOpts = formData.options.map((o, idx) => ({ ...o, isCorrect: i === idx }));
                                                        setFormData({ ...formData, options: newOpts });
                                                    }}
                                                    className={`w-14 rounded-2xl flex items-center justify-center transition-all ${opt.isCorrect ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-slate-100 text-slate-200'}`}
                                                >
                                                    <CheckCircle size={24} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-indigo-900/20 hover:scale-[1.01] active:scale-95 transition-all">
                                <Save size={20} className="inline mr-2" /> Guardar en el Banco
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Test Wizard */}
            <TestWizard
                isOpen={showWizard}
                onClose={() => setShowWizard(false)}
                onSuccess={() => {
                    setShowWizard(false);
                    alert('¡Evaluación creada exitosamente!');
                }}
            />
        </div>
    );
};

export default QuestionBankPage;
