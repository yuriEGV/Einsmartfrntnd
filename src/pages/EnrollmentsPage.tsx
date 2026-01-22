import { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { useTenant } from '../context/TenantContext';
import { UserPlus, Search, Filter, BookOpen, UserCheck, CreditCard, ChevronRight, Save, ShieldAlert } from 'lucide-react';

interface Course {
    _id: string;
    name: string;
}

const EnrollmentsPage = () => {
    const permissions = usePermissions();
    const { tenant } = useTenant();
    const [courses, setCourses] = useState<Course[]>([]);
    const [activeTab, setActiveTab] = useState<'list' | 'new'>('list');
    const [loading, setLoading] = useState(false);

    // State for toggle
    const [isNewStudent, setIsNewStudent] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        studentId: '',
        courseId: '',
        period: new Date().getFullYear().toString(),
        status: 'activo',
        fee: 0,
        notes: '',
        // Direct creation data
        newStudent: { nombres: '', apellidos: '', rut: '', email: '', grado: '', edad: 0 },
        newGuardian: { nombre: '', apellidos: '', correo: '', telefono: '', direccion: '', parentesco: 'Padre' }
    });

    useEffect(() => {
        if (permissions.canManageEnrollments) {
            fetchCourses();
        }
    }, [permissions.canManageEnrollments]);

    const fetchCourses = async () => {
        try {
            const res = await api.get('/courses');
            setCourses(res.data);
        } catch (err) {
            console.error('Error fetching courses:', err);
        }
    };

    const handleEnroll = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation for New Student
        if (isNewStudent) {
            if (!formData.newStudent.nombres || !formData.newStudent.rut || !formData.newGuardian.correo) {
                alert('Por favor complete los datos obligatorios del alumno nuevo y su apoderado (incluyendo correo).');
                return;
            }
        } else if (!formData.studentId) {
            alert('Por favor seleccione un estudiante o elija la opción "Matricular Nuevo".');
            return;
        }

        if (!formData.courseId) {
            alert('Debe asignar un curso.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/enrollments', formData);
            alert('¡Matrícula exitosa!');
            setActiveTab('list');
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || 'Error en matrícula');
        } finally {
            setLoading(false);
        }
    };

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
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#11355a] flex items-center gap-3">
                        <UserPlus size={32} />
                        Gestión de Matrículas
                    </h1>
                    <p className="text-gray-500 mt-1 text-lg">Inscribe nuevos alumnos y gestiona sus periodos académicos.</p>
                </div>

                <div className="flex bg-white rounded-xl shadow-sm border p-1">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'list' ? 'bg-[#11355a] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Ver Matrículas
                    </button>
                    <button
                        onClick={() => setActiveTab('new')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'new' ? 'bg-[#11355a] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Nueva Matrícula
                    </button>
                </div>
            </div>

            {activeTab === 'new' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Student Info Card */}
                        <div className="bg-white rounded-2xl shadow-xl border-t-4 border-[#11355a] p-8">
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
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Seleccionar Estudiante Existente</label>
                                        <div className="relative">
                                            <input
                                                placeholder="Buscar por Nombre o RUT..."
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:bg-white transition-all outline-none shadow-inner font-bold"
                                                value={formData.studentId}
                                                onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                                            />
                                            <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Periodo Académico</label>
                                        <select
                                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:bg-white transition-all outline-none shadow-inner font-bold"
                                            value={formData.period}
                                            onChange={e => setFormData({ ...formData, period: e.target.value })}
                                        >
                                            <option value="2024">2024 (Actual)</option>
                                            <option value="2025">2025 (Próximo)</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 mb-6 animate-in fade-in duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input
                                            placeholder="Nombres"
                                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 font-bold"
                                            value={formData.newStudent.nombres}
                                            onChange={e => setFormData({ ...formData, newStudent: { ...formData.newStudent, nombres: e.target.value } })}
                                        />
                                        <input
                                            placeholder="Apellidos"
                                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 font-bold"
                                            value={formData.newStudent.apellidos}
                                            onChange={e => setFormData({ ...formData, newStudent: { ...formData.newStudent, apellidos: e.target.value } })}
                                        />
                                        <input
                                            placeholder="RUT (ej: 12.345.678-9)"
                                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 font-bold"
                                            value={formData.newStudent.rut}
                                            onChange={e => setFormData({ ...formData, newStudent: { ...formData.newStudent, rut: e.target.value } })}
                                        />
                                        <input
                                            type="email"
                                            placeholder="Email del Alumno"
                                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 font-bold"
                                            value={formData.newStudent.email}
                                            onChange={e => setFormData({ ...formData, newStudent: { ...formData.newStudent, email: e.target.value } })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Guardian Info - CRITICAL for notifications */}
                            <div className="mt-8 pt-8 border-t border-dashed">
                                <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <ShieldAlert size={16} className="text-orange-500" />
                                    Información del Apoderado (Para Notificaciones)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        placeholder="Nombre Apoderado"
                                        className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500"
                                        value={formData.newGuardian.nombre}
                                        onChange={e => setFormData({ ...formData, newGuardian: { ...formData.newGuardian, nombre: e.target.value } })}
                                    />
                                    <input
                                        placeholder="Apellidos Apoderado"
                                        className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500"
                                        value={formData.newGuardian.apellidos}
                                        onChange={e => setFormData({ ...formData, newGuardian: { ...formData.newGuardian, apellidos: e.target.value } })}
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email (Recibirá calificaciones)"
                                        className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 font-bold text-blue-600"
                                        value={formData.newGuardian.correo}
                                        onChange={e => setFormData({ ...formData, newGuardian: { ...formData.newGuardian, correo: e.target.value } })}
                                    />
                                    <input
                                        placeholder="Teléfono"
                                        className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500"
                                        value={formData.newGuardian.telefono}
                                        onChange={e => setFormData({ ...formData, newGuardian: { ...formData.newGuardian, telefono: e.target.value } })}
                                    />
                                </div>
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
                                            className={`p-3 text-xs font-bold rounded-lg border-2 transition-all ${formData.courseId === course._id ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105' : 'bg-white border-gray-100 text-gray-600 hover:border-blue-300'}`}
                                        >
                                            {course.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Arancel Card */}
                        <div className="bg-white rounded-2xl shadow-xl border-t-4 border-emerald-500 p-8">
                            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
                                <CreditCard className="text-emerald-600" />
                                {tenant?.paymentType === 'paid' ? 'Arancel y Pagos' : 'Información Adicional'}
                            </h2>
                            {tenant?.paymentType === 'paid' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Monto de Matrícula ($)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="Ej: 150000"
                                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-emerald-500 focus:bg-white transition-all outline-none font-bold"
                                            value={formData.fee || ''}
                                            onChange={e => setFormData({ ...formData, fee: Number(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Notas Adicionales</label>
                                        <textarea
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
                    <div className="lg:col-span-1">
                        <div className="bg-[#11355a] rounded-2xl p-6 text-white shadow-2xl sticky top-8 border-b-8 border-blue-900">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 opacity-90 tracking-tighter">
                                <ChevronRight size={20} />
                                RESUMEN FINAL
                            </h3>
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between border-b border-blue-800 pb-2">
                                    <span className="text-blue-300 text-xs font-bold uppercase tracking-widest">Estudiante:</span>
                                    <span className="font-bold text-sm truncate max-w-[120px]">
                                        {isNewStudent ? (formData.newStudent.nombres || 'PENDIENTE') : (formData.studentId || 'N/A')}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-blue-800 pb-2">
                                    <span className="text-blue-300 text-xs font-bold uppercase tracking-widest">Curso:</span>
                                    <span className="font-bold text-sm underline">
                                        {courses.find(c => c._id === formData.courseId)?.name || 'PDTE'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-300 text-xs font-bold uppercase tracking-widest">Total:</span>
                                    <span className="font-black text-2xl text-emerald-400 font-mono tracking-tighter">${formData.fee}</span>
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
                <div className="bg-white rounded-2xl shadow-xl border overflow-hidden p-20 text-center animate-in slide-in-from-top-4 duration-500">
                    <div className="max-w-md mx-auto">
                        <div className="bg-gray-50 p-8 rounded-full inline-block mb-6 border-4 border-white shadow-inner">
                            <Filter size={64} className="text-gray-200" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-800 mb-2 tracking-tighter uppercase">Listado de Inscritos</h2>
                        <p className="text-gray-400 mb-10 font-medium">Usa esta sección para revisar quiénes ya están matriculados en cada curso.</p>

                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse border border-gray-100 flex items-center px-4 gap-4">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/4 ml-auto"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnrollmentsPage;
