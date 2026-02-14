import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { Plus, Trash2, Calendar, Clock, Save, Printer } from 'lucide-react';

interface Schedule {
    _id: string;
    courseId: { _id: string; name: string };
    subjectId: { _id: string; name: string };
    teacherId: { _id: string; name: string };
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

interface Course {
    _id: string;
    name: string;
}

interface Subject {
    _id: string;
    name: string;
    courseId: string;
}

interface Teacher {
    _id: string;
    name: string;
}

const DAYS = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

const ScheduleManagementPage = () => {
    const { isAdmin, isUTP, isDirector, isStudent, isApoderado } = usePermissions();
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>('');

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        courseId: '',
        subjectId: '',
        teacherId: '',
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '09:30'
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedCourse || isStudent || isApoderado) {
            fetchSchedules();
        } else {
            setSchedules([]);
        }
    }, [selectedCourse]);

    const fetchInitialData = async () => {
        try {
            const [courRes, userRes] = await Promise.all([
                api.get('/courses'),
                api.get('/users?role=teacher')
            ]);
            setCourses(courRes.data);
            setTeachers(userRes.data);
        } catch (error) {
            console.error('Error fetching initial data', error);
        }
    };

    const fetchSchedules = async () => {
        try {
            const url = selectedCourse ? `/schedules?courseId=${selectedCourse}` : '/schedules';
            const res = await api.get(url);
            setSchedules(res.data);
        } catch (error) {
            console.error('Error fetching schedules', error);
        }
    };

    const fetchSubjects = async (courseId: string) => {
        try {
            const res = await api.get(`/subjects?courseId=${courseId}`);
            setSubjects(res.data);
        } catch (error) {
            console.error('Error fetching subjects', error);
        }
    };

    const handleCourseChange = (courseId: string) => {
        setSelectedCourse(courseId);
        if (courseId) fetchSubjects(courseId);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/schedules', formData);
            setShowModal(false);
            fetchSchedules();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al guardar horario');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Eliminar este bloque de horario?')) return;
        try {
            await api.delete(`/schedules/${id}`);
            fetchSchedules();
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const canEdit = isAdmin || isUTP || isDirector;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tighter">
                        <Calendar className="text-blue-600" size={32} />
                        Horario Institucional
                    </h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Definición de bloques por curso y asignatura</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePrint}
                        className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-200 transition-all active:scale-95 print:hidden"
                    >
                        <Printer size={18} /> Imprimir
                    </button>
                    {canEdit && selectedCourse && (
                        <button
                            onClick={() => {
                                setFormData({
                                    courseId: selectedCourse,
                                    subjectId: '',
                                    teacherId: '',
                                    dayOfWeek: 1,
                                    startTime: '08:00',
                                    endTime: '09:30'
                                });
                                fetchSubjects(selectedCourse); // Load subjects when modal opens
                                setShowModal(true);
                            }}
                            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95"
                        >
                            <Plus size={18} /> Agregar Bloque
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                {(!isStudent && !isApoderado) && (
                    <div className="max-w-md print:hidden">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">SELECCIONAR CURSO PARA GESTIONAR</label>
                        <select
                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none font-black text-slate-700 appearance-none shadow-inner"
                            value={selectedCourse}
                            onChange={(e) => handleCourseChange(e.target.value)}
                        >
                            <option value="">Elegir un curso...</option>
                            {courses.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {(!selectedCourse && !isStudent && !isApoderado) ? (
                    <div className="py-20 text-center border-4 border-dashed border-slate-50 rounded-[3rem]">
                        <Calendar size={64} className="mx-auto text-slate-100 mb-6" />
                        <p className="text-slate-300 font-black uppercase tracking-[0.2em] text-sm">Selecciona un curso para ver su horario</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map(dayNum => (
                            <div key={dayNum} className="space-y-4">
                                <div className="bg-[#11355a] p-4 rounded-2xl text-center shadow-lg">
                                    <h3 className="text-white font-black uppercase text-[10px] tracking-widest">{DAYS[dayNum]}</h3>
                                </div>
                                <div className="space-y-3">
                                    {schedules.filter(s => s.dayOfWeek === dayNum).map(s => (
                                        <div key={s._id} className="bg-white p-4 rounded-2xl border-2 border-slate-50 hover:border-blue-100 hover:shadow-xl transition-all group relative">
                                            <div className="flex items-center gap-2 text-blue-600 mb-2">
                                                <Clock size={14} />
                                                <span className="text-[10px] font-black">{s.startTime} - {s.endTime}</span>
                                            </div>
                                            <h4 className="font-black text-slate-800 text-xs uppercase leading-tight mb-1">{s.subjectId?.name}</h4>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{s.teacherId?.name}</p>

                                            {canEdit && (
                                                <button
                                                    onClick={() => handleDelete(s._id)}
                                                    className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {schedules.filter(s => s.dayOfWeek === dayNum).length === 0 && (
                                        <div className="py-8 text-center bg-slate-50/50 rounded-2xl border-2 border-dotted border-slate-100">
                                            <p className="text-[9px] font-black text-slate-300 uppercase italic">Sin clases</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Agregar Bloque */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[999] md:pl-[300px] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl border-8 border-white animate-in zoom-in-95 duration-500">
                        <div className="p-10 bg-[#11355a] text-white relative overflow-hidden">
                            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none mb-2 relative z-10">Nuevo Bloque</h2>
                            <p className="text-blue-300 font-bold uppercase text-[10px] tracking-widest relative z-10">Asignar tiempo a la jornada</p>
                        </div>
                        <form onSubmit={handleSave} className="p-10 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">ASIGNATURA</label>
                                    <select
                                        required
                                        className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-black text-slate-700"
                                        value={formData.subjectId}
                                        onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {subjects.map(s => (
                                            <option key={s._id} value={s._id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">PROFESOR</label>
                                    <select
                                        required
                                        className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-black text-slate-700"
                                        value={formData.teacherId}
                                        onChange={e => setFormData({ ...formData, teacherId: e.target.value })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {teachers.map(t => (
                                            <option key={t._id} value={t._id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">DÍA</label>
                                    <select
                                        className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-black text-slate-700"
                                        value={formData.dayOfWeek}
                                        onChange={e => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                                    >
                                        {[1, 2, 3, 4, 5].map(d => (
                                            <option key={d} value={d}>{DAYS[d]}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">INICIO</label>
                                        <input
                                            type="time"
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-black"
                                            value={formData.startTime}
                                            onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">FIN</label>
                                        <input
                                            type="time"
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-black"
                                            value={formData.endTime}
                                            onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6 flex gap-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                                <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2">
                                    <Save size={18} /> Guardar Bloque
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduleManagementPage;
