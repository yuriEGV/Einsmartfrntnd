import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { useReactToPrint } from 'react-to-print';
import {
    ClipboardList,
    Plus,
    Edit,
    Trash2,
    Search,
    GraduationCap,
    AlertCircle,
    ChevronRight,
    Printer
} from 'lucide-react';

interface Grade {
    _id: string;
    estudianteId: { _id: string; nombres: string; apellidos: string };
    evaluationId: { _id: string; title: string; maxScore: number };
    score: number;
    tenantId: string;
    comments?: string;
    subjectId?: string; // Cache subjectId if possible
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
    subjectId: string;
    courseId: string; // Added to resolve lint errors
    subject?: string;
}

const GradesPage = ({ hideHeader = false }: { hideHeader?: boolean }) => {
    const permissions = usePermissions();
    const canManageGrades = permissions.canEditGrades;

    const [grades, setGrades] = useState<Grade[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const printRef = useRef<HTMLDivElement>(null);

    // Filter selections
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');

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
            const isStudent = permissions.user?.role === 'student';
            const isGuardian = permissions.user?.role === 'apoderado';

            // Students and Guardians: Backend already filters their grades
            // Staff: Get all data
            if (isStudent || isGuardian) {
                const [gradesRes, evalsRes, coursesRes, subjectsRes] = await Promise.all([
                    api.get('/grades'), // Backend filters by profileId for students/guardians
                    api.get('/evaluations'),
                    api.get('/courses'),
                    api.get('/subjects')
                ]);
                setGrades(gradesRes.data);
                setStudents([]); // Students/Guardians don't need the student list

                // Filter surprise evaluations for students
                const allEvals = evalsRes.data;
                setEvaluations(isStudent ? allEvals.filter((e: any) => e.category !== 'surprise' && e.category !== 'sorpresa') : allEvals);

                setCourses(coursesRes.data);
                setSubjects(subjectsRes.data);
            } else {
                // Staff gets all data
                const [gradesRes, studentsRes, evalsRes, coursesRes, subjectsRes] = await Promise.all([
                    api.get('/grades'),
                    api.get('/estudiantes'),
                    api.get('/evaluations'),
                    api.get('/courses'),
                    api.get('/subjects')
                ]);
                setGrades(gradesRes.data);
                setStudents(studentsRes.data);
                setEvaluations(evalsRes.data);
                setCourses(coursesRes.data);
                setSubjects(subjectsRes.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Notas-${new Date().toLocaleDateString()}`,
    });

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
        } catch (error: any) {
            console.error('Error saving grade:', error);
            alert(error.response?.data?.message || 'Error al guardar nota. Verifique que el estudiante tenga matrícula confirmada.');
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

    const filteredGrades = grades.filter(g => {
        const matchesSearch = (g.estudianteId?.nombres + ' ' + g.estudianteId?.apellidos).toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.evaluationId?.title?.toLowerCase().includes(searchTerm.toLowerCase());

        // Filter by Course/Subject if selected
        return matchesSearch;
    });

    const displayedGrades = filteredGrades.filter(g => {
        if (!selectedCourse && !selectedSubject) return true;

        // Find evaluation for this grade
        const evalItem = evaluations.find(e => e._id === g.evaluationId?._id);
        if (!evalItem) return false;

        // Match by subjectId if subject selected
        if (selectedSubject) {
            if (!evalItem.subjectId) return false;
            const evalSubjectId = typeof evalItem.subjectId === 'object' ? (evalItem.subjectId as any)._id : evalItem.subjectId;
            return evalSubjectId === selectedSubject;
        }

        // Match by courseId if course selected
        if (selectedCourse) {
            if (!evalItem.courseId) return false;
            const evalCourseId = typeof evalItem.courseId === 'object' ? (evalItem.courseId as any)._id : evalItem.courseId;
            return evalCourseId === selectedCourse;
        }

        return true;
    });

    const filteredStudents = students.filter(s =>
        (s.nombres + ' ' + s.apellidos + ' ' + (s.rut || '')).toLowerCase().includes(studentSearch.toLowerCase())
    );

    return (
        <div className={`${hideHeader ? 'p-0' : 'p-6'}`}>
            {/* Filters & Search - Always visible but styled differently if in Hub */}
            <div className={`flex flex-wrap items-center gap-4 mb-8 ${hideHeader ? 'mt-4' : ''}`}>
                {!hideHeader && (
                    <div className="mr-auto">
                        <h1 className="text-3xl font-black text-[#11355a] flex items-center gap-3">
                            <ClipboardList size={32} />
                            Libro de Clases: Notas
                        </h1>
                        <p className="text-gray-500 font-medium text-sm">Registro académico oficial del establecimiento.</p>
                    </div>
                )}

                <div className={`flex flex-wrap w-full ${hideHeader ? '' : 'md:w-auto'} gap-3 items-center`}>
                    {!permissions.isStudent && !permissions.isApoderado && (
                        <select
                            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm outline-none font-bold text-sm"
                            value={selectedCourse}
                            onChange={e => { setSelectedCourse(e.target.value); setSelectedSubject(''); }}
                        >
                            <option value="">Curso: Todos</option>
                            {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    )}

                    <select
                        className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm outline-none font-bold text-sm"
                        value={selectedSubject}
                        onChange={e => setSelectedSubject(e.target.value)}
                        disabled={!selectedCourse && !permissions.isStudent && !permissions.isApoderado}
                    >
                        <option value="">Asignatura: Todas</option>
                        {subjects
                            .filter(s => {
                                if (permissions.isStudent || permissions.isApoderado) return true;
                                if (!selectedCourse) return true;
                                if (!s.courseId) return false;
                                const sCourseId = typeof s.courseId === 'object' ? (s.courseId as any)._id : s.courseId;
                                return sCourseId === selectedCourse;
                            })
                            .map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>

                    {/* Student Search - Hidden for guardians */}
                    {permissions.user?.role !== 'apoderado' && (
                        <div className="relative flex-1 md:w-64 min-w-[200px]">
                            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                placeholder="Buscar alumno..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}

                    {!hideHeader && permissions.isStaff && (
                        <button
                            onClick={() => window.location.href = '/evaluations'}
                            className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20"
                        >
                            <Plus size={20} />
                            CREAR PRUEBA
                        </button>
                    )}

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

                    {!hideHeader && (
                        <button
                            onClick={handlePrint}
                            className="bg-white text-gray-600 px-6 py-2.5 rounded-xl font-bold border border-gray-200 flex items-center gap-2 hover:bg-gray-50 transition-all"
                        >
                            <Printer size={20} />
                            Imprimir
                        </button>
                    )}

                    {(permissions.isStudent || permissions.isApoderado) && (
                        <button
                            onClick={() => window.location.href = '/hoja-de-vida'}
                            className="bg-rose-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/20"
                        >
                            <ClipboardList size={20} />
                            Hoja de Vida
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#11355a]"></div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" ref={printRef}>
                    {/* Print Only Header */}
                    <div className="hidden print:block p-10 text-center border-b-4 border-slate-900 mb-10">
                        <div className="flex justify-between items-center mb-6">
                            <div className="text-left">
                                <h1 className="text-3xl font-black uppercase tracking-tighter">REGISTRO DE CALIFICACIONES</h1>
                                <p className="text-blue-600 font-black text-sm">SISTEMA DE GESTIÓN EDUCATIVA EINSMART</p>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-black uppercase">Reporte Académico</div>
                                <div className="text-slate-500 font-bold">FECHA: {new Date().toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>
                    {/* Mobile Card Grid - Optimized for all touch devices */}
                    <div className="md:hidden p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {displayedGrades.map((grade) => (
                            <div key={grade._id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="min-w-0">
                                        {!permissions.isStudent && !permissions.isApoderado && (
                                            <div className="text-sm font-black text-slate-800 leading-tight truncate">
                                                {grade.estudianteId?.nombres} {grade.estudianteId?.apellidos}
                                            </div>
                                        )}
                                        <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1 opacity-70 truncate">
                                            {(grade.evaluationId as any)?.subject || 'Gral'} • {grade.evaluationId?.title}
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-xl font-black text-lg shadow-sm ${grade.score >= 4 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                        {grade.score.toFixed(1)}
                                    </div>
                                </div>

                                {canManageGrades && (
                                    <div className="mt-auto flex gap-2 pt-4 border-t border-slate-50">
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
                                        }} className="flex-1 py-2.5 bg-slate-50 text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-colors">Editar</button>
                                        <button onClick={() => handleDelete(grade._id)} className="px-4 py-2.5 bg-slate-50 text-rose-500 rounded-xl hover:bg-rose-50 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table - Optimized for Staff (Grouped by Student) */}
                    <div className="hidden md:block overflow-x-auto">
                        {(permissions.isStudent || permissions.isApoderado) ? (
                            <div className="p-8 space-y-8">
                                {Array.from(new Set(displayedGrades.map(g => (g.evaluationId as any)?.subject || 'General'))).map(subjectName => {
                                    const subjectGrades = displayedGrades.filter(g => ((g.evaluationId as any)?.subject || 'General') === subjectName);
                                    const average = subjectGrades.reduce((acc, curr) => acc + curr.score, 0) / subjectGrades.length;

                                    return (
                                        <div key={subjectName} className="bg-slate-50/50 rounded-3xl border border-slate-100 overflow-hidden">
                                            <div className="px-8 py-5 bg-white border-b border-slate-100 flex justify-between items-center">
                                                <h3 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                                                    <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                                                    {subjectName}
                                                </h3>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Promedio:</span>
                                                    <span className={`text-xl font-black ${average >= 4 ? 'text-emerald-600' : 'text-rose-600'}`}>{average.toFixed(1)}</span>
                                                </div>
                                            </div>
                                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {subjectGrades.map(g => (
                                                    <div key={g._id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider truncate">{g.evaluationId?.title}</span>
                                                        <span className={`text-2xl font-black text-center py-2 rounded-xl ${g.score >= 4 ? 'text-emerald-600 bg-emerald-50/50' : 'text-rose-600 bg-rose-50/50'}`}>
                                                            {g.score.toFixed(1)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="min-w-full divide-y divide-gray-200">
                                {/* Group by Student for Staff View */}
                                {Object.values(displayedGrades.reduce((acc: any, grade) => {
                                    const studentId = grade.estudianteId?._id;
                                    if (!studentId) return acc;
                                    if (!acc[studentId]) {
                                        acc[studentId] = {
                                            student: grade.estudianteId,
                                            grades: []
                                        };
                                    }
                                    acc[studentId].grades.push(grade);
                                    return acc;
                                }, {})).map((entry: any) => (
                                    <div key={entry.student._id} className="bg-white border-b border-gray-100 hover:bg-slate-50 transition-colors">
                                        <div className="flex flex-col md:flex-row">
                                            {/* Student Column - Fixed width */}
                                            <div className="w-full md:w-64 p-6 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/30 flex items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-black text-sm">
                                                        {entry.student.nombres.charAt(0)}{entry.student.apellidos.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-800 leading-tight">
                                                            {entry.student.apellidos}, {entry.student.nombres}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                                            {entry.grades.length} Calificaciones
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Grades Grid - Fluid width */}
                                            <div className="flex-1 p-4">
                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                                    {entry.grades.map((grade: Grade) => (
                                                        <div key={grade._id} className="relative group bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md transition-all hover:border-blue-200">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-tighter truncate w-full pr-2" title={(grade.evaluationId as any)?.subject}>
                                                                    {(grade.evaluationId as any)?.subject}
                                                                </div>
                                                                {canManageGrades && (
                                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white shadow-sm rounded-lg p-0.5 border border-gray-100">
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
                                                                        }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit size={12} /></button>
                                                                        <button onClick={() => handleDelete(grade._id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded"><Trash2 size={12} /></button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-end justify-between gap-2">
                                                                <div className="text-xs font-bold text-gray-700 leading-tight line-clamp-2 w-full" title={grade.evaluationId?.title}>
                                                                    {grade.evaluationId?.title}
                                                                </div>
                                                                <div className={`text-lg font-black px-2 py-0.5 rounded-lg ${grade.score >= 4 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                                    {grade.score.toFixed(1)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Final Average Column */}
                                            <div className="w-24 md:w-32 p-6 border-l border-slate-100 flex flex-col justify-center items-center bg-slate-50/50">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Promedio</p>
                                                <div className={`text-2xl font-black ${(entry.grades.reduce((acc: number, g: any) => acc + g.score, 0) / entry.grades.length) >= 4
                                                    ? 'text-emerald-600'
                                                    : 'text-rose-600'
                                                    }`}>
                                                    {(entry.grades.reduce((acc: number, g: any) => acc + g.score, 0) / entry.grades.length).toFixed(1)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {displayedGrades.length === 0 && <div className="p-12 text-center text-gray-400 font-medium">No se encontraron calificaciones registradas.</div>}
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
                                        {evaluations.map(ev => (
                                            <option key={ev._id} value={ev._id}>
                                                {ev.title} ({ev.subject || subjects.find(s => s._id === (ev as any).subjectId)?.name || 'Gral'})
                                            </option>
                                        ))}
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

