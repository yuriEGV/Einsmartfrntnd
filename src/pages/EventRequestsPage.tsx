
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import {
    Calendar,
    Plus, User, FileText, ChevronRight,
    ShieldCheck, Loader2, MapPin
} from 'lucide-react';

interface EventRequest {
    _id: string;
    userId: { _id: string; name: string; role: string };
    title: string;
    description: string;
    date: string;
    location: string;
    status: 'pendiente' | 'aprobado' | 'rechazado';
    rejectionReason?: string;
    createdAt: string;
}

const EventRequestsPage = () => {
    const navigate = useNavigate();
    const permissions = usePermissions();

    const [requests, setRequests] = useState<EventRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        location: ''
    });

    useEffect(() => {
        if (permissions.isStudent) {
            navigate('/events');
            return;
        }
        fetchData();
    }, [permissions.isStudent]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = permissions.isSuperAdmin || permissions.user?.role === 'sostenedor' || permissions.user?.role === 'admin' || permissions.user?.role === 'director'
                ? await api.get('/event-requests')
                : await api.get('/event-requests/my');
            setRequests(response.data);
        } catch (error) {
            console.error('Error fetching event requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/event-requests', formData);
            alert('Solicitud enviada correctamente');
            setShowModal(false);
            setFormData({
                title: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                location: ''
            });
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al enviar solicitud');
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        const reason = status === 'rechazado' ? window.prompt('Motivo del rechazo:') : null;
        if (status === 'rechazado' && reason === null) return;

        try {
            await api.patch(`/event-requests/${id}/status`, { status, rejectionReason: reason });
            alert(`Solicitud ${status === 'aprobado' ? 'aprobada' : 'rechazada'}`);
            fetchData();
        } catch (error) {
            console.error(error);
            alert('Error al actualizar estado');
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'aprobado': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'rechazado': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-amber-50 text-amber-600 border-amber-100';
        }
    };

    if (loading && requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-white">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando Solicitudes...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-[#11355a] tracking-tight flex items-center gap-4">
                        <div className="p-4 bg-blue-50 rounded-3xl border border-blue-100 shadow-sm">
                            <Calendar size={40} className="text-blue-600" />
                        </div>
                        Solicitudes de Eventos
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg font-medium flex items-center gap-2">
                        <ShieldCheck size={18} className="text-emerald-500" />
                        Propuestas de actividades y reuniones para aprobación directiva.
                    </p>
                </div>
                {!permissions.isSuperAdmin && permissions.user?.role !== 'sostenedor' && permissions.user?.role !== 'admin' && permissions.user?.role !== 'director' && !permissions.isStudent && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                    >
                        <Plus size={24} /> NUEVA PROPUESTA
                    </button>
                )}
            </div>

            {/* Content List */}
            <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-50 overflow-hidden">
                <div className="bg-slate-50 px-10 py-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                        <FileText size={16} /> Historial de Propuestas
                    </h2>
                    <span className="text-xs font-bold text-slate-400">{requests.length} Registros</span>
                </div>

                <div className="divide-y divide-slate-50">
                    {requests.length === 0 ? (
                        <div className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">
                            No hay solicitudes de eventos registradas.
                        </div>
                    ) : (
                        requests.map(req => (
                            <div key={req._id} className="p-8 hover:bg-slate-50/50 transition-all group flex flex-col md:flex-row items-center gap-8">
                                <div className="w-24 h-24 bg-white rounded-3xl border-2 border-slate-50 flex flex-col items-center justify-center text-center shadow-sm shrink-0">
                                    <div className="text-2xl font-black text-slate-800">{new Date(req.date).getDate()}</div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(req.date).toLocaleString('es-CL', { month: 'short' })}</div>
                                    <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-0.5">{new Date(req.date).getFullYear()}</div>
                                </div>

                                <div className="flex-1 space-y-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(req.status)}`}>
                                            {req.status}
                                        </span>
                                        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-1">
                                            <MapPin size={10} /> {req.location || 'Lugar por definir'}
                                        </span>
                                    </div>

                                    <div>
                                        {(permissions.isSuperAdmin || permissions.user?.role === 'sostenedor' || permissions.user?.role === 'admin' || permissions.user?.role === 'director') && (
                                            <div className="flex items-center gap-2 mb-1">
                                                <User size={14} className="text-slate-400" />
                                                <span className="font-black text-slate-700 uppercase tracking-tight text-sm">{req.userId?.name || 'Desconocido'}</span>
                                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">{req.userId?.role}</span>
                                            </div>
                                        )}
                                        <h3 className="text-lg font-black text-[#11355a] uppercase leading-tight">
                                            {req.title}
                                        </h3>
                                        <p className="text-sm font-bold text-slate-500 mt-1">
                                            {req.description}
                                        </p>
                                        {req.status === 'rechazado' && req.rejectionReason && (
                                            <p className="text-xs text-rose-500 font-bold mt-2 bg-rose-50 p-2 rounded-lg border border-rose-100 inline-block">
                                                Motivo rechazo: {req.rejectionReason}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {req.status === 'pendiente' && (permissions.isSuperAdmin || permissions.user?.role === 'sostenedor' || permissions.user?.role === 'admin' || permissions.user?.role === 'director') ? (
                                        <>
                                            <button
                                                onClick={() => handleUpdateStatus(req._id, 'aprobado')}
                                                className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                                            >
                                                Aprobar
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(req._id, 'rechazado')}
                                                className="px-6 py-3 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                                            >
                                                Rechazar
                                            </button>
                                        </>
                                    ) : (
                                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                            {req.status === 'pendiente' ? 'Esperando Revisión' : `Procesado el ${new Date(req.createdAt).toLocaleDateString()}`}
                                        </div>
                                    )}
                                    <ChevronRight size={20} className="text-slate-100" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Request Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[999] flex items-center justify-center p-4 md:pl-[300px] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-md shadow-[0_0_80px_rgba(0,0,0,0.3)] border-8 border-white overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="bg-[#11355a] p-10 text-white relative overflow-hidden">
                            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none mb-2">Proponer Evento</h2>
                            <p className="text-blue-300 font-extrabold uppercase text-[10px] tracking-[0.3em]">PLANIFICACIÓN INSTITUCIONAL</p>
                            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-10 space-y-6 bg-slate-50/30">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Título de la Actividad</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Salida a Museo"
                                    className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-black text-slate-700"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Fecha</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-black text-slate-700"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Lugar</label>
                                    <input
                                        type="text"
                                        className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-black text-slate-700"
                                        value={formData.location}
                                        placeholder="Ej: Auditorio"
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Descripción / Objetivos</label>
                                <textarea
                                    required
                                    rows={3}
                                    className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-bold text-slate-600 resize-none"
                                    placeholder="Detalle los objetivos de la actividad..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="w-full bg-[#11355a] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-blue-900/20 hover:bg-blue-900 transition-all">
                                {loading ? 'ENVIANDO...' : 'ENVIAR PROPUESTA PARA REVISIÓN'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventRequestsPage;
