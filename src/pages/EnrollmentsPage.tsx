import { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { useTenant } from '../context/TenantContext';
import {
    UserPlus, Search, BookOpen, ShieldAlert, AlertCircle,
    DollarSign, UserCheck, CreditCard, ChevronRight, Save
} from 'lucide-react';
import { validateRut, formatRut } from '../services/utils';

interface Course {
    _id: string;
    name: string;
    code?: string;
    teacherId?: { name: string };
}

interface Enrollment {
    _id: string;
    estudianteId: { nombres: string; apellidos: string };
    courseId: { name: string; code: string };
    period: string;
    status: string;
    fee: number;
    createdAt: string;
}

const EnrollmentsPage = () => {
    const permissions = usePermissions();
    const { tenant } = useTenant();
    const [courses, setCourses] = useState<Course[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [activeTab, setActiveTab] = useState<'list' | 'new'>('list');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [searchTermStudent, setSearchTermStudent] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [searchTermGuardian, setSearchTermGuardian] = useState('');
    const [guardians, setGuardians] = useState<any[]>([]);
    const [tariffs, setTariffs] = useState<any[]>([]);
    const [selectedTariffs, setSelectedTariffs] = useState<string[]>([]);

    // State for toggle
    const [isNewStudent, setIsNewStudent] = useState(false);
    const [isNewGuardian, setIsNewGuardian] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        studentId: '',
        apoderadoId: '',
        courseId: '',
        period: new Date().getFullYear().toString(),
        status: 'confirmada',
        fee: 0,
        notes: '',
        metodoPago: 'transferencia',
        // Direct creation data
        newStudent: { nombres: '', apellidos: '', rut: '', email: '', grado: '', edad: 0, direccion: '' },
        newGuardian: { nombre: '', apellidos: '', rut: '', correo: '', telefono: '', direccion: '', parentesco: 'Padre' }
    });

    useEffect(() => {
        if (permissions.canManageEnrollments) {
            fetchCourses();
            fetchEnrollments();
            fetchStudents();
            fetchGuardians();
            fetchTariffs();
        }
    }, [permissions.canManageEnrollments]);

    useEffect(() => {
        if (tenant) {
            setFormData(prev => ({
                ...prev,
                period: tenant.academicYear || prev.period,
                fee: tenant.annualFee || prev.fee
            }));
        }
    }, [tenant]);

    const fetchStudents = async () => {
        try {
            const res = await api.get('/estudiantes');
            setStudents(res.data);
        } catch (err) {
            console.error('Error fetching students:', err);
        }
    };

    const fetchCourses = async () => {
        try {
            const res = await api.get('/courses');
            setCourses(res.data);
        } catch (err) {
            console.error('Error fetching courses:', err);
        }
    };

    const fetchGuardians = async () => {
        try {
            const res = await api.get('/apoderados');
            setGuardians(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchTariffs = async () => {
        try {
            const res = await api.get('/tariffs');
            setTariffs(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchEnrollments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/enrollments');
            setEnrollments(res.data);
        } catch (err) {
            console.error('Error fetching enrollments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendInstitutionalList = async () => {
        if (!window.confirm('¿Desea enviar el listado completo de alumnos matriculados al sostenedor para la creación de correos institucionales?')) return;
        setLoading(true);
        try {
            const res = await api.post('/enrollments/send-institutional-list');
            alert(res.data.message);
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || 'Error al enviar el listado');
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation for New Student
        if (isNewStudent) {
            if (!formData.newStudent.nombres.trim() || !formData.newStudent.rut.trim()) {
                alert('Por favor complete el nombre y RUT del alumno.');
                return;
            }
            if (!validateRut(formData.newStudent.rut)) {
                alert('El RUT del alumno no es válido.');
                return;
            }
        } else if (!formData.studentId) {
            alert('Por favor seleccione un estudiante o elija la opción "Matricular Nuevo".');
            return;
        }

        if (isNewGuardian && formData.newGuardian.rut) {
            if (!validateRut(formData.newGuardian.rut)) {
                alert('El RUT del apoderado no es válido.');
                return;
            }
        }

        if (!formData.courseId) {
            alert('Debe asignar un curso.');
            return;
        }

        setLoading(true);
        try {
            const enrollmentData = {
                ...formData,
                status: 'confirmada',
                tariffIds: selectedTariffs,
                // Include apoderadoId explicitly if not new
                apoderadoId: isNewGuardian ? undefined : formData.apoderadoId
            };
            await api.post('/enrollments', enrollmentData);
            alert('¡Matrícula exitosa!');
            setFormData({
                studentId: '',
                apoderadoId: '',
                courseId: '',
                period: new Date().getFullYear().toString(),
                status: 'confirmada',
                fee: 0,
                notes: '',
                metodoPago: 'transferencia',
                newStudent: { nombres: '', apellidos: '', rut: '', email: '', grado: '', edad: 0, direccion: '' },
                newGuardian: { nombre: '', apellidos: '', rut: '', correo: '', telefono: '', direccion: '', parentesco: 'Padre' }
            });
            setSearchTermStudent('');
            setActiveTab('list');
            fetchEnrollments();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || 'Error en matrícula');
        } finally {
            setLoading(false);
        }
    };

    const filteredEnrollments = enrollments.filter(e =>
        (e.estudianteId?.nombres + ' ' + e.estudianteId?.apellidos).toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.courseId?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredStudents = students.filter(s =>
        (s.nombres + ' ' + s.apellidos + ' ' + (s.rut || '')).toLowerCase().includes(searchTermStudent.toLowerCase())
    );

    const filteredGuardians = guardians.filter(g =>
        (g.nombre + ' ' + g.apellidos + ' ' + (g.rut || '')).toLowerCase().includes(searchTermGuardian.toLowerCase())
    );

    if (!permissions.canManageEnrollments) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center animate-in fade-in duration-500">
                <div className="bg-rose-50 p-6 rounded-full mb-6">
                    <ShieldAlert size={64} className="text-rose-500" />
                </div>
                <h1 className="text-3xl font-black text-gray-800 mb-2 underline decoration-rose-500 decoration-4">ACCESO RESTRINGIDO</h1>
                <p className="text-gray-500 max-w-sm">Esta sección es para uso exclusivo del personal administrativo y docente.</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-xl md:text-3xl font-extrabold text-[#11355a] flex items-center gap-2 md:gap-3">
                        <UserPlus size={24} className="md:w-8 md:h-8" />
                        Matrículas
                    </h1>
                    <p className="text-gray-500 mt-1 text-xs md:text-lg">Inscripciones y periodos académicos.</p>
                </div>

                <div className="flex w-full md:w-auto bg-white rounded-2xl shadow-sm border p-1.5 flex-wrap gap-2">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('list')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'list' ? 'bg-[#11355a] text-white shadow-xl shadow-blue-900/20' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            LISTADO
                        </button>
                        <button
                            onClick={() => setActiveTab('new')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'new' ? 'bg-[#11355a] text-white shadow-xl shadow-blue-900/20' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            NUEVA
                        </button>
                    </div>
                    {permissions.isSuperAdmin && activeTab === 'list' && (
                        <button
                            onClick={handleSendInstitutionalList}
                            className="px-6 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2"
                        >
                            <Save size={14} />
                            Enviar Listado Institucional
                        </button>
                    )}
                </div>
            </div>

            {activeTab === 'new' ? (
                <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="lg:col-span-2 space-y-4 md:space-y-6 order-2 lg:order-1">
                        {/* Student Info Card */}
                        <div className="bg-white rounded-2xl shadow-xl border-t-4 border-[#11355a] p-3 md:p-8">
                            <div className="flex justify-between items-center mb-6 border-b pb-4">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <UserCheck className="text-blue-600" />
                                    Datos del Estudiante
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setIsNewStudent(!isNewStudent)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${isNewStudent ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-blue-600 text-blue-600 hover:bg-blue-50'}`}
                                >
                                    {isNewStudent ? 'Matricular Existente' : 'Matricular Nuevo'}
                                </button>
                            </div>

                            {!isNewStudent ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="relative">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Buscar Estudiante Existente</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                            <input
                                                placeholder="Nombre o RUT..."
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:bg-white transition-all outline-none shadow-inner font-bold"
                                                value={searchTermStudent}
                                                onChange={e => {
                                                    setSearchTermStudent(e.target.value);
                                                    if (formData.studentId) setFormData({ ...formData, studentId: '' });
                                                }}
                                            />
                                        </div>
                                        {searchTermStudent && !formData.studentId && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                                                {filteredStudents.length > 0 ? filteredStudents.map(s => (
                                                    <button
                                                        key={s._id}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData({ ...formData, studentId: s._id });
                                                            setSearchTermStudent(`${s.nombres} ${s.apellidos}`);
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b last:border-0"
                                                    >
                                                        <div className="font-bold text-sm">{s.nombres} {s.apellidos}</div>
                                                        <div className="text-[10px] text-gray-400">{s.rut}</div>
                                                    </button>
                                                )) : (
                                                    <div className="px-4 py-4 text-center text-gray-400 text-sm">No encontrado</div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Periodo Académico</label>
                                        <select
                                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:bg-white transition-all outline-none shadow-inner font-bold"
                                            value={formData.period}
                                            onChange={e => setFormData({ ...formData, period: e.target.value })}
                                        >
                                            <option value={formData.period}>{formData.period} (Institucional)</option>
                                            <option value="2024">2024</option>
                                            <option value="2025">2025</option>
                                            <option value="2026">2026</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 mb-6 animate-in fade-in duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input
                                            placeholder="Nombres"
                                            maxLength={50}
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 font-bold"
                                            value={formData.newStudent.nombres}
                                            onChange={e => setFormData({ ...formData, newStudent: { ...formData.newStudent, nombres: e.target.value } })}
                                        />
                                        <input
                                            placeholder="Apellidos"
                                            maxLength={50}
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 font-bold"
                                            value={formData.newStudent.apellidos}
                                            onChange={e => setFormData({ ...formData, newStudent: { ...formData.newStudent, apellidos: e.target.value } })}
                                        />
                                        <input
                                            placeholder="RUT (ej: 12.345.678-9)"
                                            maxLength={12}
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 font-bold"
                                            value={formData.newStudent.rut}
                                            onChange={e => setFormData({ ...formData, newStudent: { ...formData.newStudent, rut: formatRut(e.target.value) } })}
                                        />
                                        <input
                                            type="email"
                                            placeholder="Email del Alumno"
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 font-bold"
                                            value={formData.newStudent.email}
                                            onChange={e => setFormData({ ...formData, newStudent: { ...formData.newStudent, email: e.target.value.trim().toLowerCase() } })}
                                        />
                                        <input
                                            placeholder="Dirección del Alumno"
                                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 font-bold"
                                            value={formData.newStudent.direccion || ''}
                                            onChange={e => setFormData({ ...formData, newStudent: { ...formData.newStudent, direccion: e.target.value } })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Guardian Info - CRITICAL for notifications */}
                            <div className="mt-8 pt-8 border-t border-dashed">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                                        <ShieldAlert size={16} className="text-orange-500" />
                                        Información del Apoderado
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setIsNewGuardian(!isNewGuardian)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${isNewGuardian ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-orange-500 text-orange-500 hover:bg-orange-50'}`}
                                    >
                                        {isNewGuardian ? 'Usar Existente' : 'Registrar Nuevo'}
                                    </button>
                                </div>

                                {!isNewGuardian ? (
                                    <div className="relative mb-6">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Buscar Apoderado Existente</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                            <input
                                                placeholder="Nombre o RUT..."
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:bg-white transition-all outline-none font-bold"
                                                value={searchTermGuardian}
                                                onChange={e => {
                                                    setSearchTermGuardian(e.target.value);
                                                    if (formData.apoderadoId) setFormData({ ...formData, apoderadoId: '' });
                                                }}
                                            />
                                        </div>
                                        {searchTermGuardian && !formData.apoderadoId && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                                                {filteredGuardians.length > 0 ? filteredGuardians.map(g => (
                                                    <button
                                                        key={g._id}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData({ ...formData, apoderadoId: g._id });
                                                            setSearchTermGuardian(`${g.nombre} ${g.apellidos}`);
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b last:border-0"
                                                    >
                                                        <div className="font-bold text-sm">{g.nombre} {g.apellidos}</div>
                                                        <div className="text-[10px] text-gray-400">{g.correo || 'S/ Correo'}</div>
                                                    </button>
                                                )) : (
                                                    <div className="px-4 py-4 text-center text-gray-400 text-sm">No encontrado</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                                        <input
                                            placeholder="Nombre Apoderado"
                                            maxLength={50}
                                            className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500"
                                            value={formData.newGuardian.nombre}
                                            onChange={e => setFormData({ ...formData, newGuardian: { ...formData.newGuardian, nombre: e.target.value } })}
                                        />
                                        <input
                                            placeholder="Apellidos Apoderado"
                                            maxLength={50}
                                            className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500"
                                            value={formData.newGuardian.apellidos}
                                            onChange={e => setFormData({ ...formData, newGuardian: { ...formData.newGuardian, apellidos: e.target.value } })}
                                        />
                                        <input
                                            type="email"
                                            placeholder="Email (Recibirá calificaciones)"
                                            className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 font-bold text-blue-600"
                                            value={formData.newGuardian.correo}
                                            onChange={e => setFormData({ ...formData, newGuardian: { ...formData.newGuardian, correo: e.target.value.trim().toLowerCase() } })}
                                        />
                                        <input
                                            placeholder="RUT del Apoderado"
                                            maxLength={12}
                                            className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 font-bold"
                                            value={formData.newGuardian.rut || ''}
                                            onChange={e => setFormData({ ...formData, newGuardian: { ...formData.newGuardian, rut: formatRut(e.target.value) } })}
                                        />
                                        <input
                                            placeholder="Teléfono"
                                            maxLength={15}
                                            className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500"
                                            value={formData.newGuardian.telefono}
                                            onChange={e => setFormData({ ...formData, newGuardian: { ...formData.newGuardian, telefono: e.target.value.trim() } })}
                                        />
                                        <input
                                            placeholder="Dirección del Apoderado"
                                            className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 font-bold"
                                            value={formData.newGuardian.direccion || ''}
                                            onChange={e => setFormData({ ...formData, newGuardian: { ...formData.newGuardian, direccion: e.target.value } })}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                <p className="text-sm text-blue-700 font-medium flex items-center gap-2">
                                    <BookOpen size={16} />
                                    ¿A qué curso será asignado?
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                                    {courses.map(course => (
                                        <button
                                            key={course._id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, courseId: course._id })}
                                            className={`p-4 text-[10px] md:text-xs font-bold rounded-2xl border-2 transition-all flex flex-col items-center justify-center leading-tight min-h-[80px] ${formData.courseId === course._id ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105' : 'bg-white border-slate-100 text-slate-600 hover:border-blue-300'}`}
                                        >
                                            <span className="uppercase text-[10px] md:text-sm font-black">{course.name}</span>
                                            <span className={`text-[9px] font-black mt-1.5 px-2 py-0.5 rounded-lg uppercase tracking-tighter ${formData.courseId === course._id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                {course.teacherId?.name || 'S/ Profesor'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Arancel Card */}
                        <div className="bg-white rounded-2xl shadow-xl border-t-4 border-emerald-500 p-4 md:p-8">
                            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
                                <CreditCard className="text-emerald-600" />
                                {tenant?.paymentType === 'paid' ? 'Arancel y Pagos' : 'Información Adicional'}
                            </h2>
                            {tenant?.paymentType === 'paid' ? (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Seleccionar Tarifas a Asignar</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {tariffs.map(t => (
                                                <div
                                                    key={t._id}
                                                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${selectedTariffs.includes(t._id) ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-gray-100 hover:border-emerald-200'}`}
                                                    onClick={() => {
                                                        if (selectedTariffs.includes(t._id)) {
                                                            setSelectedTariffs(selectedTariffs.filter(id => id !== t._id));
                                                        } else {
                                                            setSelectedTariffs([...selectedTariffs, t._id]);
                                                        }
                                                    }}
                                                >
                                                    <div>
                                                        <div className={`font-black uppercase text-xs ${selectedTariffs.includes(t._id) ? 'text-emerald-700' : 'text-gray-700'}`}>{t.name}</div>
                                                        <div className="text-[10px] text-gray-400 font-bold">${t.amount.toLocaleString()}</div>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedTariffs.includes(t._id) ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200'}`}>
                                                        {selectedTariffs.includes(t._id) && <UserCheck size={14} className="text-white" />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {tariffs.length === 0 && (
                                            <div className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-3">
                                                <AlertCircle className="text-orange-500 shrink-0" size={20} />
                                                <div>
                                                    <p className="text-xs text-orange-700 font-bold mb-1 uppercase tracking-widest">No hay tarifas predefinidas</p>
                                                    <p className="text-[10px] text-orange-600 font-medium leading-relaxed">
                                                        No hemos encontrado aranceles configurados para este colegio. El sistema acaba de generar valores por defecto (Matrícula y Mensualidad). Por favor, presiona el botón de recargar si no ves nada o ingresa un monto manual abajo.
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={fetchTariffs}
                                                        className="mt-3 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all"
                                                    >
                                                        Recargar Aranceles
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="pt-4 border-t border-dashed border-emerald-100">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Monto Adicional / Otro Arancel ($)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-3 text-emerald-500" size={18} />
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="Ej: 50000 (Opcional)"
                                                className="w-full pl-10 pr-4 py-3 bg-emerald-50/30 border-2 border-emerald-100 rounded-xl focus:border-emerald-500 transition-all outline-none font-bold text-emerald-700"
                                                value={formData.fee || ''}
                                                onChange={e => setFormData({ ...formData, fee: Number(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <p className="text-[9px] text-slate-400 mt-2 font-medium">Este valor se sumará al total inicial pero no generará un recibo automático por separado.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Método de Pago Preferido</label>
                                        <select
                                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-emerald-500 transition-all outline-none font-bold"
                                            value={formData.metodoPago}
                                            onChange={e => setFormData({ ...formData, metodoPago: e.target.value })}
                                        >
                                            <option value="transferencia">Transferencia Bancaria</option>
                                            <option value="efectivo">Efectivo / Caja</option>
                                            <option value="mercadopago">Mercado Pago / Online</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Notas Adicionales</label>
                                        <textarea
                                            maxLength={500}
                                            className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-emerald-500 focus:bg-white transition-all outline-none"
                                            rows={2}
                                            value={formData.notes}
                                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 bg-blue-50 rounded-xl border-2 border-blue-100">
                                    <p className="text-blue-700 font-bold mb-3">✅ Colegio con Matrícula Gratuita</p>
                                    <p className="text-sm text-blue-600">No se requiere arancel para este establecimiento educacional.</p>
                                    <div className="mt-4">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Notas Adicionales</label>
                                        <textarea
                                            maxLength={500}
                                            className="w-full px-4 py-2 bg-white border-2 border-blue-100 rounded-xl focus:border-blue-500 transition-all outline-none"
                                            rows={2}
                                            value={formData.notes}
                                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Summary / Action Card */}
                    <div className="lg:col-span-1 order-1 lg:order-2">
                        <div className="bg-[#11355a] rounded-2xl p-4 md:p-6 text-white shadow-2xl md:sticky md:top-8 border-b-8 border-blue-900">
                            <h3 className="text-sm md:text-lg font-bold mb-3 md:mb-4 flex items-center gap-2 opacity-90 tracking-tighter">
                                <ChevronRight size={20} />
                                RESUMEN FINAL
                            </h3>
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between border-b border-blue-800 pb-2">
                                    <span className="text-blue-300 text-xs font-bold uppercase tracking-widest">Estudiante:</span>
                                    <span className="font-bold text-sm truncate max-w-[150px]">
                                        {isNewStudent ? (formData.newStudent.nombres || 'PENDIENTE') : (filteredStudents.find(s => s._id === formData.studentId)?.nombres || 'PDTE')}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-blue-800 pb-2">
                                    <span className="text-blue-300 text-xs font-bold uppercase tracking-widest">Curso:</span>
                                    <span className="font-bold text-sm underline">
                                        {courses.find(c => c._id === formData.courseId)?.name || 'PDTE'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-300 text-xs font-bold uppercase tracking-widest">Total Ini:</span>
                                    <span className="font-black text-2xl text-emerald-400 font-mono tracking-tighter">
                                        ${tariffs.filter(t => selectedTariffs.includes(t._id)).reduce((acc, t) => acc + t.amount, 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleEnroll}
                                disabled={loading || (isNewStudent ? !formData.newStudent.nombres : !formData.studentId) || !formData.courseId}
                                className={`w-full py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-3 ${loading || (isNewStudent ? !formData.newStudent.nombres : !formData.studentId) || !formData.courseId ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-emerald-500 hover:bg-emerald-400 text-[#11355a] shadow-xl hover:shadow-emerald-500/30 active:scale-95'}`}
                            >
                                {loading ? 'ESPERE...' : (
                                    <>
                                        <Save size={24} />
                                        CONFIRMAR
                                    </>
                                )}
                            </button>
                            <p className="text-[10px] text-blue-400 mt-4 text-center font-bold italic">Se generarán comprobantes automáticos.</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-xl border overflow-hidden p-3 md:p-8 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div className="relative w-full md:max-w-md">
                            <input
                                type="text"
                                placeholder="Buscar inscritos..."
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse border border-gray-100"></div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* Mobile Card Grid - Unified Premium Style */}
                            <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {filteredEnrollments.map(enrollment => (
                                    <div key={enrollment._id} className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="min-w-0">
                                                <div className="font-black text-slate-800 text-sm truncate uppercase tracking-tight">
                                                    {enrollment.estudianteId ? `${enrollment.estudianteId.nombres} ${enrollment.estudianteId.apellidos}` : 'No Asignado'}
                                                </div>
                                                <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1 opacity-70 truncate">
                                                    {enrollment.courseId?.name || 'S/N'}
                                                </div>
                                            </div>
                                            <div className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 flex items-center justify-center min-w-[80px]">
                                                ${enrollment.fee.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="mt-auto flex justify-between text-[9px] text-slate-400 font-extrabold border-t border-slate-50 pt-3 uppercase tracking-tighter">
                                            <span>PERIODO: {enrollment.period}</span>
                                            <span>{new Date(enrollment.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View - Grouped by Course */}
                            <div className="hidden md:block overflow-x-auto">
                                {Object.entries(
                                    filteredEnrollments.reduce((acc, e) => {
                                        const cname = e.courseId?.name || 'Sin Curso';
                                        if (!acc[cname]) acc[cname] = [];
                                        acc[cname].push(e);
                                        return acc;
                                    }, {} as Record<string, Enrollment[]>)
                                ).map(([courseName, group]) => (
                                    <div key={courseName} className="mb-10">
                                        <div className="bg-slate-50 px-6 py-4 border-l-4 border-[#11355a] mb-4 flex items-center justify-between rounded-r-xl">
                                            <h3 className="text-sm font-black text-[#11355a] uppercase tracking-widest flex items-center gap-3">
                                                <BookOpen size={16} />
                                                CURSO: {courseName}
                                            </h3>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100 italic">
                                                {group.length} {group.length === 1 ? 'Alumno' : 'Alumnos'}
                                            </span>
                                        </div>
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                                                    <th className="pb-4 pt-2 px-6">Estudiante</th>
                                                    <th className="pb-4 pt-2 px-6">Periodo</th>
                                                    <th className="pb-4 pt-2 px-6">Fecha Matrícula</th>
                                                    <th className="pb-4 pt-2 px-6 text-right">Monto Pagado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {group.map(enrollment => (
                                                    <tr key={enrollment._id} className="hover:bg-blue-50/30 transition-all group">
                                                        <td className="py-5 px-6 font-black text-slate-700 text-sm">
                                                            {enrollment.estudianteId
                                                                ? `${enrollment.estudianteId.nombres} ${enrollment.estudianteId.apellidos}`
                                                                : 'Desconocido'}
                                                        </td>
                                                        <td className="py-5 px-6 text-xs text-slate-500 font-bold uppercase tracking-widest">
                                                            {enrollment.period}
                                                        </td>
                                                        <td className="py-5 px-6 text-[10px] text-slate-400 font-bold">
                                                            {new Date(enrollment.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="py-5 px-6 text-right font-black text-emerald-600 font-mono text-sm tracking-tighter">
                                                            ${enrollment.fee.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {!loading && filteredEnrollments.length === 0 && (
                        <div className="py-20 text-center text-gray-400 font-medium italic">
                            No se encontraron matrículas.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EnrollmentsPage;
