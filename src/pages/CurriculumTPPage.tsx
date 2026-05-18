import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    BookOpen, Target, ClipboardList, CheckCircle2, AlertTriangle, 
    ArrowRight, Sparkles, Printer, RefreshCw, BarChart3, Users, Lock
} from 'lucide-react';

const TP_CAREERS = [
    "Elaboracion Industrial de Alimentos",
    "Gastronomia Mencion Cocina",
    "Gastronomia Mencion Pasteleria y Reposteria",
    "Mecanica Automotriz",
    "Operaciones Portuarias",
    "Quimica Industrial Mencion Laboratorio Quimico"
];

const PREVIEW_MODULES: Record<string, string[]> = {
    "Elaboracion Industrial de Alimentos": [
        "Elaboración de alimentos de baja complejidad",
        "Higiene para la elaboración de alimentos",
        "Almacenaje y bodega de alimentos e insumos",
        "Recepción de materias primas",
        "Aseguramiento de la calidad de procesos y alimentos",
        "Envasado y embalaje de alimentos",
        "Operaciones de transferencia de calor",
        "Control fisicoquímico y microbiológico de alimentos",
        "Gestión del agua y residuos en la industria",
        "Emprendimiento y empleabilidad"
    ],
    "Gastronomia Mencion Cocina": [
        "Servicio de comedores, bares y salones",
        "Higiene para la elaboración de alimentos",
        "Elaboración de alimentos de baja complejidad",
        "Recepción y almacenamiento de insumos",
        "Planificación de la producción gastronómica",
        "Preparación, diseño y montaje de buffet",
        "Elaboración de masas y pastas",
        "Cocina de especialidad chilena",
        "Cocina internacional",
        "Bebidas y coctelería",
        "Emprendimiento y empleabilidad"
    ],
    "Gastronomia Mencion Pasteleria y Reposteria": [
        "Servicio de comedores, bares y salones",
        "Higiene para la elaboración de alimentos",
        "Elaboración de alimentos de baja complejidad",
        "Recepción y almacenamiento de insumos",
        "Planificación de la producción gastronómica",
        "Preparación, diseño y montaje de buffet",
        "Elaboración de masas y pastas",
        "Elaboración de productos de pastelería",
        "Elaboración de productos de repostería",
        "Innovación en la pastelería y repostería",
        "Emprendimiento y empleabilidad"
    ],
    "Mecanica Automotriz": [
        "Ajuste de motores",
        "Lectura de planos y manuales técnicos",
        "Manejo de residuos y desechos automotrices",
        "Mantenimiento de sistemas eléctricos y electrónicos",
        "Mantenimiento de sistemas de seguridad y confortabilidad",
        "Mantenimiento de motores",
        "Mantenimiento de sistemas hidráulicos y neumáticos",
        "Mantenimiento de los sistemas de transmisión y frenos",
        "Mantenimiento de sistemas de dirección y suspensión",
        "Emprendimiento y empleabilidad"
    ],
    "Operaciones Portuarias": [
        "Documentación en la Operación Portuaria",
        "Consolidación y Desconsolidación de Contenedores",
        "Seguridad y Prevención de Riesgos en Faenas Portuarias",
        "Operación de Movilizacion y Distribución de Cargas",
        "Tramitación y Documentación de Recepción y Despacho",
        "Tramitación de Movilización y Distribución de Cargas",
        "Estiba y Desestiba de Naves Mercantes",
        "Organización y Almacenamiento en Zonas de Depósito",
        "Emprendimiento y Empleabilidad"
    ],
    "Quimica Industrial Mencion Laboratorio Quimico": [
        "Manejo y almacenamiento seguro de materiales",
        "Técnicas, procesos y equipos de laboratorio",
        "Fabricación de productos industriales",
        "Cuidado del medioambiente y tratamiento de residuos",
        "Toma de muestra",
        "Preparación de muestras para análisis orgánico",
        "Mantenimiento de equipos e instrumentos de laboratorio",
        "Técnicas de análisis físico-químico",
        "Técnicas de análisis instrumental",
        "Emprendimiento y empleabilidad"
    ]
};

