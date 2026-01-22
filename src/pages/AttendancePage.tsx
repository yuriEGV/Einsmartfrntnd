
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { useReactToPrint } from 'react-to-print';
import {
    CalendarDays,
    Save,
    Printer,
    CheckCircle2,
    XCircle,
    Clock,
} from 'lucide-react';

interface Course {
    _id: string;
    name: string;
}

interface Student {
    _id: string;
    nombres: string;
    apellidos: string;
    rut: string;
}

const AttendancePage = () => {
    const permissions = usePermissions();
    const isStudentOrGuardian = permissions.user?.role === 'student' || permissions.user?.role === 'apoderado';

    const [courses, setCourses] = useState<Course[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    // Stats
    const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0 });

    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isStudentOrGuardian) {
            fetchCourses();
        } else {
            fetchStudentsAndAttendance();
        }
    }, [isStudentOrGuardian]);

    useEffect(() => {
        if (selectedCourse && selectedDate && !isStudentOrGuardian) {
            fetchStudentsAndAttendance();
        }
    }, [selectedCourse, selectedDate, isStudentOrGuardian]);

    const fetchCourses = async () => {
        try {
            const response = await api.get('/courses');
            setCourses(response.data);
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const fetchStudentsAndAttendance = async () => {
        setLoading(true);
        try {
            let studs = [];
            if (isStudentOrGuardian) {
                // Fetch student records (will only return own student)
                const stdRes = await api.get('/estudiantes');
                studs = stdRes.data;
            } else {
                const studRes = await api.get(`/estudiantes?cursoId=${selectedCourse}`);
                studs = studRes.data;
            }
            setStudents(studs);

            const attRes = await api.get(`/attendance?fecha=${selectedDate}`);
            const existingAtt = attRes.data;

            const attMap: Record<string, string> = {};
            let p = 0, a = 0, l = 0;

            studs.forEach((s: Student) => {
                const record = existingAtt.find((r: any) => r.estudianteId?._id === s._id || r.estudianteId === s._id);
                const status = record ? record.estado : (isStudentOrGuardian ? '-' : 'presente');
                attMap[s._id] = status;

                if (status === 'presente') p++;
                if (status === 'ausente') a++;
                if (status === 'justificado') l++;
            });

            setAttendance(attMap);
            setStats({ present: p, absent: a, late: l, total: studs.length });

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (studentId: string, status: string) => {
        if (isStudentOrGuardian) return;
        const newAtt = { ...attendance, [studentId]: status };
        setAttendance(newAtt);

        let p = 0, a = 0, l = 0;
        Object.values(newAtt).forEach(val => {
            if (val === 'presente') p++;
            if (val === 'ausente') a++;
            if (val === 'justificado') l++;
        });
        setStats({ present: p, absent: a, late: l, total: students.length });
    };

    const handleSave = async () => {
        if (isStudentOrGuardian) return;
        try {
            const payload = {
                courseId: selectedCourse,
                fecha: selectedDate,
                students: Object.entries(attendance).map(([estudianteId, estado]) => ({
                    estudianteId,
                    estado
                }))
            };

            await api.post('/attendance/bulk', payload);
            alert('Asistencia guardada correctamente');
        } catch (error) {
            console.error(error);
            alert('Error al guardar asistencia');
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Asistencia-${selectedCourse}-${selectedDate}`,
    });

    return (
        <div className="p-4 md:p-10 space-y-6 md:space-y-10 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100/50">
                            <CalendarDays size={32} className="text-[#11355a] md:w-10 md:h-10" />
                        </div>
                        {isStudentOrGuardian ? 'Mi Asistencia' : 'Pase de Lista'}
                    </h1>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2 ml-1">
                        {isStudentOrGuardian ? 'BITÁCORA DE PRESENCIA DIARIA' : 'REGISTRO ACADÉMICO DE ASISTENCIA'}
                    </p>
                </div>

                {!isStudentOrGuardian && (
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <button
                            onClick={handlePrint}
                            disabled={!selectedCourse || students.length === 0}
                            className="bg-white text-slate-600 px-6 py-4 rounded-[1.5rem] font-black flex items-center justify-center gap-3 hover:bg-slate-50 transition-all border border-slate-100 uppercase text-[11px] tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Printer size={20} />
                            Generar PDF
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!selectedCourse || students.length === 0}
                            className="bg-[#11355a] text-white px-8 py-4 rounded-[1.5rem] font-black flex items-center justify-center gap-3 hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/20 active:scale-95 uppercase text-[11px] tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={20} />
                            Guardar Registro
                        </button>
                    </div>
                )}
            </div>

            {/* Premium Controls */}
            <div className="grid gap-6 md:grid-cols-3">
                {!isStudentOrGuardian ? (
                    <>
                        <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-50 group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">CURSO / NIVEL</label>
                            <select
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-black text-slate-700 transition-all group-focus-within:border-blue-400"
                                value={selectedCourse}
                                onChange={e => setSelectedCourse(e.target.value)}
                            >
                                <option value="">Seleccionar Curso</option>
                                {courses.map(c => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-50 group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">FECHA DEL REGISTRO</label>
                            <input
                                type="date"
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-black text-slate-700 transition-all group-focus-within:border-blue-400"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                            />
                        </div>
                        <div className="bg-gradient-to-br from-[#11355a] to-[#1e4e83] rounded-[2rem] p-6 shadow-2xl shadow-blue-900/20 flex items-center justify-around border-4 border-white">
                            <div className="text-center group">
                                <div className="text-3xl font-black text-emerald-400 group-hover:scale-110 transition-transform">{stats.present}</div>
                                <div className="text-[8px] font-black text-blue-100 uppercase tracking-widest mt-1 opacity-70">Presentes</div>
                            </div>
                            <div className="w-px h-10 bg-white/10"></div>
                            <div className="text-center group">
                                <div className="text-3xl font-black text-rose-400 group-hover:scale-110 transition-transform">{stats.absent}</div>
                                <div className="text-[8px] font-black text-blue-100 uppercase tracking-widest mt-1 opacity-70">Ausentes</div>
                            </div>
                            <div className="w-px h-10 bg-white/10"></div>
                            <div className="text-center group">
                                <div className="text-3xl font-black text-amber-400 group-hover:scale-110 transition-transform">{stats.late}</div>
                                <div className="text-[8px] font-black text-blue-100 uppercase tracking-widest mt-1 opacity-70">Justif.</div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="md:col-span-3 bg-white p-8 rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-slate-50 flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Consulta de Historial</h3>
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest inline-block mt-1">Sincronizado en tiempo real</p>
                        </div>
                        <div className="w-full md:w-auto flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 hidden md:block">CAMBIAR FECHA:</span>
                            <input
                                type="date"
                                className="px-6 py-3 bg-white border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none font-black text-slate-700 shadow-sm"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Attendance View - Premium Hybrid (Card for Mobile, Refined Table for Desktop) */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 animate-pulse">
                    <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Actualizando nómina...</p>
                </div>
            ) : (
                <div className="space-y-4" ref={printRef}>
                    {/* Print Only Header */}
                    <div className="hidden print:block p-10 text-center border-b-4 border-slate-900 mb-10">
                        <div className="flex justify-between items-center mb-6">
                            <div className="text-left">
                                <h1 className="text-3xl font-black uppercase tracking-tighter">REGISTRO DE ASISTENCIA</h1>
                                <p className="text-blue-600 font-black text-sm">SISTEMA DE GESTIÓN EDUCATIVA EINSMART</p>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-black uppercase">{courses.find(c => c._id === selectedCourse)?.name}</div>
                                <div className="text-slate-500 font-bold">FECHA: {selectedDate}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mt-8">
                            <div className="border p-4 rounded-xl"><div className="text-2xl font-black">{stats.total}</div><div className="text-[8px] font-black uppercase text-slate-400">Total</div></div>
                            <div className="border p-4 rounded-xl text-emerald-600"><div className="text-2xl font-black">{stats.present}</div><div className="text-[8px] font-black uppercase text-slate-400">Presentes</div></div>
                            <div className="border p-4 rounded-xl text-rose-600"><div className="text-2xl font-black">{stats.absent}</div><div className="text-[8px] font-black uppercase text-slate-400">Ausentes</div></div>
                            <div className="border p-4 rounded-xl text-amber-600"><div className="text-2xl font-black">{stats.late}</div><div className="text-[8px] font-black uppercase text-slate-400">Justificados</div></div>
                        </div>
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-slate-100 overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Nombre del Estudiante</th>
                                    <th className="px-10 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Estado de Presencia</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-50">
                                {students.map((student) => (
                                    <tr key={student._id} className="group hover:bg-blue-50/20 transition-all duration-300">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#11355a] flex items-center justify-center font-black group-hover:bg-[#11355a] group-hover:text-white transition-all shadow-sm">
                                                    {student.nombres.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-lg font-black text-slate-700 tracking-tight flex items-center gap-2">
                                                        {student.nombres} {student.apellidos}
                                                    </div>
                                                    <div className="text-[10px] text-blue-500 font-black font-mono tracking-tighter opacity-60 uppercase">
                                                        ID: {student.rut}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            {!isStudentOrGuardian ? (
                                                <div className="flex justify-center gap-2 print:hidden">
                                                    <button
                                                        onClick={() => handleStatusChange(student._id, 'presente')}
                                                        className={`px-5 py-3 rounded-2xl flex items-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest border-2
                                                            ${attendance[student._id] === 'presente'
                                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-lg shadow-emerald-500/10 scale-105'
                                                                : 'bg-white border-slate-100 text-slate-300 hover:border-emerald-200 hover:text-emerald-500'}`}
                                                    >
                                                        <CheckCircle2 size={18} /> Presente
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(student._id, 'ausente')}
                                                        className={`px-5 py-3 rounded-2xl flex items-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest border-2
                                                            ${attendance[student._id] === 'ausente'
                                                                ? 'bg-rose-50 border-rose-500 text-rose-600 shadow-lg shadow-rose-500/10 scale-105'
                                                                : 'bg-white border-slate-100 text-slate-300 hover:border-rose-200 hover:text-rose-500'}`}
                                                    >
                                                        <XCircle size={18} /> Ausente
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(student._id, 'justificado')}
                                                        className={`px-5 py-3 rounded-2xl flex items-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest border-2
                                                            ${attendance[student._id] === 'justificado'
                                                                ? 'bg-amber-50 border-amber-500 text-amber-600 shadow-lg shadow-amber-500/10 scale-105'
                                                                : 'bg-white border-slate-100 text-slate-300 hover:border-amber-200 hover:text-amber-500'}`}
                                                    >
                                                        <Clock size={18} /> Justif.
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <span className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border-2
                                                        ${attendance[student._id] === 'presente' ? 'bg-emerald-50 border-emerald-500 text-emerald-600' :
                                                            attendance[student._id] === 'ausente' ? 'bg-rose-50 border-rose-500 text-rose-600' :
                                                                attendance[student._id] === 'justificado' ? 'bg-amber-50 border-amber-500 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-400'
                                                        }`}>
                                                        {attendance[student._id] || 'Pendiente'}
                                                    </span>
                                                </div>
                                            )}
                                            {/* Print View Status */}
                                            <div className="hidden print:block text-center font-black uppercase text-sm">
                                                {attendance[student._id] || 'PRESENTE'}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card-Based View */}
                    <div className="md:hidden grid gap-4">
                        {students.map((student, idx) => (
                            <div
                                key={student._id}
                                className="bg-white p-6 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100 space-y-6 active:scale-[0.98] transition-all"
                                style={{ animationDelay: `${idx * 40}ms` }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-[#11355a] text-white flex items-center justify-center font-black text-xl shadow-lg border-2 border-white">
                                        {student.nombres.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-lg font-black text-slate-800 uppercase tracking-tighter truncate">{student.nombres} {student.apellidos}</div>
                                        <div className="text-[9px] font-black text-blue-500 font-mono tracking-widest opacity-60">ID: {student.rut}</div>
                                    </div>
                                    {isStudentOrGuardian && (
                                        <span className={`px-4 py-1.5 rounded-full font-black text-[8px] uppercase tracking-widest border
                                            ${attendance[student._id] === 'presente' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                                attendance[student._id] === 'ausente' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                                                    attendance[student._id] === 'justificado' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400'
                                            }`}>
                                            {attendance[student._id] || '---'}
                                        </span>
                                    )}
                                </div>

                                {!isStudentOrGuardian && (
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => handleStatusChange(student._id, 'presente')}
                                            className={`py-6 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border-4 relative overflow-hidden
                                                ${attendance[student._id] === 'presente'
                                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-lg shadow-emerald-500/10'
                                                    : 'bg-slate-50 border-transparent text-slate-300'}`}
                                        >
                                            <CheckCircle2 size={24} />
                                            <span className="text-[8px] font-black uppercase tracking-widest">Presente</span>
                                            {attendance[student._id] === 'presente' && <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500 text-white rounded-bl-xl flex items-center justify-center font-black">✓</div>}
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange(student._id, 'ausente')}
                                            className={`py-6 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border-4 relative overflow-hidden
                                                ${attendance[student._id] === 'ausente'
                                                    ? 'bg-rose-50 border-rose-500 text-rose-600 shadow-lg shadow-rose-500/10'
                                                    : 'bg-slate-50 border-transparent text-slate-300'}`}
                                        >
                                            <XCircle size={24} />
                                            <span className="text-[8px] font-black uppercase tracking-widest">Ausente</span>
                                            {attendance[student._id] === 'ausente' && <div className="absolute top-0 right-0 w-8 h-8 bg-rose-500 text-white rounded-bl-xl flex items-center justify-center font-black">✕</div>}
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange(student._id, 'justificado')}
                                            className={`py-6 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border-4 relative overflow-hidden
                                                ${attendance[student._id] === 'justificado'
                                                    ? 'bg-amber-50 border-amber-500 text-amber-600 shadow-lg shadow-amber-500/10'
                                                    : 'bg-slate-50 border-transparent text-slate-300'}`}
                                        >
                                            <Clock size={24} />
                                            <span className="text-[8px] font-black uppercase tracking-widest">Justif.</span>
                                            {attendance[student._id] === 'justificado' && <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500 text-white rounded-bl-xl flex items-center justify-center font-black">!</div>}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {students.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-blue-900/5">
                            <CalendarDays size={64} className="text-slate-200 mb-6" />
                            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Sin Estudiantes</h3>
                            <p className="text-[10px] font-bold text-slate-300 mt-2 uppercase tracking-widest px-10">Selecciona un curso válido para iniciar el registro diario.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AttendancePage;
