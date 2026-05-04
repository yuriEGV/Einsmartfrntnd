import React, { useState } from 'react';
import { X, Calendar, Clock, MessageSquare, CheckCircle, Video, MapPin } from 'lucide-react';
import api from '../../services/api';

interface CitationResponseModalProps {
    citation: any;
    onClose: () => void;
    onSuccess: () => void;
}

const CitationResponseModal: React.FC<CitationResponseModalProps> = ({ citation, onClose, onSuccess }) => {
    const [comentarios, setComentarios] = useState(citation.comentariosApoderado || '');
    const [modalidad, setModalidad] = useState(citation.modalidad || 'presencial');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);

    const handleConfirm = async (status: string) => {
        if (!pin) {
            alert('Por favor, ingrese su PIN de firma para validar la respuesta.');
            return;
        }

        try {
            setLoading(true);
            
            // 1. Update status and comments
            await api.patch(`/citaciones/${citation._id}/status`, {
                estado: status,
                comentariosApoderado: comentarios,
                modalidad: modalidad
            });

            // 2. Sign digitally
            await api.post(`/citaciones/${citation._id}/sign`, {
                pin,
                signature: `Firma digital apoderado - ${new Date().toISOString()}`
            });

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error updating citation', error);
            alert(error.response?.data?.message || 'Error al actualizar la citación o PIN incorrecto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl border-8 border-white overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-10 bg-[#11355a] text-white relative">
                    <button onClick={onClose} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-400/30">
                            <MessageSquare size={24} className="text-blue-300" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Coordinar Citación</h2>
                            <p className="text-blue-300 font-bold uppercase text-[10px] tracking-widest mt-1">Responder al Profesor {citation.profesorId?.name}</p>
                        </div>
                    </div>
                </div>

                <div className="p-10 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-5 rounded-3xl border-2 border-slate-100">
                            <div className="flex items-center gap-3 text-slate-400 mb-2">
                                <Calendar size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Fecha Propuesta</span>
                            </div>
                            <p className="text-lg font-black text-slate-800">{new Date(citation.fecha).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                        </div>
                        <div className="bg-slate-50 p-5 rounded-3xl border-2 border-slate-100">
                            <div className="flex items-center gap-3 text-slate-400 mb-2">
                                <Clock size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Hora Propuesta</span>
                            </div>
                            <p className="text-lg font-black text-slate-800">{citation.hora}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">¿Cómo prefieres la reunión?</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setModalidad('presencial')}
                                className={`flex items-center justify-center gap-3 p-4 rounded-3xl border-2 transition-all font-black text-sm uppercase tracking-tighter ${modalidad === 'presencial' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                            >
                                <MapPin size={20} /> Presencial
                            </button>
                            <button
                                onClick={() => setModalidad('online')}
                                className={`flex items-center justify-center gap-3 p-4 rounded-3xl border-2 transition-all font-black text-sm uppercase tracking-tighter ${modalidad === 'online' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                            >
                                <Video size={20} /> Online
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Mensaje o Sugerencia de Horario</label>
                        <textarea
                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:border-blue-500 focus:bg-white transition-all outline-none font-bold text-slate-700 min-h-[100px] text-sm"
                            placeholder="Escribe aquí si necesitas cambiar la fecha o tienes alguna observación..."
                            value={comentarios}
                            onChange={(e) => setComentarios(e.target.value)}
                        />
                    </div>

                    <div className="space-y-3 p-6 bg-amber-50 rounded-[2.5rem] border-2 border-amber-100">
                        <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest text-center">Firma Digital (Ingrese su PIN)</label>
                        <input
                            type="password"
                            maxLength={4}
                            placeholder="****"
                            className="w-full text-center text-2xl font-black tracking-[1em] bg-white border-2 border-amber-200 rounded-2xl py-3 outline-none focus:border-amber-500 transition-all"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                        />
                        <p className="text-[8px] text-amber-400 font-bold text-center uppercase tracking-widest">El PIN por defecto es 1234</p>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row gap-4">
                        <button
                            disabled={loading}
                            onClick={() => handleConfirm('rechazada')}
                            className="flex-1 py-5 rounded-3xl font-black text-xs uppercase tracking-widest text-rose-500 bg-rose-50 hover:bg-rose-100 transition-all border-2 border-rose-100"
                        >
                            No puedo asistir
                        </button>
                        <button
                            disabled={loading}
                            onClick={() => handleConfirm('confirmada')}
                            className="flex-[2] py-5 rounded-3xl font-black text-xs uppercase tracking-widest text-white bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={18} /> Confirmar y Firmar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CitationResponseModal;