const CurriculumTPPage = () => {
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedCareer, setSelectedCareer] = useState(TP_CAREERS[3]); // Default: Mecanica
    const [reportData, setReportData] = useState<any | null>(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const activeCourseObj = courses.find(c => c._id === selectedCourse);
    const lockedCareerName = activeCourseObj?.careerId
        ? (typeof activeCourseObj.careerId === 'object' ? activeCourseObj.careerId.name : activeCourseObj.careerId)
        : null;

    useEffect(() => {
        if (lockedCareerName) {
            setSelectedCareer(lockedCareerName);
        }
    }, [lockedCareerName]);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await api.get('/courses');
                setCourses(res.data || []);
                if (res.data && res.data.length > 0) {
                    setSelectedCourse(res.data[0]._id);
                }
            } catch (err) {
                console.error("Error loading courses:", err);
            }
        };
        fetchCourses();
    }, []);

    const fetchReport = async (courseId: string) => {
        if (!courseId) return;
        setLoadingReport(true);
        setErrorMsg('');
        try {
            const res = await api.get(`/curriculum/report-tp/${courseId}`);
            setReportData(res.data || null);
        } catch (err: any) {
            console.error("Error loading TP report:", err);
            setErrorMsg(err.response?.data?.message || 'Error al obtener informe curricular.');
        } finally {
            setLoadingReport(false);
        }
    };

    useEffect(() => {
        if (selectedCourse) {
            fetchReport(selectedCourse);
        }
    }, [selectedCourse]);

    const handlePopulateCurriculum = async () => {
        if (!selectedCourse) return;
        setSeeding(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            const res = await api.post('/curriculum/populate-tp', {
                courseId: selectedCourse,
                careerName: selectedCareer
            });
            setSuccessMsg(res.data?.message || 'Currículum cargado y notas creadas correctamente.');
            await fetchReport(selectedCourse);
        } catch (err: any) {
            console.error("Error seeding TP curriculum:", err);
            setErrorMsg(err.response?.data?.message || 'Error del servidor al poblar el currículum técnico.');
        } finally {
            setSeeding(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const activeModules = reportData?.modules || [];
    const hasData = activeModules.length > 0;

    return (
        <div className="space-y-8 print:bg-white print:p-0">
            {/* Header Controls - No Print */}
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-violet-600 font-black text-xs uppercase tracking-widest">
                        <Sparkles size={16} /> Especialidades Técnicas Profesionales (TP)
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">currículum y aprobación de notas</h2>
                    <p className="text-xs font-bold text-slate-400">Configure los planes de estudio del MINEDUC y supervise la aprobación escolar de sus carreras técnicas.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    <div className="flex flex-col gap-1 w-full sm:w-56">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seleccionar Curso</span>
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-xl font-bold text-slate-600 text-xs focus:border-violet-500 transition-colors cursor-pointer w-full"
                        >
                            <option value="">-- Seleccionar curso --</option>
                            {courses.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1 w-full sm:w-72">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            Seleccionar Especialidad {lockedCareerName && <Lock size={12} className="text-violet-600 inline ml-1" />}
                        </span>
                        <select
                            value={selectedCareer}
                            onChange={(e) => setSelectedCareer(e.target.value)}
                            disabled={!!lockedCareerName}
                            className={`bg-slate-50 border-2 ${lockedCareerName ? 'border-violet-200 bg-violet-50/20 text-violet-700 font-black' : 'border-slate-100 text-slate-600'} px-4 py-3 rounded-xl font-bold text-xs focus:border-violet-500 transition-all cursor-pointer w-full`}
                        >
                            {TP_CAREERS.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        {lockedCareerName && (
                            <span className="text-[9px] text-violet-600 font-bold uppercase mt-1 flex items-center gap-1">
                                ✓ Especialidad asociada oficialmente
                            </span>
                        )}
                    </div>

                    {hasData && (
                        <div className="flex gap-2 w-full sm:w-auto self-end">
                            <button
                                onClick={() => fetchReport(selectedCourse)}
                                className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-all"
                                title="Actualizar Datos"
                            >
                                <RefreshCw size={16} className={loadingReport ? 'animate-spin' : ''} />
                            </button>
                            <button
                                onClick={handlePrint}
                                className="px-6 py-3.5 bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
                            >
                                <Printer size={14} /> Imprimir Informe
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Error / Success Alerts */}
            {errorMsg && (
                <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-2xl flex items-center gap-4 text-rose-700 animate-in fade-in print:hidden">
                    <AlertTriangle size={24} className="flex-shrink-0" />
                    <div>
                        <h4 className="font-black text-sm uppercase tracking-wider mb-0.5">Operación Fallida</h4>
                        <p className="text-xs font-bold opacity-90">{errorMsg}</p>
                    </div>
                </div>
            )}

            {successMsg && (
                <div className="bg-emerald-50 border-2 border-emerald-100 p-6 rounded-2xl flex items-center gap-4 text-emerald-700 animate-in fade-in print:hidden">
                    <CheckCircle2 size={24} className="flex-shrink-0" />
                    <div>
                        <h4 className="font-black text-sm uppercase tracking-wider mb-0.5">Operación Exitosa</h4>
                        <p className="text-xs font-bold opacity-90">{successMsg}</p>
                    </div>
                </div>
            )}

            {/* Loading state - No Print */}
            {loadingReport && !hasData && (
                <div className="bg-white p-20 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col justify-center items-center gap-4 text-slate-400 print:hidden">
                    <RefreshCw size={48} className="animate-spin text-violet-500" />
                    <span className="text-sm font-black uppercase tracking-widest">Cargando Informe Curricular...</span>
                </div>
            )}

            {/* NO DATA / SEEDING INTERFACE */}
            {!loadingReport && !hasData && selectedCourse && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start print:hidden">
                    {/* Official Curriculum Preview */}
                    <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                            <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl">
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Módulos del Plan de Estudio</h3>
                                <p className="text-xs font-bold text-slate-400 mt-1">Estructura curricular oficial del Mineduc para {selectedCareer}.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                            {PREVIEW_MODULES[selectedCareer]?.map((name, i) => (
                                <div key={name} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3 hover:bg-slate-100/50 transition-colors">
                                    <span className="w-6 h-6 rounded-lg bg-violet-100 text-violet-700 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                                        {(i+1).toString().padStart(2, '0')}
                                    </span>
                                    <div>
                                        <h5 className="font-black text-xs text-slate-800 leading-tight mb-1 uppercase">{name}</h5>
                                        <p className="text-[10px] text-slate-400 leading-normal font-bold">Módulo curricular técnico profesional oficial.</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Populator Widget */}
                    <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-10 rounded-[3rem] text-white space-y-8 shadow-2xl relative overflow-hidden">
                        <div className="space-y-4">
                            <div className="inline-flex p-3 bg-white/10 rounded-2xl">
                                <Target size={28} />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight leading-tight uppercase">Poblar Especialidad</h3>
                            <p className="text-xs font-bold text-violet-100 leading-relaxed">
                                Este asistente creará automáticamente los 10-12 módulos técnicos correspondientes en el centro académico, plantillas de planificación pedagógica, rúbricas de desempeño, preguntas de evaluación y matrices de notas ficticias (18 a 20 calificaciones promedio) para el curso activo.
                            </p>
                        </div>

                        <div className="bg-white/10 p-6 rounded-2xl border border-white/10 space-y-4">
                            <div className="flex items-center gap-3">
                                <Users size={16} />
                                <div className="text-xs font-bold">Curso: <span className="underline font-black">{courses.find(c => c._id === selectedCourse)?.name || 'Cargando...'}</span></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <ClipboardList size={16} />
                                <div className="text-xs font-bold">Especialidad: <span className="underline font-black">{selectedCareer}</span></div>
                            </div>
                        </div>

                        <button
                            onClick={handlePopulateCurriculum}
                            disabled={seeding}
                            className="w-full py-5 bg-white text-violet-700 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-violet-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
                        >
                            {seeding ? (
                                <>
                                    <RefreshCw className="animate-spin" size={16} /> Poblando Currículum...
                                </>
                            ) : (
                                <>
                                    Inicializar Datos Académicos <ArrowRight size={16} />
                                </>
                            )}
                        </button>

                        {/* Decorative bubbles */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl translate-x-10 -translate-y-10"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl -translate-x-10 translate-y-10"></div>
                    </div>
                </div>
            )}

            {/* DASHBOARD REPORT DISPLAY */}
            {!loadingReport && hasData && reportData && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
                    
                    {/* STATS HIGHLIGHTS */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-slate-100 flex items-center gap-5">
                            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl flex-shrink-0">
                                <BarChart3 size={24} />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Tasa de Aprobación TP</span>
                                <span className="text-3xl font-black text-slate-800 tracking-tight">{reportData.stats?.overallApprovalRate}%</span>
                            </div>
                        </div>

                        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-slate-100 flex items-center gap-5">
                            <div className="p-4 bg-violet-50 text-violet-600 rounded-2xl flex-shrink-0">
                                <BookOpen size={24} />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Módulos Registrados</span>
                                <span className="text-3xl font-black text-slate-800 tracking-tight">{reportData.modules?.length}</span>
                            </div>
                        </div>

                        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-slate-100 flex items-center gap-5">
                            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl flex-shrink-0">
                                <ClipboardList size={24} />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Pruebas Evaluadas</span>
                                <span className="text-3xl font-black text-slate-800 tracking-tight">{reportData.stats?.totalEvaluations}</span>
                            </div>
                        </div>

                        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-slate-100 flex items-center gap-5">
                            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl flex-shrink-0">
                                <Users size={24} />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Estudiantes Calificados</span>
                                <span className="text-3xl font-black text-slate-800 tracking-tight">{reportData.stats?.totalStudents}</span>
                            </div>
                        </div>
                    </div>

                    {/* MODULAR COMPARE CHART/GRID */}
                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Rendimiento por Módulo Curricular</h3>
                                <p className="text-xs font-bold text-slate-400">Porcentaje de aprobación y calificaciones promedio de la especialidad.</p>
                            </div>
                            <span className="px-4 py-2 bg-violet-50 text-violet-700 text-[9px] font-black uppercase tracking-wider rounded-xl print:hidden">Visualización de Datos</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeModules.map((mod: any) => {
                                const approval = mod.approvalPercentage || 0;
                                let barColor = 'bg-rose-500';
                                let textColor = 'text-rose-600 bg-rose-50';
                                if (approval >= 85) {
                                    barColor = 'bg-emerald-500';
                                    textColor = 'text-emerald-700 bg-emerald-50';
                                } else if (approval >= 70) {
                                    barColor = 'bg-amber-500';
                                    textColor = 'text-amber-700 bg-amber-50';
                                }

                                return (
                                    <div key={mod.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between gap-6 hover:bg-slate-100/50 transition-colors">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-start gap-4">
                                                <h4 className="font-black text-xs text-slate-800 uppercase leading-snug line-clamp-2" title={mod.name}>{mod.name}</h4>
                                                <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg ${textColor} shrink-0`}>
                                                    Nota: {mod.averageScore?.toFixed(2)}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold leading-normal">{mod.description || 'Sin descripción curricular.'}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase">
                                                <span>Aprobación</span>
                                                <span className="font-black">{approval}%</span>
                                            </div>
                                            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                                                <div className={`h-full ${barColor}`} style={{ width: `${approval}%` }}></div>
                                            </div>
                                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 pt-1">
                                                <span>Evals: <span className="font-black text-slate-600">{mod.evaluationsCount}</span></span>
                                                <span>Notas: <span className="font-black text-slate-600">{mod.gradesCount}</span></span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* STUDENT HIGH-DENSITY PERFORMANCE MATRIX */}
                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8 overflow-hidden print:shadow-none print:p-0 print:border-none">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-6 print:pb-4">
                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Matriz de Rendimiento de Alumnos (TP)</h3>
                                <p className="text-xs font-bold text-slate-400">Detalle individualizado por alumno y su tasa de aprobación por módulo técnico.</p>
                            </div>
                        </div>

                        {/* Scrollable table container */}
                        <div className="overflow-x-auto -mx-10 px-10 scrollbar-thin print:-mx-0 print:px-0">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b-2 border-slate-100 bg-slate-50/50">
                                        <th className="py-4 px-4 font-black text-slate-700 uppercase tracking-wider sticky left-0 bg-white z-10 min-w-[220px]">Alumno Completo</th>
                                        <th className="py-4 px-4 font-black text-slate-700 uppercase tracking-wider text-center min-w-[120px]">RUT</th>
                                        {activeModules.map((mod: any) => (
                                            <th key={mod.id} className="py-4 px-3 font-black text-slate-600 uppercase text-center min-w-[140px] max-w-[180px] break-words leading-tight" title={mod.name}>
                                                {mod.name.length > 30 ? `${mod.name.substring(0, 28)}...` : mod.name}
                                            </th>
                                        ))}
                                        <th className="py-4 px-4 font-black text-slate-700 uppercase tracking-wider text-center min-w-[110px]">Aprobación TP</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {reportData.studentAverages?.map((student: any) => (
                                        <tr key={student.id} className="hover:bg-slate-50/40 transition-colors">
                                            <td className="py-4 px-4 font-black text-[#11355a] uppercase sticky left-0 bg-white hover:bg-slate-50 z-10 whitespace-nowrap shadow-[5px_0_10px_-5px_rgba(0,0,0,0.05)] print:shadow-none print:whitespace-normal">
                                                {student.fullName}
                                            </td>
                                            <td className="py-4 px-4 text-center text-slate-500 font-bold font-mono whitespace-nowrap">
                                                {student.rut}
                                            </td>
                                            {activeModules.map((mod: any) => {
                                                const avg = student.modularScores[mod.id];
                                                const hasScore = avg !== null && avg !== undefined;
                                                const isPassing = hasScore && avg >= 4.0;
                                                return (
                                                    <td key={mod.id} className="py-4 px-3 text-center whitespace-nowrap">
                                                        {hasScore ? (
                                                            <span className={`font-black text-sm ${isPassing ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                {avg.toFixed(1)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-300">--</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className="py-4 px-4 text-center whitespace-nowrap">
                                                <span className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black ${
                                                    student.approvalPercentage >= 85 ? 'text-emerald-700 bg-emerald-50' :
                                                    student.approvalPercentage >= 70 ? 'text-amber-700 bg-amber-50' : 'text-rose-700 bg-rose-50'
                                                }`}>
                                                    {student.approvalPercentage}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CurriculumTPPage;
