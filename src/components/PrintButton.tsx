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

    const filteredQuestions = (questions || []).filter(q => {
        if (!q) return false;
        if (difficulty === 'all') return true;
        return q.difficulty === difficulty;
    });

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
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
            alert('Error al generar PDF. Intenta con Imprimir.');
        }
    };

    return (
        <>
            <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-all"
            >
                <Printer size={16} />
                Imprimir Prueba
            </button>

            {showPreview && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
                        {/* Header */}
                        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black">Vista Previa de Impresión</h2>
                                <p className="text-blue-100 text-sm font-bold">{title}</p>
                            </div>
                            <button onClick={() => setShowPreview(false)} className="text-white/40 hover:text-white">
                                <X size={32} />
                            </button>
                        </div>

                        {/* Difficulty Filter */}
                        <div className="p-6 bg-slate-50 border-b border-slate-200">
                            <label className="text-sm font-black text-slate-600 mb-3 block">
                                Seleccionar Dificultad:
                            </label>
                            <div className="flex gap-2">
                                {[
                                    { value: 'all', label: 'Todas las Preguntas' },
                                    { value: 'easy', label: 'Solo Fáciles' },
                                    { value: 'medium', label: 'Solo Medias' },
                                    { value: 'hard', label: 'Solo Difíciles' }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setDifficulty(opt.value as any)}
                                        className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${difficulty === opt.value
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-blue-300'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500 mt-2 font-bold">
                                {filteredQuestions.length} de {questions.length} preguntas seleccionadas
                            </p>
                        </div>

                        {/* Preview Content */}
                        <div className="p-8 overflow-y-auto max-h-[50vh] print-content">
                            <div className="max-w-3xl mx-auto">
                                {/* Print Header */}
                                <div className="text-center mb-8 pb-6 border-b-2 border-slate-200">
                                    <h1 className="text-3xl font-black text-[#11355a] mb-2">{title}</h1>
                                    <p className="text-slate-600 font-bold">Fecha: {new Date().toLocaleDateString('es-ES')}</p>
                                    <div className="mt-4 flex gap-4 justify-center text-sm">
                                        <div className="border-2 border-slate-200 rounded-lg px-4 py-2">
                                            <strong>Nombre:</strong> _______________________
                                        </div>
                                        <div className="border-2 border-slate-200 rounded-lg px-4 py-2">
                                            <strong>Curso:</strong> ___________
                                        </div>
                                    </div>
                                </div>

                                {/* Questions */}
                                <div className="space-y-6">
                                    {filteredQuestions.map((q, index) => (
                                        <div key={q._id} className="border-2 border-slate-100 rounded-2xl p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="font-black text-lg text-slate-800">
                                                    {index + 1}. {q.questionText}
                                                </h3>
                                                <span className={`px-3 py-1 rounded-lg text-xs font-black ${q.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                                                    q.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-rose-100 text-rose-700'
                                                    }`}>
                                                    {q.difficulty === 'easy' ? 'Fácil' : q.difficulty === 'medium' ? 'Medio' : 'Difícil'}
                                                </span>
                                            </div>

                                            {q.type === 'multiple_choice' && q.options && (
                                                <div className="mt-4 space-y-2">
                                                    {q.options.map((opt, i) => (
                                                        <div key={i} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
                                                            <div className="w-6 h-6 rounded-full border-2 border-slate-300"></div>
                                                            <span className="font-bold text-slate-700">{String.fromCharCode(65 + i)})</span>
                                                            <span className="text-slate-600">{opt.text}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {q.type === 'open' && (
                                                <div className="mt-4 border-2 border-dashed border-slate-200 rounded-lg p-6 min-h-[100px]">
                                                    <p className="text-xs text-slate-400 font-bold">Espacio para respuesta</p>
                                                </div>
                                            )}

                                            {q.type === 'true_false' && (
                                                <div className="mt-4 flex gap-4">
                                                    <div className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg">
                                                        <div className="w-6 h-6 rounded-full border-2 border-slate-300"></div>
                                                        <span className="font-bold text-emerald-600">Verdadero</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg">
                                                        <div className="w-6 h-6 rounded-full border-2 border-slate-300"></div>
                                                        <span className="font-bold text-rose-600">Falso</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-3">
                            <button
                                onClick={handlePrint}
                                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                            >
                                <Printer size={20} />
                                Imprimir Ahora
                            </button>
                            <button
                                onClick={handleDownloadPDF}
                                className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                            >
                                <Download size={20} />
                                Descargar PDF
                            </button>
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
