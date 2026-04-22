import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { ChevronRight, ChevronLeft, GraduationCap, ClipboardList, Calendar, BookOpen, AlertCircle, Search, ShieldCheck, UserCheck, List, LayoutGrid, Printer, UserPlus, ExternalLink, FileText, X, Clock, Trash2, Save } from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useReactToPrint } from 'react-to-print';

const UnifiedClassBook = () => {
    const { tenant } = useTenant();
    const { user } = useAuth();
    const permissions = usePermissions();
    const printRef = useRef<HTMLDivElement>(null);
    const actaPrintRef = useRef<HTMLDivElement>(null);

    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const [activeTab, setActiveTab] = useState<'ficha' | 'asistencia' | 'leccionario' | 'notas' | 'citaciones' | 'anotaciones' | 'atrasos'>('ficha');
    const [attendanceViewMode, setAttendanceViewMode] = useState<'grid' | 'list'>('grid');

    const [courses, setCourses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [citaciones, setCitaciones] = useState<any[]>([]);
    const [annotations, setAnnotations] = useState<any[]>([]);

    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedBlock, setSelectedBlock] = useState('Bloque 1');
    const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
    const [searchQuery, setSearchQuery] = useState('');

    const [showLogForm, setShowLogForm] = useState(false);
    const [logFormData, setLogFormData] = useState({ date: new Date().toISOString().split('T')[0], topic: '', activities: '', objectives: [] as string[] });
    const [attendanceConfirmed, setAttendanceConfirmed] = useState(false);

    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [signingLogId, setSigningLogId] = useState<string | null>(null);
    const [pin, setPin] = useState('');

    // Tardiness State
    const [tardinessLogs, setTardinessLogs] = useState<any[]>([]);
    const [tardinessLoading, setTardinessLoading] = useState(false);

    // Grades Matrix State
    const [gradeMatrix, setGradeMatrix] = useState<Record<string, Record<string, string>>>({});
    const [isSavingMatrix, setIsSavingMatrix] = useState(false);

    // Aula Efectiva (Timer)
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [isTimerPaused, setIsTimerPaused] = useState(false);
    const [effectiveDuration, setEffectiveDuration] = useState(0); // in seconds
    const currentSessionRef = useRef({ course: '', subject: '', block: '' });

    // Student Detail Modal
    const [showStudentDetailModal, setShowStudentDetailModal] = useState(false);
    const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<any>(null);
    const [studentPerformance, setStudentPerformance] = useState<any>(null);

    // Citacion Modal
    const [showCitacionModal, setShowCitacionModal] = useState(false);
    const [citacionFormData, setCitacionFormData] = useState({
        estudianteId: '',
        apoderadoId: '',
        fecha: new Date().toISOString().split('T')[0],
        hora: '10:00',
        motivo: '',
        modalidad: 'presencial',
        lugar: ''
    });
    const [showActaModal, setShowActaModal] = useState(false);
    const [selectedCitacion, setSelectedCitacion] = useState<any>(null);
    const [actaFormData, setActaFormData] = useState({
        estado: 'realizada',
        actaReunion: '',
        acuerdo: '',
        resultado: '',
        asistioApoderado: true
    });

    // Annotations State
    const [showAnnotationModal, setShowAnnotationModal] = useState(false);
    const [annotationFormData, setAnnotationFormData] = useState({
        estudianteId: '', // if empty, it's a general course annotation
        tipo: 'positiva',
        titulo: '',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0]
    });

    // Evaluation State
    const [showEvaluationModal, setShowEvaluationModal] = useState(false);
    const [evaluationFormData, setEvaluationFormData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        weight: 1,
        description: '',
        type: 'test',
        category: 'planned'
    });

    useEffect(() => {
        let interval: any;
        if (isTimerRunning && !isTimerPaused) {
            interval = setInterval(() => {
                setEffectiveDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, isTimerPaused]);

    // Reset duration ONLY when session context REALLY changes
    useEffect(() => {
        if (selectedCourse && selectedSubject && selectedBlock) {
            const isNewSession =
                currentSessionRef.current.course !== selectedCourse ||
                currentSessionRef.current.subject !== selectedSubject ||
                currentSessionRef.current.block !== selectedBlock;
            
            if (isNewSession) {
                currentSessionRef.current = { course: selectedCourse, subject: selectedSubject, block: selectedBlock };
                setEffectiveDuration(0);
                setIsTimerRunning(false); // Do not auto-start, teacher must control
                setIsTimerPaused(false);
            }
        } else {
            setIsTimerRunning(false);
            setIsTimerPaused(false);
            setEffectiveDuration(0);
            currentSessionRef.current = { course: '', subject: '', block: '' };
        }
    }, [selectedCourse, selectedSubject, selectedBlock]);


    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Libro de Clases - ${selectedCourse || 'Curso'}`,
    });

    const handlePrintActa = useReactToPrint({
        contentRef: actaPrintRef,
        documentTitle: `Acta de Reunión - ${selectedCitacion?.estudianteId?.apellidos || 'Documento'}`,
    });

    const openActaModal = (citacion: any) => {
        setSelectedCitacion(citacion);
        setActaFormData({
            estado: citacion.estado || 'realizada',
            actaReunion: citacion.actaReunion || '',
            acuerdo: citacion.acuerdo || '',
            resultado: citacion.resultado || '',
            asistioApoderado: citacion.asistioApoderado ?? true
        });
        setShowActaModal(true);
    };

    const handleSaveActa = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.patch(`/citaciones/${selectedCitacion._id}/status`, actaFormData);
            alert('Acta guardada correctamente.');
            setShowActaModal(false);
            refreshTabContent();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error al guardar el acta.');
        }
    };

    // -------------------------------------------------------------------------
    // Data Fetching
    // -------------------------------------------------------------------------

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                // [FIX] Directors and specialized roles should see ALL courses
                const endpoint = (permissions.canViewSensitiveData || permissions.isAdmin)
                    ? '/courses?all=true'
                    : '/courses';

                const [cRes, sRes] = await Promise.all([api.get(endpoint), api.get('/subjects')]);
                
                // [NEW] Robust Chilean Pedagogical Sorting
                const sortedCourses = cRes.data.sort((a: any, b: any) => {
                    const getRank = (name: string) => {
                        const n = name.toLowerCase();
                        if (n.includes('pre-kínder') || n.includes('prek')) return -3;
                        if (n.includes('kínder') || n.includes('kinder')) return -2;
                        if (n.includes('i° medio') || n.includes('1° medio') || n.includes('1 medio')) return 9;
                        if (n.includes('ii° medio') || n.includes('2° medio') || n.includes('2 medio')) return 10;
                        if (n.includes('iii° medio') || n.includes('3° medio') || n.includes('3 medio')) return 11;
                        if (n.includes('iv° medio') || n.includes('4° medio') || n.includes('4 medio')) return 12;
                        const match = n.match(/(\d+)/);
                        return match ? parseInt(match[0]) : 50;
                    };
                    const rankA = getRank(a.name);
                    const rankB = getRank(b.name);
                    if (rankA !== rankB) return rankA - rankB;
                    return a.name.localeCompare(b.name);
                });
                
                setCourses(sortedCourses);
                setSubjects(sRes.data);
            } catch (err) { console.error(err); }
        };
        fetchInitial();
    }, [user]);

    const refreshTabContent = async () => {
        if (!selectedCourse) return;
        try {
            // [FIX] Celo de Datos: Enforce strict filtering of returned students
            const strictFilter = (stds: any[]) => stds.filter(s => {
                const sCourseId = s.activeEnrollment?.[0]?.courseId?.toString() || (s.enrolledCourse?.[0]?._id?.toString());
                if (sCourseId && sCourseId === selectedCourse) return true;

                const crs = courses.find((c: any) => c._id === selectedCourse);
                if (!crs) return false;

                if (s.grado === crs.name) return true;

                const normalize = (str: string) => (str || '').replace(/\s+/g, '').toLowerCase();
                const normGrado = normalize(s.grado);
                const normCrs = normalize(crs.name);

                return normGrado && normCrs && (normGrado === normCrs || normGrado.includes(normCrs) || normCrs.includes(normGrado));
            });

            if (activeTab === 'ficha') {
                const res = await api.get(`/estudiantes?cursoId=${selectedCourse}`);
                setStudents(strictFilter(res.data));
            } else if (activeTab === 'asistencia') {
                const [studRes, attRes] = await Promise.all([
                    api.get(`/estudiantes?cursoId=${selectedCourse}`),
                    api.get(`/attendance?courseId=${selectedCourse}&fecha=${attendanceDate}&bloqueHorario=${selectedBlock}`)
                ]);
                const filteredData = strictFilter(studRes.data);
                setStudents(filteredData);
                const amap: Record<string, string> = {};
                filteredData.forEach((s: any) => {
                    const rec = attRes.data.find((r: any) => (r.estudianteId?._id || r.estudianteId) === s._id);
                    if (rec) amap[s._id] = rec.estado;
                });
                setAttendanceMap(amap);
            } else if (activeTab === 'anotaciones') {
                const [annRes, studRes] = await Promise.all([
                    api.get(`/anotaciones?cursoId=${selectedCourse}`),
                    api.get(`/estudiantes?cursoId=${selectedCourse}`)
                ]);
                setAnnotations(annRes.data);
                setStudents(strictFilter(studRes.data));
            } else if (activeTab === 'citaciones') {
                const res = await api.get(`/citaciones?cursoId=${selectedCourse}`);
                setCitaciones(res.data);
            } else if (selectedSubject) {
                if (activeTab === 'leccionario') {
                    const res = await api.get(`/class-logs?courseId=${selectedCourse}&subjectId=${selectedSubject}`);
                    setLogs(res.data);
                } else if (activeTab === 'notas') {
                    const [gradesRes, evalsRes, studRes] = await Promise.all([
                        api.get(`/grades?courseId=${selectedCourse}`),
                        api.get(`/evaluations?courseId=${selectedCourse}&subjectId=${selectedSubject}`),
                        api.get(`/estudiantes?cursoId=${selectedCourse}`)
                    ]);
                    const filteredStudents = strictFilter(studRes.data);
                    setStudents(filteredStudents);
                    setEvaluations(evalsRes.data.slice(0, 10));
                    
                    const matrix: Record<string, Record<string, string>> = {};
                    gradesRes.data.forEach((g: any) => {
                        const studentId = typeof g.estudianteId === 'object' ? g.estudianteId._id : g.estudianteId;
                        const evaluationId = typeof g.evaluationId === 'object' ? g.evaluationId._id : g.evaluationId;
                        if (!matrix[studentId]) matrix[studentId] = {};
                        matrix[studentId][evaluationId] = g.score.toString();
                    });
                    setGradeMatrix(matrix);
                } else if (activeTab === 'atrasos') {
                    setTardinessLoading(true);
                    const res = await api.get(`/atrasos?courseId=${selectedCourse}`);
                    setTardinessLogs(res.data);
                    setTardinessLoading(false);
                    const studRes = await api.get(`/estudiantes?cursoId=${selectedCourse}`);
                    setStudents(strictFilter(studRes.data));
                }
            }
        } catch (err) { console.error('REFRESH ERROR:', err); }
    };

    useEffect(() => { refreshTabContent(); }, [selectedCourse, selectedSubject, activeTab, attendanceDate, selectedBlock]);

    // [NEW] Log Access to Class Book
    useEffect(() => {
        if (selectedCourse) {
            const logAccess = async () => {
                try {
                    await api.post('/logs/class-book', {
                        courseId: selectedCourse,
                        action: 'view',
                        details: `Acceso a libro de clases - Tab: ${activeTab}`
                    });
                } catch (err) {
                    console.error('Error logging access:', err);
                }
            };
            logAccess();
        }
    }, [selectedCourse, activeTab]);

    const handleCreateEvaluation = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/evaluations', {
                ...evaluationFormData,
                courseId: selectedCourse,
                subjectId: selectedSubject
            });
            setShowEvaluationModal(false);
            refreshTabContent();
            setEvaluationFormData({
                title: '',
                date: new Date().toISOString().split('T')[0],
                weight: 1,
                description: '',
                type: 'test',
                category: 'planned'
            });
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error al crear la evaluación.');
        }
    };

    // -------------------------------------------------------------------------
    // Handlers
    // -------------------------------------------------------------------------

    const handleSaveAttendance = async () => {
        try {
            const payload = {
                courseId: selectedCourse,
                fecha: attendanceDate,
                bloqueHorario: selectedBlock,
                subjectId: selectedSubject,
                students: Object.entries(attendanceMap).map(([estudianteId, estado]) => ({ estudianteId, estado }))
            };
            await api.post('/attendance/bulk', payload);
            alert('Asistencia legal guardada y validada.');
        } catch (err) { alert('Error al guardar asistencia para este bloque.'); }
    };

    const handleSaveLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!attendanceConfirmed) { alert('Debe confirmar el pase de lista antes de firmar.'); return; }
        try {
            const res = await api.post('/class-logs', {
                ...logFormData,
                courseId: selectedCourse,
                subjectId: selectedSubject,
                bloqueHorario: selectedBlock
            });
            // Automatic prompt to sign or just refresh
            alert('Registro guardado. Ahora proceda a firmar digitalmente.');
            setShowLogForm(false);
            setAttendanceConfirmed(false);
            refreshTabContent();
            setSigningLogId(res.data._id);
            setShowSignatureModal(true);
        } catch (err) { alert('Error al registrar actividad pedagógica.'); }
    };

    const handleSignLog = async () => {
        if (!signingLogId || pin.length < 4) return;
        try {
            await api.post(`/class-logs/${signingLogId}/sign`, {
                pin,
                effectiveDuration: Math.floor(effectiveDuration / 60), // Send the tracked duration in minutes
                bloqueHorario: selectedBlock
            });
            alert('Registro firmado exitosamente con firma digital legal.');
            setShowSignatureModal(false);
            setSigningLogId(null);
            setPin('');
            setIsTimerRunning(false); // Stop timer
            refreshTabContent();
        } catch (err) { alert('Error al firmar documento.'); }
    };



    const handleSaveCitacion = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/citaciones', {
                ...citacionFormData,
                courseId: selectedCourse
            });
            alert('Citación programada y notificada al apoderado.');
            setShowCitacionModal(false);
            refreshTabContent();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error al programar la citación.');
        }
    };

    const handleSaveAnnotation = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/anotaciones', {
                ...annotationFormData,
                cursoId: selectedCourse,
                estudianteId: annotationFormData.estudianteId || null
            });
            alert('Anotación registrada exitosamente.');
            setShowAnnotationModal(false);
            setAnnotationFormData({ ...annotationFormData, estudianteId: '', titulo: '', descripcion: '' });
            refreshTabContent();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error al registrar la anotación.');
        }
    };

    const handleBulkGradeSave = async () => {
        if (!window.confirm('¿Está seguro de que desea guardar todos los cambios en la matriz de notas? Esta acción actualizará los registros oficiales.')) return;
        setIsSavingMatrix(true);
        try {
            // 1. Identify which virtual columns have data
            const virtualIdsToCreate: string[] = [];
            Object.values(gradeMatrix).forEach(studentEvals => {
                Object.entries(studentEvals).forEach(([key, val]) => {
                    if (key.startsWith('virtual_') && val && !virtualIdsToCreate.includes(key)) {
                        virtualIdsToCreate.push(key);
                    }
                });
            });

            // 2. Create real evaluations for those virtual columns
            const virtualToRealMap: Record<string, string> = {};
            for (const vId of virtualIdsToCreate) {
                const colNumber = vId.split('_')[1];
                const res = await api.post('/evaluations', {
                    title: `Nota ${colNumber}`,
                    date: new Date().toISOString().split('T')[0],
                    weight: 10,
                    type: 'test',
                    category: 'planned',
                    courseId: selectedCourse,
                    subjectId: selectedSubject
                });
                virtualToRealMap[vId] = res.data._id;
            }

            // 3. Prepare final bulk payload
            const gradesPayload: any[] = [];
            Object.entries(gradeMatrix).forEach(([estId, evals]) => {
                Object.entries(evals).forEach(([evId, score]) => {
                    if (score) {
                        const finalEvId = evId.startsWith('virtual_') ? virtualToRealMap[evId] : evId;
                        if (finalEvId) {
                            gradesPayload.push({
                                estudianteId: estId,
                                evaluationId: finalEvId,
                                score: parseFloat(score)
                            });
                        }
                    }
                });
            });

            if (gradesPayload.length === 0) {
                alert('No hay notas nuevas para guardar.');
                return;
            }

            await api.post('/grades/bulk', { grades: gradesPayload });
            alert('Matriz de calificaciones actualizada exitosamente.');
            refreshTabContent();
        } catch (error: any) {
            console.error('SAVE ERROR:', error);
            alert(error.response?.data?.message || 'Error al guardar calificaciones masivamente');
        } finally {
            setIsSavingMatrix(false);
        }
    };

    const handleAddTardiness = async (student: any) => {
        const mins = window.prompt(`Minutos de atraso para ${student.apellidos}:`, "15");
        if (!mins) return;
        try {
            await api.post('/atrasos', {
                estudianteId: student._id,
                fecha: new Date(),
                minutosAtraso: parseInt(mins),
                bloque: selectedBlock,
                motivo: 'Ingreso tardío jornada'
            });
            alert('Atraso registrado');
            refreshTabContent();
        } catch (error) {
            alert('Error al registrar atraso');
        }
    };

    const handleDeleteTardiness = async (id: string) => {
        if (!window.confirm('¿Eliminar este registro de atraso?')) return;
        try {
            await api.delete(`/atrasos/${id}`);
            refreshTabContent();
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    const handleShowStudentDetail = async (student: any) => {
        setSelectedStudentForDetail(student);
        setShowStudentDetailModal(true);
        setStudentPerformance(null);
        try {
            const res = await api.get(`/analytics/student/${student._id}`);
            setStudentPerformance(res.data);
        } catch (err) {
            console.error("Error fetching performance", err);
        }
    };

    const handlePrintStudent = async (studentId: string, printImmediately: boolean = false) => {
        try {
            const response = await api.get(`/reports/student/${studentId}`);
            const d = response.data;
            const s = d.student;
            const school = d.school || {};

            const calcAge = (dob: string) => {
                if (!dob) return '--';
                const diff = new Date().getTime() - new Date(dob).getTime();
                return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
            };

            const fmt = (date: string) => date ? new Date(date).toLocaleDateString('es-CL') : '--';
            const scoreColor = (score: number) => score >= 4 ? '#065f46' : '#9f1239';
            const scoreBg = (score: number) => score >= 4 ? '#d1fae5' : '#ffe4e6';

            const logoHtml = school.logoUrl
                ? `<img src="${school.logoUrl}" alt="Logo" style="height:70px; object-fit:contain; max-width:180px;" />`
                : `<div style="width:70px;height:70px;background:#11355a;border-radius:12px;display:flex;align-items:center;justify-content:center;color:white;font-size:1.6rem;font-weight:900;">${school.name?.charAt(0) || 'E'}</div>`;

            const gradesBySubjectHtml = (d.gradesBySubject || []).map((sub: any) => `
                <div style="margin-bottom:20px; border:1px solid #e2e8f0; border-radius:10px; overflow:hidden; page-break-inside:avoid;">
                    <div style="background:#11355a; color:white; padding:10px 16px; display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:900; font-size:0.9rem; text-transform:uppercase; letter-spacing:0.05em;">${sub.subject}</span>
                        <span style="font-size:1.1rem; font-weight:900; padding:4px 12px; border-radius:999px; background:${scoreBg(sub.average)}; color:${scoreColor(sub.average)};">
                            Promedio: ${sub.average ?? '--'}
                        </span>
                    </div>
                    <table style="width:100%;border-collapse:collapse;">
                        <thead>
                            <tr style="background:#f8fafc;">
                                <th style="padding:8px 12px;text-align:left;font-size:0.8rem;color:#475569;border-bottom:1px solid #e2e8f0;">Evaluación</th>
                                <th style="padding:8px 12px;text-align:center;font-size:0.8rem;color:#475569;border-bottom:1px solid #e2e8f0;">Nota</th>
                                <th style="padding:8px 12px;text-align:center;font-size:0.8rem;color:#475569;border-bottom:1px solid #e2e8f0;">Fecha</th>
                                <th style="padding:8px 12px;text-align:center;font-size:0.8rem;color:#475569;border-bottom:1px solid #e2e8f0;">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sub.grades.map((g: any, i: number) => `
                                <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'};">
                                    <td style="padding:8px 12px;font-size:0.85rem;border-bottom:1px solid #f1f5f9;">${g.title}</td>
                                    <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #f1f5f9;">
                                        <span style="font-weight:900;font-size:1rem;color:${scoreColor(g.score)};background:${scoreBg(g.score)};padding:2px 10px;border-radius:999px;">${g.score?.toFixed(1)}</span>
                                    </td>
                                    <td style="padding:8px 12px;text-align:center;font-size:0.8rem;color:#64748b;border-bottom:1px solid #f1f5f9;">${fmt(g.date)}</td>
                                    <td style="padding:8px 12px;text-align:center;font-size:0.75rem;border-bottom:1px solid #f1f5f9;">
                                        <span style="padding:2px 8px;border-radius:999px;background:${g.status === 'justified' ? '#fef9c3' : '#f0f9ff'};color:${g.status === 'justified' ? '#854d0e' : '#0369a1'};">${g.status === 'justified' ? 'Justificada' : 'Calificada'}</span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `).join('') || '<p style="color:#94a3b8;font-style:italic;padding:20px 0;">Sin registros de calificaciones este período.</p>';

            const annotationsHtml = (d.annotations || []).map((a: any) => `
                <div style="margin-bottom:12px;padding:12px 16px;border-left:4px solid ${a.tipo === 'positiva' ? '#10b981' : a.tipo === 'negativa' ? '#ef4444' : '#f59e0b'};background:#f8fafc;border-radius:0 8px 8px 0;page-break-inside:avoid;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                        <strong style="font-size:0.9rem;color:#1e293b;">${a.titulo || 'Sin título'}</strong>
                        <span style="font-size:0.7rem;font-weight:900;padding:3px 10px;border-radius:999px;background:${a.tipo === 'positiva' ? '#d1fae5' : a.tipo === 'negativa' ? '#ffe4e6' : '#fef9c3'};color:${a.tipo === 'positiva' ? '#065f46' : a.tipo === 'negativa' ? '#9f1239' : '#854d0e'};">${(a.tipo || 'neutra').toUpperCase()}</span>
                    </div>
                    <p style="margin:0;font-size:0.85rem;color:#475569;">${a.descripcion || ''}</p>
                    <div style="margin-top:6px;font-size:0.75rem;color:#94a3b8;">Fecha: ${fmt(a.fecha)} • Autor: ${a.autor || 'Sistema'}</div>
                </div>
            `).join('') || '<p style="color:#94a3b8;font-style:italic;">No registra anotaciones en el período.</p>';

            const licensesHtml = (d.licenses || []).length > 0 ? `
                <table style="width:100%;border-collapse:collapse;margin-top:8px;">
                    <thead>
                        <tr style="background:#fef9c3;">
                            <th style="padding:8px 12px;text-align:left;font-size:0.8rem;color:#854d0e;border-bottom:1px solid #fde047;">Tipo</th>
                            <th style="padding:8px 12px;text-align:center;font-size:0.8rem;color:#854d0e;border-bottom:1px solid #fde047;">Inicio</th>
                            <th style="padding:8px 12px;text-align:center;font-size:0.8rem;color:#854d0e;border-bottom:1px solid #fde047;">Fin</th>
                            <th style="padding:8px 12px;text-align:center;font-size:0.8rem;color:#854d0e;border-bottom:1px solid #fde047;">Días</th>
                            <th style="padding:8px 12px;text-align:center;font-size:0.8rem;color:#854d0e;border-bottom:1px solid #fde047;">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(d.licenses || []).map((l: any, i: number) => `
                            <tr style="background:${i % 2 === 0 ? '#fff' : '#fffbeb'};">
                                <td style="padding:8px 12px;font-size:0.85rem;border-bottom:1px solid #f1f5f9;">${l.tipo || 'Médica'} ${l.esElectronica ? '(Elec.)' : ''}</td>
                                <td style="padding:8px 12px;text-align:center;font-size:0.85rem;border-bottom:1px solid #f1f5f9;">${fmt(l.fechaInicio)}</td>
                                <td style="padding:8px 12px;text-align:center;font-size:0.85rem;border-bottom:1px solid #f1f5f9;">${fmt(l.fechaFin)}</td>
                                <td style="padding:8px 12px;text-align:center;font-weight:900;font-size:0.85rem;border-bottom:1px solid #f1f5f9;">${l.diasReposo || '--'}</td>
                                <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #f1f5f9;">
                                    <span style="padding:2px 8px;border-radius:999px;font-size:0.75rem;background:#d1fae5;color:#065f46;">${l.estado || 'Aprobado'}</span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p style="color:#94a3b8;font-style:italic;">Sin licencias médicas registradas.</p>';

            const atrasosHtml = (d.atrasos || []).length > 0 ? `
                <table style="width:100%;border-collapse:collapse;margin-top:8px;">
                    <thead>
                        <tr style="background:#fff7ed;">
                            <th style="padding:8px 12px;text-align:left;font-size:0.8rem;color:#9a3412;border-bottom:1px solid #fed7aa;">Fecha</th>
                            <th style="padding:8px 12px;text-align:center;font-size:0.8rem;color:#9a3412;border-bottom:1px solid #fed7aa;">Bloque</th>
                            <th style="padding:8px 12px;text-align:center;font-size:0.8rem;color:#9a3412;border-bottom:1px solid #fed7aa;">Min. Atraso</th>
                            <th style="padding:8px 12px;text-align:center;font-size:0.8rem;color:#9a3412;border-bottom:1px solid #fed7aa;">Min. Legales</th>
                            <th style="padding:8px 12px;text-align:left;font-size:0.8rem;color:#9a3412;border-bottom:1px solid #fed7aa;">Motivo</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(d.atrasos || []).slice(0, 20).map((a: any, i: number) => `
                            <tr style="background:${i % 2 === 0 ? '#fff' : '#fff7ed'};">
                                <td style="padding:8px 12px;font-size:0.85rem;border-bottom:1px solid #f1f5f9;">${fmt(a.fecha)}</td>
                                <td style="padding:8px 12px;text-align:center;font-size:0.85rem;border-bottom:1px solid #f1f5f9;">${a.bloque || '--'}</td>
                                <td style="padding:8px 12px;text-align:center;font-weight:900;color:#ea580c;font-size:0.85rem;border-bottom:1px solid #f1f5f9;">${a.minutosAtraso} min</td>
                                <td style="padding:8px 12px;text-align:center;font-size:0.85rem;color:#64748b;border-bottom:1px solid #f1f5f9;">${a.minutosLegales} min</td>
                                <td style="padding:8px 12px;font-size:0.8rem;color:#475569;border-bottom:1px solid #f1f5f9;">${a.motivo || '--'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p style="color:#94a3b8;font-style:italic;">Sin registros de atrasos.</p>';

            const classLogsHtml = (d.classLogs || []).length > 0 ? `
                <table style="width:100%;border-collapse:collapse;margin-top:8px;">
                    <thead>
                        <tr style="background:#eff6ff;">
                            <th style="padding:8px 12px;text-align:left;font-size:0.8rem;color:#1e40af;border-bottom:1px solid #bfdbfe;">Fecha</th>
                            <th style="padding:8px 12px;text-align:left;font-size:0.8rem;color:#1e40af;border-bottom:1px solid #bfdbfe;">Asignatura</th>
                            <th style="padding:8px 12px;text-align:left;font-size:0.8rem;color:#1e40af;border-bottom:1px solid #bfdbfe;">Contenido / OA</th>
                            <th style="padding:8px 12px;text-align:center;font-size:0.8rem;color:#1e40af;border-bottom:1px solid #bfdbfe;">Profesor</th>
                            <th style="padding:8px 12px;text-align:center;font-size:0.8rem;color:#1e40af;border-bottom:1px solid #bfdbfe;">Hrs. Efectivas</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(d.classLogs || []).map((log: any, i: number) => `
                            <tr style="background:${i % 2 === 0 ? '#fff' : '#f0f9ff'};">
                                <td style="padding:8px 12px;font-size:0.8rem;border-bottom:1px solid #f1f5f9;">${fmt(log.date)}</td>
                                <td style="padding:8px 12px;font-size:0.8rem;font-weight:700;color:#1e40af;border-bottom:1px solid #f1f5f9;">${log.subject || '--'}</td>
                                <td style="padding:8px 12px;font-size:0.8rem;border-bottom:1px solid #f1f5f9;">${log.topic}</td>
                                <td style="padding:8px 12px;text-align:center;font-size:0.8rem;color:#64748b;border-bottom:1px solid #f1f5f9;">${log.teacher || '--'}</td>
                                <td style="padding:8px 12px;text-align:center;font-size:0.8rem;font-weight:700;border-bottom:1px solid #f1f5f9;">${log.effectiveDuration ? (log.effectiveDuration / 60).toFixed(1) + ' h' : '--'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p style="color:#94a3b8;font-style:italic;">Sin registros de leccionario.</p>';

            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <title>Reporte SIGE - ${s.apellidos}, ${s.nombres}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; font-size: 13px; }
        .page { max-width: 900px; margin: 0 auto; padding: 40px; background: white; }
        /* --- HEADER --- */
        .report-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 24px; border-bottom: 3px solid #11355a; margin-bottom: 28px; }
        .school-info h1 { font-size: 1.4rem; font-weight: 900; color: #11355a; text-transform: uppercase; letter-spacing: -0.02em; }
        .school-info p { font-size: 0.78rem; color: #64748b; margin-top: 3px; }
        .report-meta { text-align: right; }
        .report-meta .doc-type { font-size: 0.65rem; font-weight: 900; letter-spacing: 0.15em; color: #64748b; text-transform: uppercase; background: #f1f5f9; padding: 4px 12px; border-radius: 999px; }
        .report-meta .issue-date { font-size: 0.75rem; color: #94a3b8; margin-top: 6px; }
        /* --- STUDENT CARD --- */
        .student-card { display: grid; grid-template-columns: auto 1fr; gap: 20px; background: linear-gradient(135deg, #11355a 0%, #1e40af 100%); color: white; padding: 24px; border-radius: 16px; margin-bottom: 28px; }
        .student-avatar { width: 80px; height: 80px; border-radius: 12px; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 900; overflow: hidden; flex-shrink: 0; }
        .student-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .student-info h2 { font-size: 1.4rem; font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em; }
        .student-info .student-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 12px; }
        .student-info .meta-item { background: rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 8px; }
        .student-info .meta-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.7; }
        .student-info .meta-value { font-size: 0.85rem; font-weight: 700; margin-top: 2px; }
        /* --- SUMMARY STATS --- */
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
        .stat-box { padding: 16px; border-radius: 12px; text-align: center; border: 2px solid; }
        .stat-box .stat-value { font-size: 1.8rem; font-weight: 900; line-height: 1; }
        .stat-box .stat-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px; }
        .stat-promedio { border-color: ${d.overallAverage >= 4 ? '#10b981' : '#ef4444'}; color: ${d.overallAverage >= 4 ? '#065f46' : '#9f1239'}; background: ${d.overallAverage >= 4 ? '#d1fae5' : '#ffe4e6'}; }
        .stat-asistencia { border-color: #3b82f6; color: #1e40af; background: #eff6ff; }
        .stat-anotaciones { border-color: #f59e0b; color: #854d0e; background: #fef9c3; }
        .stat-atrasos { border-color: #f97316; color: #9a3412; background: #fff7ed; }
        /* --- SECTIONS --- */
        .section { margin-bottom: 28px; page-break-inside: avoid; }
        .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
        .section-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; }
        .section-header h2 { font-size: 1rem; font-weight: 900; color: #11355a; text-transform: uppercase; letter-spacing: 0.05em; }
        .section-badge { margin-left: auto; font-size: 0.7rem; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
        /* --- GUARDIAN --- */
        .guardian-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .guardian-field .field-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.08em; }
        .guardian-field .field-value { font-size: 0.85rem; font-weight: 600; color: #1e293b; margin-top: 2px; }
        /* --- FOOTER --- */
        .report-footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; }
        .footer-left { font-size: 0.7rem; color: #94a3b8; max-width: 400px; line-height: 1.6; }
        .signature-area { text-align: center; }
        .signature-line { width: 200px; border-top: 1px solid #334155; margin: 0 auto 6px; }
        .signature-label { font-size: 0.7rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
        /* --- PRINT --- */
        @media print {
            body { background: white; }
            .page { padding: 20px; max-width: 100%; }
            .no-print { display: none !important; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
<div class="page">

    <!-- HEADER -->
    <div class="report-header">
        <div style="display:flex;align-items:center;gap:16px;">
            ${logoHtml}
            <div class="school-info">
                <h1>${school.name || 'Establecimiento'}</h1>
                <p>${school.address || ''}</p>
                <p>${school.phone ? 'Tel: ' + school.phone : ''} ${school.contactEmail ? '• ' + school.contactEmail : ''}</p>
            </div>
        </div>
        <div class="report-meta">
            <div class="doc-type">Reporte SIGE Oficial</div>
            <div class="issue-date">Año Académico ${school.academicYear || new Date().getFullYear()}</div>
            <div class="issue-date">Emitido: ${new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
        </div>
    </div>

    <!-- STUDENT CARD -->
    <div class="student-card">
        <div class="student-avatar">
            ${s.fotoUrl ? `<img src="${s.fotoUrl}" alt="foto" />` : `${(s.nombres||'?')[0]}${(s.apellidos||'?')[0]}`}
        </div>
        <div class="student-info">
            <h2>${s.apellidos}, ${s.nombres}</h2>
            <div class="student-meta">
                <div class="meta-item"><div class="meta-label">RUT</div><div class="meta-value">${s.rut || 'Sin Registro'}</div></div>
                <div class="meta-item"><div class="meta-label">Curso</div><div class="meta-value">${s.grado || '--'}</div></div>
                <div class="meta-item"><div class="meta-label">Edad</div><div class="meta-value">${calcAge(s.fechaNacimiento)} años</div></div>
                <div class="meta-item"><div class="meta-label">Nacimiento</div><div class="meta-value">${fmt(s.fechaNacimiento)}</div></div>
                <div class="meta-item"><div class="meta-label">Nacionalidad</div><div class="meta-value">${s.nacionalidad || 'Chilena'}</div></div>
                <div class="meta-item"><div class="meta-label">Previsión Salud</div><div class="meta-value">${s.salud || 'Sin Registro'}</div></div>
                ${s.direccion ? `<div class="meta-item" style="grid-column:span 2;"><div class="meta-label">Dirección</div><div class="meta-value">${s.direccion}</div></div>` : ''}
                ${s.email ? `<div class="meta-item"><div class="meta-label">Email</div><div class="meta-value">${s.email}</div></div>` : ''}
            </div>
        </div>
    </div>

    <!-- SUMMARY STATS -->
    <div class="stats-grid">
        <div class="stat-box stat-promedio">
            <div class="stat-value">${d.overallAverage ?? '--'}</div>
            <div class="stat-label">Promedio General</div>
        </div>
        <div class="stat-box stat-asistencia">
            <div class="stat-value">${d.attendance?.percent ?? '--'}%</div>
            <div class="stat-label">Asistencia (${d.attendance?.present ?? 0}/${d.attendance?.total ?? 0})</div>
        </div>
        <div class="stat-box stat-anotaciones">
            <div class="stat-value">${d.annotations?.length ?? 0}</div>
            <div class="stat-label">Anotaciones</div>
        </div>
        <div class="stat-box stat-atrasos">
            <div class="stat-value">${d.atrasos?.length ?? 0}</div>
            <div class="stat-label">Atrasos</div>
        </div>
    </div>

    <!-- APODERADO -->
    ${d.guardian ? `
    <div class="section">
        <div class="section-header">
            <div class="section-icon" style="background:#eff6ff;">👨‍👩‍👦</div>
            <h2>Apoderado / Tutor Legal</h2>
        </div>
        <div class="guardian-card">
            <div class="guardian-field"><div class="field-label">Nombre Completo</div><div class="field-value">${(d.guardian.nombre || '') + ' ' + (d.guardian.apellidos || '')}</div></div>
            <div class="guardian-field"><div class="field-label">RUT</div><div class="field-value">${d.guardian.rut || '--'}</div></div>
            <div class="guardian-field"><div class="field-label">Parentesco</div><div class="field-value">${d.guardian.parentesco || '--'}</div></div>
            <div class="guardian-field"><div class="field-label">Teléfono</div><div class="field-value">${d.guardian.telefono || '--'}</div></div>
            <div class="guardian-field"><div class="field-label">Email</div><div class="field-value">${d.guardian.email || '--'}</div></div>
        </div>
    </div>
    ` : ''}

    <!-- CALIFICACIONES POR RAMO -->
    <div class="section">
        <div class="section-header">
            <div class="section-icon" style="background:#d1fae5;">📊</div>
            <h2>Situación Académica por Asignatura</h2>
            <span class="section-badge" style="background:#d1fae5;color:#065f46;">${d.grades?.length ?? 0} evaluaciones</span>
        </div>
        ${gradesBySubjectHtml}
    </div>

    <!-- ASISTENCIA -->
    <div class="section">
        <div class="section-header">
            <div class="section-icon" style="background:#eff6ff;">📋</div>
            <h2>Registro de Asistencia</h2>
            <span class="section-badge" style="background:#eff6ff;color:#1e40af;">${d.attendance?.percent ?? 100}% de asistencia</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:16px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
            <div style="text-align:center;"><div style="font-size:1.5rem;font-weight:900;color:#10b981;">${d.attendance?.present ?? 0}</div><div style="font-size:0.7rem;color:#64748b;font-weight:700;text-transform:uppercase;">Presentes</div></div>
            <div style="text-align:center;"><div style="font-size:1.5rem;font-weight:900;color:#ef4444;">${d.attendance?.absent ?? 0}</div><div style="font-size:0.7rem;color:#64748b;font-weight:700;text-transform:uppercase;">Ausencias</div></div>
            <div style="text-align:center;"><div style="font-size:1.5rem;font-weight:900;color:#f59e0b;">${d.attendance?.tardinessAtt ?? 0}</div><div style="font-size:0.7rem;color:#64748b;font-weight:700;text-transform:uppercase;">Atrasos S.Att</div></div>
            <div style="text-align:center;"><div style="font-size:1.5rem;font-weight:900;color:#1e40af;">${d.attendance?.total ?? 0}</div><div style="font-size:0.7rem;color:#64748b;font-weight:700;text-transform:uppercase;">Total Registros</div></div>
        </div>
    </div>

    <!-- LECCIONARIO -->
    <div class="section">
        <div class="section-header">
            <div class="section-icon" style="background:#eff6ff;">📚</div>
            <h2>Resumen Leccionario</h2>
            <span class="section-badge" style="background:#eff6ff;color:#1e40af;">${d.classLogs?.length ?? 0} clases firmadas</span>
        </div>
        ${classLogsHtml}
    </div>

    <!-- ANOTACIONES -->
    <div class="section">
        <div class="section-header">
            <div class="section-icon" style="background:#fef9c3;">📝</div>
            <h2>Registro de Anotaciones</h2>
            <span class="section-badge" style="background:#fef9c3;color:#854d0e;">${d.annotations?.length ?? 0} registros</span>
        </div>
        ${annotationsHtml}
    </div>

    <!-- LICENCIAS MÉDICAS -->
    <div class="section">
        <div class="section-header">
            <div class="section-icon" style="background:#fef9c3;">🏥</div>
            <h2>Licencias Médicas</h2>
            <span class="section-badge" style="background:#fef9c3;color:#854d0e;">${d.licenses?.length ?? 0} licencias</span>
        </div>
        ${licensesHtml}
    </div>

    <!-- ATRASOS -->
    <div class="section">
        <div class="section-header">
            <div class="section-icon" style="background:#fff7ed;">⏱️</div>
            <h2>Control de Atrasos</h2>
            <span class="section-badge" style="background:#fff7ed;color:#9a3412;">${d.atrasos?.length ?? 0} registros</span>
        </div>
        ${atrasosHtml}
    </div>

    <!-- FOOTER -->
    <div class="report-footer">
        <div class="footer-left">
            <p style="font-weight:700;color:#475569;margin-bottom:4px;">Declaración de autenticidad</p>
            <p>El presente reporte ha sido generado automáticamente por el sistema EinSmart con datos auditables. Documento emitido el ${new Date().toLocaleDateString('es-CL')} para uso exclusivo de la institución educativa.</p>
        </div>
        <div class="signature-area">
            <div class="signature-line"></div>
            <div class="signature-label">Firma Director(a)</div>
        </div>
    </div>

    <!-- PRINT BUTTON -->
    <div class="no-print" style="margin-top:30px;display:flex;gap:12px;justify-content:center;">
        <button onclick="window.print()" style="padding:12px 32px;background:#11355a;color:white;border:none;border-radius:10px;font-weight:900;font-size:0.9rem;cursor:pointer;text-transform:uppercase;letter-spacing:0.05em;">🖨️ Imprimir Reporte SIGE</button>
        <button onclick="window.close()" style="padding:12px 24px;background:#f1f5f9;color:#475569;border:none;border-radius:10px;font-weight:700;font-size:0.9rem;cursor:pointer;">Cerrar</button>
    </div>

</div>
${printImmediately ? `<script>window.onload = () => { window.print(); setTimeout(() => window.close(), 1500); }<\/script>` : ''}
</body>
</html>
                `);
                printWindow.document.close();
            }
        } catch (err) {
            console.error(err);
            alert('Error al generar el reporte SIGE. Verifique la conexión.');
        }
    };


    const filteredSubjects = selectedCourse ? subjects.filter((s: any) => (s.courseId?._id || s.courseId) === selectedCourse) : [];


    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 min-h-screen pb-20 print:p-0 print:max-w-none">
            {/* Header Control */}
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-8 relative overflow-hidden group print:hidden">
                <div className="flex items-center gap-6 relative z-10">
                    <div className="p-5 bg-gradient-to-br from-[#11355a] to-blue-600 text-white rounded-[2.5rem] shadow-2xl transition-transform group-hover:rotate-3">
                        <BookOpen size={40} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-[#11355a] tracking-tighter uppercase leading-none">Mi Libro Digital</h1>
                        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mt-3 flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                            <ShieldCheck size={12} className="text-emerald-500" />
                            Ambiente Oficial • {tenant?.name || 'EinSmart'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto relative z-10">
                    <button onClick={() => setSidebarExpanded(!sidebarExpanded)}
                        className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm flex items-center gap-2 font-black text-[10px] uppercase">
                        {sidebarExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                        <span className="hidden sm:inline">{sidebarExpanded ? 'Contraer' : 'Expandir'}</span>
                    </button>
                    <div className="flex-1 lg:w-60">
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Curso / Nivel</label>
                        <select className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-black text-slate-700 transition-all shadow-sm text-xs"
                            value={selectedCourse} onChange={e => { setSelectedCourse(e.target.value); setSelectedSubject(''); }}>
                            <option value="">-- CURSO --</option>
                            {(Array.isArray(courses) ? courses : []).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 lg:w-60">
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Asignatura</label>
                        <select className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-black text-slate-700 disabled:opacity-50 transition-all shadow-sm text-xs"
                            value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} disabled={!selectedCourse}>
                            <option value="">-- SELECCIONAR --</option>
                            {(Array.isArray(filteredSubjects) ? filteredSubjects : []).map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Layout Wrapper */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className={`${sidebarExpanded ? 'lg:w-72' : 'lg:w-20'} shrink-0 space-y-3 print:hidden transition-all duration-300`}>
                    {[
                        { id: 'ficha', label: 'Ficha Estudiantes', icon: GraduationCap },
                        { id: 'asistencia', label: 'Lista Digital', icon: UserCheck },
                        { id: 'atrasos', label: 'Atrasos', icon: Clock },
                        { id: 'leccionario', label: 'Leccionario', icon: List },
                        { id: 'notas', label: 'Calificaciones', icon: ClipboardList },
                        { id: 'citaciones', label: 'Citaciones', icon: Calendar },
                        { id: 'anotaciones', label: 'Anotaciones', icon: FileText }
                    ].map((tab: any) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                            title={tab.label}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all
                            ${activeTab === tab.id ? 'bg-[#11355a] text-white shadow-xl -translate-x-1' : 'bg-white text-slate-400 border border-slate-100 shadow-sm hover:border-blue-200'}`}>
                            <tab.icon size={20} className={activeTab === tab.id ? 'text-blue-400' : 'text-slate-300'} />
                            {sidebarExpanded && <span>{tab.label}</span>}
                        </button>
                    ))}

                    <div className="mt-10 p-8 bg-gradient-to-br from-blue-900 to-[#11355a] rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <h4 className="text-xs font-black uppercase tracking-widest mb-2">Reporte SIGE</h4>
                            <p className="text-[9px] text-blue-200 mb-6 font-bold uppercase leading-relaxed">Genera documentos legales para subvención escolar.</p>
                            <button onClick={() => handlePrint()} className="w-full py-4 bg-white text-[#11355a] rounded-2xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2">
                                <Printer size={16} /> Exportar Libro PDF
                            </button>
                        </div>
                        <Printer size={80} className="absolute -bottom-4 -right-4 text-white/5 group-hover:rotate-12 transition-transform" />
                    </div>
                </div>

                {/* Main Content Area */}
                <div ref={printRef} className="flex-1 animate-in fade-in slide-in-from-right-10 duration-700">
                    {!selectedCourse ? (
                        <div className="bg-white rounded-[4rem] p-40 text-center border-4 border-dashed border-slate-100">
                            <LayoutGrid size={80} className="mx-auto text-slate-100 mb-8" />
                            <h2 className="text-3xl font-black text-slate-300 uppercase tracking-tighter">Seleccione un Curso</h2>
                            <p className="text-slate-300 font-bold uppercase tracking-[0.3em] text-[10px] mt-6">Cargando base de datos segura...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* TAB CONTEXT: FICHA DE VIDA */}
                            {activeTab === 'ficha' && (
                                <div className="space-y-6">
                                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                                        <h3 className="text-xl font-black text-[#11355a] tracking-tighter uppercase">Ficha Estudiantes</h3>
                                        <div className="relative w-full md:w-96">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Buscar por nombre o RUT..."
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                className="w-full pl-12 pr-6 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none font-bold text-slate-700 transition-all text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {(Array.isArray(students) ? students : []).filter(s =>
                                            s.nombres?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            s.apellidos?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            s.rut?.includes(searchQuery)
                                        ).map((s: any) => (
                                            <div key={s._id} className="bg-white p-6 rounded-2xl shadow-lg border border-slate-50 relative group hover:border-blue-300 transition-all">
                                                <div className="flex gap-4">
                                                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                                        {(s.fotoUrl || s.photoUrl) ? (
                                                            <img src={s.fotoUrl || s.photoUrl} alt="Foto Alumno" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-xl font-black text-slate-300 uppercase">{s.nombres[0]}{s.apellidos[0]}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-black text-[#11355a] text-sm uppercase leading-tight mb-1">{s.apellidos}, {s.nombres}</h4>
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-[10px]">
                                                                <span className="text-slate-400 font-bold uppercase">RUT</span>
                                                                <span className="text-slate-700 font-black">{s.rut || 'No Reg.'}</span>
                                                            </div>
                                                            <div className="flex justify-between text-[10px]">
                                                                <span className="text-slate-400 font-bold uppercase">Edad</span>
                                                                <span className="text-slate-700 font-black">{s.fechaNacimiento ? new Date().getFullYear() - new Date(s.fechaNacimiento).getFullYear() : '--'} Años</span>
                                                            </div>
                                                            <div className="flex justify-between text-[10px]">
                                                                <span className="text-slate-400 font-bold uppercase">Salud</span>
                                                                <span className="text-slate-700 font-black">{typeof s.salud === 'object' ? (s.salud?.seguro || 'Sin Registro') : (s.salud || 'Sin Registro')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-slate-50 flex gap-2">
                                                    <button
                                                        onClick={() => handleShowStudentDetail(s)}
                                                        className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all"
                                                    >
                                                        HOJA DE VIDA
                                                    </button>
                                                    <button className="p-2 border border-slate-100 text-slate-400 rounded-lg hover:text-blue-500 transition-colors">
                                                        <UserPlus size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'asistencia' && (
                                <div className="space-y-8">
                                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-black text-[#11355a] tracking-tighter uppercase">Pase de Lista Digital</h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Sincronización SIGE</span>
                                                <span className="text-slate-400 font-bold text-[10px]">Registro Obligatorio por Bloque</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
                                            <div className="flex bg-slate-50 p-1 rounded-2xl border-2 border-slate-100">
                                                <button
                                                    onClick={() => setAttendanceViewMode('grid')}
                                                    className={`p-3 rounded-xl transition-all ${attendanceViewMode === 'grid' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                    title="Vista Cuadrícula"
                                                >
                                                    <LayoutGrid size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setAttendanceViewMode('list')}
                                                    className={`p-3 rounded-xl transition-all ${attendanceViewMode === 'list' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                    title="Vista Lista"
                                                >
                                                    <List size={18} />
                                                </button>
                                            </div>
                                            <select
                                                value={selectedBlock}
                                                onChange={e => setSelectedBlock(e.target.value)}
                                                className="bg-slate-50 px-6 py-4 rounded-2xl border-2 border-slate-100 font-black text-slate-700 text-xs outline-none focus:border-blue-500"
                                            >
                                                <option>Bloque 1</option>
                                                <option>Bloque 2</option>
                                                <option>Bloque 3</option>
                                                <option>Bloque 4</option>
                                            </select>
                                            <div className="flex items-center gap-4 bg-slate-50 px-6 py-4 rounded-2xl border-2 border-slate-100">
                                                <Calendar size={18} className="text-slate-300" />
                                                <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="bg-transparent font-black text-slate-700 text-xs outline-none" />
                                            </div>
                                            <button onClick={handleSaveAttendance} className="flex-1 xl:flex-none bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:scale-[1.02] transition-all">TERMINAR PASE LISTA</button>
                                        </div>
                                    </div>

                                    {attendanceViewMode === 'grid' ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                            {students.map((s: any) => (
                                                <div key={s._id} className={`bg-white rounded-[3rem] p-6 shadow-xl border-4 transition-all relative overflow-hidden flex flex-col items-center text-center
                                                ${attendanceMap[s._id] === 'ausente' ? 'border-rose-100 bg-rose-50/10' :
                                                        attendanceMap[s._id] === 'atraso' ? 'border-amber-100 bg-amber-50/10' :
                                                            'border-slate-50 hover:border-blue-200'}`}>

                                                    <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6 relative group cursor-pointer"
                                                        onClick={() => setAttendanceMap({ ...attendanceMap, [s._id]: attendanceMap[s._id] === 'presente' ? 'ausente' : 'presente' })}>
                                                        <div className="text-2xl font-black text-slate-300 uppercase">{s.nombres[0]}{s.apellidos[0]}</div>
                                                        {attendanceMap[s._id] === 'presente' && <div className="absolute inset-0 bg-emerald-500/10 rounded-full flex items-center justify-center ring-4 ring-emerald-500/20"><UserCheck size={40} className="text-emerald-500" /></div>}
                                                        {attendanceMap[s._id] === 'ausente' && <div className="absolute inset-0 bg-rose-500/10 rounded-full flex items-center justify-center ring-4 ring-rose-500/30"><X size={40} className="text-rose-500" /></div>}
                                                    </div>

                                                    <h4 className="text-xs font-black text-[#11355a] uppercase tracking-tight mb-2 line-clamp-1">{s.apellidos}, {s.nombres}</h4>

                                                    <div className="flex gap-1 w-full mt-4">
                                                        {[
                                                            { id: 'presente', label: 'P', color: 'emerald' },
                                                            { id: 'ausente', label: 'A', color: 'rose' },
                                                            { id: 'atraso', label: 'T', color: 'amber' },
                                                            { id: 'retiro_anticipado', label: 'R', color: 'indigo' }
                                                        ].map(status => (
                                                            <button
                                                                key={status.id}
                                                                onClick={() => setAttendanceMap({ ...attendanceMap, [s._id]: status.id })}
                                                                className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase transition-all
                                                            ${attendanceMap[s._id] === status.id
                                                                        ? `bg-${status.color}-600 text-white shadow-lg`
                                                                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                                            >
                                                                {status.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-3 bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
                                            {students.map((s: any) => (
                                                <div key={s._id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${attendanceMap[s._id] === 'ausente' ? 'bg-rose-50/30 border-rose-100' : 'bg-white border-slate-50 hover:border-blue-100'}`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs">
                                                            {s.nombres[0]}{s.apellidos[0]}
                                                        </div>
                                                        <span className="font-bold text-slate-700 text-sm uppercase">{s.apellidos}, {s.nombres}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {[
                                                            { id: 'presente', label: 'Presente', color: 'emerald' },
                                                            { id: 'ausente', label: 'Ausente', color: 'rose' },
                                                            { id: 'atraso', label: 'Atrasado', color: 'amber' },
                                                            { id: 'retiro_anticipado', label: 'Retirado', color: 'indigo' }
                                                        ].map(status => (
                                                            <button
                                                                key={status.id}
                                                                onClick={() => setAttendanceMap({ ...attendanceMap, [s._id]: status.id })}
                                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all
                                                                ${attendanceMap[s._id] === status.id
                                                                        ? `bg-${status.color}-500 text-white shadow-lg`
                                                                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                                            >
                                                                {status.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB CONTEXT: ATRASOS */}
                            {activeTab === 'atrasos' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
                                    <div className="lg:col-span-1 bg-white rounded-[3rem] shadow-xl border border-slate-100 p-10 space-y-8 self-start">
                                        <div>
                                            <h2 className="text-2xl font-black text-[#11355a] uppercase tracking-tighter flex items-center gap-3">
                                                <Clock size={28} className="text-rose-600" /> Control de Atrasos
                                            </h2>
                                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Gestión de puntualidad reglamentaria</p>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Seleccionar Estudiante</label>
                                            <div className="relative">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                                <select 
                                                    className="w-full pl-12 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xs outline-none focus:border-rose-500 transition-all appearance-none"
                                                    onChange={e => {
                                                        const student = students.find(s => s._id === e.target.value);
                                                        if (student) handleAddTardiness(student);
                                                    }}
                                                >
                                                    <option value="">-- Buscar Alumno --</option>
                                                    {students.sort((a,b) => a.apellidos.localeCompare(b.apellidos)).map(s => (
                                                        <option key={s._id} value={s._id}>{s.apellidos}, {s.nombres}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 text-rose-700">
                                            <div className="flex items-center gap-2 mb-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest">Información Administrativa</label>
                                            </div>
                                            <p className="text-[10px] font-bold leading-relaxed">
                                                Los atrasos registrados impactan automáticamente en el informe legal de asistencia mensual y se notifican al apoderado vía app.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-2 space-y-4">
                                        {tardinessLoading ? (
                                            <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div></div>
                                        ) : tardinessLogs.length === 0 ? (
                                            <div className="bg-white rounded-[3rem] p-32 text-center border-4 border-dashed border-slate-100">
                                                <Clock size={60} className="mx-auto text-slate-100 mb-6" />
                                                <p className="text-slate-300 font-black uppercase text-xs tracking-[0.2em]">Sin atrasos registrados hoy</p>
                                            </div>
                                        ) : (
                                            tardinessLogs.map(t => (
                                                <div key={t._id} className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-50 flex items-center justify-between hover:scale-[1.01] transition-all group">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-16 h-16 rounded-2xl bg-rose-50 flex flex-col items-center justify-center border border-rose-100">
                                                            <span className="text-xl font-black text-rose-600 leading-none">{t.minutosAtraso}</span>
                                                            <span className="text-[8px] font-black text-rose-400 uppercase">Min</span>
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-[#11355a] text-sm uppercase">{t.estudianteId?.apellidos}, {t.estudianteId?.nombres}</div>
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase mt-1 flex items-center gap-2">
                                                                <span className="bg-slate-100 px-2 py-0.5 rounded-md">{t.bloque}</span>
                                                                <span>•</span>
                                                                <span>{new Date(t.fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} hrs</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleDeleteTardiness(t._id)}
                                                        className="p-4 text-slate-200 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB CONTEXT: LECCIONARIO */}
                            {activeTab === 'leccionario' && (
                                <div className="space-y-8">
                                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 px-4">
                                        <h2 className="text-2xl font-black text-[#11355a] uppercase tracking-tighter">Leccionario Digital (Firmado)</h2>
                                        
                                        <div className="flex flex-wrap items-center gap-4">
                                            {/* MANUAL TIMER CONTROLS */}
                                            <div className="flex bg-slate-50 p-2 rounded-2xl border-2 border-slate-100 items-center gap-2">
                                                {!isTimerRunning ? (
                                                    <button 
                                                        onClick={() => { setIsTimerRunning(true); setIsTimerPaused(false); }}
                                                        className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2"
                                                    >
                                                        <Clock size={16} /> Iniciar Clase
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button 
                                                            onClick={() => setIsTimerPaused(!isTimerPaused)}
                                                            className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isTimerPaused ? 'bg-amber-500 text-white shadow-amber-900/20' : 'bg-slate-200 text-slate-600'} hover:scale-105`}
                                                        >
                                                            {isTimerPaused ? 'Reanudar' : 'Pausar'}
                                                        </button>
                                                        <button 
                                                            onClick={() => { setIsTimerRunning(false); setIsTimerPaused(false); setEffectiveDuration(0); }}
                                                            className="px-6 py-2 bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all"
                                                        >
                                                            Reset
                                                        </button>
                                                    </>
                                                )}
                                                
                                                <div className="px-4 py-2 border-l-2 border-slate-200">
                                                    <div className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Aula Efectiva</div>
                                                    <div className={`text-lg font-black tabular-nums ${isTimerRunning && !isTimerPaused ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`}>
                                                        {Math.floor(effectiveDuration / 60)}m {effectiveDuration % 60}s
                                                    </div>
                                                </div>
                                            </div>

                                            <button onClick={() => setShowLogForm(true)} disabled={!selectedSubject}
                                                className="bg-[#11355a] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl disabled:opacity-50">NUEVA FIRMA DE CLASE</button>
                                        </div>
                                    </div>

                                    {showLogForm && (
                                        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-blue-50 space-y-6 animate-in slide-in-from-top-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Registro de Actividad Pedagógica</h3>
                                                <button onClick={() => setShowLogForm(false)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={32} /></button>
                                            </div>
                                            <form onSubmit={handleSaveLog} className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</label>
                                                        <input type="date" value={logFormData.date} onChange={e => setLogFormData({ ...logFormData, date: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contenido / OA</label>
                                                        <input required value={logFormData.topic} onChange={e => setLogFormData({ ...logFormData, topic: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" placeholder="Ej: OA 04 - Ecuaciones Lineales" />
                                                    </div>
                                                </div>
                                                <textarea rows={3} required value={logFormData.activities} onChange={e => setLogFormData({ ...logFormData, activities: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold resize-none" placeholder="Actividades realizadas..." />
                                                <div className="flex items-center gap-4 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                                                    <input type="checkbox" id="attConf" className="w-6 h-6 rounded-lg accent-blue-600" checked={attendanceConfirmed} onChange={e => setAttendanceConfirmed(e.target.checked)} />
                                                    <label htmlFor="attConf" className="text-sm font-black text-blue-900 italic">Doy fe de que se ha pasado la asistencia en este bloque horario.</label>
                                                </div>
                                                <button type="submit" className="w-full py-6 bg-emerald-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 hover:scale-[1.02] transition-all">FIRMAR Y CERRAR REGISTRO</button>
                                            </form>
                                        </div>
                                    )}

                                    <div className="grid gap-6">
                                        {logs.map(log => (
                                            <div key={log._id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 group hover:border-blue-300 transition-all flex flex-col md:flex-row gap-8 relative overflow-hidden">
                                                {log.isSigned && <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full flex items-end justify-start p-8"><ShieldCheck size={40} className="text-emerald-500/20" /></div>}
                                                <div className="md:w-32 py-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-center flex flex-col items-center justify-center">
                                                    <div className="text-3xl font-black text-[#11355a] leading-none mb-1">{new Date(log.date).getUTCDate()}</div>
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(log.date).toLocaleString('es-CL', { month: 'short', timeZone: 'UTC' }).toUpperCase()}</div>
                                                </div>
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 ${log.isSigned ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                            {log.isSigned ? <ShieldCheck size={12} /> : <AlertCircle size={12} />} {log.isSigned ? 'Firma Digital Válida' : 'Pendiente de Firma'}
                                                        </span>
                                                        {log.isSigned && <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Sello: {log.signatureMetadata?.signedAt ? new Date(log.signatureMetadata.signedAt).toLocaleString() : 'Verificado'}</span>}
                                                    </div>
                                                    <h4 className="text-xl font-black text-[#11355a] tracking-tight">{log.topic}</h4>
                                                    <p className="text-sm font-bold text-slate-500 italic line-clamp-2 leading-relaxed">{log.activities}</p>

                                                    {!log.isSigned && (
                                                        <div className="pt-4 flex gap-2">
                                                            <button
                                                                onClick={() => { setSigningLogId(log._id); setShowSignatureModal(true); }}
                                                                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-blue-900/20"
                                                            >
                                                                FIRMAR AHORA
                                                            </button>
                                                            <button className="px-6 py-2 bg-slate-50 text-slate-400 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-100 transition-all">Editar</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {logs.length === 0 && <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 text-slate-300 font-bold uppercase text-xs tracking-widest">No hay registros aún para este curso.</div>}
                                    </div>
                                </div>
                            )}

                            {/* TAB CONTEXT: NOTAS (BULK MATRIX) */}
                            {activeTab === 'notas' && (
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-black text-[#11355a] tracking-tighter uppercase">Matriz de Calificaciones Global</h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Decreto 67</span>
                                                <span className="text-slate-400 font-bold text-[10px]">Ingreso de Alto Rendimiento • Máx 8 Columnas</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 w-full xl:w-auto">
                                            <button 
                                                onClick={() => setShowEvaluationModal(true)}
                                                disabled={!selectedSubject}
                                                className="flex-1 xl:flex-none bg-[#11355a] text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                                            >
                                                <UserPlus size={20}/>
                                                NUEVA EVALUACIÓN
                                            </button>
                                            <button 
                                                onClick={handleBulkGradeSave}
                                                disabled={isSavingMatrix || !selectedSubject}
                                                className="flex-1 xl:flex-none bg-emerald-600 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                                            >
                                                {isSavingMatrix ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div> : <Save size={20}/>}
                                                GUARDAR CAMBIOS MATRIZ
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
                                        {!selectedSubject ? (
                                            <div className="p-40 text-center space-y-6">
                                                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-200">
                                                    <ClipboardList size={40} />
                                                </div>
                                                <h3 className="text-xl font-black text-slate-300 uppercase tracking-tight">Seleccione una Asignatura para calificar</h3>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-50/50">
                                                            <th className="p-2 border-b text-[9px] font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-slate-50/80 backdrop-blur-md z-10 w-44 shadow-[10px_0_15px_-15px_rgba(0,0,0,0.1)]">Alumno</th>
                                                            <th className="p-2 border-b text-center min-w-[60px] bg-blue-50/50 text-[9px] font-black text-blue-600 uppercase">PROM.</th>
                                                            {/* Render real evaluations first */}
                                                            {evaluations.slice(0, 8).map(ev => (
                                                                <th key={ev._id} className="p-2 border-b text-center min-w-[72px] group transition-all hover:bg-slate-100/50">
                                                                    <div className="text-[9px] font-black text-[#11355a] uppercase tracking-tight truncate max-w-[60px] mx-auto mb-0.5" title={ev.title}>{ev.title}</div>
                                                                    <div className="text-[7px] font-bold text-slate-300 uppercase">{new Date(ev.date).toLocaleDateString()}</div>
                                                                    <div className="text-[7px] font-black text-blue-500">{ev.weight}%</div>
                                                                </th>
                                                            ))}
                                                            {/* Render virtual slots for the remainder up to 8 */}
                                                            {Array.from({length: Math.max(0, 8 - evaluations.length)}).map((_, i) => {
                                                                const virtualId = `virtual_${evaluations.length + i + 1}`;
                                                                return (
                                                                    <th key={virtualId} className="p-2 border-b text-center min-w-[72px] bg-slate-50/30 group">
                                                                        <div className="text-[9px] font-black text-slate-300 uppercase italic">N{evaluations.length + i + 1}</div>
                                                                        <div className="text-[7px] font-bold text-slate-200 uppercase mt-0.5">Vacío</div>
                                                                    </th>
                                                                );
                                                            })}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {students.sort((a,b) => a.apellidos.localeCompare(b.apellidos)).map(student => (
                                                            <tr key={student._id} className="hover:bg-blue-50/20 transition-all group">
                                                                <td className="p-1 font-black text-[#11355a] text-[10px] uppercase sticky left-0 bg-white group-hover:bg-blue-50/20 z-10 shadow-[10px_0_15px_-15px_rgba(0,0,0,0.05)]">
                                                                    <div className="truncate w-40 px-1">{student.apellidos}, {student.nombres}</div>
                                                                </td>
                                                                <td className="p-1 text-center bg-blue-50/20">
                                                                    {(() => {
                                                                        const studentGrades = Object.values(gradeMatrix[student._id] || {});
                                                                        const numericGrades = studentGrades.map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
                                                                        if (numericGrades.length === 0) return <span className="text-slate-300 font-bold">--</span>;
                                                                        const avg = numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length;
                                                                        return (
                                                                            <span className={`text-sm font-black ${avg >= 4.0 ? 'text-blue-600' : 'text-rose-600'}`}>
                                                                                {avg.toFixed(1)}
                                                                            </span>
                                                                        );
                                                                    })()}
                                                                </td>
                                                                {/* Real Evaluations Inputs */}
                                                                {evaluations.slice(0, 8).map(ev => (
                                                                    <td key={ev._id} className="p-1 text-center">
                                                                        <input 
                                                                            type="number" 
                                                                            min="1" max="7" step="0.1"
                                                                            placeholder="--"
                                                                            className={`w-12 h-9 text-center rounded-lg border-2 font-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                                                                                parseFloat(gradeMatrix[student._id]?.[ev._id] || '0') >= 4 ? 'bg-emerald-50 border-emerald-100 text-emerald-700 focus:border-emerald-500' : 
                                                                                parseFloat(gradeMatrix[student._id]?.[ev._id] || '0') > 0 ? 'bg-rose-50 border-rose-100 text-rose-600 focus:border-rose-500' :
                                                                                'bg-white border-slate-100 text-slate-300 focus:bg-white focus:border-blue-300 focus:text-blue-600'
                                                                            }`}
                                                                            value={gradeMatrix[student._id]?.[ev._id] || ''}
                                                                            onChange={e => setGradeMatrix({
                                                                                ...gradeMatrix,
                                                                                [student._id]: {
                                                                                    ...(gradeMatrix[student._id] || {}),
                                                                                    [ev._id]: e.target.value
                                                                                }
                                                                            })}
                                                                        />
                                                                    </td>
                                                                ))}
                                                                {/* Virtual Slots Inputs */}
                                                                {Array.from({length: Math.max(0, 8 - evaluations.length)}).map((_, i) => {
                                                                    const virtualKey = `virtual_${evaluations.length + i + 1}`;
                                                                    const val = gradeMatrix[student._id]?.[virtualKey] || '';
                                                                    return (
                                                                        <td key={virtualKey} className="p-1 text-center bg-slate-50/10">
                                                                            <input 
                                                                                type="number" 
                                                                                min="1" max="7" step="0.1"
                                                                                placeholder="..."
                                                                                className={`w-12 h-9 text-center rounded-lg border-2 border-dashed font-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                                                                                    parseFloat(val) >= 4 ? 'bg-emerald-50/50 border-emerald-200 text-emerald-700' : 
                                                                                    parseFloat(val) > 0 ? 'bg-rose-50/50 border-rose-200 text-rose-600' :
                                                                                    'bg-transparent border-slate-200 text-slate-400 focus:bg-white focus:border-blue-300 focus:border-solid'
                                                                                }`}
                                                                                value={val}
                                                                                onChange={e => setGradeMatrix({
                                                                                    ...gradeMatrix,
                                                                                    [student._id]: {
                                                                                        ...(gradeMatrix[student._id] || {}),
                                                                                        [virtualKey]: e.target.value
                                                                                    }
                                                                                })}
                                                                            />
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB CONTEXT: CITACIONES */}
                            {activeTab === 'citaciones' && (
                                <div className="space-y-8">
                                    <div className="flex justify-between items-center px-4">
                                        <h2 className="text-2xl font-black text-[#11355a] uppercase tracking-tighter">Citaciones y Reuniones</h2>
                                        <button onClick={() => setShowCitacionModal(true)} className="bg-[#11355a] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all">CREAR CITACIÓN</button>
                                    </div>

                                    <div className="grid gap-6">
                                        {(Array.isArray(citaciones) ? citaciones : []).map((c: any) => (
                                            <div key={c._id} className="p-8 bg-white border-2 border-slate-100 rounded-[3rem] shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group animate-in slide-in-from-bottom-5">
                                                <div className="flex items-center gap-6 mb-6">
                                                    <div className="p-4 bg-amber-50 text-amber-500 rounded-2xl group-hover:scale-110 transition-transform">
                                                        <Calendar size={32} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${c.estado === 'confirmada' ? 'bg-emerald-50 text-emerald-600' :
                                                                c.estado === 'realizada' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'
                                                                }`}>{c.estado}</span>
                                                            <span className="px-3 py-1 bg-blue-50 text-blue-400 rounded-full text-[8px] font-black uppercase tracking-widest">{c.modalidad}</span>
                                                        </div>
                                                        <h4 className="text-sm font-black text-[#11355a] uppercase leading-none">{c.estudianteId?.nombres} {c.estudianteId?.apellidos}</h4>
                                                        <p className="text-[10px] text-slate-400 font-bold mt-1 italic leading-tight capitalize">{c.motivo}</p>
                                                        <div className="mt-2 space-y-0.5">
                                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                                                                Profesor: <span className="text-blue-600">{c.profesorId?.name || 'No asignado'}</span>
                                                            </p>
                                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                                                                Apoderado: <span className="text-[#11355a]">{c.apoderadoId?.nombre} {c.apoderadoId?.apellidos}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xl font-black text-[#11355a] tracking-tighter">{new Date(c.fecha).toLocaleDateString()}</div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.hora} hrs</div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all"><X size={18} /></button>
                                                    <button onClick={() => openActaModal(c)} className="px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Ver Acta</button>
                                                </div>
                                            </div>
                                        ))}
                                        {citaciones.length === 0 && (
                                            <div className="bg-white p-20 rounded-[4rem] border-4 border-dashed border-slate-100 text-center">
                                                <Calendar size={60} className="mx-auto text-slate-100 mb-8" />
                                                <h3 className="text-2xl font-black text-slate-300 uppercase tracking-tighter">Gestión de Agenda</h3>
                                                <p className="text-slate-300 font-bold uppercase tracking-[0.3em] text-[10px] mt-4">No hay citaciones programadas para este curso.</p>
                                            </div>
                                        )}
                                    </div>

                                    {showCitacionModal && (
                                        <div className="fixed inset-0 bg-[#11355a]/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
                                            <div className="bg-white rounded-[4rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 p-12 border-b-[16px] border-amber-500">
                                                <div className="flex justify-between items-center mb-10">
                                                    <h2 className="text-3xl font-black text-[#11355a] uppercase tracking-tighter">Nueva Citación</h2>
                                                    <button onClick={() => setShowCitacionModal(false)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={40} /></button>
                                                </div>

                                                <form onSubmit={handleSaveCitacion} className="space-y-8">
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudiante</label>
                                                            <select required value={citacionFormData.estudianteId} onChange={e => setCitacionFormData({ ...citacionFormData, estudianteId: e.target.value })} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold">
                                                                <option value="">Seleccionar Alumno</option>
                                                                {(Array.isArray(students) ? students : []).map(s => <option key={s._id} value={s._id}>{s.apellidos}, {s.nombres}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Modalidad</label>
                                                            <select required value={citacionFormData.modalidad} onChange={e => setCitacionFormData({ ...citacionFormData, modalidad: e.target.value })} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold">
                                                                <option value="presencial">Presencial</option>
                                                                <option value="online">Virtual / Meet</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</label>
                                                            <input required type="date" value={citacionFormData.fecha} onChange={e => setCitacionFormData({ ...citacionFormData, fecha: e.target.value })} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hora</label>
                                                            <input required type="time" value={citacionFormData.hora} onChange={e => setCitacionFormData({ ...citacionFormData, hora: e.target.value })} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo de la Reunión</label>
                                                        <textarea required value={citacionFormData.motivo} onChange={e => setCitacionFormData({ ...citacionFormData, motivo: e.target.value })} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold resize-none" rows={3} placeholder="Describa el objetivo de la entrevista..."></textarea>
                                                    </div>
                                                    <button type="submit" className="w-full py-6 bg-amber-500 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-amber-500/20 hover:scale-[1.02] transition-all">PROGRAMAR CITACIÓN Y NOTIFICAR</button>
                                                </form>
                                            </div>
                                        </div>
                                    )}

                                    {showActaModal && selectedCitacion && (
                                        <div className="fixed inset-0 bg-[#11355a]/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
                                            <div className="bg-white rounded-[4rem] w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col border-b-[16px] border-blue-600">
                                                <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                                    <div>
                                                        <h2 className="text-3xl font-black text-[#11355a] uppercase tracking-tighter">Acta de Reunión</h2>
                                                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
                                                            Estudiante: {selectedCitacion.estudianteId?.apellidos}, {selectedCitacion.estudianteId?.nombres}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <button type="button" onClick={() => handlePrintActa()} className="p-4 bg-[#11355a] text-white rounded-2xl hover:scale-110 shadow-lg transition-all">
                                                            <Printer size={24} />
                                                        </button>
                                                        <button type="button" onClick={() => setShowActaModal(false)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                                            <X size={40} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <form onSubmit={handleSaveActa} className="p-10 overflow-y-auto custom-scrollbar space-y-8 flex-1">
                                                    <div className="grid grid-cols-2 gap-8">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado de la Citación</label>
                                                            <select value={actaFormData.estado} onChange={e => setActaFormData({ ...actaFormData, estado: e.target.value })} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold">
                                                                <option value="programada">Programada</option>
                                                                <option value="confirmada">Confirmada</option>
                                                                <option value="realizada">Realizada</option>
                                                                <option value="cancelada">Cancelada</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Asistencia del Apoderado</label>
                                                            <div className="flex gap-4">
                                                                <button type="button" onClick={() => setActaFormData({ ...actaFormData, asistioApoderado: true })} className={`flex-1 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest border-2 transition-all ${actaFormData.asistioApoderado ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>SÍ ASISTIÓ</button>
                                                                <button type="button" onClick={() => setActaFormData({ ...actaFormData, asistioApoderado: false })} className={`flex-1 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest border-2 transition-all ${!actaFormData.asistioApoderado ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>NO ASISTIÓ</button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Desarrollo de la Entrevista (Minuta)</label>
                                                        <textarea value={actaFormData.actaReunion} onChange={e => setActaFormData({ ...actaFormData, actaReunion: e.target.value })} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold resize-none" rows={4} placeholder="Escriba los puntos tratados..."></textarea>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-8">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Acuerdos y Compromisos</label>
                                                            <textarea value={actaFormData.acuerdo} onChange={e => setActaFormData({ ...actaFormData, acuerdo: e.target.value })} className="w-full px-8 py-5 bg-emerald-50 border-2 border-emerald-100 rounded-3xl font-bold resize-none" rows={3} placeholder="¿A qué se comprometió el apoderado/escuela?"></textarea>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Resolución / Resultado</label>
                                                            <textarea value={actaFormData.resultado} onChange={e => setActaFormData({ ...actaFormData, resultado: e.target.value })} className="w-full px-8 py-5 bg-blue-50 border-2 border-blue-100 rounded-3xl font-bold resize-none" rows={3} placeholder="Resultado final de la reunión..."></textarea>
                                                        </div>
                                                    </div>

                                                    <button type="submit" className="w-full py-6 bg-[#11355a] text-white rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-xl hover:scale-[1.02] transition-all">
                                                        GUARDAR CAMBIOS EN EL ACTA
                                                    </button>
                                                </form>

                                                {/* Printable Template (Hidden) */}
                                                <div className="hidden">
                                                    <div ref={actaPrintRef} className="p-20 text-slate-900 bg-white min-h-[1000px]">
                                                        <div className="flex justify-between items-start border-b-4 border-[#11355a] pb-10 mb-10">
                                                            <div className="flex items-center gap-6">
                                                                {tenant?.theme?.logoUrl && (
                                                                    <img src={tenant.theme.logoUrl} alt="Logo" className="w-24 h-24 object-contain" />
                                                                )}
                                                                <div>
                                                                    <h1 className="text-4xl font-black uppercase tracking-tighter text-[#11355a]">ACTA DE REUNIÓN</h1>
                                                                    <p className="text-lg font-bold text-slate-500 uppercase tracking-widest">SISTEMA ELECTRÓNICO EINSMART</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-2xl font-black uppercase">{tenant?.name || 'ESTABLECIMIENTO'}</div>
                                                                <div className="text-slate-400 font-bold uppercase text-xs">AÑO ESCOLAR {new Date().getFullYear()}</div>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-10 mb-10">
                                                            <div className="space-y-4">
                                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">DATOS DEL ESTUDIANTE</h3>
                                                                <div className="text-sm"><span className="font-black uppercase">ALUMNO:</span> {selectedCitacion.estudianteId?.nombres} {selectedCitacion.estudianteId?.apellidos}</div>
                                                                <div className="text-sm"><span className="font-black uppercase">CURSO:</span> {courses.find(c => c._id === selectedCourse)?.name || 'N/A'}</div>
                                                            </div>
                                                            <div className="space-y-4">
                                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">DETALLES DE LA CITA</h3>
                                                                <div className="text-sm"><span className="font-black uppercase">FECHA:</span> {new Date(selectedCitacion.fecha).toLocaleDateString()}</div>
                                                                <div className="text-sm"><span className="font-black uppercase">HORA:</span> {selectedCitacion.hora} hrs</div>
                                                                <div className="text-sm"><span className="font-black uppercase">MOTIVO:</span> {selectedCitacion.motivo}</div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-10">
                                                            <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">DESARROLLO DE LA ENTREVISTA</h3>
                                                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{actaFormData.actaReunion || 'No se registraron detalles del desarrollo.'}</p>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-10">
                                                                <div className="p-8 border-2 border-emerald-100 rounded-[2rem] bg-emerald-50/50">
                                                                    <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">ACUERDOS Y COMPROMISOS</h3>
                                                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{actaFormData.acuerdo || 'Sin acuerdos registrados.'}</p>
                                                                </div>
                                                                <div className="p-8 border-2 border-blue-100 rounded-[2rem] bg-blue-50/50">
                                                                    <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">RESULTADOS / RESOLUCIÓN</h3>
                                                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{actaFormData.resultado || 'Pendiente de resolución.'}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-32 grid grid-cols-2 gap-20 text-center">
                                                            <div className="border-t-2 border-slate-200 pt-8">
                                                                <div className="font-black uppercase text-xs mb-1">FIRMA RESPONSABLE COLEGIO</div>
                                                                <div className="text-[8px] text-slate-300 uppercase font-bold tracking-tighter">CERTIFICADO DIGITAL EINSMART ID-{selectedCitacion._id.slice(-8)}</div>
                                                            </div>
                                                            <div className="border-t-2 border-slate-200 pt-8">
                                                                <div className="font-black uppercase text-xs mb-1">FIRMA APODERADO / TUTOR</div>
                                                                <div className="text-[8px] text-slate-300 uppercase font-bold tracking-tighter">ASISTENCIA: {actaFormData.asistioApoderado ? 'SÍ ASISTIÓ' : 'NO ASISTIÓ'}</div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-20 text-center">
                                                            <p className="text-[8px] text-slate-300 font-black uppercase tracking-[0.5em]">DOCUMENTO OFICIAL GENERADO POR EINSMART • NO REQUIERE TIMBRE FÍSICO SI TIENE CÓDIGO DE VALIDACIÓN</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'anotaciones' && (
                                <div className="space-y-8">
                                    <div className="flex justify-between items-center px-4">
                                        <h2 className="text-2xl font-black text-[#11355a] uppercase tracking-tighter">Anotaciones del Curso</h2>
                                        <button onClick={() => setShowAnnotationModal(true)} className="bg-[#11355a] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all">NUEVA ANOTACIÓN</button>
                                    </div>

                                    <div className="grid gap-6">
                                        {(Array.isArray(annotations) ? annotations : []).map((a: any) => (
                                            <div key={a._id} className={`bg-white p-8 rounded-[2.5rem] shadow-xl border-l-[12px] flex flex-col md:flex-row gap-8 items-center group transition-all
                                                ${a.tipo === 'positiva' ? 'border-emerald-500' : a.tipo === 'negativa' ? 'border-rose-500' : 'border-blue-500'}`}>
                                                <div className={`w-20 h-20 rounded-full flex items-center justify-center
                                                    ${a.tipo === 'positiva' ? 'bg-emerald-50 text-emerald-500' : a.tipo === 'negativa' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                                                    <FileText size={32} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border
                                                            ${a.tipo === 'positiva' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                a.tipo === 'negativa' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                                    'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                            {a.tipo}
                                                        </span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase">
                                                            {a.estudianteId ? `${a.estudianteId.apellidos}, ${a.estudianteId.nombres}` : 'CURSO GENERAL'}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-lg font-black text-[#11355a] uppercase">{a.titulo}</h4>
                                                    <p className="text-xs font-bold text-slate-500 italic mt-1">{a.descripcion}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xl font-black text-[#11355a]">{new Date(a.fechaOcurrencia || a.createdAt).toLocaleDateString()}</div>
                                                    <div className="text-xs font-bold text-slate-400">Por: {a.creadoPor?.name || 'Sistema'}</div>
                                                </div>
                                            </div>
                                        ))}
                                        {annotations.length === 0 && (
                                            <div className="bg-white p-20 rounded-[4rem] border-4 border-dashed border-slate-100 text-center">
                                                <FileText size={60} className="mx-auto text-slate-100 mb-8" />
                                                <h3 className="text-2xl font-black text-slate-300 uppercase tracking-tighter">Hoja de Vida Digital</h3>
                                                <p className="text-slate-300 font-bold uppercase tracking-[0.3em] text-[10px] mt-4">No hay anotaciones registradas para este curso.</p>
                                            </div>
                                        )}
                                    </div>

                                    {showAnnotationModal && (
                                        <div className="fixed inset-0 bg-[#11355a]/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
                                            <div className="bg-white rounded-[4rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 p-12 border-b-[16px] border-blue-500">
                                                <div className="flex justify-between items-center mb-10">
                                                    <h2 className="text-3xl font-black text-[#11355a] uppercase tracking-tighter">Nueva Anotación</h2>
                                                    <button onClick={() => setShowAnnotationModal(false)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={40} /></button>
                                                </div>

                                                <form onSubmit={handleSaveAnnotation} className="space-y-8">
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudiante (Opcional)</label>
                                                            <select value={annotationFormData.estudianteId} onChange={e => setAnnotationFormData({ ...annotationFormData, estudianteId: e.target.value })} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold">
                                                                <option value="">-- TODO EL CURSO --</option>
                                                                {(Array.isArray(students) ? students : []).map(s => <option key={s._id} value={s._id}>{s.apellidos}, {s.nombres}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</label>
                                                            <select required value={annotationFormData.tipo} onChange={e => setAnnotationFormData({ ...annotationFormData, tipo: e.target.value })} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold">
                                                                <option value="positiva">Positiva</option>
                                                                <option value="negativa">Negativa</option>
                                                                <option value="general">Mensaje / General</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-2 col-span-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título / Asunto</label>
                                                            <input required type="text" value={annotationFormData.titulo} onChange={e => setAnnotationFormData({ ...annotationFormData, titulo: e.target.value })} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold" placeholder="Ej: Excelente participación en clase" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</label>
                                                        <textarea required value={annotationFormData.descripcion} onChange={e => setAnnotationFormData({ ...annotationFormData, descripcion: e.target.value })} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold resize-none" rows={3} placeholder="Detalle la observación..."></textarea>
                                                    </div>
                                                    <button type="submit" className="w-full py-6 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-all">REGISTRAR EN HOJA DE VIDA</button>
                                                </form>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>


                {/* Signature PIN Modal */}
                {
                    showSignatureModal && (
                        <div className="fixed inset-0 bg-[#11355a]/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
                            <div className="bg-white rounded-[3.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 p-10 text-center border-b-[12px] border-blue-600">
                                <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
                                    <ShieldCheck size={48} />
                                </div>
                                <h2 className="text-2xl font-black text-[#11355a] uppercase tracking-tighter mb-2">Firma Digital Avanzada</h2>
                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-10 leading-relaxed">
                                    Ingrese su PIN de seguridad docente para validar el cierre legal de este registro pedagógico.
                                </p>

                                <div className="space-y-6">
                                    <input
                                        type="password"
                                        maxLength={4}
                                        value={pin}
                                        onChange={e => setPin(e.target.value)}
                                        className="w-full text-center text-4xl tracking-[1em] font-black py-6 bg-slate-50 border-4 border-slate-100 rounded-[2rem] outline-none focus:border-blue-500 transition-all"
                                        placeholder="****"
                                    />
                                    <div className="flex gap-4">
                                        <button onClick={() => setShowSignatureModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                                        <button
                                            onClick={handleSignLog}
                                            disabled={pin.length < 4}
                                            className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/20 disabled:opacity-50"
                                        >
                                            RECONOCER Y FIRMAR
                                        </button>
                                    </div>
                                </div>
                                <p className="mt-8 text-[8px] font-black text-slate-300 uppercase tracking-tighter">Certificado Digital ID: LCD-CHILE-{tenant?._id?.slice(-8)}</p>
                            </div>
                        </div>
                    )
                }

                {/* Student Detail Modal */}
                {
                    showStudentDetailModal && selectedStudentForDetail && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                            <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
                                <div className="bg-[#11355a] p-8 text-white flex justify-between items-center shrink-0">
                                    <div>
                                        <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                                            <GraduationCap size={24} className="text-blue-300" />
                                            Ficha del Estudiante
                                        </h2>
                                        <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mt-1">Expediente Digital Completo</p>
                                    </div>
                                    <button onClick={() => setShowStudentDetailModal(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"><X size={24} /></button>
                                </div>

                                <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                                    {/* Personal Info */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Información Personal</h3>
                                        <div className="flex flex-col md:flex-row gap-6">
                                            {/* Foto */}
                                            <div className="shrink-0 flex justify-center">
                                                <div className="w-32 h-32 rounded-3xl bg-slate-50 border-4 border-slate-100 shadow-xl overflow-hidden flex justify-center items-center text-slate-300">
                                                    {selectedStudentForDetail.fotoUrl ? (
                                                        <img src={selectedStudentForDetail.fotoUrl} alt="Foto Estudiante" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-black text-5xl">
                                                            {selectedStudentForDetail.nombres?.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Info Grid */}
                                            <div className="grid grid-cols-2 gap-4 flex-1">
                                                <div className="p-4 bg-slate-50 rounded-2xl">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Nombre Completo</label>
                                                    <div className="text-sm font-black text-[#11355a]">{selectedStudentForDetail.nombres} {selectedStudentForDetail.apellidos}</div>
                                                </div>
                                                <div className="p-4 bg-slate-50 rounded-2xl">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase">RUT</label>
                                                    <div className="text-sm font-black text-[#11355a]">{selectedStudentForDetail.rut || 'No Registrado'}</div>
                                                </div>
                                                <div className="p-4 bg-slate-50 rounded-2xl">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Matrícula</label>
                                                    <div className="text-sm font-black text-[#11355a]">{selectedStudentForDetail.matricula || 'No Registrada'}</div>
                                                </div>
                                                <div className="p-4 bg-slate-50 rounded-2xl">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Email</label>
                                                    <div className="text-sm font-black text-[#11355a] truncate">{selectedStudentForDetail.email}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Apoderado Info */}
                                    {selectedStudentForDetail.guardian && (
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Datos del Apoderado</h3>
                                            <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-[#11355a] uppercase">{selectedStudentForDetail.guardian.nombre} {selectedStudentForDetail.guardian.apellidos}</span>
                                                    <span className="text-[10px] px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-black uppercase">{selectedStudentForDetail.guardian.parentesco || 'Apoderado'}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                                                    <div><span className="font-bold">Tel:</span> {selectedStudentForDetail.guardian.telefono}</div>
                                                    <div><span className="font-bold">Email:</span> {selectedStudentForDetail.guardian.correo}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Quick Stats Placeholder */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-4 bg-emerald-50 rounded-2xl text-center border border-emerald-100">
                                            <div className="text-2xl font-black text-emerald-600">
                                                {studentPerformance ? `${studentPerformance.passingStatus === 'Aprueba' ? '95%' : '70%'}` : '...'}
                                            </div>
                                            <div className="text-[8px] font-bold text-emerald-400 uppercase">Asistencia Est.</div>
                                        </div>
                                        <div className="p-4 bg-blue-50 rounded-2xl text-center border border-blue-100">
                                            <div className="text-2xl font-black text-blue-600">
                                                {studentPerformance?.overallAverage?.toFixed(1) || '--'}
                                            </div>
                                            <div className="text-[8px] font-bold text-blue-400 uppercase">Promedio Gral</div>
                                        </div>
                                        <div className="p-4 bg-amber-50 rounded-2xl text-center border border-amber-100">
                                            <div className="text-2xl font-black text-amber-600">
                                                {studentPerformance?.annotations ? (studentPerformance.annotations.positiva + studentPerformance.annotations.negativa) : '--'}
                                            </div>
                                            <div className="text-[8px] font-bold text-amber-400 uppercase">Anotaciones</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                                        <button onClick={() => handlePrintStudent(selectedStudentForDetail._id, true)} className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                                            <Printer size={18} /> Imprimir Ficha
                                        </button>
                                        <button onClick={() => handlePrintStudent(selectedStudentForDetail._id, false)} className="py-4 bg-blue-50 text-blue-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-100 transition-all flex items-center justify-center gap-2">
                                            <ExternalLink size={18} /> Ver Detalles Completos
                                        </button>
                                        <button onClick={() => setShowStudentDetailModal(false)} className="md:col-span-2 py-4 bg-[#11355a] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:scale-[1.01] transition-all">
                                            Cerrar Ficha
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>
            {showEvaluationModal && (
                <div className="fixed inset-0 bg-[#0a192f]/80 backdrop-blur-xl z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[3.5rem] p-12 shadow-2xl border border-white/20 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                        
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h3 className="text-3xl font-black text-[#11355a] tracking-tight uppercase">Nueva Evaluación</h3>
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 flex items-center gap-2">
                                    <ShieldCheck size={14} className="text-blue-500" /> Registro Oficial Legislativo
                                </p>
                            </div>
                            <button onClick={() => setShowEvaluationModal(false)} className="p-4 hover:bg-slate-50 rounded-2xl text-slate-300 hover:text-rose-500 transition-all">
                                <X size={28} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateEvaluation} className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Título de la Evaluación</label>
                                <input 
                                    required 
                                    className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold text-slate-700 focus:border-blue-500 focus:bg-white outline-none transition-all shadow-sm"
                                    placeholder="Ej: Prueba Parcial N°1"
                                    value={evaluationFormData.title}
                                    onChange={e => setEvaluationFormData({...evaluationFormData, title: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Fecha Aplicación</label>
                                    <input 
                                        type="date"
                                        required 
                                        className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold focus:border-blue-500 focus:bg-white outline-none transition-all"
                                        value={evaluationFormData.date}
                                        onChange={e => setEvaluationFormData({...evaluationFormData, date: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Ponderado (%)</label>
                                    <input 
                                        type="number"
                                        required
                                        min="1" max="100"
                                        className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold focus:border-blue-500 focus:bg-white outline-none transition-all"
                                        value={evaluationFormData.weight}
                                        onChange={e => setEvaluationFormData({...evaluationFormData, weight: parseInt(e.target.value)})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Descripción / Temario (Opcional)</label>
                                <textarea 
                                    rows={4}
                                    className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold focus:border-blue-500 focus:bg-white outline-none transition-all resize-none"
                                    placeholder="Contenidos que se evaluarán..."
                                    value={evaluationFormData.description}
                                    onChange={e => setEvaluationFormData({...evaluationFormData, description: e.target.value})}
                                />
                            </div>

                            <div className="pt-6">
                                <button type="submit" className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-900/30 hover:scale-[1.02] active:scale-95 transition-all">
                                    CREAR EVALUACIÓN E INICIAR REGISTRO
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnifiedClassBook;
