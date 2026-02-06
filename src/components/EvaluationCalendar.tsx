import { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

interface Evaluation {
    _id: string;
    title: string;
    date: string;
    category: 'planificada' | 'sorpresa';
    subjectId: { name: string; _id: string };
    courseId: { name: string; _id: string };
}

interface EvaluationCalendarProps {
    studentId?: string;
    guardianId?: string;
    courseId?: string;
}

const EvaluationCalendar = ({ studentId, guardianId, courseId }: EvaluationCalendarProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvaluations();
    }, [currentDate, studentId, guardianId, courseId]);

    const fetchEvaluations = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (studentId) params.append('studentId', studentId);
            if (guardianId) params.append('guardianId', guardianId);
            if (courseId) params.append('courseId', courseId);

            const res = await api.get(`/evaluations?${params.toString()}`);
            setEvaluations(res.data);
        } catch (err) {
            console.error('Error fetching evaluations:', err);
        } finally {
            setLoading(false);
        }
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        return { daysInMonth, startingDayOfWeek };
    };

    const getEvaluationsForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return evaluations.filter(e => e.date.split('T')[0] === dateStr);
    };

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(<div key={`empty-${i}`} className="h-24 bg-slate-50/50"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dayEvaluations = getEvaluationsForDate(date);
        const isToday = new Date().toDateString() === date.toDateString();

        days.push(
            <div
                key={day}
                className={`h-24 p-2 border-2 transition-all ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 hover:border-blue-200'
                    }`}
            >
                <div className={`text-sm font-black mb-1 ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                    {day}
                </div>
                <div className="space-y-1 overflow-y-auto max-h-16">
                    {dayEvaluations.map(ev => (
                        <div
                            key={ev._id}
                            className={`text-[9px] font-bold px-2 py-1 rounded-lg truncate ${ev.category === 'planificada'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                                }`}
                            title={`${ev.title} - ${ev.subjectId.name}`}
                        >
                            <BookOpen size={10} className="inline mr-1" />
                            {ev.title}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-2xl">
                        <CalendarIcon size={28} className="text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-[#11355a] capitalize">{monthName}</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                            Calendario de Evaluaciones
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={previousMonth}
                        className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
                    >
                        <ChevronLeft size={20} className="text-slate-600" />
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
                    >
                        <ChevronRight size={20} className="text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                    <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            {loading ? (
                <div className="flex justify-center items-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-7 gap-2">
                    {days}
                </div>
            )}

            {/* Legend */}
            <div className="flex gap-4 mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-emerald-100 border-2 border-emerald-200"></div>
                    <span className="text-xs font-bold text-slate-600">Planificada</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-amber-100 border-2 border-amber-200"></div>
                    <span className="text-xs font-bold text-slate-600">Sorpresa</span>
                </div>
            </div>
        </div>
    );
};

export default EvaluationCalendar;
