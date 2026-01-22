import { useState, useEffect } from 'react';
import { getAnotaciones, createAnotacion, type Anotacion } from '../services/annotationService';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { Search, Filter, AlertCircle, CheckCircle, User, Calendar, BookOpen, ChevronRight } from 'lucide-react';

interface Student {
    _id: string;
    nombres: string;
    apellidos: string;
    rut: string;
}

interface Course {
    _id: string;
    name: string;
}

const AnnotationsPage = () => {
    const [anotaciones, setAnotaciones] = useState<Anotacion[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // UI Filters
    const [courseFilter, setCourseFilter] = useState('');
    const [studentSearch, setStudentSearch] = useState('');

    const { user } = useAuth();
    const permissions = usePermissions();

    // Form state
    const [formData, setFormData] = useState({
        estudianteId: '',
        tipo: 'positiva',
        titulo: '',
        descripcion: '',
        fechaOcurrencia: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [annotRes, studRes, courseRes] = await Promise.all([
                getAnotaciones(),
                api.get('/estudiantes'),
                api.get('/courses')
            ]);
            setAnotaciones(annotRes);
            setStudents(studRes.data);
            setCourses(courseRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createAnotacion({
                ...formData,
                tipo: formData.tipo as 'positiva' | 'negativa',
                creadoPor: user?._id || user?.id
            });
            setShowForm(false);
            fetchInitialData();
            setFormData({
                estudianteId: '',
                tipo: 'positiva',
                titulo: '',
                descripcion: '',
                fechaOcurrencia: new Date().toISOString().split('T')[0]
            });
            setStudentSearch('');
        } catch (error) {
            console.error('Error creating annotation:', error);
            alert('Error al crear la anotación');
        }
    };

    const filteredStudents = students.filter(s => {
        const matchesSearch = (s.nombres + ' ' + s.apellidos + ' ' + s.rut).toLowerCase().includes(studentSearch.toLowerCase());
        return matchesSearch;
    });

    const getStudentName = (id: any) => {
        const s = students.find(x => x._id === id);
        return s ? `${s.nombres} ${s.apellidos}` : 'Error: Estudiante no encontrado';
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                        <AlertCircle className="text-blue-600" />
                        Registro de Observaciones
                    </h1>
                    <p className="text-gray-500 text-sm">Bitácora de comportamiento y méritos académicos.</p>
                </div>
                {permissions.canEditAnnotations && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg ${showForm ? 'bg-gray-100 text-gray-600' : 'bg-[#11355a] text-white hover:bg-blue-800 active:scale-95'}`}
                    >
                        {showForm ? 'Cerrar Panel' : '+ Nueva Anotación'}
                    </button>
                )}
            </div>

            {showForm && (
                <div className="bg-white p-8 rounded-2xl shadow-2xl border-2 border-blue-50 mb-8 animate-in zoom-in duration-300">
                    <h3 className="text-xl font-bold mb-6 text-[#11355a] flex items-center gap-2 border-b pb-4">
                        <BookOpen size={20} />
                        Detalles de la Nueva Observación
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Searchable Student Selection */}
                        <div className="md:col-span-2 relative">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Buscar Estudiante</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Nombre, Apellido o RUT..."
                                    value={studentSearch}
                                    onChange={(e) => {
                                        setStudentSearch(e.target.value);
                                        // Reset selection if typing
                                        if (formData.estudianteId) setFormData({ ...formData, estudianteId: '' });
                                    }}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition-all outline-none"
                                />
                            </div>

                            {studentSearch && !formData.estudianteId && (
                                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden">
                                    {filteredStudents.length > 0 ? filteredStudents.map(s => (
                                        <button
                                            key={s._id}
                                            type="button"
                                            onClick={() => {
                                                setFormData({ ...formData, estudianteId: s._id });
                                                setStudentSearch(`${s.nombres} ${s.apellidos} (${s.rut})`);
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center justify-between group"
                                        >
                                            <div>
                                                <div className="font-bold text-gray-800">{s.nombres} {s.apellidos}</div>
                                                <div className="text-xs text-gray-400 group-hover:text-blue-500">{s.rut}</div>
                                            </div>
                                            <ChevronRight className="text-gray-300 group-hover:text-blue-500" size={16} />
                                        </button>
                                    )) : (
                                        <div className="px-4 py-6 text-center text-gray-500 text-sm">No se encontraron estudiantes</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Impacto</label>
                            <div className="flex bg-gray-50 p-1 rounded-xl border-2 border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, tipo: 'positiva' })}
                                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${formData.tipo === 'positiva' ? 'bg-green-500 text-white shadow-md' : 'text-gray-500 hover:text-green-600'}`}
                                >
                                    Favorable
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, tipo: 'negativa' })}
                                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${formData.tipo === 'negativa' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500 hover:text-red-600'}`}
                                >
                                    Desfavorable
                                </button>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Título de la Observación</label>
                            <input
                                type="text"
                                placeholder="..."
                                value={formData.titulo}
                                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition-all outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Fecha del Suceso</label>
                            <div className="relative">
                                <Calendar className="absolute right-3 top-3.5 text-gray-400" size={18} />
                                <input
                                    type="date"
                                    value={formData.fechaOcurrencia}
                                    onChange={(e) => setFormData({ ...formData, fechaOcurrencia: e.target.value })}
                                    className="w-full pl-4 pr-10 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-3">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Descripción Detallada</label>
                            <textarea
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                placeholder="Describe brevemente lo ocurrido..."
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition-all outline-none"
                                rows={3}
                                required
                            />
                        </div>

                        <div className="md:col-span-3">
                            <button
                                type="submit"
                                disabled={!formData.estudianteId}
                                className={`w-full py-4 rounded-xl font-black text-white shadow-xl transition-all active:scale-95 ${!formData.estudianteId ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#11355a] hover:bg-blue-800 shadow-blue-900/20'}`}
                            >
                                REGISTRAR EN HOJA DE VIDA
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border shadow-inner">
                            <Filter size={16} className="text-gray-400" />
                            <select
                                className="text-sm font-bold bg-transparent outline-none"
                                value={courseFilter}
                                onChange={e => setCourseFilter(e.target.value)}
                            >
                                <option value="">Todos los Cursos</option>
                                {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Estudiante</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Acción Registrada</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {anotaciones.length > 0 ? anotaciones.map((anotacion) => (
                                    <tr key={anotacion._id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-gray-100 p-2 rounded-full text-gray-500"><User size={18} /></div>
                                                <div className="text-sm font-bold text-gray-800">{getStudentName(anotacion.estudianteId)}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {anotacion.tipo === 'positiva' ? (
                                                <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                                    <CheckCircle size={14} /> Positiva
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-rose-600 font-bold text-xs bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                                                    <AlertCircle size={14} /> Negativa
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-700">{anotacion.titulo}</div>
                                            <div className="text-xs text-gray-500 max-w-xs truncate italic">{anotacion.descripcion}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                                            {new Date(anotacion.fechaOcurrencia || '').toLocaleDateString('es-CL')}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm">No hay observaciones registradas aún.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnnotationsPage;

