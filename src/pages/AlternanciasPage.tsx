import React, { useState, useEffect } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import api from '../services/api';
import { Briefcase, Plus, Search, Trash2, X, Edit, Building2, ShieldCheck, BookOpen, AlertCircle, FileText, CheckCircle2, User, Star, MapPin, PenTool, Calendar, KeyRound } from 'lucide-react';
import { GPSMonitor } from '../components/Alternancia/GPSMonitor';
import { AlternanciaSignatureModal } from '../components/Alternancia/AlternanciaSignatureModal';
import { useGPSTracker } from '../hooks/useGPSTracker';
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
    estudianteId: { 
        _id: string; 
        firstName: string; 
        lastName: string; 
        rut: string;
        photoUrl?: string; 
    };
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
        firma?: string;
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
        signature?: string;
    }>;
    observaciones: string;
    dispositivoRastreo?: {
        numeroChip: string;
        imei: string;
        modeloEquipo: string;
        activo: boolean;
    };
    bitacora?: Array<{
        _id?: string;
        fecha: string;
        horasCronologicas: number;
        actividadRealizada: string;
        observaciones?: string;
        firmadoTutor: boolean;
        firmaEstudiante?: string;
        firmaTutorContenido?: string;
        gpsLocation?: {
            lat: number;
            lng: number;
            accuracy?: number;
            timestamp?: string;
        };
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
    const [isGPSMonitorOpen, setIsGPSMonitorOpen] = useState(false);
    const [signatureTarget, setSignatureTarget] = useState<{alternanciaId: string, bitacoraId: string} | null>(null);
    
    
    // Selections
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedAlt, setSelectedAlt] = useState<Alternancia | null>(null);
    const { isTracking, toggleTracking } = useGPSTracker(selectedAlt?._id || null);
    
    
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
        modulosDual: [] as any[],
        dispositivoRastreo: { numeroChip: '', imei: '', modeloEquipo: '', activo: true }
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
            modulosDual: alt.modulosDual || [],
            dispositivoRastreo: alt.dispositivoRastreo || { numeroChip: '', imei: '', modeloEquipo: '', activo: true }
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
            {/* Header Module */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-[#002447] uppercase tracking-tighter flex items-center gap-3">
                        <div className="p-3 bg-[#002447]/5 text-[#2DAAB8] rounded-2xl">
                            <Briefcase size={28} />
                        </div>
                        Gestión de Alternancia Dual
                    </h1>
                    <p className="text-slate-500 font-bold text-sm tracking-wide mt-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2DAAB8] animate-pulse"></span>
                        Instituto Marítimo: Supervisión Profesional y Formación en Empresa
                    </p>
                </div>
                <div className="flex gap-4">
                    {permissions.canManageAlternancias && (
                        <button
                            onClick={() => setIsGPSMonitorOpen(true)}
                            className="bg-[#2DAAB8]/10 hover:bg-[#2DAAB8]/20 text-[#2DAAB8] px-6 py-4 rounded-[1.5rem] flex items-center gap-3 font-black uppercase text-xs tracking-[0.2em] transition-all border-b-4 border-[#2DAAB8]/30 active:scale-95"
                        >
                            <MapPin size={18} /> Monitor GPS
                        </button>
                    )}
                    {permissions.canManageAlternancias && (
                        <button
                            onClick={() => {
                                setEditingId(null);
                                setFormData(initialAltForm);
                                setIsModalOpen(true);
                            }}
                            className="bg-[#002447] hover:bg-[#003666] text-white px-8 py-4 rounded-[1.5rem] flex items-center gap-3 font-black uppercase text-xs tracking-[0.2em] transition-all shadow-2xl shadow-[#002447]/30 active:scale-95 border-b-4 border-[#00152b]"
                        >
                            <Plus size={18} /> Inscribir Nueva Alternancia
                        </button>
                    )}
                </div>
            </div>

            {/* Smart Search */}
            <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-2 shadow-2xl shadow-[#002447]/5 border border-white/80 flex items-center gap-3 focus-within:ring-4 ring-[#2DAAB8]/10 transition-all">
                <div className="p-3 bg-[#002447] rounded-2xl text-[#2DAAB8]">
                    <Search size={22} />
                </div>
                <input
                    type="text"
                    placeholder="Filtrar por Estudiante, RUT, Especialidad o Empresa asignada..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full py-4 bg-transparent focus:outline-none text-base font-black text-[#002447] placeholder:text-slate-300"
                />
            </div>

            {/* Cards Grid */}
            {loading ? (
                <div className="py-20 text-center animate-pulse flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-slate-100 border-t-[#2DAAB8] rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-bold mt-4 uppercase tracking-widest text-[10px]">Sincronizando Expedientes Académicos...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredAlternancias.map((alt, idx) => (
                        <div 
                            key={alt._id} 
                            style={{ animationDelay: `${idx * 100}ms` }}
                            className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white p-6 shadow-2xl shadow-[#002447]/5 hover:shadow-[#002447]/10 transition-all hover:-translate-y-2 group relative overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-500"
                        >
                            {/* Card Background Accent */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#2DAAB8]/5 rounded-full blur-3xl group-hover:bg-[#2DAAB8]/15 transition-colors"></div>
                            
                            {/* Student Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-[#002447] to-[#004080] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#002447]/20 overflow-hidden border-2 border-white/20">
                                        {alt.estudianteId?.photoUrl ? (
                                            <img src={alt.estudianteId.photoUrl} alt="Alumno" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={28} />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-[#002447] uppercase leading-tight tracking-tighter text-lg">
                                            {alt.estudianteId?.firstName} <br/> {alt.estudianteId?.lastName}
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{alt.estudianteId?.rut}</p>
                                    </div>
                                </div>
                                <div className={`px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-sm
                                    ${alt.estado === 'Activa' ? 'bg-[#2DAAB8] text-white' :
                                      alt.estado === 'Finalizada' ? 'bg-[#002447] text-white' :
                                      'bg-slate-100 text-slate-400'}`}>
                                    {alt.estado}
                                </div>
                            </div>

                            {/* Info Rows */}
                            <div className="space-y-4 mb-8">
                                <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100/50">
                                    <div className="flex items-center gap-3 mb-2 text-[#002447]">
                                        <Building2 size={16} className="text-[#2DAAB8]" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Empresa Asignada</span>
                                    </div>
                                    <p className="font-black text-slate-800 text-sm pl-7">{alt.empresa?.razonSocial}</p>
                                    <p className="text-[9px] font-bold text-[#2DAAB8] pl-7 mt-1 uppercase italic">{alt.tipo}</p>
                                </div>

                                <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100/50">
                                    <div className="flex items-center gap-3 mb-2 text-[#002447]">
                                        <BookOpen size={16} className="text-[#2DAAB8]" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Especialidad</span>
                                    </div>
                                    <p className="font-black text-slate-800 text-sm pl-7">{alt.careerId?.name || 'Formación Técnica'}</p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center justify-between px-2 mb-8">
                                <div className="text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Horas Totales</p>
                                    <p className="text-lg font-black text-[#002447]">{alt.planFormativo?.totalHoras || 0}</p>
                                </div>
                                <div className="h-8 w-px bg-slate-100"></div>
                                <div className="text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Evaluaciones</p>
                                    <p className="text-lg font-black text-[#2DAAB8]">{alt.evaluacionesPeriodicas?.length || 0}</p>
                                </div>
                                <div className="h-8 w-px bg-slate-100"></div>
                                <div className="text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Seguro</p>
                                    {alt.seguroEscolar ? <ShieldCheck className="text-emerald-500 mx-auto" size={22} /> : <AlertCircle className="text-rose-400 mx-auto" size={22} />}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => { setSelectedAlt(alt); setIsBitacoraModalOpen(true); }}
                                    className="bg-white border-2 border-slate-50 hover:border-[#2DAAB8] p-4 rounded-[1.5rem] flex flex-col items-center gap-2 transition-all hover:shadow-xl hover:shadow-[#2DAAB8]/10 group/btn"
                                >
                                    <FileText size={20} className="text-slate-400 group-hover/btn:text-[#2DAAB8] transition-colors" />
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover/btn:text-[#002447]">Bitácora</span>
                                </button>
                                <button
                                    onClick={() => { setSelectedAlt(alt); setIsEvalModalOpen(true); }}
                                    className="bg-white border-2 border-slate-50 hover:border-[#2DAAB8] p-4 rounded-[1.5rem] flex flex-col items-center gap-2 transition-all hover:shadow-xl hover:shadow-[#2DAAB8]/10 group/btn"
                                >
                                    <Star size={20} className="text-slate-400 group-hover/btn:text-[#2DAAB8] transition-colors" />
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover/btn:text-[#002447]">Evaluar</span>
                                </button>
                                
                                {permissions.canManageAlternancias && (
                                    <>
                                        <button
                                            onClick={() => handleEdit(alt)}
                                            className="bg-[#2DAAB8]/5 hover:bg-[#2DAAB8] p-4 rounded-[1.5rem] flex flex-col items-center gap-2 transition-all group/btn2"
                                        >
                                            <Edit size={20} className="text-[#2DAAB8] group-hover/btn2:text-white transition-colors" />
                                            <span className="text-[9px] font-black text-[#2DAAB8] group-hover/btn2:text-white uppercase tracking-widest">Ajustes</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(alt._id)}
                                            className="bg-rose-50 hover:bg-rose-500 p-4 rounded-[1.5rem] flex flex-col items-center gap-2 transition-all group/btn3 text-rose-500 hover:text-white"
                                        >
                                            <Trash2 size={20} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Eliminar</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredAlternancias.length === 0 && (
                        <div className="col-span-full py-20 bg-white/50 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
                            <FileText size={64} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No se encontraron expedientes activos para esta búsqueda</p>
                        </div>
                    )}
                </div>
            )}

            {/* Alternancia Main Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#002447]/60 backdrop-blur-md p-4 animate-in fade-in">
                    <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border-4 border-white scale-in-center">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-[#002447] to-[#004080] text-white shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[#2DAAB8] rounded-2xl shadow-lg shadow-[#2DAAB8]/20">
                                    <Building2 size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tighter">
                                        {editingId ? 'Actualización de Expediente' : 'Apertura de Alternancia Dual'}
                                    </h2>
                                    <p className="text-[10px] font-bold text-white/50 tracking-[0.2em] uppercase mt-1">Sincronización Curricular Marítima</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/10 rounded-full transition-colors text-white">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto p-10 custom-scrollbar scroll-smooth">
                            <form id="altForm" onSubmit={handleSubmit} className="space-y-12">
                                {/* Bloque Identidad */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b-2 border-slate-50 pb-4">
                                        <User className="text-[#2DAAB8]" size={20} />
                                        <h3 className="font-black text-[#002447] uppercase tracking-widest text-xs">Información del Estudiante y Empresa</h3>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alumno / Residente</label>
                                            <select
                                                required
                                                value={formData.estudianteId}
                                                onChange={(e) => setFormData({ ...formData, estudianteId: e.target.value })}
                                                className="w-full px-6 py-5 rounded-2xl border-2 border-slate-50 focus:border-[#2DAAB8] bg-slate-50/50 font-black text-[#002447] text-sm shadow-inner outline-none transition-all"
                                            >
                                                <option value="">Selección de Padrón...</option>
                                                {students.map(s => (
                                                    <option key={s._id} value={s._id}>{formatearRUT(s.rut)} - {s.firstName} {s.lastName}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Especialidad TP</label>
                                            <select
                                                required
                                                value={formData.careerId}
                                                onChange={(e) => setFormData({ ...formData, careerId: e.target.value })}
                                                className="w-full px-6 py-5 rounded-2xl border-2 border-slate-50 focus:border-[#2DAAB8] bg-slate-50/50 font-black text-[#002447] text-sm shadow-inner outline-none transition-all"
                                            >
                                                <option value="">Asignar Carrera...</option>
                                                {careers.map(c => (
                                                    <option key={c._id} value={c._id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between items-center">
                                                <span>Entidad Receptora</span>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setIsEmpresaModalOpen(true)}
                                                    className="text-[#2DAAB8] hover:text-[#002447] flex items-center gap-1 font-black text-[9px] uppercase tracking-widest"
                                                >
                                                    <Plus size={12}/> Nueva Empresa
                                                </button>
                                            </label>
                                            <select
                                                required
                                                value={formData.empresa}
                                                onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                                                className="w-full px-6 py-5 rounded-2xl border-2 border-slate-50 focus:border-[#2DAAB8] bg-slate-50/50 font-black text-[#2DAAB8] text-sm shadow-inner outline-none transition-all"
                                            >
                                                <option value="">Seleccione Organización...</option>
                                                {empresas.map(emp => (
                                                    <option key={emp._id} value={emp._id}>{emp.razonSocial} (RUT: {formatearRUT(emp.rut)})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modalidad de Alternancia</label>
                                            <select
                                                value={formData.tipo}
                                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                                className="w-full px-6 py-5 rounded-2xl border-2 border-slate-50 focus:border-[#2DAAB8] bg-slate-50/50 font-black text-[#002447] text-sm shadow-inner outline-none transition-all"
                                            >
                                                <option value="Práctica Profesional">Práctica Profesional Dual / Tradicional</option>
                                                <option value="Pasantía">Pasantía Inicial / Observación</option>
                                                <option value="Charla Técnica">Charla Técnica / Seminario</option>
                                                <option value="Uso de Equipamiento">Uso de Equipamiento Avanzado</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Bloque Temporalidad y Seguro */}
                                <div className="grid md:grid-cols-3 gap-8 items-end">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Inicio</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.fechaInicio}
                                            onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                                            className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-[#2DAAB8] bg-slate-50/50 font-black text-[#002447] text-sm outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Término</label>
                                        <input
                                            type="date"
                                            value={formData.fechaTermino}
                                            onChange={(e) => setFormData({ ...formData, fechaTermino: e.target.value })}
                                            className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-[#2DAAB8] bg-slate-50/50 font-black text-[#002447] text-sm outline-none"
                                        />
                                    </div>
                                    <div className="bg-[#2DAAB8]/5 p-5 rounded-2xl border border-[#2DAAB8]/10">
                                        <label className="flex items-center gap-4 cursor-pointer group">
                                            <div className="relative flex items-center justify-center shrink-0">
                                                <input 
                                                    type="checkbox" 
                                                    checked={formData.seguroEscolar}
                                                    onChange={(e) => setFormData({ ...formData, seguroEscolar: e.target.checked })}
                                                    className="w-6 h-6 border-2 border-[#2DAAB8]/30 rounded-xl appearance-none checked:bg-[#2DAAB8] checked:border-[#2DAAB8] transition-all cursor-pointer peer"
                                                />
                                                <ShieldCheck size={16} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-all" />
                                            </div>
                                            <div>
                                                <p className="font-black text-[#002447] text-[11px] uppercase tracking-widest">Seguro Escolar Activo</p>
                                                <p className="text-[9px] font-bold text-[#2DAAB8] uppercase mt-1">Cobertura Mineduc</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Bloque Dispositivo Móvil */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b-2 border-slate-50 pb-4">
                                        <MapPin size={20} className="text-[#2DAAB8]" />
                                        <h3 className="font-black text-[#002447] uppercase tracking-widest text-xs">Vincular Dispositivo de Rastreo GPS</h3>
                                    </div>
                                    <div className="grid md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">N° Telefónico / Chip</label>
                                            <input
                                                type="text"
                                                value={formData.dispositivoRastreo?.numeroChip || ''}
                                                onChange={(e) => setFormData({ ...formData, dispositivoRastreo: { ...formData.dispositivoRastreo, numeroChip: e.target.value } })}
                                                placeholder="+56 9..."
                                                className="w-full px-5 py-3.5 rounded-xl border border-slate-100 focus:border-[#2DAAB8] font-bold text-xs"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Modelo de Equipo</label>
                                            <input
                                                type="text"
                                                value={formData.dispositivoRastreo?.modeloEquipo || ''}
                                                onChange={(e) => setFormData({ ...formData, dispositivoRastreo: { ...formData.dispositivoRastreo, modeloEquipo: e.target.value } })}
                                                placeholder="Ej: Galaxy S21"
                                                className="w-full px-5 py-3.5 rounded-xl border border-slate-100 focus:border-[#2DAAB8] font-bold text-xs"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">IMEI (Opcional)</label>
                                            <input
                                                type="text"
                                                value={formData.dispositivoRastreo?.imei || ''}
                                                onChange={(e) => setFormData({ ...formData, dispositivoRastreo: { ...formData.dispositivoRastreo, imei: e.target.value } })}
                                                placeholder="15 dígitos"
                                                className="w-full px-5 py-3.5 rounded-xl border border-slate-100 focus:border-[#2DAAB8] font-bold text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Bloque Maestro Guía */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b-2 border-slate-50 pb-4">
                                        <Building2 size={20} className="text-[#2DAAB8]" />
                                        <h3 className="font-black text-[#002447] uppercase tracking-widest text-xs">Datos del Maestro Guía (Empresa)</h3>
                                    </div>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre del Tutor</label>
                                            <input
                                                type="text"
                                                value={formData.maestroGuiaNombre}
                                                onChange={(e) => setFormData({ ...formData, maestroGuiaNombre: e.target.value })}
                                                placeholder="Nombre Completo"
                                                className="w-full px-5 py-3.5 rounded-xl border border-slate-100 focus:border-[#2DAAB8] font-bold text-xs"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Cargo Directo</label>
                                            <input
                                                type="text"
                                                value={formData.maestroGuiaCargo}
                                                onChange={(e) => setFormData({ ...formData, maestroGuiaCargo: e.target.value })}
                                                placeholder="Jefe de Operaciones"
                                                className="w-full px-5 py-3.5 rounded-xl border border-slate-100 focus:border-[#2DAAB8] font-bold text-xs"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Corporativo</label>
                                            <input
                                                type="email"
                                                value={formData.maestroGuiaEmail}
                                                onChange={(e) => setFormData({ ...formData, maestroGuiaEmail: e.target.value })}
                                                placeholder="ejemplo@empresa.com"
                                                className="w-full px-5 py-3.5 rounded-xl border border-slate-100 focus:border-[#2DAAB8] font-bold text-xs"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Teléfono</label>
                                            <input
                                                type="text"
                                                value={formData.maestroGuiaTelefono}
                                                onChange={(e) => setFormData({ ...formData, maestroGuiaTelefono: e.target.value })}
                                                placeholder="+56 9..."
                                                className="w-full px-5 py-3.5 rounded-xl border border-slate-100 focus:border-[#2DAAB8] font-bold text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Bloque Carga Dual */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b-2 border-slate-50 pb-4">
                                        <div className="flex items-center gap-3">
                                            <Star size={20} className="text-[#2DAAB8]" />
                                            <h3 className="font-black text-[#002447] uppercase tracking-widest text-xs">Módulos Técnicos y Carga Dual</h3>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setFormData({ ...formData, modulosDual: [...formData.modulosDual, { subjectId: '', horasLiceo: 0, horasEmpresa: 0, actividades: '' }] })}
                                            className="bg-[#2DAAB8] hover:bg-[#258a96] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#2DAAB8]/20 transition-all active:scale-95"
                                        >
                                            + Vincular Módulo
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-4">
                                        {formData.modulosDual?.map((mod: any, index: number) => (
                                            <div key={index} className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row gap-6 relative group">
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        const newMods = formData.modulosDual.filter((_: any, i: number) => i !== index);
                                                        setFormData({ ...formData, modulosDual: newMods });
                                                    }}
                                                    className="absolute -top-2 -right-2 w-8 h-8 bg-white text-rose-500 rounded-full shadow-lg flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <X size={14} />
                                                </button>
                                                
                                                <div className="flex-1 space-y-2">
                                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Asignatura del Mineduc</label>
                                                    <select
                                                        value={typeof mod.subjectId === 'object' ? mod.subjectId?._id : mod.subjectId}
                                                        onChange={(e) => {
                                                            const newMods = [...formData.modulosDual];
                                                            newMods[index].subjectId = e.target.value;
                                                            setFormData({ ...formData, modulosDual: newMods });
                                                        }}
                                                        className="w-full px-5 py-3 bg-white rounded-xl border border-slate-200 font-bold text-xs"
                                                    >
                                                        <option value="">Seleccione Módulo...</option>
                                                        {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="w-full md:w-32 space-y-2">
                                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Hrs Liceo</label>
                                                    <input 
                                                        type="number"
                                                        value={mod.horasLiceo}
                                                        onChange={(e) => {
                                                            const newMods = [...formData.modulosDual];
                                                            newMods[index].horasLiceo = Number(e.target.value);
                                                            setFormData({ ...formData, modulosDual: newMods });
                                                        }}
                                                        className="w-full px-5 py-3 bg-white rounded-xl border border-slate-200 font-bold text-xs"
                                                    />
                                                </div>
                                                <div className="w-full md:w-32 space-y-2">
                                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Hrs Empresa</label>
                                                    <input 
                                                        type="number"
                                                        value={mod.horasEmpresa}
                                                        onChange={(e) => {
                                                            const newMods = [...formData.modulosDual];
                                                            newMods[index].horasEmpresa = Number(e.target.value);
                                                            setFormData({ ...formData, modulosDual: newMods });
                                                        }}
                                                        className="w-full px-5 py-3 bg-white rounded-xl border border-[#2DAAB8]/30 font-bold text-xs text-[#2DAAB8]"
                                                    />
                                                </div>
                                                <div className="flex-[1.5] space-y-2">
                                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Actividades Profesionales</label>
                                                    <input 
                                                        type="text"
                                                        value={mod.actividades}
                                                        onChange={(e) => {
                                                            const newMods = [...formData.modulosDual];
                                                            newMods[index].actividades = e.target.value;
                                                            setFormData({ ...formData, modulosDual: newMods });
                                                        }}
                                                        placeholder="Descripción breve..."
                                                        className="w-full px-5 py-3 bg-white rounded-xl border border-slate-200 font-bold text-xs"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Bloque Validaciones Finales */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b-2 border-slate-50 pb-4">
                                        <AlertCircle size={20} className="text-[#2DAAB8]" />
                                        <h3 className="font-black text-[#002447] uppercase tracking-widest text-xs">Cierre y Asignación de Supervisión</h3>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profesor Supervisor (Liceo)</label>
                                            <select
                                                required
                                                value={formData.profesorSupervisor}
                                                onChange={(e) => setFormData({ ...formData, profesorSupervisor: e.target.value })}
                                                className="w-full px-6 py-5 rounded-2xl border-2 border-slate-50 focus:border-[#2DAAB8] bg-slate-50/50 font-black text-[#002447] text-sm shadow-inner outline-none transition-all"
                                            >
                                                <option value="">Seleccionar Docente...</option>
                                                {users.filter(u => u.role === 'teacher').map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado Administrativo</label>
                                            <select
                                                value={formData.estado}
                                                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                                className="w-full px-6 py-5 rounded-2xl border-2 border-slate-50 focus:border-[#2DAAB8] bg-slate-50/50 font-black text-[#002447] text-sm shadow-inner outline-none transition-all"
                                            >
                                                <option value="Borrador">Borrador (Ficha Interna)</option>
                                                <option value="Activa">Activa (En Proceso)</option>
                                                <option value="Finalizada">Finalizada (Certificada)</option>
                                                <option value="Cancelada">Cancelada</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-10 border-t border-slate-100 flex flex-col md:flex-row gap-4 bg-slate-50/50 shrink-0">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-[#002447] font-black hover:bg-slate-100 rounded-3xl transition-all uppercase tracking-[0.2em] text-[10px] border-2 border-slate-100">
                                Descartar Cambios
                            </button>
                            <button form="altForm" type="submit" className="flex-[2] py-5 bg-[#002447] hover:bg-[#003666] text-white rounded-3xl font-black shadow-2xl shadow-[#002447]/30 transition-all uppercase tracking-[0.2em] text-[10px] flex justify-center items-center gap-2 border-b-4 border-[#00152b]">
                                <CheckCircle2 size={18} className="text-[#2DAAB8]" /> 
                                {editingId ? 'Confirmar Actualización de Expediente' : 'Generar y Activar Expediente Dual'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sub-Modal: Create Empresa (Inline) */}
            {isEmpresaModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#002447]/80 backdrop-blur-xl p-4 animate-in zoom-in-95">
                    <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] w-full max-w-lg shadow-[0_0_100px_rgba(45,170,184,0.3)] flex flex-col overflow-hidden border-4 border-white">
                        <div className="p-10 bg-gradient-to-br from-[#2DAAB8] to-[#258a96] text-white relative flex justify-between items-center">
                            <div>
                                <h3 className="font-black uppercase tracking-tighter text-2xl flex items-center gap-3">
                                    <Building2 size={24} /> Registro de Empresa
                                </h3>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-white/70 mt-1">Vinculación con el Sector Productivo</p>
                            </div>
                            <button type="button" onClick={() => { setIsEmpresaModalOpen(false); setRutFeedback(null); }} className="p-3 hover:bg-white/10 rounded-2xl transition-all">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleEmpresaSubmit} className="p-10 space-y-8">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                                    <span>Identificador Fiscal / RUT Empresa</span>
                                    {rutFeedback && (
                                        <span className={`text-[10px] font-black ${rutFeedback.isValid ? 'text-[#2DAAB8]' : 'text-rose-500'}`}>
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
                                    className={`w-full px-6 py-5 rounded-2xl border-2 outline-none font-black text-sm shadow-inner transition-all focus:border-[#2DAAB8] ${rutFeedback?.isValid === false ? 'border-rose-100 bg-rose-50 text-rose-700' : 'border-slate-50 bg-slate-50/50'}`}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Razón Social o Nombre Legal</label>
                                <input
                                    type="text"
                                    required
                                    value={empresaForm.razonSocial}
                                    onChange={e => setEmpresaForm({ ...empresaForm, razonSocial: e.target.value })}
                                    placeholder="Ej: Maestranza Marítima SpA"
                                    className="w-full px-6 py-5 rounded-2xl border-2 border-slate-50 focus:border-[#2DAAB8] bg-slate-50/50 font-black text-sm shadow-inner outline-none transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Corporativo</label>
                                    <input
                                        type="email"
                                        value={empresaForm.emailContacto}
                                        onChange={e => setEmpresaForm({ ...empresaForm, emailContacto: e.target.value })}
                                        className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-[#2DAAB8] bg-slate-50/50 font-black text-xs"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rubro Industrial</label>
                                    <input
                                        type="text"
                                        value={empresaForm.rubro}
                                        onChange={e => setEmpresaForm({ ...empresaForm, rubro: e.target.value })}
                                        className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-[#2DAAB8] bg-slate-50/50 font-black text-xs"
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={rutFeedback?.isValid === false}
                                className="w-full py-6 mt-4 bg-[#002447] hover:bg-[#003666] disabled:bg-slate-200 disabled:cursor-not-allowed text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-2xl shadow-[#002447]/30 border-b-4 border-[#00152b] active:scale-95 flex justify-center items-center gap-3"
                            >
                                <CheckCircle2 size={18} className="text-[#2DAAB8]" /> Validar e Indexar Entidad
                            </button>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Modal de Bitácora: Registro de Actividades y Seguimiento GPS/Firma */}
            {isBitacoraModalOpen && selectedAlt && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#002447]/95 backdrop-blur-2xl p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-[0_0_100px_rgba(45,170,184,0.2)] border-8 border-white scale-in-center">
                        {/* Header */}
                        <div className="p-10 bg-gradient-to-br from-[#002447] to-[#004080] text-white flex justify-between items-center relative">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center backdrop-blur-md border border-white/20">
                                    {selectedAlt.estudianteId?.photoUrl ? (
                                        <img src={selectedAlt.estudianteId.photoUrl} alt="Alumno" className="w-full h-full object-cover rounded-[1.8rem]" />
                                    ) : (
                                        <BookOpen size={40} className="text-[#2DAAB8]" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black uppercase tracking-tighter leading-none mb-2">Bitácora de Alternancia</h2>
                                    <p className="text-[10px] font-bold text-[#2DAAB8] uppercase tracking-[0.3em]">
                                        Expediente Dual: {selectedAlt.estudianteId?.firstName} {selectedAlt.estudianteId?.lastName}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-center">
                                <div className="flex flex-col items-end gap-1">
                                    <button
                                        onClick={toggleTracking}
                                        className={`px-5 py-3 rounded-[1.2rem] flex items-center gap-2 font-black uppercase tracking-widest text-[10px] transition-all shadow-xl active:scale-95 ${
                                            isTracking 
                                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30' 
                                                : 'bg-white hover:bg-slate-50 text-[#002447] shadow-black/5'
                                        }`}
                                    >
                                        <MapPin size={16} /> {isTracking ? 'Rastreando Ubicación...' : 'Iniciar Tracker GPS'}
                                    </button>
                                    {permissions.canManageAlternancias && (
                                        <button 
                                            onClick={() => { setIsBitacoraModalOpen(false); handleEdit(selectedAlt); }}
                                            className="text-[#2DAAB8] hover:text-white font-bold text-[9px] uppercase transition-colors"
                                        >
                                            ⚙️ VINCULAR EQUIPO GPS
                                        </button>
                                    )}
                                </div>
                                <button onClick={() => setIsBitacoraModalOpen(false)} className="p-4 hover:bg-white/10 rounded-3xl transition-all">
                                    <X size={28} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-slate-50/50">
                            {/* Stats Summary */}
                            <div className="grid grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Horas en Liceo</p>
                                    <p className="text-2xl font-black text-[#002447]">{selectedAlt.modulosDual?.reduce((acc, m) => acc + m.horasLiceo, 0) || 0}h</p>
                                </div>
                                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Horas en Empresa</p>
                                    <p className="text-2xl font-black text-[#2DAAB8]">{selectedAlt.bitacora?.reduce((acc, b) => acc + b.horasCronologicas, 0) || 0}h</p>
                                </div>
                                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Planificado</p>
                                    <p className="text-2xl font-black text-slate-800">{selectedAlt.planFormativo?.totalHoras || 0}h</p>
                                </div>
                            </div>

                            {/* Entries List */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-[#002447] uppercase tracking-widest ml-4 mb-6 flex items-center gap-2">
                                    <Calendar size={16} className="text-[#2DAAB8]" /> Cronograma de Actividades Recientes
                                </h3>
                                
                                {selectedAlt.bitacora && selectedAlt.bitacora.length > 0 ? (
                                    selectedAlt.bitacora.map((entry, eIdx) => (
                                        <div key={entry._id || eIdx} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:border-[#2DAAB8]/30 transition-all group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-[#2DAAB8]/10 text-[#2DAAB8] px-4 py-2 rounded-2xl font-black text-xs">
                                                        {new Date(entry.fecha).toLocaleDateString('es-CL')}
                                                    </div>
                                                    <div className="bg-slate-100 text-slate-600 px-4 py-2 rounded-2xl font-black text-xs">
                                                        {entry.horasCronologicas} HORAS
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {entry.gpsLocation && (
                                                        <a 
                                                            href={`https://www.google.com/maps?q=${entry.gpsLocation.lat},${entry.gpsLocation.lng}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center gap-1 font-bold text-[9px] uppercase"
                                                            title="Ver ubicación en GPS"
                                                        >
                                                            <MapPin size={14} /> GPS Verificado
                                                        </a>
                                                    )}
                                                    {entry.firmadoTutor && (
                                                        <div className="p-2 bg-[#002447]/5 text-[#002447] rounded-xl flex items-center gap-2 font-black text-[9px] uppercase">
                                                            <PenTool size={14} className="text-[#2DAAB8]" /> Firmado por Tutor
                                                        </div>
                                                    )}
                                                    {entry.firmaEstudiante && (
                                                        <div className="p-2 bg-[#2DAAB8]/10 text-[#2DAAB8] rounded-xl flex items-center gap-2 font-black text-[9px] uppercase">
                                                            <CheckCircle2 size={14} /> Firmado (Estudiante)
                                                        </div>
                                                    )}
                                                    {(!entry.firmadoTutor || !entry.firmaEstudiante) && (
                                                        <button 
                                                            onClick={() => setSignatureTarget({ alternanciaId: selectedAlt._id, bitacoraId: entry._id || '' })}
                                                            className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-xl flex items-center gap-2 font-black text-[9px] uppercase transition-all shadow-sm"
                                                        >
                                                            <KeyRound size={14} /> Firmar (PIN)
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-sm font-bold text-[#002447]/80 leading-relaxed bg-slate-50/50 p-5 rounded-3xl group-hover:bg-white transition-colors">
                                                {entry.actividadRealizada}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-20 bg-slate-50/50 rounded-[3rem] border-4 border-dashed border-slate-100">
                                        <AlertCircle size={48} className="mx-auto text-slate-200 mb-4" />
                                        <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">No se registran actividades en el expediente actual</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-10 bg-slate-50 flex justify-between items-center border-t border-slate-100">
                            <div className="flex items-center gap-4 text-left">
                                <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                    <ShieldCheck size={24} className="text-[#2DAAB8]" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-[#002447] uppercase tracking-widest">Validación de Integridad</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Los registros incluyen marcaje GPS y firma digital biométrica</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsBitacoraModalOpen(false)}
                                className="px-10 py-5 bg-[#002447] hover:bg-[#003666] text-white rounded-[1.8rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-[#002447]/20 active:scale-95 transition-all"
                            >
                                Cerrar Registro
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Periodic Evaluation Modal */}
            {isEvalModalOpen && selectedAlt && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#002447]/60 backdrop-blur-md p-4 animate-in fade-in">
                    <div className="bg-white/90 backdrop-blur-2xl rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col scale-in-center border-4 border-white">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-[#002447] to-[#004080] text-white">
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                                    <Star className="text-[#2DAAB8]" size={24} fill="currentColor" /> Rúbrica de Especialidad
                                </h2>
                                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-1">
                                    Evaluación Dual: {selectedAlt.estudianteId?.firstName} {selectedAlt.estudianteId?.lastName}
                                </p>
                            </div>
                            <button onClick={() => setIsEvalModalOpen(false)} className="bg-white/10 p-2 rounded-xl text-white hover:bg-white/20 transition-colors shadow-sm focus:ring-2 ring-[#2DAAB8]">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddEvaluation} className="p-8 space-y-8 overflow-y-auto custom-scrollbar scroll-smooth">
                            {/* Score Matrix with Progress Bars */}
                            <div className="space-y-6">
                                {[
                                    { label: 'Desempeño Técnico y Aplicación', key: 'desempeñoTecnico' },
                                    { label: 'Habilidades Socio-Laborales', key: 'habilidadesLaborales' },
                                    { label: 'Asistencia, Puntualidad y Compromiso', key: 'asistencia' }
                                ].map((field) => (
                                    <div key={field.key} className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-200/50 group/row">
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="block text-[11px] font-black text-[#002447] uppercase tracking-widest">{field.label}</label>
                                            <span className="text-xl font-black text-[#2DAAB8]">{(evalForm as any)[field.key]}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <input 
                                                type="range" 
                                                min="1" max="7" step="0.1"
                                                value={(evalForm as any)[field.key]}
                                                onChange={(e) => setEvalForm({ ...evalForm, [field.key]: Number(e.target.value) })}
                                                className="flex-1 accent-[#2DAAB8] h-2 bg-slate-200 rounded-full appearance-none cursor-pointer"
                                            />
                                            <div className="w-12 text-center text-[9px] font-black text-slate-400">1.0 - 7.0</div>
                                        </div>
                                        {/* Dynamic Bar Background */}
                                        <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-[#2DAAB8] to-[#002447] transition-all duration-500 rounded-full"
                                                style={{ width: `${((evalForm as any)[field.key] / 7) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Observations */}
                            <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-200/50">
                                <label className="block text-[11px] font-black text-[#002447] uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <FileText size={16} className="text-[#2DAAB8]" /> Comentario Maestro Guía / Feedback
                                </label>
                                <textarea
                                    value={evalForm.comentarios}
                                    onChange={(e) => setEvalForm({ ...evalForm, comentarios: e.target.value })}
                                    rows={3}
                                    placeholder="Describa el progreso del estudiante en el entorno real de trabajo..."
                                    className="w-full px-5 py-4 rounded-2xl border-2 border-white focus:border-[#2DAAB8] bg-white font-bold text-sm shadow-sm outline-none transition-all resize-none"
                                />
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEvalModalOpen(false)}
                                    className="flex-1 px-6 py-5 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-400 hover:bg-slate-100 transition-all active:scale-95 border-2 border-transparent"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] bg-[#002447] hover:bg-[#003666] text-white px-6 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-2xl shadow-[#002447]/30 active:scale-95 flex items-center justify-center gap-3 border-b-4 border-[#00152b]"
                                >
                                    <CheckCircle2 size={18} className="text-[#2DAAB8]" /> Finalizar Evaluación Dual
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Monitor Sátelital */}
            {isGPSMonitorOpen && <GPSMonitor onClose={() => setIsGPSMonitorOpen(false)} />}
            
            {/* Modal de Firma */}
            {signatureTarget && (
                <AlternanciaSignatureModal 
                    alternanciaId={signatureTarget.alternanciaId} 
                    bitacoraId={signatureTarget.bitacoraId} 
                    onSuccess={() => { loadData(); setSignatureTarget(null); }} 
                    onClose={() => setSignatureTarget(null)} 
                />
            )}
        </div>
    );
}
