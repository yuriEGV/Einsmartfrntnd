import { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, BookOpen, Clock, Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';

interface Evaluation {
    _id: string;
    title: string;
    date: string;
    category: 'planificada' | 'sorpresa';
    subjectId: { name: string; _id: string };
    courseId: { name: string; _id: string };
    itemType: 'evaluation';
}

interface Event {
    _id: string;
    title: string;
    description?: string;
    date: string;
    location?: string;
    type: 'evento' | 'reunion' | 'otro';
    itemType: 'event';
}

type CalendarItem = Evaluation | Event;

interface InstitutionalCalendarProps {
    studentId?: string;
    guardianId?: string;
    courseId?: string;
}

const InstitutionalCalendar = ({ studentId, guardianId, courseId }: InstitutionalCalendarProps) => {
    const { user } = useAuth();
    const { tenant } = useTenant();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [items, setItems] = useState<CalendarItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        date: '',
        location: '',
        type: 'evento' as const
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Roles authorized to manage institution-wide events
    const canManageEvents = ['admin', 'sostenedor', 'director', 'utp'].includes(user?.role || '');

    useEffect(() => {
        fetchData();
    }, [currentDate, studentId, guardianId, courseId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (studentId) params.append('studentId', studentId);
            if (guardianId) params.append('guardianId', guardianId);
            if (courseId) params.append('courseId', courseId);

            const [evalRes, eventRes] = await Promise.all([
                api.get(`/evaluations?${params.toString()}`),
                api.get('/events')
            ]);

            const evals = evalRes.data.map((e: any) => ({ ...e, itemType: 'evaluation' }));
            const events = eventRes.data.map((e: any) => ({ ...e, itemType: 'event' }));

            setItems([...evals, ...events]);
        } catch (err) {
            console.error('Error fetching calendar data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/events', newEvent);
            setShowModal(false);
            setNewEvent({ title: '', description: '', date: '', location: '', type: 'evento' });
            fetchData();
        } catch (err) {
            console.error('Error creating event:', err);
            alert('Error al crear el evento');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteEvent = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar este evento?')) return;
        try {
            await api.delete(`/events/${id}`);
            fetchData();
        } catch (err) {
            console.error('Error deleting event:', err);
            alert('Error al eliminar el evento');
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

    const getItemsForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return items.filter(e => e.date.split('T')[0] === dateStr);
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
        days.push(<div key={`empty-${i}`} className="h-32 bg-slate-50/50"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dayItems = getItemsForDate(date);
        const isToday = new Date().toDateString() === date.toDateString();

        days.push(
            <div
                key={day}
                className={`h-32 p-2 border-2 transition-all overflow-hidden ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 hover:border-blue-200'
                    }`}
            >
                <div className={`text-sm font-black mb-1 ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                    {day}
                </div>
                <div className="space-y-1 overflow-y-auto max-h-20 scrollbar-hide">
                    {dayItems.map(item => (
                        <div
                            key={item._id}
                            className={`text-[9px] font-black px-2 py-1 rounded-lg truncate flex items-center justify-between group ${item.itemType === 'evaluation'
                                ? (item.category === 'planificada' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')
                                : 'bg-indigo-100 text-indigo-700'
                                }`}
                            title={item.title}
                        >
                            <span className="truncate flex items-center gap-1">
                                {item.itemType === 'evaluation' ? <BookOpen size={10} /> : <Clock size={10} />}
                                {item.title}
                            </span>
                            {item.itemType === 'event' && canManageEvents && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteEvent(item._id); }}
                                    className="hidden group-hover:block text-indigo-900 hover:text-red-500 transition-colors"
                                >
                                    <X size={10} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-6 md:p-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-blue-600 text-white rounded-3xl shadow-xl shadow-blue-200" style={{ backgroundColor: tenant?.theme?.primaryColor }}>
                        <CalendarIcon size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-[#11355a] capitalize tracking-tighter">{monthName}</h2>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                            Calendario Institucional y Académico
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {canManageEvents && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
                            style={{ backgroundColor: tenant?.theme?.primaryColor }}
                        >
                            <Plus size={18} /> Crear Evento
                        </button>
                    )}
                    <div className="flex gap-2">
                        <button
                            onClick={previousMonth}
                            className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all border border-slate-100"
                        >
                            <ChevronLeft size={20} className="text-slate-600" />
                        </button>
                        <button
                            onClick={nextMonth}
                            className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all border border-slate-100"
                        >
                            <ChevronRight size={20} className="text-slate-600" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-3 mb-3">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                    <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-3">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            {loading ? (
                <div className="flex flex-col justify-center items-center h-96 gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Cargando Agenda...</p>
                </div>
            ) : (
                <div className="grid grid-cols-7 gap-3 rounded-[2rem] overflow-hidden border border-slate-100">
                    {days}
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-6 mt-10 pt-8 border-t border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-emerald-100 border-2 border-emerald-200"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Evaluación Planificada</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-amber-100 border-2 border-amber-200"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Evaluación Sorpresa</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-indigo-100 border-2 border-indigo-200"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Evento / Institucional</span>
                </div>
            </div>

            {/* Modal para Crear Evento */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="px-10 py-8 bg-blue-600 flex items-center justify-between" style={{ backgroundColor: tenant?.theme?.primaryColor }}>
                            <h3 className="text-white font-black uppercase tracking-widest text-lg">Nuevo Evento</h3>
                            <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateEvent} className="p-10 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Título del Evento</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-extrabold text-slate-700"
                                    placeholder="Ej: Reunión de Apoderados"
                                    value={newEvent.title}
                                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Fecha</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-extrabold text-slate-700"
                                        value={newEvent.date}
                                        onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Tipo</label>
                                    <select
                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-extrabold text-slate-700 appearance-none"
                                        value={newEvent.type}
                                        onChange={e => setNewEvent({ ...newEvent, type: e.target.value as any })}
                                    >
                                        <option value="evento">Evento</option>
                                        <option value="reunion">Reunión</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Ubicación</label>
                                <input
                                    type="text"
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-extrabold text-slate-700"
                                    placeholder="Ej: Salón de Actos"
                                    value={newEvent.location}
                                    onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                                style={{ backgroundColor: tenant?.theme?.primaryColor }}
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>Guardar Evento</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstitutionalCalendar;
