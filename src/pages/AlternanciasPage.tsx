import React, { useState, useEffect } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import api from '../services/api';
import { Briefcase, Plus, Search, Trash2, X, Edit, Building2, ShieldCheck, BookOpen, AlertCircle, FileText, FileCheck, CheckCircle2, User, Star, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { validarRUT, formatearRUT } from '../utils/rutValidator';

interface Empresa {
    _id: string;
    rut: string;
    razonSocial: string;
    telefono: string;
    emailContacto: string;
    direccion: string;
}

interface Alternancia {
    _id: string;
    estudianteId: { _id: string; firstName: string; lastName: string; rut: string };
    careerId: { _id: string; name: string };
    empresa: { _id: string; razonSocial: string; rut: string; emailContacto: string };
    tipo: string;
    fechaInicio: string;
    fechaTermino: string;
    estado: string;
    seguroEscolar: boolean;
    profesorSupervisor: { _id: string; name: string };
    planFormativo: {
        objetivosAprendizaje: string[];
        actividades: string[];
        totalHoras: number;
    };
    maestroGuia?: {
        nombre: string;
        cargo: string;
        email: string;
        telefono: string;
    };
    modulosDual?: Array<{
        subjectId: { _id: string; name: string } | string;
        horasLiceo: number;
        horasEmpresa: number;
        actividades: string;
    }>;
    evaluacionesPeriodicas?: Array<{
        fecha: string;
        desempeñoTecnico: number;
        habilidadesLaborales: number;
        asistencia: number;
        comentarios: string;
        tutorFirma: boolean;
    }>;
    observaciones: string;
    bitacora?: Array<{
        fecha: string;
        horasCronologicas: number;
        actividadRealizada: string;
        firmadoTutor: boolean;
    }>;
}

export default function AlternanciasPage() {
    const permissions = usePermissions();
    
    // Core Data States
    const [alternancias, setAlternancias] = useState<Alternancia[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [careers, setCareers] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modals visibility
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEmpresaModalOpen, setIsEmpresaModalOpen] = useState(false);
    const [isBitacoraModalOpen, setIsBitacoraModalOpen] = useState(false);
    const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
    
    // Selections
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedAlt, setSelectedAlt] = useState<Alternancia | null>(null);
    
    // Validation Feedback
    const [rutFeedback, setRutFeedback] = useState<{ isValid: boolean, message: string } | null>(null);

    // Initial Empty States
    const initialAltForm = {
        estudianteId: '',
        careerId: '',
        empresa: '',
        tipo: 'Práctica Profesional',
        fechaInicio: '',
        fechaTermino: '',
        estado: 'Borrador',
        seguroEscolar: false,
        profesorSupervisor: '',
        planFormativoDetalle: '',
        actividadesDetalle: '',
        observaciones: '',
        // Dual Pro
        maestroGuiaNombre: '',
        maestroGuiaCargo: '',
        maestroGuiaEmail: '',
        maestroGuiaTelefono: '',
        modulosDual: [] as any[]
    };

    const initialEmpresaForm = {
        rut: '',
        razonSocial: '',
        direccion: '',
        telefono: '',
        emailContacto: '',
        rubro: ''
    };

    const [formData, setFormData] = useState<any>(initialAltForm);
    const [empresaForm, setEmpresaForm] = useState(initialEmpresaForm);
    const [evalForm, setEvalForm] = useState({
        desempeñoTecnico: 7,
        habilidadesLaborales: 7,
        asistencia: 7,
        comentarios: ''
    });

    const loadData = async () => {
        try {
            setLoading(true);
            const [altsRes, stdRes, carRes, usersRes, empRes, subjectsRes] = await Promise.all([
                api.get('/alternancias').catch(() => ({ data: [] })),
                api.get('/estudiantes').catch(() => ({ data: [] })),
                api.get('/careers').catch(() => ({ data: [] })),
                api.get('/users').catch(() => ({ data: [] })),
                api.get('/empresas').catch(() => ({ data: [] })),
                api.get('/subjects').catch(() => ({ data: [] }))
            ]);
            setAlternancias(altsRes.data);
            setStudents(stdRes.data);
            setCareers(carRes.data);
            setUsers(usersRes.data);
            setEmpresas(empRes.data);
            setSubjects(subjectsRes.data);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error al cargar datos core de Alternancias');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // EMPRESA SUBMIT
    const handleEmpresaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validarRUT(empresaForm.rut)) {
            setRutFeedback({ isValid: false, message: 'RUT de Empresa Inválido.' });
            return;
        }

        try {
            const res = await api.post('/empresas', { ...empresaForm, rut: formatearRUT(empresaForm.rut) });
            toast.success('Empresa receptora registrada exitosamente');
            setEmpresas([...empresas, res.data]);
            
            // Auto Select en el form de Alternancia
            setFormData({ ...formData, empresa: res.data._id });
            setIsEmpresaModalOpen(false);
            setEmpresaForm(initialEmpresaForm);
            setRutFeedback(null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar la empresa');
        }
    };

    // ALTERNANCIA SUBMIT
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            maestroGuia: {
                nombre: formData.maestroGuiaNombre,
                cargo: formData.maestroGuiaCargo,
                email: formData.maestroGuiaEmail,
                telefono: formData.maestroGuiaTelefono
            },
            planFormativo: {
                objetivosAprendizaje: formData.planFormativoDetalle ? formData.planFormativoDetalle.split('\n').filter(Boolean) : [],
                actividades: formData.actividadesDetalle ? formData.actividadesDetalle.split('\n').filter(Boolean) : [],
                totalHoras: formData.modulosDual?.reduce((acc: number, m: any) => acc + (Number(m.horasEmpresa) || 0), 0) || 0
            }
        };

        try {
            if (editingId) {
                await api.put(`/alternancias/${editingId}`, payload);
                toast.success('Alternancia Técnico Profesional actualizada');
            } else {
                await api.post('/alternancias', payload);
                toast.success('Alternancia registrada exitosamente en Mineduc Standards');
            }
            setIsModalOpen(false);
            setEditingId(null);
            loadData();
            setFormData(initialAltForm);
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al registrar alternancia');
        }
    };

    const handleEdit = (alt: Alternancia) => {
        setFormData({
            estudianteId: alt.estudianteId?._id || '',
            careerId: alt.careerId?._id || '',
            empresa: alt.empresa?._id || '',
            tipo: alt.tipo || 'Práctica Profesional',
            fechaInicio: alt.fechaInicio ? new Date(alt.fechaInicio).toISOString().split('T')[0] : '',
            fechaTermino: alt.fechaTermino ? new Date(alt.fechaTermino).toISOString().split('T')[0] : '',
            estado: alt.estado || 'Activa',
            seguroEscolar: alt.seguroEscolar || false,
            profesorSupervisor: alt.profesorSupervisor?._id || '',
            planFormativoDetalle: alt.planFormativo?.objetivosAprendizaje?.join('\n') || '',
            actividadesDetalle: alt.planFormativo?.actividades?.join('\n') || '',
            observaciones: alt.observaciones || '',
            maestroGuiaNombre: alt.maestroGuia?.nombre || '',
            maestroGuiaCargo: alt.maestroGuia?.cargo || '',
            maestroGuiaEmail: alt.maestroGuia?.email || '',
            maestroGuiaTelefono: alt.maestroGuia?.telefono || '',
            modulosDual: alt.modulosDual || []
        });
        setEditingId(alt._id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Seguro que deseas eliminar profundamente este registro de alternancia?')) return;
        try {
            await api.delete(`/alternancias/${id}`);
            toast.success('Alternancia eliminada y desvinculada');
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('Error al eliminar');
        }
    };

    const handleAddEvaluation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAlt) return;

        try {
            const newEvals = [...(selectedAlt.evaluacionesPeriodicas || []), { ...evalForm, fecha: new Date().toISOString() }];
            await api.put(`/alternancias/${selectedAlt._id}`, { evaluacionesPeriodicas: newEvals });
            toast.success('Rúbrica de evaluación guardada con éxito');
            setIsEvalModalOpen(false);
            setEvalForm({ desempeñoTecnico: 7, habilidadesLaborales: 7, asistencia: 7, comentarios: '' });
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('Error al registrar la evaluación');
        }
    };

    const handleEmpresaRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmpresaForm({ ...empresaForm, rut: value });
        if (value.length > 7) {
            if (validarRUT(value)) {
                setRutFeedback({ isValid: true, message: '✓ RUT Válido y Operativo' });
            } else {
                setRutFeedback({ isValid: false, message: '✕ RUT Erróneo o mal ingresado' });
            }
        } else {
            setRutFeedback(null);
        }
    };

    const filteredAlternancias = alternancias.filter(a =>
        a.estudianteId?.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.estudianteId?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.estudianteId?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.empresa?.razonSocial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.careerId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
            {/* Header Module */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <Briefcase size={28} />
                        </div>
                        Alternancias TP Central
                    </h1>
                    <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">
                        Sistema unificado Mineduc: Prácticas, Seguros Escolares y Validaciones
                    </p>
                </div>
                {permissions.canManageAlternancias && (
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData(initialAltForm);
                            setIsModalOpen(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl flex items-center gap-3 font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
                    >
                        <Plus size={18} /> Inscribir Nueva
                    </button>
                )}
            </div>

            {/* Smart Search */}
            <div className="bg-white rounded-3xl p-3 shadow-xl shadow-emerald-900/5 border border-slate-100 flex items-center gap-3 focus-within:ring-4 ring-emerald-50 transition-all">
                <Search className="text-emerald-400 ml-3" size={24} />
                <input
                    type="text"
                    placeholder="Escanear y filtrar por Alumno, RUT, o Especialidad / Empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full py-3 bg-transparent focus:outline-none text-base font-bold text-slate-700 placeholder:text-slate-300"
                />
            </div>

            {/* Table */}
            {loading ? (
                <div className="py-20 text-center animate-pulse flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-bold mt-4 uppercase tracking-widest text-xs">Conectando Red Curricular...</p>
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-5 font-black text-[10px] text-slate-400 tracking-[0.2em] uppercase">Estudiante Experto</th>
                                    <th className="px-6 py-5 font-black text-[10px] text-slate-400 tracking-[0.2em] uppercase">Organización Receptora</th>
                                    <th className="px-6 py-5 font-black text-[10px] text-slate-400 tracking-[0.2em] uppercase">Especialidad TP</th>
                                    <th className="px-6 py-5 font-black text-[10px] text-slate-400 tracking-[0.2em] uppercase">Métricas Status</th>
                                    <th className="px-6 py-5 font-black text-[10px] text-slate-400 tracking-[0.2em] uppercase">Seguro</th>
                                    <th className="px-6 py-5 text-right font-black text-[10px] text-slate-400 tracking-[0.2em] uppercase">Consola de Mando</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredAlternancias.map(alt => (
                                    <tr key={alt._id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-5">
                                            <p className="font-black text-slate-700 text-sm">{alt.estudianteId?.firstName} {alt.estudianteId?.lastName}</p>
                                            <p className="text-xs font-bold text-slate-400 tracking-wide mt-1">{alt.estudianteId?.rut}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <Building2 size={14} className="text-emerald-500" />
                                                <p className="font-bold text-slate-800 text-sm">{alt.empresa?.razonSocial}</p>
                                            </div>
                                            <p className="text-[10px] font-black tracking-widest uppercase text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded-md mt-2">
                                                {alt.tipo}
                                            </p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="font-bold text-blue-900 text-xs py-1 px-3 bg-blue-50 rounded-lg inline-block border border-blue-100">
                                                {alt.careerId?.name || 'S/E'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1">
                                                <span className={`font-black text-[9px] tracking-widest uppercase px-3 py-1.5 rounded-xl w-fit
                                                    ${alt.estado === 'Activa' ? 'bg-emerald-100 text-emerald-700' :
                                                        alt.estado === 'Finalizada' ? 'bg-indigo-100 text-indigo-700' :
                                                        alt.estado === 'Borrador' ? 'bg-slate-100 text-slate-600' :
                                                        'bg-rose-100 text-rose-700'}`}>
                                                    {alt.estado}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                    Horas: {alt.planFormativo?.totalHoras || 0} hrs.
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {alt.seguroEscolar ? 
                                                <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 py-1 px-2 rounded-lg w-fit border border-emerald-100">
                                                    <ShieldCheck size={14} /> <span className="font-black text-[9px] tracking-widest uppercase">Activo</span>
                                                </div> :
                                                <div className="flex items-center gap-1 text-rose-500 bg-rose-50 py-1 px-2 rounded-lg w-fit border border-rose-100">
                                                    <AlertCircle size={14} /> <span className="font-black text-[9px] tracking-widest uppercase">Ausente</span>
                                                </div>
                                            }
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2 pr-2">
                                                <button
                                                    onClick={() => { setSelectedAlt(alt); setIsBitacoraModalOpen(true); }}
                                                    className="p-2.5 text-indigo-400 hover:text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                                                    title="Bitácora Diaria"
                                                >
                                                    <BookOpen size={18} />
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedAlt(alt); setIsEvalModalOpen(true); }}
                                                    className="p-2.5 text-amber-500 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"
                                                    title="Evaluación Maestro Guía"
                                                >
                                                    <Star size={18} />
                                                </button>
                                                {permissions.canManageAlternancias && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(alt)}
                                                            className="p-2.5 text-blue-400 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                                                            title="Editar Master"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(alt._id)}
                                                            className="p-2.5 text-rose-400 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                                                            title="Eliminar Registro"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredAlternancias.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center">
                                            <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                                            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No hay expedientes activos</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Alternancia Main Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800 flex items-center gap-3">
                                    {editingId ? 'Resolución de Expediente' : 'Apertura de Expediente'}
                                </h2>
                                <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mt-1">Configuración Administrativa Mineduc</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-200 rounded-full transition-colors bg-white shadow-sm">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto p-8 custom-scrollbar">
                            <form id="altForm" onSubmit={handleSubmit} className="space-y-8">
                                {/* Bloque Identidad */}
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-5">
                                    <h3 className="font-black text-slate-700 uppercase tracking-widest text-[10px] mb-2">1. Eje de Vinculación y Actores</h3>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Alumno Residente</label>
                                            <select
                                                required
                                                value={formData.estudianteId}
                                                onChange={(e) => setFormData({ ...formData, estudianteId: e.target.value })}
                                                className="w-full px-5 py-4 rounded-xl border-2 border-white focus:border-emerald-500 bg-white font-bold text-sm shadow-sm outline-none"
                                            >
                                                <option value="">Selección de Padrón...</option>
                                                {students.map(s => (
                                                    <option key={s._id} value={s._id}>{formatearRUT(s.rut)} - {s.firstName} {s.lastName}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Especialidad TP</label>
                                            <select
                                                required
                                                value={formData.careerId}
                                                onChange={(e) => setFormData({ ...formData, careerId: e.target.value })}
                                                className="w-full px-5 py-4 rounded-xl border-2 border-white focus:border-emerald-500 bg-white font-bold text-sm shadow-sm outline-none"
                                            >
                                                <option value="">Cruzar con Carrera...</option>
                                                {careers.map(c => (
                                                    <option key={c._id} value={c._id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 flex justify-between items-center">
                                                <span>Organización Colaboradora</span>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setIsEmpresaModalOpen(true)}
                                                    className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg"
                                                >
                                                    <Plus size={12}/> Agregar Nueva
                                                </button>
                                            </label>
                                            <select
                                                required
                                                value={formData.empresa}
                                                onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                                                className="w-full px-5 py-4 rounded-xl border-2 border-emerald-100 focus:border-emerald-500 bg-white font-bold text-sm shadow-sm outline-none text-emerald-900"
                                            >
                                                <option value="">Seleccione Entidad Receptora...</option>
                                                {empresas.map(emp => (
                                                    <option key={emp._id} value={emp._id}>{emp.razonSocial} (RUT: {formatearRUT(emp.rut)})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Modalidad</label>
                                            <select
                                                value={formData.tipo}
                                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                                className="w-full px-5 py-4 rounded-xl border-2 border-white focus:border-emerald-500 bg-white font-bold text-sm shadow-sm outline-none"
                                            >
                                                <option value="Práctica Profesional">Práctica Profesional Dual / Tradicional</option>
                                                <option value="Pasantía">Pasantía Inicial / Observación</option>
                                                <option value="Charla Técnica">Charla Técnica / Seminario</option>
                                                <option value="Uso de Equipamiento">Uso de Equipamiento Avanzado</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Bloque Legalidad */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100 flex flex-col justify-center">
                                        <label className="flex items-start gap-4 cursor-pointer group">
                                            <div className="relative flex items-center justify-center shrink-0 mt-1">
                                                <input 
                                                    type="checkbox" 
                                                    checked={formData.seguroEscolar}
                                                    onChange={(e) => setFormData({ ...formData, seguroEscolar: e.target.checked })}
                                                    className="w-6 h-6 border-2 border-rose-300 rounded appearance-none checked:bg-rose-500 checked:border-rose-500 transition-all cursor-pointer peer"
                                                />
                                                <ShieldCheck size={16} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-all" />
                                            </div>
                                            <div>
                                                <p className="font-black text-rose-800 text-sm">Validar Póliza / Seguro Escolar</p>
                                                <p className="text-[10px] font-bold text-rose-500/80 uppercase tracking-widest mt-1 leading-relaxed">
                                                    Imprescindible para certificar cobertura de salud o accidentes del Estado durante horas de desempeño externo.
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Fecha de Despliegue (Inicio)</label>
                                            <input
                                                type="date"
                                                required
                                                value={formData.fechaInicio}
                                                onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                                                className="w-full px-5 py-3.5 rounded-xl border-2 border-white focus:border-blue-500 bg-white font-bold text-sm shadow-sm outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Cierre Proyectado</label>
                                            <input
                                                type="date"
                                                value={formData.fechaTermino}
                                                onChange={(e) => setFormData({ ...formData, fechaTermino: e.target.value })}
                                                className="w-full px-5 py-3.5 rounded-xl border-2 border-white focus:border-blue-500 bg-white font-bold text-sm shadow-sm outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Bloque Maestro Guía (Empresa) */}
                                <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100/50 space-y-5">
                                    <h3 className="font-black text-emerald-800 uppercase tracking-widest text-[10px] mb-2 flex items-center gap-2">
                                        <User size={14} /> 2. Maestro Guía (Tutor Empresa)
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 ml-1">Nombre Completo</label>
                                            <input
                                                type="text"
                                                value={formData.maestroGuiaNombre}
                                                onChange={(e) => setFormData({ ...formData, maestroGuiaNombre: e.target.value })}
                                                placeholder="Ej: Ing. Juan Pérez"
                                                className="w-full px-5 py-3.5 rounded-xl border-2 border-white focus:border-emerald-500 bg-white font-bold text-sm shadow-sm outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 ml-1">Cargo / Especialidad</label>
                                            <input
                                                type="text"
                                                value={formData.maestroGuiaCargo}
                                                onChange={(e) => setFormData({ ...formData, maestroGuiaCargo: e.target.value })}
                                                placeholder="Ej: Jefe de Laboratorio"
                                                className="w-full px-5 py-3.5 rounded-xl border-2 border-white focus:border-emerald-500 bg-white font-bold text-sm shadow-sm outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 ml-1">Email de Coordinación</label>
                                            <input
                                                type="email"
                                                value={formData.maestroGuiaEmail}
                                                onChange={(e) => setFormData({ ...formData, maestroGuiaEmail: e.target.value })}
                                                className="w-full px-5 py-3.5 rounded-xl border-2 border-white focus:border-emerald-500 bg-white font-bold text-sm shadow-sm outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 ml-1">Teléfono Directo</label>
                                            <input
                                                type="text"
                                                value={formData.maestroGuiaTelefono}
                                                onChange={(e) => setFormData({ ...formData, maestroGuiaTelefono: e.target.value })}
                                                className="w-full px-5 py-3.5 rounded-xl border-2 border-white focus:border-emerald-500 bg-white font-bold text-sm shadow-sm outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Bloque Carga Dual Académica */}
                                <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50 space-y-5">
                                    <h3 className="font-black text-indigo-800 uppercase tracking-widest text-[10px] mb-2 flex justify-between items-center">
                                        <span className="flex items-center gap-2"><BookOpen size={14} /> 3. Distribución Dual (Liceo vs Empresa)</span>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                const newMods = [...formData.modulosDual, { subjectId: '', horasLiceo: 0, horasEmpresa: 0, actividades: '' }];
                                                setFormData({ ...formData, modulosDual: newMods });
                                            }}
                                            className="text-[10px] bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-all font-black"
                                        >
                                            + Agregar Módulo
                                        </button>
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        {formData.modulosDual?.map((mod: any, index: number) => (
                                            <div key={index} className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm space-y-4 relative">
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        const newMods = formData.modulosDual.filter((_: any, i: number) => i !== index);
                                                        setFormData({ ...formData, modulosDual: newMods });
                                                    }}
                                                    className="absolute top-4 right-4 text-rose-400 hover:text-rose-600 p-1"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="md:col-span-1">
                                                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Módulo / Asignatura</label>
                                                        <select
                                                            value={typeof mod.subjectId === 'object' ? mod.subjectId?._id : mod.subjectId}
                                                            onChange={(e) => {
                                                                const newMods = [...formData.modulosDual];
                                                                newMods[index].subjectId = e.target.value;
                                                                setFormData({ ...formData, modulosDual: newMods });
                                                            }}
                                                            className="w-full px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 font-bold text-xs outline-none focus:border-indigo-500"
                                                        >
                                                            <option value="">Selección...</option>
                                                            {subjects.map(s => (
                                                                <option key={s._id} value={s._id}>{s.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Hrs Liceo</label>
                                                        <input 
                                                            type="number"
                                                            value={mod.horasLiceo}
                                                            onChange={(e) => {
                                                                const newMods = [...formData.modulosDual];
                                                                newMods[index].horasLiceo = Number(e.target.value);
                                                                setFormData({ ...formData, modulosDual: newMods });
                                                            }}
                                                            className="w-full px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 font-bold text-xs outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Hrs Empresa</label>
                                                        <input 
                                                            type="number"
                                                            value={mod.horasEmpresa}
                                                            onChange={(e) => {
                                                                const newMods = [...formData.modulosDual];
                                                                newMods[index].horasEmpresa = Number(e.target.value);
                                                                setFormData({ ...formData, modulosDual: newMods });
                                                            }}
                                                            className="w-full px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 font-bold text-xs outline-none text-emerald-600"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Actividades de Aprendizaje Definidas</label>
                                                    <input 
                                                        type="text"
                                                        value={mod.actividades}
                                                        onChange={(e) => {
                                                            const newMods = [...formData.modulosDual];
                                                            newMods[index].actividades = e.target.value;
                                                            setFormData({ ...formData, modulosDual: newMods });
                                                        }}
                                                        placeholder="Ej: Análisis sensorial de muestras..."
                                                        className="w-full px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 font-bold text-xs outline-none"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {(!formData.modulosDual || formData.modulosDual.length === 0) && (
                                            <div className="text-center py-6 border-2 border-dashed border-indigo-100 rounded-2xl">
                                                <AlertCircle size={32} className="mx-auto text-indigo-200 mb-2" />
                                                <p className="text-[10px] font-bold text-indigo-300 uppercase italic">Favor declarar módulos y distribución horaria</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bloque Plan Académico (Objetivos) */}
                                <div className="bg-blue-50/40 p-6 rounded-3xl border border-blue-100/50 space-y-5">
                                    <h3 className="font-black text-blue-800 uppercase tracking-widest text-[10px] mb-2 flex items-center gap-2">
                                        <FileCheck size={14} /> 4. Objetivos y Supervisión Docente
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 ml-1">Objetivos de Aprendizaje (OAs)</label>
                                            <textarea
                                                value={formData.planFormativoDetalle}
                                                onChange={(e) => setFormData({ ...formData, planFormativoDetalle: e.target.value })}
                                                placeholder="Ej: OA1 Leer e interpretar planos eléctricos...\nOA2 Conocer normativas vigentes...\n(Ingrese uno por línea)"
                                                className="w-full px-5 py-4 rounded-xl border-2 border-white focus:border-blue-500 bg-white font-bold text-sm shadow-sm outline-none min-h-[120px]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 ml-1">Rubrica de Actividades Core</label>
                                            <textarea
                                                value={formData.actividadesDetalle}
                                                onChange={(e) => setFormData({ ...formData, actividadesDetalle: e.target.value })}
                                                placeholder="- Uso de osciloscopio en motores.\n- Programación PLC básico.\n(Ingrese uno por línea)"
                                                className="w-full px-5 py-4 rounded-xl border-2 border-white focus:border-blue-500 bg-white font-bold text-sm shadow-sm outline-none min-h-[120px]"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="grid md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-blue-100">
                                        <div>
                                            <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 ml-1">Supervisor de Plantel Docente</label>
                                            <select
                                                required
                                                value={formData.profesorSupervisor}
                                                onChange={(e) => setFormData({ ...formData, profesorSupervisor: e.target.value })}
                                                className="w-full px-5 py-4 rounded-xl border-2 border-blue-100 focus:border-blue-500 bg-white font-bold text-sm shadow-sm outline-none text-blue-900"
                                            >
                                                <option value="">Seleccione Profesor Jefe / Tutor...</option>
                                                {users.filter(u => u.role === 'teacher').map(u => (
                                                    <option key={u._id} value={u._id}>{u.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 ml-1">Status Interno de Validación</label>
                                            <select
                                                value={formData.estado}
                                                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                                className="w-full px-5 py-4 rounded-xl border-2 border-blue-100 focus:border-blue-500 bg-white font-bold text-sm shadow-sm outline-none"
                                            >
                                                <option value="Borrador">Borrador (Configurando Perfil)</option>
                                                <option value="Activa">Activa (Ejecutando en Empresa)</option>
                                                <option value="Finalizada">Finalizada (Cerrada Satisfactoriamente)</option>
                                                <option value="Cancelada">Cancelada (N/A o Fuerza Mayor)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-6 border-t border-slate-100 flex flex-col md:flex-row gap-4 bg-white shrink-0">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-colors uppercase tracking-widest text-xs border border-slate-200">
                                Abortar y Salir
                            </button>
                            <button form="altForm" type="submit" className="flex-[2] py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-xl shadow-emerald-600/20 transition-all uppercase tracking-widest text-xs flex justify-center items-center gap-2">
                                <CheckCircle2 size={18} /> {editingId ? 'Cerrar y Actualizar Firmas' : 'Constituir y Desplegar Alternancia'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sub-Modal: Create Empresa (Inline) */}
            {isEmpresaModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in zoom-in-95">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-[0_0_90px_rgba(30,200,100,0.2)] flex flex-col overflow-hidden">
                        <div className="p-6 bg-emerald-600 text-white relative flex justify-between items-center">
                            <div>
                                <h3 className="font-black uppercase tracking-tighter text-xl">Integración de Empresa</h3>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-200 mt-1">Registrando receptores locales</p>
                            </div>
                            <button type="button" onClick={() => { setIsEmpresaModalOpen(false); setRutFeedback(null); }} className="p-2 hover:bg-emerald-500 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleEmpresaSubmit} className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 flex justify-between">
                                    <span>Identificador Fiscal / RUT Empresa</span>
                                    {rutFeedback && (
                                        <span className={`text-[10px] ${rutFeedback.isValid ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {rutFeedback.message}
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={empresaForm.rut}
                                    onChange={handleEmpresaRutChange}
                                    placeholder="Ej: 76.123.456-K"
                                    className={`w-full px-5 py-4 rounded-xl border-2 outline-none font-bold text-sm shadow-sm transition-all focus:border-emerald-500 ${rutFeedback?.isValid === false ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50'}`}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Razón Social o Nombre Legal</label>
                                <input
                                    type="text"
                                    required
                                    value={empresaForm.razonSocial}
                                    onChange={e => setEmpresaForm({ ...empresaForm, razonSocial: e.target.value })}
                                    placeholder="Ej: Maestranza Metalmecánica SpA"
                                    className="w-full px-5 py-4 rounded-xl border-2 border-slate-200 focus:border-emerald-500 bg-white font-bold text-sm shadow-sm outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Correo Directo Contacto</label>
                                <input
                                    type="email"
                                    value={empresaForm.emailContacto}
                                    onChange={e => setEmpresaForm({ ...empresaForm, emailContacto: e.target.value })}
                                    className="w-full px-5 py-4 rounded-xl border-2 border-slate-200 focus:border-emerald-500 bg-white font-bold text-sm shadow-sm outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Rubro General</label>
                                <input
                                    type="text"
                                    value={empresaForm.rubro}
                                    onChange={e => setEmpresaForm({ ...empresaForm, rubro: e.target.value })}
                                    className="w-full px-5 py-4 rounded-xl border-2 border-slate-200 focus:border-emerald-500 bg-white font-bold text-sm shadow-sm outline-none"
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={rutFeedback?.isValid === false}
                                className="w-full py-5 mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-colors shadow-lg"
                            >
                                Validar e Indexar Empresa
                            </button>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Modal de Interfaz Temporal: Bitácoras (Placeholder For Next Upgrade) */}
            {isBitacoraModalOpen && selectedAlt && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/70 backdrop-blur p-4">
                    <div className="bg-white rounded-3xl w-full max-w-xl p-8 text-center shadow-2xl relative overflow-hidden">
                        <button onClick={() => setIsBitacoraModalOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full">
                            <X size={20} className="text-slate-400" />
                        </button>
                        
                        <BookOpen size={64} className="mx-auto text-indigo-200 mb-6" />
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Libro de Actividades</h2>
                        <p className="text-sm font-bold text-slate-500 mb-6">Aluminado: {selectedAlt.estudianteId?.firstName} {selectedAlt.estudianteId?.lastName}</p>
                        
                        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 mb-6">
                            <h3 className="font-extrabold text-indigo-800 text-sm">Resumen Operativo</h3>
                            <div className="mt-4 grid grid-cols-2 gap-4 text-left">
                                <div>
                                    <span className="block text-[10px] text-indigo-400 uppercase font-black tracking-widest">Horas Cumplidas</span>
                                    <span className="text-xl font-black text-indigo-600">{selectedAlt.planFormativo?.totalHoras || 0} hrs</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] text-indigo-400 uppercase font-black tracking-widest">Registros de Jornada</span>
                                    <span className="text-xl font-black text-indigo-600">{selectedAlt.bitacora?.length || 0}</span>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs font-bold text-slate-400">
                            La funcionalidad completa de carga cronológica diaria por parte del Estudiante y validación perimetral de Profesores está en fase de despliegue inminente.
                        </p>
                        
                        <button 
                            onClick={() => setIsBitacoraModalOpen(false)}
                            className="mt-8 w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px]"
                        >
                            Comprendido, retornar
                        </button>
                    </div>
                </div>
            )}
            {/* Periodic Evaluation Modal */}
            {isEvalModalOpen && selectedAlt && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col scale-in-center">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-indigo-50/30">
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tighter text-indigo-900 flex items-center gap-3">
                                    <Star className="text-amber-500" size={24} /> Rúbrica Maestro Guía
                                </h2>
                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">
                                    Evaluación Técnica Estudiante: {selectedAlt.estudianteId?.firstName} {selectedAlt.estudianteId?.lastName}
                                </p>
                            </div>
                            <button onClick={() => setIsEvalModalOpen(false)} className="bg-white p-2 rounded-xl text-slate-400 hover:text-slate-600 transition-colors shadow-sm focus:ring-2 ring-indigo-100">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddEvaluation} className="p-8 space-y-8 overflow-y-auto">
                            {/* Score Matrix */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { label: 'Desempeño Técnico', key: 'desempeñoTecnico' },
                                    { label: 'Habilidades Lab.', key: 'habilidadesLaborales' },
                                    { label: 'Asistencia / Punt.', key: 'asistencia' }
                                ].map((field) => (
                                    <div key={field.key} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">{field.label}</label>
                                        <div className="text-center">
                                            <input 
                                                type="number" 
                                                min="1" max="7" step="0.1"
                                                value={(evalForm as any)[field.key]}
                                                onChange={(e) => setEvalForm({ ...evalForm, [field.key]: Number(e.target.value) })}
                                                className="w-20 text-center bg-white border-2 border-indigo-100 rounded-xl py-2 text-xl font-black text-indigo-600 focus:border-indigo-500 outline-none"
                                            />
                                            <div className="mt-2 text-[9px] font-bold text-slate-400 italic">Escala 1.0 - 7.0</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Observations */}
                            <div>
                                <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
                                    <FileText size={14} /> Observaciones Cualitativas y Feedback
                                </label>
                                <textarea
                                    value={evalForm.comentarios}
                                    onChange={(e) => setEvalForm({ ...evalForm, comentarios: e.target.value })}
                                    rows={4}
                                    placeholder="Describa el progreso del estudiante en el entorno real de trabajo..."
                                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-50 focus:border-indigo-400 bg-slate-50/50 font-bold text-sm shadow-inner outline-none transition-all resize-none"
                                />
                            </div>

                            {/* Warning Note */}
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
                                <AlertCircle className="text-amber-500 shrink-0" size={20} />
                                <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase italic">
                                    Nota: Esta evaluación quedará registrada permanentemente en el expediente del alumno y será visible para UTP y el Profesor Supervisor del Liceo Marítimo.
                                </p>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEvalModalOpen(false)}
                                    className="flex-1 px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-400 hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-3 border-b-4 border-indigo-800"
                                >
                                    <CheckCircle2 size={18} /> Registrar Evaluación Dual
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
