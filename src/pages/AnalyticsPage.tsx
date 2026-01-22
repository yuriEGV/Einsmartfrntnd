import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTenant } from '../context/TenantContext';
import { Trophy, ThumbsUp, ThumbsDown, BarChart3, Target, Star } from 'lucide-react';

const AnalyticsPage = () => {
    const { tenant } = useTenant();
    const [loading, setLoading] = useState(true);
    const [topStudents, setTopStudents] = useState([]);
    const [annotationRankings, setAnnotationRankings] = useState<any>(null);
    const [studentAnalytics, setStudentAnalytics] = useState([]);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const [topRes, annotRes, studentRes] = await Promise.all([
                api.get('/analytics/top-students?limit=10'),
                api.get('/analytics/annotations-ranking'),
                api.get('/analytics/students')
            ]);
            setTopStudents(topRes.data);
            setAnnotationRankings(annotRes.data);
            setStudentAnalytics(studentRes.data);
        } catch (err) {
            console.error('Error fetching analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black text-gray-800 flex items-center gap-3">
                    <BarChart3 size={40} className="text-blue-600" />
                    Análisis de Rendimiento Académico
                </h1>
                <p className="text-gray-500 text-lg mt-2">Métricas de estudiantes, promedios y comportamiento</p>
            </div>

            {/* Top Students - Best Averages */}
            <div className="bg-white rounded-3xl shadow-2xl border overflow-hidden">
                <div
                    className="px-8 py-5 flex items-center justify-between"
                    style={{ backgroundColor: tenant?.theme?.primaryColor || '#11355a' }}
                >
                    <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
                        <Trophy size={24} className="text-yellow-300" />
                        Top 10 - Mejores Promedios del Colegio
                    </h2>
                </div>
                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {topStudents.map((student: any, index: number) => (
                            <div
                                key={student._id}
                                className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-100 hover:shadow-lg transition-all"
                            >
                                <div className="flex-shrink-0">
                                    {index < 3 ? (
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl
                                            ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' : ''}
                                            ${index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' : ''}
                                            ${index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' : ''}
                                        `}>
                                            {index + 1}°
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-black text-2xl">
                                            {index + 1}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="font-black text-gray-800 text-lg">{student.studentName}</div>
                                    <div className="text-xs text-gray-500 font-bold uppercase">{student.grado}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black text-blue-600">{student.overallAverage.toFixed(2)}</div>
                                    <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Promedio</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Annotation Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Most Positive */}
                <div className="bg-white rounded-3xl shadow-2xl border overflow-hidden">
                    <div className="px-8 py-5 bg-gradient-to-r from-green-600 to-emerald-600">
                        <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
                            <ThumbsUp size={24} />
                            Mejores Conductas (Anotaciones Positivas)
                        </h2>
                    </div>
                    <div className="p-6 space-y-3">
                        {annotationRankings?.mostPositive.map((student: any, index: number) => (
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
                        ))}
                    </div>
                </div>

                {/* Most Negative */}
                <div className="bg-white rounded-3xl shadow-2xl border overflow-hidden">
                    <div className="px-8 py-5 bg-gradient-to-r from-rose-600 to-red-600">
                        <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
                            <ThumbsDown size={24} />
                            Necesitan Apoyo (Anotaciones Negativas)
                        </h2>
                    </div>
                    <div className="p-6 space-y-3">
                        {annotationRankings?.mostNegative.map((student: any, index: number) => (
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
                        ))}
                    </div>
                </div>
            </div>

            {/* Student Performance Table */}
            <div className="bg-white rounded-3xl shadow-2xl border overflow-hidden">
                <div
                    className="px-8 py-5 flex items-center justify-between"
                    style={{ backgroundColor: tenant?.theme?.primaryColor || '#11355a' }}
                >
                    <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
                        <Target size={24} className="text-blue-300" />
                        Rendimiento por Estudiante y Materia
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
                            {studentAnalytics.slice(0, 20).map((student: any) => (
                                <tr key={student._id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-800">{student.studentName}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-2">
                                            {student.subjectAverages.map((subject: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className={`px-3 py-1 rounded-full text-xs font-bold ${subject.average >= 4.0
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-rose-100 text-rose-700'
                                                        }`}
                                                >
                                                    {subject.subject}: {subject.average.toFixed(1)}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className={`text-2xl font-black ${student.overallAverage >= 4.0 ? 'text-emerald-600' : 'text-rose-600'
                                            }`}>
                                            {student.overallAverage.toFixed(2)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${student.passingStatus === 'Aprueba'
                                            ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                                            : 'bg-rose-100 text-rose-700 border-2 border-rose-300'
                                            }`}>
                                            {student.passingStatus}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
