
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
    // const { isTeacher, isSuperAdmin, isSostenedor } = usePermissions();
    usePermissions(); // Hook call needed if logic depends on it, but here it seems unused? 
    // Actually, maybe we only need it for protection?
    // Let's keep the hook call but remove destructured unused vars.
    // If logic doesn't use them, I'll just remove the destructuring.
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
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedCourse && selectedDate) {
            fetchStudentsAndAttendance();
        }
    }, [selectedCourse, selectedDate]);

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
            // Fetch students for course
            const studRes = await api.get(`/estudiantes?cursoId=${selectedCourse}`);
            const studs = studRes.data;
            setStudents(studs);

            // Fetch existing attendance for this date
            // Note: Our listAttendances API filters by tenant. We might need to filter by date/course on client or server.
            // Let's assume listAttendances supports ?fecha=... & ?estudianteId=... or we fetch all and filter client side for now if needed.
            // Better: Add filter support to listAttendance. I added ?fecha support.

            // We need to fetch attendance for ALL students in this course for this date.
            // Since our backend listAttendances might return ALL attendances for tenant if checks aren't strict,
            // let's fetch strictly using logic or assumes we get list.
            // Actually, querying by date is enough if we map by student ID.
            const attRes = await api.get(`/attendance?fecha=${selectedDate}`);
            const existingAtt = attRes.data;

            // Map existing attendance
            const attMap: Record<string, string> = {};
            let p = 0, a = 0, l = 0;

            studs.forEach((s: Student) => {
                // Find record for this student
                const record = existingAtt.find((r: any) => r.estudianteId?._id === s._id || r.estudianteId === s._id);
                const status = record ? record.estado : 'presente'; // Default to present if not set? Or empty?
                // Default to 'presente' makes it easier for teachers (exception based)
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
        const newAtt = { ...attendance, [studentId]: status };
        setAttendance(newAtt);

        // Update local stats
        let p = 0, a = 0, l = 0;
        Object.values(newAtt).forEach(val => {
            if (val === 'presente') p++;
            if (val === 'ausente') a++;
            if (val === 'justificado') l++;
        });
        setStats({ present: p, absent: a, late: l, total: students.length });
    };

    const handleSave = async () => {
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
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-[#11355a] flex items-center gap-3">
                        <CalendarDays size={32} />
                        Control de Asistencia
                    </h1>
                    <p className="text-gray-500 font-medium">Registro diario de asistencia por curso.</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handlePrint}
                        disabled={!selectedCourse || students.length === 0}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-200 transition-all"
                    >
                        <Printer size={20} />
                        Imprimir Lista
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!selectedCourse || students.length === 0}
                        className="bg-[#11355a] text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20"
                    >
                        <Save size={20} />
                        Guardar Asistencia
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 grid gap-6 md:grid-cols-3">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Seleccionar Curso</label>
                    <select
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none font-medium text-gray-700"
                        value={selectedCourse}
                        onChange={e => setSelectedCourse(e.target.value)}
                    >
                        <option value="">-- Curso --</option>
                        {courses.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Fecha</label>
                    <input
                        type="date"
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none font-medium text-gray-700"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                    />
                </div>
                <div className="bg-blue-50/50 rounded-xl p-4 flex items-center justify-between border border-blue-100">
                    <div className="text-center">
                        <div className="text-2xl font-black text-green-600">{stats.present}</div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Presentes</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-black text-red-500">{stats.absent}</div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ausentes</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-black text-yellow-500">{stats.late}</div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Justif.</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-black text-gray-700">{stats.total}</div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total</div>
                    </div>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#11355a]"></div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" ref={printRef}>
                    {/* Print Header - Visible only when printing usually, but here part of div */}
                    <div className="hidden print:block p-8 pb-0 text-center">
                        <h1 className="text-2xl font-bold text-black mb-2">Registro de Asistencia</h1>
                        <p className="text-lg text-gray-600">Curso: {courses.find(c => c._id === selectedCourse)?.name} | Fecha: {selectedDate}</p>
                    </div>

                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest w-1/2">Estudiante</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Asistencia</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {students.map(student => (
                                <tr key={student._id} className="hover:bg-blue-50/10 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-gray-800">
                                            {student.nombres} {student.apellidos}
                                        </div>
                                        <div className="text-xs text-gray-400 font-mono">{student.rut}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2 print:hidden">
                                            <button
                                                onClick={() => handleStatusChange(student._id, 'presente')}
                                                className={`p-2 rounded-lg flex items-center gap-1 transition-all ${attendance[student._id] === 'presente' ? 'bg-green-100 text-green-700 shadow-inner' : 'text-gray-400 hover:bg-gray-100'}`}
                                            >
                                                <CheckCircle2 size={20} />
                                                <span className="text-xs font-bold">Presente</span>
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(student._id, 'ausente')}
                                                className={`p-2 rounded-lg flex items-center gap-1 transition-all ${attendance[student._id] === 'ausente' ? 'bg-red-100 text-red-700 shadow-inner' : 'text-gray-400 hover:bg-gray-100'}`}
                                            >
                                                <XCircle size={20} />
                                                <span className="text-xs font-bold">Ausente</span>
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(student._id, 'justificado')}
                                                className={`p-2 rounded-lg flex items-center gap-1 transition-all ${attendance[student._id] === 'justificado' ? 'bg-yellow-100 text-yellow-700 shadow-inner' : 'text-gray-400 hover:bg-gray-100'}`}
                                            >
                                                <Clock size={20} />
                                                <span className="text-xs font-bold">Justif.</span>
                                            </button>
                                        </div>
                                        {/* Print View Only */}
                                        <div className="hidden print:block text-center text-sm font-bold border border-gray-300 rounded px-2 py-1">
                                            {attendance[student._id]?.toUpperCase() || 'PRESENTE'}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {students.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="px-6 py-12 text-center text-gray-400 font-medium">
                                        Selecciona un curso para ver la lista de estudiantes.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AttendancePage;
