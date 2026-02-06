import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    ChevronLeft, ChevronRight, Wand2, Check,
    AlertCircle, HelpCircle
} from 'lucide-react';

interface TestWizardProps {
    isOpen: boolean;
    onClose: () => void;
    initialCourseId?: string;
    initialSubjectId?: string;
    onSuccess?: () => void;
}

const TestWizard = ({ isOpen, onClose, initialCourseId, initialSubjectId, onSuccess }: TestWizardProps) => {
    const [step, setStep] = useState(1);
    const [courses, setCourses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState(initialCourseId || '');
    const [selectedSubject, setSelectedSubject] = useState(initialSubjectId || '');
    const [availableMaterials, setAvailableMaterials] = useState<any[]>([]);
    const [selectedOAs, setSelectedOAs] = useState<string[]>([]);
    const [bankQuestions, setBankQuestions] = useState<any[]>([]);
    const [selectedBankQuestions, setSelectedBankQuestions] = useState<string[]>([]);

    // Form Data
    const [formData, setFormData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        type: 'sumativa' as 'formativa' | 'sumativa' | 'diagnostica',
        maxScore: 7.0
    });

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
    }, [initialCourseId, initialSubjectId]);

    const handleGenerate = async () => {
        if (!formData.title) return alert("Por favor, ingrese un título.");
        try {
            const payload = {
                ...formData,
                courseId: selectedCourse,
                subjectId: selectedSubject,
                objectives: selectedOAs,
                questions: selectedBankQuestions, // Backend expects IDs
                category: 'planificada'
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
            <div className="bg-white w-full max-w-5xl h-[75vh] max-h-[900px] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-500">

                {/* Header */}
                <div className="bg-[#11355a] p-10 text-white flex justify-between items-start shrink-0 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/10 rounded-xl"><Wand2 size={24} /></div>
                            <span className="font-bold text-blue-200 tracking-widest text-xs uppercase">Asistente Inteligente</span>
                        </div>
                        <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">Generador de Pruebas</h2>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all relative z-10">
                        <span className="sr-only">Cerrar</span>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                </div>

                {/* Steps Indicator */}
                <div className="px-10 py-6 bg-slate-50 border-b border-slate-100 flex items-center gap-4 overflow-x-auto shrink-0">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all ${step === s ? 'bg-white shadow-lg border-2 border-slate-100' : 'opacity-40'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${step === s ? 'bg-[#11355a] text-white' : 'bg-slate-200 text-slate-500'}`}>{s}</div>
                            <span className={`font-black text-xs uppercase tracking-widest whitespace-nowrap ${step === s ? 'text-[#11355a]' : 'text-slate-400'}`}>
                                {s === 1 ? 'Configuración' : s === 2 ? 'Objetivos' : 'Preguntas'}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
                    {step === 1 && (
                        <div className="space-y-8 max-w-2xl mx-auto animate-in slide-in-from-right-4">
                            <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex gap-4 items-start">
                                <AlertCircle className="text-blue-600 shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-black text-blue-800 uppercase text-xs tracking-widest mb-1">Paso 1: Configuración Básica</h4>
                                    <p className="text-blue-600/80 text-sm font-medium leading-relaxed">Defina los parámetros generales de la evaluación. Si seleccionó un curso y asignatura previamente, estos campos estarán pre-llenados.</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Curso</label>
                                        <select
                                            value={selectedCourse}
                                            onChange={e => { setSelectedCourse(e.target.value); setSelectedSubject(''); }}
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-slate-700"
                                            disabled={!!initialCourseId}
                                        >
                                            <option value="">Seleccione...</option>
                                            {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Asignatura</label>
                                        <select
                                            value={selectedSubject}
                                            onChange={e => setSelectedSubject(e.target.value)}
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-slate-700"
                                            disabled={!!initialSubjectId || !selectedCourse}
                                        >
                                            <option value="">Seleccione...</option>
                                            {filteredSubjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Título de la Prueba</label>
                                    <input
                                        autoFocus
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-xl"
                                        placeholder="Ej: Evaluación Unidad 1 - Números"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fecha Programada</label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tipo de Evaluación</label>
                                        <select
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold"
                                        >
                                            <option value="sumativa">Sumativa (Con nota)</option>
                                            <option value="formativa">Formativa (Sin nota)</option>
                                            <option value="diagnostica">Diagnóstica</option>
                                        </select>
                                    </div>
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

                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Preguntas Disponibles</h3>
                                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">{bankQuestions.length} en banco</span>
                            </div>

                            {/* Real-time Difficulty Meter */}
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4 mb-6 sticky top-0 z-10">
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Dificultad Global</label>
                                        <span className="text-[9px] font-bold text-slate-300">Basado en {selectedBankQuestions.length} preguntas</span>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-lg font-black uppercase tracking-tighter ${(() => {
                                            const total = selectedBankQuestions.length || 1;
                                            const easy = bankQuestions.filter(q => q && selectedBankQuestions.includes(q._id) && q.difficulty === 'easy').length;
                                            const medium = bankQuestions.filter(q => q && selectedBankQuestions.includes(q._id) && q.difficulty === 'medium').length;
                                            const hard = bankQuestions.filter(q => q && selectedBankQuestions.includes(q._id) && q.difficulty === 'hard').length;
                                            const score = (easy * 1 + medium * 2 + hard * 3) / total;
                                            if (score < 1.6) return 'text-emerald-500';
                                            if (score < 2.4) return 'text-amber-500';
                                            return 'text-rose-500';
                                        })()}`}>
                                            {(() => {
                                                const total = selectedBankQuestions.length || 1;
                                                const easy = bankQuestions.filter(q => q && selectedBankQuestions.includes(q._id) && q.difficulty === 'easy').length;
                                                const medium = bankQuestions.filter(q => q && selectedBankQuestions.includes(q._id) && q.difficulty === 'medium').length;
                                                const hard = bankQuestions.filter(q => q && selectedBankQuestions.includes(q._id) && q.difficulty === 'hard').length;
                                                const score = (easy * 1 + medium * 2 + hard * 3) / total;
                                                if (score < 1.6) return 'Básica';
                                                if (score < 2.4) return 'Intermedia';
                                                return 'Avanzada';
                                            })()}
                                        </span>
                                    </div>
                                </div>

                                {/* Progress Bars */}
                                <div className="h-2 flex rounded-full overflow-hidden bg-slate-100">
                                    <div className="bg-emerald-400 h-full transition-all duration-700 ease-out" style={{ width: `${(bankQuestions.filter(q => q && selectedBankQuestions.includes(q._id) && q.difficulty === 'easy').length / (selectedBankQuestions.length || 1)) * 100}%` }}></div>
                                    <div className="bg-amber-400 h-full transition-all duration-700 ease-out" style={{ width: `${(bankQuestions.filter(q => q && selectedBankQuestions.includes(q._id) && q.difficulty === 'medium').length / (selectedBankQuestions.length || 1)) * 100}%` }}></div>
                                    <div className="bg-rose-500 h-full transition-all duration-700 ease-out" style={{ width: `${(bankQuestions.filter(q => q && selectedBankQuestions.includes(q._id) && q.difficulty === 'hard').length / (selectedBankQuestions.length || 1)) * 100}%` }}></div>
                                </div>

                                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400 pt-1">
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400"></div>Fácil</div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"></div>Media</div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div>Difícil</div>
                                </div>
                            </div>

                            <div className="grid gap-4 pb-20">
                                {bankQuestions.map((q: any) => (
                                    <label key={q._id} className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-start gap-4 ${selectedBankQuestions.includes(q._id) ? 'border-amber-500 bg-amber-50' : 'border-slate-100 hover:border-amber-200'}`}>
                                        <input
                                            type="checkbox"
                                            checked={selectedBankQuestions.includes(q._id)}
                                            onChange={() => {
                                                if (selectedBankQuestions.includes(q._id)) {
                                                    setSelectedBankQuestions(selectedBankQuestions.filter(id => id !== q._id));
                                                } else {
                                                    setSelectedBankQuestions([...selectedBankQuestions, q._id]);
                                                }
                                            }}
                                            className="hidden"
                                        />
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 transition-all ${selectedBankQuestions.includes(q._id) ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            <Check size={18} />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-700 uppercase tracking-tight text-sm leading-snug mb-2">{q.questionText}</p>
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex gap-0.5 h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full transition-all ${q.difficulty === 'easy' ? 'w-1/3 bg-emerald-500' : q.difficulty === 'medium' ? 'w-2/3 bg-amber-500' : 'w-full bg-rose-500'}`} />
                                                    </div>
                                                    <span className={`text-[7px] font-black uppercase tracking-tighter ${q.difficulty === 'hard' ? 'text-rose-500' : q.difficulty === 'medium' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                        {q.difficulty === 'easy' ? 'Fácil' : q.difficulty === 'medium' ? 'Media' : 'Difícil'}
                                                    </span>
                                                </div>
                                                <span className="bg-white px-3 py-1 rounded-lg text-[9px] font-black text-slate-400 border border-slate-100 uppercase">{q.type.replace('_', ' ')}</span>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                                {bankQuestions.length === 0 && (
                                    <div className="text-center py-12 bg-amber-50 rounded-3xl border border-amber-100">
                                        <HelpCircle className="mx-auto mb-3 text-amber-400" size={36} />
                                        <p className="text-amber-600 font-bold text-sm mb-2">No hay preguntas en el banco</p>
                                        <p className="text-amber-500 text-xs mb-4">Vaya a "Banco de Preguntas" para crear preguntas reutilizables</p>
                                        <p className="text-amber-400 text-xs">O puede crear la evaluación manualmente desde "Gestión de Evaluaciones"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-8 bg-slate-50 border-t shrink-0 flex justify-between gap-4">
                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="flex-1 py-5 bg-white text-slate-400 border border-slate-200 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                        >
                            <ChevronLeft size={20} /> Anterior
                        </button>
                    )}
                    {step < 3 ? (
                        <>
                            {step === 2 && (
                                <button
                                    onClick={() => setStep(3)}
                                    className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                                >
                                    Saltar Objetivos →
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    if (step === 1 && !formData.title) return alert("Por favor ingrese un título para la evaluación");
                                    if (step === 1 && !selectedCourse) return alert("Seleccione un curso");
                                    if (step === 1 && !selectedSubject) return alert("Seleccione una asignatura");
                                    setStep(step + 1);
                                }}
                                className="flex-[2] py-5 bg-amber-500 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-amber-900/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                            >
                                Siguiente <ChevronRight size={20} />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleGenerate}
                            className="flex-[2] py-5 bg-emerald-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-900/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                        >
                            <Wand2 size={20} /> FINALIZAR Y GENERAR PRUEBA
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TestWizard;
