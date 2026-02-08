
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { ArrowLeft, Users, Mail, Download, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';

const CourseStudentsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    usePermissions();
    const [students, setStudents] = useState<any[]>([]);
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Lista-Curso-${course?.name || 'Alumnos'}`,
    });

    useEffect(() => {
        if (id) fetchCourseData();
    }, [id]);

    const fetchCourseData = async () => {
        try {
            // Fetch Course Info
            // Assuming endpoint /courses/:id exists
            await api.get(`/courses/${id}`); // We might need to implement this one if listed in filtered list only. 
            // Usually valid API has GET /courses or we filter from list. Let's assume GET /courses/:id works or we have to filter clientside?
            // Actually, backend usually has GET /courses.
            // Let's rely on getting enrollments filtered by courseId to get students.

            // Getting students:
            // Enrollments are the link. /enrollments?courseId=... 
            // Or use /students?courseId=... if backend supports field filtering on students collection directly (if student has courseId).
            // Usually student has 'curso' string or Enrollment model links them.
            // Let's try fetching Enrollments for this course.
            const enrollRes = await api.get(`/enrollments/course/${id}`); // We have getEnrollmentsByCourse in controller (Step 306 verified)

            // Set data
            // enrollRes.data is array of enrollments populated with student?
            // Checking enrollmentController (Step 306). Yes, getEnrollmentsByCourse.
            // It should populate 'estudianteId'.

            // Set data
            setStudents(enrollRes.data);

            // Robust course naming
            if (enrollRes.data.length > 0) {
                const firstEnroll = enrollRes.data[0];
                const courseInfo = firstEnroll.courseId || {};
                if (courseInfo.name) {
                    setCourse(courseInfo);
                } else {
                    // Try to fetch explicitly if missing or just use first available data
                    setCourse({ _id: id, name: courseInfo.name || 'Curso' });
                }
            }

        } catch (error) {
            console.error('Error fetching course students:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-10 text-center animate-pulse">Cargando lista de curso...</div>;
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto animate-in fade-in duration-500">
            <button
                onClick={() => navigate('/courses')}
                className="flex items-center gap-2 text-slate-400 hover:text-[#11355a] font-bold mb-6 transition-colors"
            >
                <ArrowLeft size={20} />
                Volver a Cursos
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-[#11355a] flex items-center gap-3">
                        <Users size={32} />
                        {course?.name || 'Lista de Curso'}
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">
                        {students.length} Estudiantes Matriculados
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-slate-600 rounded-xl font-black border border-slate-200 hover:bg-slate-50 hover:text-[#11355a] transition-all shadow-sm"
                    >
                        <Printer size={18} /> IMPRIMIR LISTA
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10">
                        <Download size={18} /> EXPORTAR CSV
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden" ref={printRef}>
                {/* Print Header */}
                <div className="hidden print:block p-8 border-b-2 border-black text-center">
                    <h1 className="text-2xl font-bold uppercase">Nómina de Alumnos</h1>
                    <h2 className="text-xl">{course?.name || 'Curso'}</h2>
                    <p className="text-sm mt-2">Fecha: {new Date().toLocaleDateString()}</p>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-[#11355a] text-white">
                        <tr>
                            <th className="px-6 py-4 font-black text-xs uppercase tracking-widest text-center w-16">#</th>
                            <th className="px-6 py-4 font-black text-xs uppercase tracking-widest">Estudiante</th>
                            <th className="px-6 py-4 font-black text-xs uppercase tracking-widest">RUT</th>
                            <th className="px-6 py-4 font-black text-xs uppercase tracking-widest print:hidden">Contacto</th>
                            <th className="px-6 py-4 font-black text-xs uppercase tracking-widest">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {students.map((enrollment, index) => {
                            const student = enrollment.estudianteId || {};
                            return (
                                <tr key={enrollment._id} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="px-6 py-4 text-center font-bold text-slate-400">{index + 1}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-black text-slate-700 text-sm uppercase">
                                            {student.apellidos}, {student.nombres}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-500 font-mono">
                                        {student.rut}
                                    </td>
                                    <td className="px-6 py-4 print:hidden">
                                        <div className="flex flex-col gap-1">
                                            {student.email && (
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                                    <Mail size={12} /> {student.email}
                                                </div>
                                            )}
                                            {/* Telefono usually in Apoderado... logic to fetch apoderado needed if crucial here */}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${enrollment.status === 'confirmada' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {enrollment.status}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {students.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-slate-400 font-bold border-dashed">
                                    No hay alumnos matriculados en este curso.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CourseStudentsPage;
