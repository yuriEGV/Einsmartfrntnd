import { useState } from 'react';
import { Printer, X, Download } from 'lucide-react';
import api from '../services/api';

interface Question {
    _id: string;
    questionText: string;
    difficulty: 'easy' | 'medium' | 'hard';
    type: 'multiple_choice' | 'open' | 'true_false';
    options?: { text: string; isCorrect: boolean }[];
}

interface PrintButtonProps {
    evaluationId: string;
    title: string;
    questions: Question[];
}

const PrintButton = ({ evaluationId, title, questions }: PrintButtonProps) => {
    const [showPreview, setShowPreview] = useState(false);
    const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
    const [isGenerating, setIsGenerating] = useState(false);

    const filteredQuestions = (questions || []).filter(q => {
        if (!q) return false;
        if (difficulty === 'all') return true;
        return q.difficulty === difficulty;
    });

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        setIsGenerating(true);
        try {
            const res = await api.get(`/evaluations/${evaluationId}/print?difficulty=${difficulty}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${title.replace(/\s+/g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Error downloading PDF:', err);
            alert('El servidor externo de PDF está ocupado. Por favor use el botón "Imprimir Ahora" y seleccione "Guardar como PDF" en su navegador.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            <button
                onClick={(e) => { e.stopPropagation(); setShowPreview(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-all"
            >
                <Printer size={16} />
                Imprimir
            </button>

            {showPreview && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
                        {/* Header */}
                        <div className="bg-[#11355a] p-8 text-white flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-2xl font-black tracking-tighter uppercase">Preparar Impresión</h2>
                                <p className="text-blue-300 font-bold text-[10px] uppercase tracking-widest mt-1">{title}</p>
                            </div>
                            <button onClick={() => setShowPreview(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                            {/* Controls Sidebar */}
                            <div className="w-full md:w-72 bg-slate-50 border-r border-slate-100 p-8 space-y-8 overflow-y-auto">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Filtro de Dificultad</label>
                                    <div className="space-y-2">
                                        {[
                                            { value: 'all', label: 'Todas' },
                                            { value: 'easy', label: 'Fácil' },
                                            { value: 'medium', label: 'Media' },
                                            { value: 'hard', label: 'Difícil' }
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setDifficulty(opt.value as any)}
                                                className={`w-full text-left px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${difficulty === opt.value
                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                    : 'bg-white text-slate-500 border-2 border-slate-100 hover:border-blue-200'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Resumen</p>
                                    <p className="text-2xl font-black text-[#11355a]">{filteredQuestions.length}</p>
                                    <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Preguntas a imprimir</p>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={handlePrint}
                                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Printer size={16} /> Imprimir Ahora
                                    </button>
                                    <button
                                        onClick={handleDownloadPDF}
                                        disabled={isGenerating}
                                        className={`w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isGenerating ? 'Generando...' : <><Download size={16} /> Descargar PDF</>}
                                    </button>
                                </div>
                            </div>

                            {/* Preview area */}
                            <div className="flex-1 bg-slate-200/50 p-8 overflow-y-auto custom-scrollbar">
                                <div className="bg-white shadow-2xl mx-auto p-12 min-h-[1000px] border border-slate-200 print-content" style={{ width: '210mm' }}>
                                    {/* Print Header - Institutional Style */}
                                    <div className="flex justify-between items-start mb-12 border-b-4 border-slate-900 pb-8">
                                        <div className="space-y-1">
                                            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{title}</h1>
                                            <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Evaluación de Aprendizaje</p>
                                        </div>
                                        <div className="text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Fecha de Emisión: {new Date().toLocaleDateString('es-ES')}
                                        </div>
                                    </div>

                                    {/* Student Info Box */}
                                    <div className="grid grid-cols-2 gap-6 mb-12">
                                        <div className="border-2 border-slate-900 p-4 rounded-xl">
                                            <span className="text-[9px] font-black uppercase text-slate-400 block mb-2">Nombre del Alumno(a)</span>
                                            <div className="h-6 border-b border-slate-300"></div>
                                        </div>
                                        <div className="border-2 border-slate-900 p-4 rounded-xl">
                                            <span className="text-[9px] font-black uppercase text-slate-400 block mb-2">R.U.T / Identificación</span>
                                            <div className="h-6 border-b border-slate-300"></div>
                                        </div>
                                        <div className="border-2 border-slate-900 p-4 rounded-xl">
                                            <span className="text-[9px] font-black uppercase text-slate-400 block mb-2">Puntaje Ideal</span>
                                            <div className="h-6 font-black text-lg flex items-center"> 100 PTS</div>
                                        </div>
                                        <div className="border-2 border-slate-900 p-4 rounded-xl">
                                            <span className="text-[9px] font-black uppercase text-slate-400 block mb-2">Puntaje Obtenido</span>
                                            <div className="h-6"></div>
                                        </div>
                                        <div className="border-2 border-slate-900 p-4 rounded-xl">
                                            <span className="text-[9px] font-black uppercase text-slate-400 block mb-2">Nota Final</span>
                                            <div className="h-6 font-black text-2xl"></div>
                                        </div>
                                        <div className="border-2 border-slate-900 p-4 rounded-xl">
                                            <span className="text-[9px] font-black uppercase text-slate-400 block mb-2">Firma / Timbre</span>
                                            <div className="h-6"></div>
                                        </div>
                                    </div>

                                    {/* Questions */}
                                    <div className="space-y-10">
                                        {filteredQuestions.map((q, index) => (
                                            <div key={q._id} className="break-inside-avoid">
                                                <div className="flex gap-4 items-start mb-4">
                                                    <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0">{index + 1}</span>
                                                    <p className="font-bold text-xl text-slate-900 leading-tight pt-1">{q.questionText}</p>
                                                </div>

                                                {q.type === 'multiple_choice' && q.options && (
                                                    <div className="ml-12 grid gap-3">
                                                        {q.options.map((opt, i) => (
                                                            <div key={i} className="flex items-center gap-4 group">
                                                                <div className="w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center font-black text-[10px] shrink-0">
                                                                    {String.fromCharCode(65 + i)}
                                                                </div>
                                                                <span className="text-slate-800 font-medium">{opt.text}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {q.type === 'open' && (
                                                    <div className="ml-12 mt-4 space-y-4">
                                                        <div className="h-px bg-slate-200"></div>
                                                        <div className="h-px bg-slate-200"></div>
                                                        <div className="h-px bg-slate-200"></div>
                                                        <div className="h-px bg-slate-200"></div>
                                                    </div>
                                                )}

                                                {q.type === 'true_false' && (
                                                    <div className="ml-12 mt-4 flex gap-8">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-6 h-6 rounded-full border-2 border-slate-900"></div>
                                                            <span className="font-black text-xs uppercase text-slate-900">Verdadero</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-6 h-6 rounded-full border-2 border-slate-900"></div>
                                                            <span className="font-black text-xs uppercase text-slate-900">Falso</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-content, .print-content * {
                        visibility: visible;
                    }
                    .print-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                    }
                }
            `}</style>
        </>
    );
};

export default PrintButton;
