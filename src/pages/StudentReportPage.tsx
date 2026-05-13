import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
    GraduationCap, ClipboardList, BookOpen, FileText, 
    Printer, TrendingUp, AlertCircle, CheckCircle2, 
    User, Phone, MapPin, Mail, Award, Clock
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useTenant } from '../context/TenantContext';

const StudentReportPage = () => {
    const { user } = useAuth();
    const { tenant } = useTenant();
    const [data, setData] = useState<any>(null);
    const [period, setPeriod] = useState('anual');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Informe_Academico_${data?.student?.apellidos || 'Estudiante'}_${period}`,
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.profileId && user?.role !== 'student' && user?.role !== 'apoderado') {
                setError('No se encontró un perfil vinculado a este usuario.');
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // If it's an apoderado, we might need to find the studentId first if not in profileId
                let studentId = user.profileId;
                
                if (user.role === 'apoderado') {
                    const apoRes = await api.get(`/apoderados/${user.profileId}`);
                    studentId = apoRes.data.estudianteId?._id || apoRes.data.estudianteId;
                }

                const res = await api.get(`/reports/student/${studentId}?period=${period}`);
                setData(res.data);
            } catch (err: any) {
                console.error(err);
                setError(err.response?.data?.message || 'Error al cargar el informe académico.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, period]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Generando Informe Académico...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="bg-white p-12 rounded-[3rem] shadow-xl text-center max-w-md border-b-8 border-rose-500">
                    <AlertCircle size={64} className="mx-auto text-rose-500 mb-6" />
                    <h2 className="text-2xl font-black text-[#11355a] uppercase tracking-tighter mb-4">Error de Acceso</h2>
                    <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed">{error || 'No se pudieron cargar los datos del estudiante.'}</p>
                    <button onClick={() => window.location.reload()} className="px-8 py-4 bg-[#11355a] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Reintentar Conexión</button>
                </div>
            </div>
        );
    }

    const { student, school, gradesBySubject, overallAverage, attendance, annotations, guardian, atrasos } = data;

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans">
            {/* Header Sticky */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-40 px-8 py-5 flex justify-between items-center shadow-sm backdrop-blur-md bg-white/80">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                        <Award size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-[#11355a] uppercase tracking-tighter">Informe de Rendimiento</h1>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{school.academicYear} • Portal de Familia</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <select 
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="bg-slate-50 px-6 py-3 rounded-2xl border-2 border-slate-100 font-black text-[#11355a] text-[10px] uppercase tracking-widest outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    >
                        <option value="anual">Informe Anual</option>
                        <option value="1_semestre">Primer Semestre</option>
                        <option value="2_semestre">Segundo Semestre</option>
                    </select>

                    <button 
                        onClick={() => handlePrint()}
                        className="flex items-center gap-3 px-6 py-3 bg-[#11355a] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-900/20"
                    >
                        <Printer size={18} /> Imprimir Reporte
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-8 py-10 space-y-10">
                {/* Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl hover:border-blue-200 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                                <TrendingUp size={20} />
                            </div>
                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Global</span>
                        </div>
                        <div className="text-3xl font-black text-[#11355a] tracking-tighter">{overallAverage?.toFixed(1) || '--'}</div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Promedio</p>
                        <div className="w-full h-1.5 bg-slate-50 rounded-full mt-4 overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(overallAverage / 7) * 100}%` }}></div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl hover:border-emerald-200 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                                <CheckCircle2 size={20} />
                            </div>
                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Asistencia</span>
                        </div>
                        <div className="text-3xl font-black text-[#11355a] tracking-tighter">{attendance.percent}%</div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Presencia ({attendance.present}/{attendance.total} d)</p>
                        <div className="w-full h-1.5 bg-slate-50 rounded-full mt-4 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${attendance.percent}%` }}></div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl hover:border-rose-200 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
                                <Clock size={20} />
                            </div>
                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Puntualidad</span>
                        </div>
                        <div className="text-3xl font-black text-[#11355a] tracking-tighter">{atrasos?.length || 0}</div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Atrasos Registrados</p>
                        <div className="flex gap-1 mt-4">
                            {(atrasos || []).slice(0, 8).map((_: any, i: number) => (
                                <div key={i} className="h-1.5 flex-1 rounded-full bg-rose-300"></div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl hover:border-amber-200 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                                <ClipboardList size={20} />
                            </div>
                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Conducta</span>
                        </div>
                        <div className="text-3xl font-black text-[#11355a] tracking-tighter">{annotations.length}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-emerald-500 uppercase">{annotations.filter((a:any)=>a.tipo==='positiva').length} P</span>
                            <span className="text-[10px] font-bold text-slate-300">•</span>
                            <span className="text-[10px] font-bold text-rose-500 uppercase">{annotations.filter((a:any)=>a.tipo==='negativa').length} N</span>
                        </div>
                        <div className="flex gap-1 mt-4">
                            {annotations.slice(0, 8).map((a: any, i: number) => (
                                <div key={i} className={`h-1.5 flex-1 rounded-full ${a.tipo === 'positiva' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#11355a] p-6 rounded-[2.5rem] shadow-2xl shadow-blue-900/20 text-white flex flex-col justify-center text-center">
                        <div className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-2">Estado Académico</div>
                        <div className="text-xl font-black uppercase tracking-tighter">
                            {overallAverage >= 4.0 && attendance.percent >= 85 ? 'Suficiencia' : 'En Observación'}
                        </div>
                        <p className="text-[8px] font-bold opacity-40 mt-2 uppercase tracking-widest leading-relaxed">Decreto 67 de evaluación</p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left: Grades Table */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                <h3 className="text-sm font-black text-[#11355a] uppercase tracking-widest flex items-center gap-3">
                                    <BookOpen size={18} className="text-blue-500" /> Detalle por Asignatura
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Asignatura</th>
                                            <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Evaluaciones</th>
                                            <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Promedio</th>
                                            <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Progreso</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {gradesBySubject.map((sub: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="p-6 font-black text-[#11355a] text-xs uppercase">{sub.subject}</td>
                                                <td className="p-6 text-center text-xs font-bold text-slate-400">{sub.totalEvaluations}</td>
                                                <td className="p-6 text-center">
                                                    <span className={`px-4 py-1.5 rounded-full font-black text-xs ${
                                                        sub.average >= 4.0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                    }`}>
                                                        {sub.average?.toFixed(1) || '--'}
                                                    </span>
                                                </td>
                                                <td className="p-6">
                                                    <div className="w-24 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
                                                        <div className={`h-full rounded-full ${sub.average >= 4.0 ? 'bg-blue-500' : 'bg-rose-400'}`} style={{ width: `${(sub.average / 7) * 100}%` }}></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Annotations Section */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-black text-[#11355a] uppercase tracking-widest px-4 flex items-center gap-3">
                                <Award size={18} className="text-amber-500" /> Registro de Observaciones
                            </h3>
                            <div className="grid gap-4">
                                {annotations.map((a: any, i: number) => (
                                    <div key={i} className={`p-6 rounded-[2rem] border-2 bg-white flex items-center gap-6 group transition-all hover:shadow-lg ${
                                        a.tipo === 'positiva' ? 'border-emerald-50' : 'border-rose-50'
                                    }`}>
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                                            a.tipo === 'positiva' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
                                        }`}>
                                            <FileText size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-sm font-black text-[#11355a] uppercase">{a.titulo}</h4>
                                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                                                    a.tipo === 'positiva' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                }`}>{a.tipo}</span>
                                            </div>
                                            <p className="text-[11px] font-bold text-slate-400 italic leading-relaxed">{a.descripcion}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-xs font-black text-slate-300 uppercase">{new Date(a.fecha).toLocaleDateString()}</div>
                                            <div className="text-[9px] font-bold text-blue-400 uppercase mt-1">Por: {a.autor}</div>
                                        </div>
                                    </div>
                                ))}
                                {annotations.length === 0 && (
                                    <div className="p-12 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 text-center">
                                        <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">No hay registros conductuales este período</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Sidebar Info */}
                    <div className="space-y-8">
                        {/* Student Profile Card */}
                        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                            <div className="h-24 bg-gradient-to-br from-blue-600 to-indigo-800"></div>
                            <div className="px-8 pb-10 -mt-12 text-center">
                                <div className="w-24 h-24 bg-white rounded-[2rem] shadow-2xl mx-auto border-4 border-white overflow-hidden mb-4 p-1">
                                    <div className="w-full h-full bg-slate-100 rounded-[1.5rem] flex items-center justify-center overflow-hidden">
                                        {student.fotoUrl ? (
                                            <img src={student.fotoUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={40} className="text-slate-300" />
                                        )}
                                    </div>
                                </div>
                                <h2 className="text-lg font-black text-[#11355a] uppercase leading-tight">{student.nombres} {student.apellidos}</h2>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">{student.grado}</p>
                                
                                <div className="mt-8 space-y-3">
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl text-left">
                                        <div className="p-2 bg-white rounded-lg text-slate-400 shadow-sm"><Award size={14} /></div>
                                        <div>
                                            <div className="text-[8px] font-black text-slate-400 uppercase">RUT / ID Alumno</div>
                                            <div className="text-[11px] font-bold text-slate-700">{student.rut}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl text-left">
                                        <div className="p-2 bg-white rounded-lg text-slate-400 shadow-sm"><Mail size={14} /></div>
                                        <div>
                                            <div className="text-[8px] font-black text-slate-400 uppercase">Correo Institucional</div>
                                            <div className="text-[11px] font-bold text-slate-700 truncate max-w-[150px]">{student.email}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Guardian Card */}
                        {guardian && (
                            <div className="bg-slate-900 rounded-[3rem] p-8 text-white space-y-6">
                                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                    <User size={14} /> Tutor Responsable
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-black uppercase tracking-tight">{guardian.nombre} {guardian.apellidos}</span>
                                        <span className="text-[8px] bg-white/10 px-2 py-0.5 rounded font-black uppercase">{guardian.parentesco}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 opacity-60">
                                            <Phone size={12} /> <span className="text-[10px] font-bold">{guardian.telefono}</span>
                                        </div>
                                        <div className="flex items-center gap-3 opacity-60">
                                            <Mail size={12} /> <span className="text-[10px] font-bold">{guardian.email}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Institution Card */}
                        <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm space-y-6">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Institución</h3>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden">
                                    {school.logoUrl ? (
                                        <img src={school.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <GraduationCap size={20} className="text-slate-300" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-black text-[#11355a] uppercase truncate">{school.name}</div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">RBD: {tenant?.rbd || '000-0'}</div>
                                </div>
                            </div>
                            <div className="space-y-2 pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                                    <MapPin size={12} className="text-slate-300" /> {school.address}
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                                    <Phone size={12} className="text-slate-300" /> {school.phone}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Hidden Printable Content */}
            <div className="hidden">
                <div ref={printRef} className="p-16 text-slate-900 bg-white min-h-[1100px]">
                    {/* Print Header */}
                    <div className="flex justify-between items-start border-b-4 border-[#11355a] pb-10 mb-10">
                        <div className="flex items-center gap-8">
                            {school.logoUrl && <img src={school.logoUrl} alt="Logo" className="h-24 w-auto object-contain" />}
                            <div>
                                <h1 className="text-4xl font-black uppercase tracking-tighter text-[#11355a]">INFORME ACADÉMICO</h1>
                                <p className="text-lg font-bold text-slate-500 uppercase tracking-widest">{school.academicYear} • {school.name}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-black text-[#11355a] uppercase">{student.grado}</div>
                            <div className="text-slate-400 font-bold uppercase text-xs mt-1">EMITIDO EL {new Date().toLocaleDateString()}</div>
                        </div>
                    </div>

                    {/* Print Student Info */}
                    <div className="grid grid-cols-2 gap-10 mb-12">
                        <div className="bg-slate-50 p-8 rounded-[2rem] space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">IDENTIFICACIÓN DEL ALUMNO</h3>
                            <div className="text-sm"><span className="font-black uppercase">ALUMNO:</span> {student.apellidos}, {student.nombres}</div>
                            <div className="text-sm"><span className="font-black uppercase">RUT:</span> {student.rut}</div>
                            <div className="text-sm"><span className="font-black uppercase">CURSO:</span> {student.grado}</div>
                        </div>
                        <div className="bg-slate-50 p-8 rounded-[2rem] space-y-4 text-right">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">RESUMEN DE RENDIMIENTO</h3>
                            <div className="text-2xl font-black text-[#11355a]">PROMEDIO GENERAL: {overallAverage?.toFixed(1) || '--'}</div>
                            <div className="text-lg font-bold text-emerald-600">ASISTENCIA: {attendance.percent}%</div>
                            <div className="text-xs font-black text-slate-400 uppercase">ESTADO: {overallAverage >= 4.0 ? 'SUFICIENTE' : 'EN OBSERVACIÓN'}</div>
                        </div>
                    </div>

                    {/* Print Grades Table */}
                    <div className="mb-12">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-l-4 border-blue-600 pl-4">DESGLOSE DE CALIFICACIONES POR ASIGNATURA</h3>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-[#11355a] text-white">
                                    <th className="p-4 text-left text-xs uppercase font-black">Asignatura</th>
                                    <th className="p-4 text-center text-xs uppercase font-black">Evaluaciones</th>
                                    <th className="p-4 text-center text-xs uppercase font-black">Promedio</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gradesBySubject.map((sub: any, i: number) => (
                                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                        <td className="p-4 text-xs font-black border-b border-slate-100 uppercase">{sub.subject}</td>
                                        <td className="p-4 text-center text-xs font-bold border-b border-slate-100 text-slate-400">{sub.totalEvaluations}</td>
                                        <td className="p-4 text-center border-b border-slate-100">
                                            <span className={`text-sm font-black ${sub.average >= 4.0 ? 'text-slate-800' : 'text-rose-600'}`}>{sub.average?.toFixed(1) || '--'}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid grid-cols-2 gap-10">
                        {/* Print Annotations */}
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-l-4 border-amber-500 pl-4">HOJA DE VIDA Y CONDUCTA</h3>
                            <div className="space-y-4">
                                {annotations.map((a: any, i: number) => (
                                    <div key={i} className="p-4 border border-slate-100 rounded-2xl bg-white shadow-sm">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-black uppercase text-[#11355a]">{a.titulo}</span>
                                            <span className={`text-[8px] font-black uppercase ${a.tipo === 'positiva' ? 'text-emerald-600' : 'text-rose-600'}`}>{a.tipo}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 italic leading-tight">{a.descripcion}</p>
                                        <div className="text-[8px] text-slate-300 font-bold uppercase mt-2">{new Date(a.fecha).toLocaleDateString()} • Por: {a.autor}</div>
                                    </div>
                                ))}
                                {annotations.length === 0 && <p className="text-[10px] text-slate-300 italic">No registra anotaciones este período.</p>}
                            </div>
                        </div>

                        {/* Print Attendance */}
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-l-4 border-emerald-500 pl-4">ESTADÍSTICAS DE ASISTENCIA</h3>
                            <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4">
                                <div className="flex justify-between text-xs">
                                    <span className="font-bold text-slate-500">Días Presentes:</span>
                                    <span className="font-black text-[#11355a]">{attendance.present}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="font-bold text-slate-500">Días Ausentes:</span>
                                    <span className="font-black text-rose-500">{attendance.absent}</span>
                                </div>
                                <div className="flex justify-between text-xs border-t border-slate-200 pt-4">
                                    <span className="font-black text-slate-500 uppercase">Porcentaje Final:</span>
                                    <span className="font-black text-emerald-600 text-lg">{attendance.percent}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Print Footer / Signatures */}
                    <div className="mt-40 grid grid-cols-2 gap-20 text-center">
                        <div className="border-t-2 border-slate-200 pt-8">
                            <div className="text-[10px] font-black uppercase text-slate-400 mb-1">PROFESOR JEFE / JEFE UTP</div>
                            <div className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em]">SISTEMA DIGITAL EINSMART</div>
                        </div>
                        <div className="border-t-2 border-slate-200 pt-8">
                            <div className="text-[10px] font-black uppercase text-slate-400 mb-1">TIMBRE ESTABLECIMIENTO</div>
                            <div className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em]">{school.name}</div>
                        </div>
                    </div>

                    <div className="mt-20 text-center">
                        <p className="text-[8px] text-slate-200 font-black uppercase tracking-[0.5em]">Este documento es un informe de avance académico generado digitalmente y es válido como registro institucional interno.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentReportPage;
