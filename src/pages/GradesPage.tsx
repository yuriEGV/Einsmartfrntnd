import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import {
    ClipboardList,
    Plus,
    Edit,
    Trash2,
    Search,
    GraduationCap,
    AlertCircle,
    ChevronRight
} from 'lucide-react';

interface Grade {
    _id: string;
    estudianteId: { _id: string; nombre: string; apellido: string };
    evaluationId: { _id: string; title: string; maxScore: number };
    score: number;
    tenantId: string;
    comments?: string;
}

interface Student {
    _id: string;
    nombres: string;
    apellidos: string;
    rut: string;
}

interface Evaluation {
    _id: string;
    title: string;
    subject: string;
}

const GradesPage = () => {
    const permissions = usePermissions();
    const canManageGrades = permissions.canEditGrades;

    const [grades, setGrades] = useState<Grade[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [loading, setLoading] = useState(true);

    // UI - Search and Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [studentSearch, setStudentSearch] = useState('');

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState({
        _id: '',
        estudianteId: '',
        evaluationId: '',
        score: 4.0,
        comments: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [gradesRes, studentsRes, evalsRes] = await Promise.all([
                api.get('/grades'),
                api.get('/estudiantes'),
                api.get('/evaluations')
            ]);
            setGrades(gradesRes.data);
            setStudents(studentsRes.data);
            setEvaluations(evalsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (modalMode === 'create') {
                const { _id, ...cleanData } = formData;
                await api.post('/grades', cleanData);
            } else {
                await api.put(`/grades/${formData._id}`, { score: formData.score, comments: formData.comments });
            }
            setShowModal(false);
            setStudentSearch('');
            fetchInitialData();
        } catch (error) {
            alert('Error al guardar nota');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Seguro que deseas ELIMINAR esta nota? Esta acción quedará registrada en el sistema de auditoría.')) return;
        try {
            await api.delete(`/grades/${id}`);
            fetchInitialData();
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    const filteredGrades = grades.filter(g =>
        (g.estudianteId?.nombre + ' ' + g.estudianteId?.apellido).toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.evaluationId?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredStudents = students.filter(s =>
        (s.nombres + ' ' + s.apellidos + ' ' + s.rut).toLowerCase().includes(studentSearch.toLowerCase())
    );

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-[#11355a] flex items-center gap-3">
                        <ClipboardList size={32} />
                        Libro de Clases: Notas
                    </h1>
                    <p className="text-gray-500 font-medium">Registro académico oficial del establecimiento.</p>
                </div>

                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                            placeholder="Buscar por alumno o evaluación..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {canManageGrades && (
                        <button
                            onClick={() => {
                                setModalMode('create');
                                setFormData({ _id: '', estudianteId: '', evaluationId: '', score: 4.0, comments: '' });
                                setStudentSearch('');
                                setShowModal(true);
                            }}
                            className="bg-[#11355a] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20"
                        >
                            <Plus size={20} />
                            Ingresar Nota
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#11355a]"></div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Estudiante</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Evaluación / Asignatura</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Nota</th>
                                    {canManageGrades && <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredGrades.map((grade) => (
                                    <tr key={grade._id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-800">
                                                {grade.estudianteId?.nombre} {grade.estudianteId?.apellido}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-700">{grade.evaluationId?.title}</div>
                                            <div className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">
                                                {(grade.evaluationId as any)?.subject}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-block px-4 py-1.5 rounded-lg font-black text-lg ${grade.score >= 4 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {grade.score.toFixed(1)}
                                            </span>
                                        </td>
                                        {canManageGrades && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => {
                                                        const stud = students.find(s => s._id === grade.estudianteId?._id);
                                                        setModalMode('edit');
                                                        setFormData({
                                                            _id: grade._id,
                                                            estudianteId: grade.estudianteId?._id,
                                                            evaluationId: grade.evaluationId?._id,
                                                            score: grade.score,
                                                            comments: grade.comments || ''
                                                        });
                                                        setStudentSearch(stud ? `${stud.nombres} ${stud.apellidos}` : '');
                                                        setShowModal(true);
                                                    }} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><Edit size={18} /></button>
                                                    <button onClick={() => handleDelete(grade._id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredGrades.length === 0 && <div className="p-12 text-center text-gray-400 font-medium">No se encontraron calificaciones registradas.</div>}
                </div>
            )}

            {/* Modal de Ingreso/Edición */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-[#11355a] p-6 text-white flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <GraduationCap size={24} />
                                {modalMode === 'create' ? 'Ingresar Calificación' : 'Modificar Nota'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-white/60 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            {modalMode === 'create' && (
                                <div className="relative">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Buscar Alumno</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                                        <input
                                            placeholder="Nombre o RUT..."
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:bg-white transition-all outline-none"
                                            value={studentSearch}
                                            onChange={e => {
                                                setStudentSearch(e.target.value);
                                                if (formData.estudianteId) setFormData({ ...formData, estudianteId: '' });
                                            }}
                                        />
                                    </div>
                                    {studentSearch && !formData.estudianteId && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                                            {filteredStudents.length > 0 ? filteredStudents.map(s => (
                                                <button
                                                    key={s._id}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData({ ...formData, estudianteId: s._id });
                                                        setStudentSearch(`${s.nombres} ${s.apellidos}`);
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center justify-between border-b last:border-0 group"
                                                >
                                                    <div>
                                                        <div className="font-bold text-sm text-gray-800">{s.nombres} {s.apellidos}</div>
                                                        <div className="text-[10px] text-gray-400 group-hover:text-blue-500">{s.rut}</div>
                                                    </div>
                                                    <ChevronRight className="text-gray-300 group-hover:text-blue-500" size={16} />
                                                </button>
                                            )) : (
                                                <div className="px-4 py-6 text-center text-gray-400 text-sm italic">No se encontraron resultados</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Evaluación</label>
                                    <select
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none appearance-none"
                                        value={formData.evaluationId}
                                        onChange={e => setFormData({ ...formData, evaluationId: e.target.value })}
                                        disabled={modalMode === 'edit'}
                                        required
                                    >
                                        <option value="">Seleccione...</option>
                                        {evaluations.map(ev => <option key={ev._id} value={ev._id}>{ev.title} ({ev.subject})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Nota (1.0 - 7.0)</label>
                                    <input
                                        type="number" step="0.1" min="1" max="7"
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none font-black text-center text-xl text-[#11355a]"
                                        value={formData.score}
                                        onChange={e => setFormData({ ...formData, score: parseFloat(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-2xl flex items-start gap-3 border border-blue-100 text-xs text-blue-700 leading-relaxed font-medium">
                                <AlertCircle size={18} className="shrink-0" />
                                <span>Al {modalMode === 'create' ? 'crear' : 'editar'} una nota, se enviará una notificación automática al apoderado y quedará registro permanente en el historial de movimientos (Audit Log).</span>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={!formData.estudianteId || !formData.evaluationId}
                                    className="w-full bg-[#11355a] text-white py-4 rounded-2xl font-black shadow-xl hover:bg-blue-800 disabled:bg-gray-300 transition-all flex items-center justify-center gap-2"
                                >
                                    {modalMode === 'create' ? 'PUBLICAR CALIFICACIÓN' : 'ACTUALIZAR NOTA'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GradesPage;

