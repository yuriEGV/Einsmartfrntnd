import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    ChevronLeft, ChevronRight,
    AlertCircle, Calendar, Search, ShieldCheck, FileText, Plus
} from 'lucide-react';

interface TestWizardProps {
    isOpen: boolean;
    onClose: () => void;
    initialCourseId?: string;
    initialSubjectId?: string;
    initialCategory?: 'planificada' | 'sorpresa';
    onSuccess?: () => void;
}

const TestWizard = ({ isOpen, onClose, initialCourseId, initialSubjectId, initialCategory, onSuccess }: TestWizardProps) => {
    const [step, setStep] = useState(1);
    const [courses, setCourses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState(initialCourseId || '');
    const [selectedSubject, setSelectedSubject] = useState(initialSubjectId || '');
    const [availableMaterials, setAvailableMaterials] = useState<any[]>([]);
    const [selectedOAs, setSelectedOAs] = useState<string[]>([]);
    const [bankQuestions, setBankQuestions] = useState<any[]>([]);
    const [selectedBankQuestions, setSelectedBankQuestions] = useState<string[]>([]);

    // Question Creation State
    const [showQuestionForm, setShowQuestionForm] = useState(false);
    const [newQuestionData, setNewQuestionData] = useState<any>({
        questionText: '',
        type: 'multiple_choice',
        difficulty: 'medium',
        options: [
            { text: '', isCorrect: true },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
        ]
    });

    const handleCreateQuestion = async () => {
        if (!newQuestionData.questionText) return alert("Ingrese el texto de la pregunta");
        try {
            const res = await api.post('/questions', {
                ...newQuestionData,
                subjectId: selectedSubject,
                courseId: selectedCourse
            });
            setBankQuestions([...bankQuestions, res.data]);
            setSelectedBankQuestions([...selectedBankQuestions, res.data._id]);
            setShowQuestionForm(false);
            setNewQuestionData({
                questionText: '',
                type: 'multiple_choice',
                difficulty: 'medium',
                options: [
                    { text: '', isCorrect: true },
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false }
                ]
            });
        } catch (err) {
            console.error(err);
            alert("Error al crear la pregunta");
        }
    };

    // Form Data
    const [formData, setFormData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        type: 'sumativa' as 'formativa' | 'sumativa' | 'diagnostica',
        maxScore: 7.0,
        category: initialCategory || 'planificada' as 'planificada' | 'sorpresa'
    });

    const [questionSearch, setQuestionSearch] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const [cRes, sRes] = await Promise.all([
                    api.get('/courses'),
                    api.get('/subjects')
                ]);
                setCourses(cRes.data);
                setSubjects(sRes.data);
            } catch (err) { console.error(err); }
        };
        fetchInitial();
    }, []);

    useEffect(() => {
        if (selectedCourse && selectedSubject) {
            const fetchData = async () => {
                try {
                    const [bankRes, matRes] = await Promise.all([
                        api.get(`/questions?subjectId=${selectedSubject}`),
                        api.get(`/curriculum-materials/subject/${selectedSubject}`)
                    ]);
                    setBankQuestions(bankRes.data);
                    setAvailableMaterials(matRes.data);
                } catch (err) { console.error(err); }
            };
            fetchData();
        }
    }, [selectedCourse, selectedSubject]);

    // Update internal state if props change
    useEffect(() => {
        if (initialCourseId) setSelectedCourse(initialCourseId);
        if (initialSubjectId) setSelectedSubject(initialSubjectId);
        if (initialCategory) setFormData(prev => ({ ...prev, category: initialCategory }));
    }, [initialCourseId, initialSubjectId, initialCategory]);

    const handleGenerate = async () => {
        if (!formData.title) return alert("Por favor, ingrese un título.");
        try {
            const payload = {
                ...formData,
                courseId: selectedCourse,
                subjectId: selectedSubject,
                objectives: selectedOAs,
                questions: selectedBankQuestions, // Backend expects IDs
            };

            await api.post('/evaluations', payload);

            alert("¡Prueba Generada! La evaluación ha sido creada exitosamente.");

            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al generar prueba');
        }
    };

    if (!isOpen) return null;

    // Filter Subjects based on Course
    const filteredSubjects = selectedCourse
        ? subjects.filter(s => (s.courseId?._id || s.courseId) === selectedCourse)
        : [];

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-5xl h-[85vh] max-h-[900px] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-500">

                {/* Header - Matching Image 1 */}
                <div className={`px-8 py-6 text-white flex justify-between items-center shrink-0 ${formData.category === 'sorpresa' ? 'bg-amber-500' : 'bg-[#00a86b]'}`}>
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Calendar size={28} />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">
                            {formData.category === 'sorpresa' ? 'Generar Prueba Sorpresa' : 'Programar Nueva Prueba'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-all text-white/60 hover:text-white">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Steps Indicator */}
                <div className="px-5 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto shrink-0">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${step === s ? 'bg-white shadow-sm border border-slate-200' : 'opacity-40'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${step === s ? 'bg-[#11355a] text-white' : 'bg-slate-200 text-slate-500'}`}>{s}</div>
                            <span className={`font-black text-[9px] uppercase tracking-widest whitespace-nowrap ${step === s ? 'text-[#11355a]' : 'text-slate-400'}`}>
                                {s === 1 ? 'Configuración' : s === 2 ? 'Objetivos' : 'Preguntas'}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar relative">
                    {step === 1 && (
                        <div className="space-y-10 max-w-3xl mx-auto animate-in slide-in-from-right-4 py-6">
                            {/* Title Section - Matching Image 1 rhythm */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-[#00a86b] uppercase tracking-[0.2em] ml-2">Título de la Evaluación</label>
                                <input
                                    autoFocus
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-8 py-7 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:border-[#00a86b]/30 focus:bg-white outline-none font-black text-2xl text-slate-700 shadow-inner transition-all"
                                    placeholder="Ej: Control de Lectura #2"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Fecha Programada</label>
                                    <div className="relative group">
                                        <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#00a86b] transition-colors" size={20} />
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#00a86b]/30 focus:bg-white outline-none font-bold text-slate-600 shadow-inner transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Tipo / Categoría</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#00a86b]/30 focus:bg-white outline-none font-bold text-slate-600 shadow-inner transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="sumativa">Evaluación Planificada (Sumativa)</option>
                                        <option value="formativa">Evaluación Formativa</option>
                                        <option value="diagnostica">Evaluación Diagnóstica</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Curso / Nivel</label>
                                    <select
                                        value={selectedCourse}
                                        onChange={e => { setSelectedCourse(e.target.value); setSelectedSubject(''); }}
                                        className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500/30 outline-none font-bold text-slate-600 shadow-inner transition-all"
                                        disabled={!!initialCourseId}
                                    >
                                        <option value="">Seleccione Curso...</option>
                                        {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Asignatura</label>
                                    <select
                                        value={selectedSubject}
                                        onChange={e => setSelectedSubject(e.target.value)}
                                        className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500/30 outline-none font-bold text-slate-600 shadow-inner transition-all"
                                        disabled={!!initialSubjectId || !selectedCourse}
                                    >
                                        <option value="">Seleccione Asignatura...</option>
                                        {filteredSubjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Objetivos de Aprendizaje (Opcional)</h3>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Puede omitir este paso</span>
                            </div>
                            <div className="grid gap-4">
                                {availableMaterials.flatMap(m => m.objectives).length === 0 ? (
                                    <div className="text-center py-12 bg-blue-50 rounded-3xl border border-blue-100">
                                        <AlertCircle className="mx-auto mb-3 text-blue-400" size={32} />
                                        <p className="text-blue-600 font-bold text-sm mb-1">No hay objetivos en la planificación</p>
                                        <p className="text-blue-400 text-xs">Puede agregar objetivos en la página de Planificación o saltar este paso</p>
                                    </div>
                                ) : (
                                    availableMaterials.flatMap((m) => m.objectives.map((obj: string, i: number) => ({ obj, id: `${m._id}-${i}` }))).map((item: any) => (
                                        <label key={item.id} className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex items-start gap-4 ${selectedOAs.includes(item.obj) ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-blue-200'}`}>
                                            <input
                                                type="checkbox"
                                                checked={selectedOAs.includes(item.obj)}
                                                onChange={() => {
                                                    if (selectedOAs.includes(item.obj)) setSelectedOAs(selectedOAs.filter(o => o !== item.obj));
                                                    else setSelectedOAs([...selectedOAs, item.obj]);
                                                }}
                                                className="mt-1 w-5 h-5 accent-blue-600"
                                            />
                                            <div className="flex-1">
                                                <p className={`font-bold text-sm ${selectedOAs.includes(item.obj) ? 'text-blue-900' : 'text-slate-600'}`}>{item.obj}</p>
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Questions Selection - Restyled to match Image 1 & 2 */}
                    {step === 3 && (
                        <div className="space-y-8 max-w-3xl mx-auto animate-in slide-in-from-bottom-4">
                            <div className="flex justify-between items-end border-b-2 border-slate-50 pb-4">
                                <div>
                                    <h3 className="text-[10px] font-black text-[#00a86b] uppercase tracking-[0.2em] mb-1">Banco de Preguntas</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-black text-slate-800">{selectedBankQuestions.length}</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Seleccionadas</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowQuestionForm(true)}
                                    className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[9px] uppercase tracking-widest border border-indigo-100 flex items-center gap-2 hover:bg-indigo-100 transition-all"
                                >
                                    <Plus size={14} /> Crear Pregunta
                                </button>
                            </div>

                            {showQuestionForm && (
                                <div className="bg-slate-50 border-2 border-indigo-100 rounded-[2rem] p-8 space-y-6 animate-in zoom-in-95">
                                    <h4 className="text-sm font-black text-indigo-600 uppercase tracking-widest">Nueva Pregunta Express</h4>
                                    <textarea
                                        autoFocus
                                        placeholder="Escriba el enunciado de la pregunta..."
                                        className="w-full p-6 bg-white border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-600 focus:border-indigo-500/20"
                                        value={newQuestionData.questionText}
                                        onChange={e => setNewQuestionData({ ...newQuestionData, questionText: e.target.value })}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <select
                                            className="p-4 bg-white border-2 border-slate-100 rounded-xl font-bold text-slate-600 outline-none"
                                            value={newQuestionData.difficulty}
                                            onChange={e => setNewQuestionData({ ...newQuestionData, difficulty: e.target.value as any })}
                                        >
                                            <option value="easy">Dificultad: Fácil</option>
                                            <option value="medium">Dificultad: Medio</option>
                                            <option value="hard">Dificultad: Difícil</option>
                                        </select>
                                        <select
                                            className="p-4 bg-white border-2 border-slate-100 rounded-xl font-bold text-slate-600 outline-none"
                                            value={newQuestionData.type}
                                            onChange={e => setNewQuestionData({ ...newQuestionData, type: e.target.value as any })}
                                        >
                                            <option value="multiple_choice">Tipo: Opción Múltiple</option>
                                            <option value="open">Tipo: Desarrollo (Abierta)</option>
                                            <option value="true_false">Tipo: Verdadero / Falso</option>
                                        </select>
                                    </div>

                                    {newQuestionData.type === 'multiple_choice' && (
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Opciones de Respuesta</label>
                                            {[0, 1, 2, 3].map(idx => (
                                                <div key={idx} className="flex gap-2">
                                                    <input
                                                        placeholder={`Opción ${idx + 1}`}
                                                        className="flex-1 p-3 bg-white border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-indigo-500/20"
                                                        value={newQuestionData.options?.[idx]?.text || ''}
                                                        onChange={e => {
                                                            const opts = [...(newQuestionData.options || [])];
                                                            opts[idx] = { text: e.target.value, isCorrect: idx === 0 };
                                                            setNewQuestionData({ ...newQuestionData, options: opts });
                                                        }}
                                                    />
                                                    {idx === 0 && <span className="text-[8px] font-black text-emerald-500 uppercase mt-4">Correcta</span>}
                                                </div>
                                            ))}
                                            <p className="text-[8px] text-slate-400 font-bold italic ml-2">* La primera opción se considera la correcta por defecto en el modo express.</p>
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => setShowQuestionForm(false)}
                                            className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleCreateQuestion}
                                            className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-900/20 hover:bg-indigo-700 transition-all"
                                        >
                                            Guardar Pregunta
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Search & Filters */}
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        placeholder="Buscador inteligente de preguntas..."
                                        className="w-full pl-12 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-500 focus:border-indigo-500/20 focus:bg-white transition-all shadow-inner"
                                        value={questionSearch}
                                        onChange={e => setQuestionSearch(e.target.value)}
                                    />
                                </div>

                                <div className="flex items-center gap-8 px-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 grayscale opacity-50">
                                            <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dificultad</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {[
                                                { id: 'all', label: 'TODAS' },
                                                { id: 'easy', label: 'FÁCIL' },
                                                { id: 'medium', label: 'MEDIO' },
                                                { id: 'hard', label: 'DIFÍCIL' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setDifficultyFilter(opt.id as any)}
                                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${difficultyFilter === opt.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-200'}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 grayscale opacity-50">
                                            <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipo</span>
                                        </div>
                                        <button className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200">
                                            TODOS
                                        </button>
                                    </div>
                                </div>

                                {/* Questions List */}
                                <div className="space-y-4 pt-4 max-h-[400px] overflow-y-auto px-1 custom-scrollbar">
                                    {bankQuestions
                                        .filter(q => q.questionText.toLowerCase().includes(questionSearch.toLowerCase()))
                                        .filter(q => difficultyFilter === 'all' || q.difficulty === difficultyFilter)
                                        .map((q: any) => (
                                            <label key={q._id} className={`group relative p-6 bg-white rounded-3xl border-2 transition-all cursor-pointer flex items-start gap-6 hover:shadow-xl hover:-translate-y-1 ${selectedBankQuestions.includes(q._id) ? 'border-emerald-500 ring-4 ring-emerald-50' : 'border-slate-100 hover:border-indigo-200'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedBankQuestions.includes(q._id)}
                                                    onChange={() => {
                                                        if (selectedBankQuestions.includes(q._id)) setSelectedBankQuestions(selectedBankQuestions.filter(id => id !== q._id));
                                                        else setSelectedBankQuestions([...selectedBankQuestions, q._id]);
                                                    }}
                                                    className="hidden"
                                                />

                                                {/* Shield indicator like in Image 2 */}
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${selectedBankQuestions.includes(q._id) ? 'bg-emerald-50 text-emerald-500 shadow-inner' : 'bg-slate-50 text-slate-200 group-hover:text-slate-300'}`}>
                                                    <ShieldCheck size={28} strokeWidth={selectedBankQuestions.includes(q._id) ? 2.5 : 1.5} />
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[7px] font-black uppercase tracking-widest border border-indigo-100">
                                                            {q.subjectId?.name || 'MATERIALES'}
                                                        </span>
                                                        <div className="flex flex-col">
                                                            <div className="h-1 w-16 bg-slate-100 rounded-full overflow-hidden mb-0.5">
                                                                <div className={`h-full ${q.difficulty === 'hard' ? 'bg-rose-500 w-full' : q.difficulty === 'medium' ? 'bg-amber-500 w-2/3' : 'bg-emerald-500 w-1/3'}`} />
                                                            </div>
                                                            <span className={`text-[7px] font-black uppercase tracking-tighter ${q.difficulty === 'hard' ? 'text-rose-500' : q.difficulty === 'medium' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                                Nivel {q.difficulty === 'hard' ? 'Difícil' : q.difficulty === 'medium' ? 'Medio' : 'Fácil'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="font-black text-slate-700 text-lg leading-tight tracking-tight">
                                                        {q.questionText}
                                                    </p>
                                                </div>
                                            </label>
                                        ))}
                                </div>

                                {/* Banner like in Image 2 */}
                                <div className="bg-emerald-50/50 p-8 rounded-3xl border border-emerald-100 mb-4">
                                    <p className="text-emerald-800 text-xs font-black leading-relaxed tracking-tight text-center">
                                        {formData.category === 'sorpresa'
                                            ? 'Las evaluaciones sorpresa NO aparecen en el calendario hasta ser publicadas, pero notifican a los alumnos inmediatamente.'
                                            : 'Las evaluaciones planificadas aparecen en el calendario de alumnos y se notifican con antelación.'}
                                    </p>
                                </div>

                                {/* Main Button like in Image 2 */}
                                <button
                                    onClick={handleGenerate}
                                    className={`w-full py-6 text-white rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group ${formData.category === 'sorpresa' ? 'bg-amber-500 shadow-amber-900/40' : 'bg-[#00a86b] shadow-emerald-900/40'}`}
                                >
                                    <FileText size={24} className="group-hover:rotate-12 transition-transform" />
                                    {formData.category === 'sorpresa' ? 'PUBLICAR EVALUACIÓN SORPRESA' : 'PUBLICAR EVALUACIÓN'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls - Compact */}
                <div className="px-8 py-6 bg-slate-50 border-t flex justify-between gap-4">
                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="bg-white border-2 border-slate-200 text-slate-400 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                        >
                            <ChevronLeft size={16} /> Volver
                        </button>
                    )}
                    <div className="flex-1" />
                    {step < 3 && (
                        <button
                            onClick={() => setStep(step + 1)}
                            className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-900/20 hover:scale-[1.05] transition-all flex items-center gap-2"
                        >
                            Continuar <ChevronRight size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TestWizard;
