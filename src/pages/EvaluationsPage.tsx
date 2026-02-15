
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { Plus, Edit, Trash2, Search, ClipboardList, X, HelpCircle } from 'lucide-react';
import TestWizard from '../components/TestWizard';
import PrintButton from '../components/PrintButton';

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
    category: 'planificada' | 'sorpresa';
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
    feedback?: string;
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

const EvaluationsPage = ({ hideHeader = false }: { hideHeader?: boolean }) => {
    const { canEditGrades, isSuperAdmin, isStudent, isApoderado, isTeacher, isDirector, isUTP } = usePermissions();
    const isStaff = !isStudent && !isApoderado;

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
        courseId: '',
        category: 'planificada' as 'planificada' | 'sorpresa'
    });

    const [viewingEval, setViewingEval] = useState<any>(null);

    useEffect(() => {
        fetchData();
        if (isStaff) {
            fetchAuxData();
        }
    }, [isStaff]);

    const fetchData = async () => {
        try {
            const response = await api.get('/evaluations');
            let data = response.data;

            if (isStudent) {
                data = data.filter((e: any) => e.category !== 'sorpresa' && e.category !== 'surprise');
            }

            setEvaluations(data);
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
            const selectedSubjectObj = subjects.find(s => s.name === formData.subject);
            const payload = {
                title: formData.title,
                date: formData.date,
                category: formData.category,
                courseId: formData.courseId,
                subjectId: selectedSubjectObj?._id,
                maxScore: formData.maxScore
            };

            if (!payload.subjectId) {
                alert('Por favor seleccione una asignatura válida');
                return;
            }

            if (modalMode === 'create') {
                await api.post('/evaluations', payload);
            } else {
                await api.put(`/evaluations/${formData._id}`, payload);
            }
            setShowModal(false);
            fetchData();
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Error al guardar la evaluación');
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

    const handleSubmitForReview = async (id: string) => {
        try {
            await api.post(`/evaluations/${id}/submit`);
            alert('Evaluación enviada para revisión.');
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al enviar');
        }
    };

    const handleReview = async (id: string, status: 'approved' | 'rejected') => {
        const feedback = status === 'rejected' ? window.prompt('Motivo del rechazo:') : '';
        if (status === 'rejected' && feedback === null) return;
        try {
            await api.post(`/evaluations/${id}/review`, { status, feedback });
            alert(status === 'approved' ? 'Evaluación aprobada.' : 'Evaluación rechazada.');
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al revisar');
        }
    };

    const [showWizard, setShowWizard] = useState(false);

    const availableSubjects = subjects.filter(s => {
        if (!formData.courseId) return false;
        if (!s.courseId) return false;
        const sCourseId = typeof s.courseId === 'object' ? (s.courseId as any)._id : s.courseId;
        return sCourseId === formData.courseId;
    });

    const filteredEvals = evaluations.filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const canManage = (canEditGrades || isSuperAdmin || isTeacher) && isStaff;

    const pageTitle = isStaff ? 'Gestión de Evaluaciones' : 'Calendario de Evaluaciones';

    return (
        <div className={`${hideHeader ? 'p-0' : 'p-6'}`}>
            {!hideHeader && (
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <ClipboardList className="text-[#11355a]" />
                        {pageTitle}
                    </h1>
                    {canManage && (
                        <button
                            onClick={() => setShowWizard(true)}
                            className="bg-[#11355a] text-white px-4 py-2 rounded flex items-center gap-2 hover:opacity-90 transition"
                        >
                            <Plus size={18} /> Nueva Evaluación
                        </button>
                    )}
                </div>
            )}

            <div className={`bg-white p-4 rounded-3xl shadow-sm mb-6 border-2 border-slate-100 flex items-center gap-3 ${hideHeader ? 'mt-4' : ''}`}>
                <Search className="text-slate-400" size={20} />
                <input
                    placeholder="Buscar por título o asignatura..."
                    className="flex-1 outline-none font-bold text-slate-600 bg-transparent"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                {hideHeader && canManage && (
                    <button
                        onClick={() => setShowWizard(true)}
                        className="bg-[#11355a] text-white p-2 rounded-lg hover:bg-[#1a4a7c] transition-all shadow-lg"
                        title="Nueva Evaluación"
                    >
                        <Plus size={20} />
                    </button>
                )}
            </div>

            {loading ? <p className="text-center py-20 font-black text-slate-300 uppercase animate-pulse">Cargando Evaluaciones...</p> : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredEvals.map(ev => {
                        const qCount = (ev as any).questions?.length || 0;
                        return (
                            <div key={ev._id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border border-blue-100">
                                                {typeof ev.courseId === 'object' ? (ev.courseId as any)?.name : 'Sin Curso'}
                                            </span>
                                            {(ev as any).category === 'sorpresa' && (
                                                <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border border-rose-100 animate-pulse">
                                                    Sorpresa
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mb-1">
                                            {ev.status === 'draft' && <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[8px] font-black uppercase">Borrador</span>}
                                            {ev.status === 'submitted' && <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-[8px] font-black uppercase">En Revisión</span>}
                                            {ev.status === 'approved' && <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded text-[8px] font-black uppercase">Aprobada</span>}
                                            {ev.status === 'rejected' && <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-[8px] font-black uppercase">Rechazada</span>}
                                        </div>
                                        <h3 className="font-black text-lg text-slate-800 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">{ev.title}</h3>
                                        {ev.status === 'rejected' && ev.feedback && (
                                            <p className="text-[9px] font-bold text-rose-400 mt-1 italic border-l-2 border-rose-200 pl-2"> feedback: {ev.feedback}</p>
                                        )}
                                    </div>
                                    {canManage && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => {
                                                setModalMode('edit');
                                                setFormData({
                                                    _id: ev._id,
                                                    title: ev.title,
                                                    subject: ev.subject,
                                                    maxScore: ev.maxScore,
                                                    date: new Date(ev.date).toISOString().split('T')[0],
                                                    courseId: (ev.courseId as any)._id,
                                                    category: (ev as any).category || 'planificada'
                                                });
                                                setShowModal(true);
                                            }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(ev._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {typeof (ev as any).subjectId === 'object' ? (ev as any).subjectId?.name : (ev as any).subject || 'Sin Asignatura'}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                                    <Plus size={14} className="rotate-45" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-600">{new Date(ev.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1.5 justify-end">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                <span className="text-2xl font-black text-slate-800 tracking-tighter">{qCount}</span>
                                            </div>
                                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">Preguntas</p>
                                        </div>
                                    </div>

                                    {/* Action Shortcuts */}
                                    <div className="pt-4 border-t border-slate-50 flex flex-wrap gap-2 pb-1">
                                        <button
                                            onClick={() => setViewingEval(ev)}
                                            className="flex-1 min-w-[100px] bg-slate-50 hover:bg-slate-100 text-slate-500 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all"
                                        >
                                            Ver Contenido
                                        </button>
                                        <PrintButton
                                            evaluationId={ev._id}
                                            title={ev.title}
                                            questions={(ev as any).questions || []}
                                        />

                                        {/* Workflow Buttons */}
                                        {isTeacher && (ev.status === 'draft' || ev.status === 'rejected') && (
                                            <button
                                                onClick={() => handleSubmitForReview(ev._id)}
                                                className="flex-1 min-w-[100px] bg-indigo-600 text-white py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all shadow-lg shadow-indigo-200"
                                            >
                                                Enviar a Revisión
                                            </button>
                                        )}

                                        {(isSuperAdmin || isDirector || isUTP) && ev.status === 'submitted' && (
                                            <div className="flex gap-2 w-full mt-2">
                                                <button
                                                    onClick={() => handleReview(ev._id, 'approved')}
                                                    className="flex-1 bg-emerald-600 text-white py-2 rounded-xl font-black uppercase text-[8px] tracking-widest"
                                                >
                                                    Aprobar
                                                </button>
                                                <button
                                                    onClick={() => handleReview(ev._id, 'rejected')}
                                                    className="flex-1 bg-rose-600 text-white py-2 rounded-xl font-black uppercase text-[8px] tracking-widest"
                                                >
                                                    Rechazar
                                                </button>
                                            </div>
                                        )}

                                        {ev.status === 'approved' && (
                                            <button
                                                onClick={() => window.location.href = `/grades?evaluationId=${ev._id}`}
                                                className="flex-1 min-w-[110px] bg-blue-50 hover:bg-blue-100 text-blue-600 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all"
                                            >
                                                Ver Resultados
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* View Content Modal */}
            {viewingEval && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-500">
                        <div className="bg-[#11355a] p-8 text-white flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-2xl font-black tracking-tighter uppercase">{viewingEval.title}</h2>
                                <p className="text-blue-300 font-extrabold text-[10px] uppercase tracking-widest mt-1">Vista Previa de Instrumento</p>
                            </div>
                            <button onClick={() => setViewingEval(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all"><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            {(!viewingEval.questions || viewingEval.questions.length === 0) ? (
                                <div className="py-20 text-center opacity-40">
                                    <HelpCircle size={48} className="mx-auto mb-4" />
                                    <p className="font-black uppercase tracking-widest text-xs">Sin preguntas asociadas</p>
                                </div>
                            ) : (
                                viewingEval.questions.map((q: any, i: number) => (
                                    <div key={q._id} className="space-y-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-3 items-center">
                                                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm">{i + 1}</div>
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${q.difficulty === 'hard' ? 'bg-rose-100 text-rose-600' : q.difficulty === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                    {q.difficulty}
                                                </span>
                                            </div>
                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{q.type.replace('_', ' ')}</span>
                                        </div>
                                        <p className="font-black text-slate-800 leading-snug">{q.questionText}</p>
                                        {q.type === 'multiple_choice' && (
                                            <div className="grid gap-2 pl-4">
                                                {q.options?.map((opt: any, idx: number) => (
                                                    <div key={idx} className={`text-sm font-bold flex items-center gap-3 ${opt.isCorrect ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        <div className={`w-3 h-3 rounded-full border-2 ${opt.isCorrect ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200'}`}></div>
                                                        {opt.text}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-6 bg-slate-50 border-t flex justify-end">
                            <div className="flex gap-4">
                                <PrintButton
                                    evaluationId={viewingEval._id}
                                    title={viewingEval.title}
                                    questions={viewingEval.questions || []}
                                />
                                <button
                                    onClick={() => setViewingEval(null)}
                                    className="bg-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-300 active:scale-95 transition-all"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Test Wizard */}
            <TestWizard
                isOpen={showWizard}
                onClose={() => setShowWizard(false)}
                onSuccess={() => {
                    fetchData();
                    setShowWizard(false);
                }}
            />

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

                        <div className="mt-4 border-t pt-4">
                            <label className="block text-sm font-medium mb-1">Tipo de Notificación</label>
                            <select
                                className="w-full border p-2 rounded bg-white"
                                value={(formData as any).category}
                                onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                            >
                                <option value="planificada">Evaluación Planificada (Visible en Calendario)</option>
                                <option value="sorpresa">Evaluación Sorpresa (Alerta Inmediata)</option>
                            </select>
                            <p className="text-xs text-gray-400 mt-1">
                                {(formData as any).category === 'sorpresa'
                                    ? 'Los alumnos recibirán una notificación de "Evaluación Sorpresa" pero NO aparecerá en el calendario hasta después de realizada.'
                                    : 'La evaluación será visible en el calendario de los alumnos inmediatamente.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EvaluationsPage;
