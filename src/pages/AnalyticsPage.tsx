import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useTenant } from '../context/TenantContext';
import { useReactToPrint } from 'react-to-print';
import { Link } from 'react-router-dom';
import { Trophy, ThumbsUp, ThumbsDown, BarChart3, Target, Star, Printer, TrendingUp, AlertCircle, FileText, Activity, ShieldCheck, Clock, Award } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';

const AnalyticsPage = () => {
    const { tenant } = useTenant();
    const [loading, setLoading] = useState(true);
    const [topStudents, setTopStudents] = useState([]);
    const [annotationRankings, setAnnotationRankings] = useState<any>(null);
    const [studentAnalytics, setStudentAnalytics] = useState([]);
    const [debtorRanking, setDebtorRanking] = useState([]);
    const [punctualityRanking, setPunctualityRanking] = useState<any[]>([]);
    const [performanceTrends, setPerformanceTrends] = useState([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [licenseRanking, setLicenseRanking] = useState<any[]>([]);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [selectedCourse]);

    const fetchInitialData = async () => {
        try {
            const res = await api.get('/courses');
            setCourses(res.data);
        } catch (err) {
            console.error(err);
        }
    };
    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const params = selectedCourse ? `?courseId=${selectedCourse}` : '';
            const [topRes, annotRes, studentRes, debtRes, trendRes, licRes, punctRes] = await Promise.all([
                api.get(`/analytics/top-students?limit=10${params ? `&${params.slice(1)}` : ''}`),
                api.get(`/analytics/annotations-ranking${params}`),
                api.get(`/analytics/students${params}`),
                api.get(`/analytics/debtors${params}`),
                api.get(`/analytics/performance-trends${params}`),
                api.get(`/analytics/licenses-ranking${params}`),
                api.get(`/analytics/punctuality-ranking${params}`)
            ]);
            setTopStudents(topRes.data);
            setAnnotationRankings(annotRes.data);
            setStudentAnalytics(studentRes.data);
            setDebtorRanking(debtRes.data);
            setPerformanceTrends(trendRes.data);
            setLicenseRanking(licRes.data);
            setPunctualityRanking(punctRes.data);
        } catch (err) {
            console.error('Error fetching analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Analisis-Academico-${new Date().toLocaleDateString()}`,
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const totalStudentsCount = studentAnalytics.length;
    const generalAverage = totalStudentsCount > 0
        ? (studentAnalytics.reduce((sum: number, s: any) => sum + (s.overallAverage || 0), 0) / totalStudentsCount).toFixed(2)
        : '0.00';
    const overallPassingRate = totalStudentsCount > 0
        ? ((studentAnalytics.filter((s: any) => s.passingStatus === 'Aprueba').length / totalStudentsCount) * 100).toFixed(1)
        : '0.0';

    const outstandingCount = studentAnalytics.filter((s: any) => s.overallAverage >= 6.0).length;
    const passingCount = studentAnalytics.filter((s: any) => s.overallAverage >= 4.0 && s.overallAverage < 6.0).length;
    const failingCount = studentAnalytics.filter((s: any) => s.overallAverage < 4.0).length;

    const outstandingPct = totalStudentsCount > 0 ? ((outstandingCount / totalStudentsCount) * 100).toFixed(1) : '0.0';
    const passingPct = totalStudentsCount > 0 ? ((passingCount / totalStudentsCount) * 100).toFixed(1) : '0.0';
    const failingPct = totalStudentsCount > 0 ? ((failingCount / totalStudentsCount) * 100).toFixed(1) : '0.0';

    const renderTopStudents = () => {
        if (!topStudents || topStudents.length === 0) {
            return (
                <div className="col-span-2 p-16 text-center bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl mx-auto mb-6 text-blue-200">
                        <Trophy size={40} />
                    </div>
                    <h3 className="text-xl font-black text-gray-400 uppercase tracking-tighter">Sin Datos Académicos</h3>
                    <p className="text-gray-400 font-bold max-w-sm mx-auto mt-2 italic">
                        Aún no se han registrado calificaciones para este periodo. Comience registrando notas en la sección pedagógica para ver el ranking.
                    </p>
                </div>
            );
        }

        return topStudents.map((student: any, index: number) => {
            let rankClass = "w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-black text-2xl";
            if (index === 0) rankClass = "w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 text-white";
            if (index === 1) rankClass = "w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl bg-gradient-to-br from-gray-300 to-gray-500 text-white";
            if (index === 2) rankClass = "w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-white";

            return (
                <div key={student._id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-100 hover:shadow-lg transition-all">
                    <div className="flex-shrink-0">
                        <div className={rankClass}>
                            {index + 1}{index < 3 ? '°' : ''}
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="font-black text-gray-800 text-lg">{student.studentName}</div>
                        <div className="text-[10px] text-blue-600 font-black uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md inline-block mb-1">Apod: {student.guardianName || 'N/A'}</div>
                        <div className="text-xs text-gray-500 font-bold uppercase block">{student.grado}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-black text-blue-600">{student.overallAverage ? student.overallAverage.toFixed(2) : '0.00'}</div>
                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Promedio</div>
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-gray-800 flex items-center gap-3">
                        <BarChart3 size={40} className="text-blue-600" />
                        Análisis de Rendimiento Académico
                    </h1>
                    <p className="text-gray-500 text-lg mt-2">Métricas de estudiantes, promedios y comportamiento</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1">
                        <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-3 ml-1">Filtrar por Curso</label>
                        <select
                            className="w-full px-6 py-5 text-lg bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-blue-500 outline-none font-black text-slate-800 appearance-none"
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                            value={selectedCourse}
                            onChange={e => setSelectedCourse(e.target.value)}
                        >
                            <option value="">Todos los cursos</option>
                            {Array.from(new Set(courses.map(c => c.name)))
                                .sort()
                                .map(name => {
                                    const course = courses.find(c => c.name === name);
                                    return (
                                        <option key={course?._id} value={course?._id}>{name}</option>
                                    );
                                })
                            }
                        </select>
                    </div>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-8 py-4 bg-white text-gray-700 rounded-3xl font-black border-2 border-gray-100 hover:bg-gray-50 transition-all shadow-xl shadow-gray-200/50"
                    >
                        <Printer size={20} /> Imprimir Reporte
                    </button>
                </div>
            </div>

            <div className="space-y-8" ref={printRef}>
                <div className="hidden print:block p-10 text-center border-b-4 border-slate-900 mb-10">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-left">
                            <h1 className="text-3xl font-black uppercase tracking-tighter">ANÁLISIS DE RENDIMIENTO GLOBAL</h1>
                            <p className="text-blue-600 font-black text-sm">SISTEMA DE GESTIÓN EDUCATIVA EINSMART</p>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-black uppercase">Consolidado Estadístico</div>
                            <div className="text-slate-500 font-bold">FECHA: {new Date().toLocaleDateString()}</div>
                        </div>
                    </div>
                </div>

                {/* Institutional Statistics Dashboard Panel */}
                <div className="bg-white rounded-3xl shadow-2xl border overflow-hidden p-8 space-y-6">
                    <div className="flex items-center gap-3 border-b pb-4">
                        <Activity size={32} className="text-blue-600 animate-pulse" />
                        <div>
                            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Resumen Estadístico Institucional</h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Indicadores Clave de Rendimiento Académico</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* KPI 1 */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-6 flex items-center gap-5">
                            <div className="p-4 bg-white rounded-2xl shadow-md text-blue-600 shrink-0">
                                <Trophy size={28} />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Promedio General</div>
                                <div className="text-3xl font-black text-slate-800 mt-1">{generalAverage}</div>
                                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Escala 1.0 - 7.0</div>
                            </div>
                        </div>

                        {/* KPI 2 */}
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-3xl p-6 flex items-center gap-5">
                            <div className="p-4 bg-white rounded-2xl shadow-md text-emerald-600 shrink-0">
                                <ShieldCheck size={28} />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Tasa de Aprobación</div>
                                <div className="text-3xl font-black text-slate-800 mt-1">{overallPassingRate}%</div>
                                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Promedio &gt;= 4.0</div>
                            </div>
                        </div>

                        {/* KPI 3 */}
                        <div className="bg-gradient-to-br from-rose-50 to-red-50 border border-rose-100 rounded-3xl p-6 flex items-center gap-5">
                            <div className="p-4 bg-white rounded-2xl shadow-md text-rose-600 shrink-0">
                                <AlertCircle size={28} />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-rose-800 uppercase tracking-widest">Alumnos en Alerta</div>
                                <div className="text-3xl font-black text-slate-800 mt-1">{failingCount} Alumnos</div>
                                <div className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-1">Promedio &lt; 4.0</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4">
                        <div className="text-xs font-black text-slate-600 uppercase tracking-widest">Distribución de Alumnos por Rango de Rendimiento</div>
                        
                        {/* Progress Bar 1 */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-black text-slate-700">
                                <span className="uppercase tracking-wider">Sobresaliente (6.0 - 7.0)</span>
                                <span>{outstandingCount} Alumnos ({outstandingPct}%)</span>
                            </div>
                            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${outstandingPct}%` }}></div>
                            </div>
                        </div>

                        {/* Progress Bar 2 */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-black text-slate-700">
                                <span className="uppercase tracking-wider">Aprobado Regular (4.0 - 5.9)</span>
                                <span>{passingCount} Alumnos ({passingPct}%)</span>
                            </div>
                            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${passingPct}%` }}></div>
                            </div>
                        </div>

                        {/* Progress Bar 3 */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-black text-slate-700">
                                <span className="uppercase tracking-wider">Riesgo / Insuficiente (1.0 - 3.9)</span>
                                <span>{failingCount} Alumnos ({failingPct}%)</span>
                            </div>
                            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                                <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${failingPct}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-2xl border overflow-hidden">
                    <div className="px-8 py-5 flex items-center justify-between" style={{ backgroundColor: tenant?.theme?.primaryColor || '#11355a' }}>
                        <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
                            <Trophy size={24} className="text-yellow-300" />
                            Top 10 - Mejores Promedios del Colegio
                        </h2>
                    </div>
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderTopStudents()}
                        </div>
                    </div>
                </div>

                {/* Trends Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white rounded-3xl shadow-2xl border overflow-hidden">
                        <div className="px-8 py-5 bg-blue-600">
                            <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
                                <TrendingUp size={24} />
                                Tendencia de Rendimiento Académico
                            </h2>
                        </div>
                        <div className="p-8 h-[400px] relative">
                            {performanceTrends.length === 0 ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10">
                                    <TrendingUp size={64} className="text-slate-100 mb-4" />
                                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Sin registros históricos suficientes</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={performanceTrends}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}
                                        />
                                        <YAxis
                                            domain={[1, 7]}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                            labelStyle={{ fontWeight: 'black', color: '#1e293b' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="average"
                                            stroke="#2563eb"
                                            strokeWidth={4}
                                            dot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 8, strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-2xl border overflow-hidden flex flex-col">
                        <div className="px-8 py-5 bg-amber-500">
                            <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
                                <AlertCircle size={24} />
                                Alerta de Riesgo
                            </h2>
                        </div>
                        <div className="p-8 flex-1 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center">
                                <AlertCircle size={40} className="text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800">Alumnos en Riesgo</h3>
                                <p className="text-sm text-slate-500 font-bold mt-2">
                                    {(studentAnalytics.filter((s: any) => s.overallAverage < 4.0).length)} estudiantes presentan promedios insuficientes.
                                </p>
                                <Link
                                    to="/students?filter=at-risk"
                                    className="flex items-center justify-center gap-2 px-8 py-5 bg-black text-white rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-gray-900 transition-all shadow-2xl border-2 border-transparent hover:border-gray-700 active:scale-95"
                                >
                                    Ver Listado de Riesgo
                                </Link>
                                <Link
                                    to="/classroom-efficiency"
                                    className="flex items-center justify-center gap-2 px-8 py-5 bg-[#11355a] text-white rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-[#0a233d] transition-all shadow-2xl active:scale-95"
                                >
                                    <Activity size={18} />
                                    Eficiencia en Aula
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white rounded-3xl shadow-2xl border overflow-hidden">
                        <div className="px-8 py-5 bg-gradient-to-r from-blue-700 to-indigo-800">
                            <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
                                <FileText size={24} />
                                Ranking de Licencias Médicas
                            </h2>
                        </div>
                        <div className="p-6 space-y-3">
                            {licenseRanking && licenseRanking.length > 0 ? (
                                licenseRanking.map((lic: any, index: number) => (
                                    <div key={lic._id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                        <div className="w-10 h-10 bg-blue-700 text-white rounded-full flex items-center justify-center font-black">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-gray-800">{lic.name}</div>
                                            <div className="text-xs text-gray-500">{lic.userType}</div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-full">
                                            <span className="font-black">{lic.totalDays}D</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-16 text-center text-slate-300 font-black uppercase tracking-[0.2em] text-[10px] border-2 border-dashed border-slate-50 rounded-3xl bg-slate-50/30">
                                    Sin licencias registradas
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-3xl shadow-2xl border overflow-hidden">
                        <div className="px-8 py-5 bg-gradient-to-r from-green-600 to-emerald-600">
                            <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
                                <ThumbsUp size={24} />
                                Mejores Conductas
                            </h2>
                        </div>
                        <div className="p-6 space-y-3">
                            {annotationRankings?.mostPositive && annotationRankings.mostPositive.length > 0 ? (
                                annotationRankings.mostPositive.map((student: any, index: number) => (
                                    <div key={student._id} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                                        <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-black">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-gray-800">{student.studentName}</div>
                                            <div className="text-xs text-gray-500">{student.grado}</div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full">
                                            <Star size={16} />
                                            <span className="font-black">{student.positiveCount}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-16 text-center text-slate-300 font-black uppercase tracking-[0.2em] text-[10px] border-2 border-dashed border-slate-50 mx-4 mb-4 rounded-3xl bg-slate-50/30">
                                    <Star size={32} className="mx-auto mb-4 opacity-50" />
                                    Sin registros positivos
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-2xl border overflow-hidden">
                        <div className="px-8 py-5 bg-gradient-to-r from-rose-600 to-red-600">
                            <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
                                <ThumbsDown size={24} />
                                Necesitan Apoyo
                            </h2>
                        </div>
                        <div className="p-6 space-y-3">
                            {annotationRankings?.mostNegative && annotationRankings.mostNegative.length > 0 ? (
                                annotationRankings.mostNegative.map((student: any, index: number) => (
                                    <div key={student._id} className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
                                        <div className="w-10 h-10 bg-rose-600 text-white rounded-full flex items-center justify-center font-black">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-gray-800">{student.studentName}</div>
                                            <div className="text-xs text-gray-500">{student.grado}</div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-full">
                                            <ThumbsDown size={16} />
                                            <span className="font-black">{student.negativeCount}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-16 text-center text-slate-300 font-black uppercase tracking-[0.2em] text-[10px] border-2 border-dashed border-slate-50 mx-4 mb-4 rounded-3xl bg-slate-50/30">
                                    <ThumbsDown size={32} className="mx-auto mb-4 opacity-50" />
                                    Todo en orden
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Ranking de Puntualidad y Asistencia (Class Book Logs) */}
                <div className="bg-white rounded-3xl shadow-2xl border overflow-hidden">
                    <div className="px-8 py-5 bg-gradient-to-r from-amber-600 to-orange-600">
                        <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
                            <Clock size={24} className="text-amber-100 animate-pulse" />
                            Ranking de Puntualidad y Asistencia (Libro de Clases)
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-orange-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-black text-orange-950 uppercase tracking-widest">Estudiante</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-orange-950 uppercase tracking-widest">Curso / Grado</th>
                                    <th className="px-6 py-4 text-center text-xs font-black text-orange-950 uppercase tracking-widest">Asistencia Promedio</th>
                                    <th className="px-6 py-4 text-center text-xs font-black text-orange-950 uppercase tracking-widest">Cant. Atrasos</th>
                                    <th className="px-6 py-4 text-center text-xs font-black text-orange-950 uppercase tracking-widest">Minutos Totales Atrasados</th>
                                    <th className="px-6 py-4 text-center text-xs font-black text-orange-950 uppercase tracking-widest">Estado Alerta</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-orange-100">
                                {punctualityRanking && punctualityRanking.length > 0 ? (
                                    punctualityRanking.map((row: any) => (
                                        <tr key={row.studentId} className="hover:bg-orange-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-black text-gray-800">{row.studentName}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-600 uppercase">{row.grado}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-sm font-black ${row.attendanceRate < 85 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {row.attendanceRate}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${row.tardinessCount > 5 ? 'bg-rose-100 text-rose-800' : row.tardinessCount > 2 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                                                    {row.tardinessCount} Atrasos
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="text-sm font-bold text-slate-700">{row.totalDelayMinutes} min</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                    row.tardinessCount > 5 || row.attendanceRate < 85
                                                        ? 'bg-rose-50 text-rose-700 border-2 border-rose-100'
                                                        : row.tardinessCount > 2 
                                                            ? 'bg-amber-50 text-amber-700 border-2 border-amber-100'
                                                            : 'bg-emerald-50 text-emerald-700 border-2 border-emerald-100'
                                                }`}>
                                                    {row.tardinessCount > 5 || row.attendanceRate < 85 ? 'Crítico' : row.tardinessCount > 2 ? 'Advertencia' : 'Óptimo'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <ShieldCheck size={48} className="mx-auto text-slate-200 mb-4" />
                                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Sin registros de puntualidad en el libro</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-2xl border overflow-hidden">
                    <div className="px-8 py-5 flex items-center justify-between" style={{ backgroundColor: tenant?.theme?.primaryColor || '#11355a' }}>
                        <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
                            <Target size={24} className="text-blue-300" />
                            Rendimiento por Materia
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Estudiante</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Materias</th>
                                    <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-widest">Promedio General</th>
                                    <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-widest">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {studentAnalytics && studentAnalytics.length > 0 ? (
                                    studentAnalytics.slice(0, 20).map((student: any) => (
                                        <tr key={student._id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-800">{student.studentName}</div>
                                                <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Apod: {student.guardianName || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {student.subjectAverages && student.subjectAverages.map((subject: any, idx: number) => (
                                                        <div
                                                            key={idx}
                                                            className={`px-3 py-1 rounded-full text-xs font-bold ${subject.average >= 4.0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}
                                                        >
                                                            {subject.subject}: {subject.average ? subject.average.toFixed(1) : '0.0'}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className={`text-2xl font-black ${student.overallAverage >= 4.0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {student.overallAverage ? student.overallAverage.toFixed(2) : '0.00'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${student.passingStatus === 'Aprueba' ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300' : 'bg-rose-100 text-rose-700 border-2 border-rose-300'}`}>
                                                    {student.passingStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-400 font-bold">Sin datos de materias.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
