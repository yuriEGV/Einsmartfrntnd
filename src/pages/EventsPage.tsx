import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { Calendar, Plus, Trash2, MapPin, Clock } from 'lucide-react';

interface SchoolEvent {
    _id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    type: 'evento' | 'reunion' | 'otro';
}

const EventsPage = () => {
    const { isSuperAdmin } = usePermissions();
    const [events, setEvents] = useState<SchoolEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newEvent, setNewEvent] = useState<Partial<SchoolEvent>>({
        type: 'evento',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await api.get('/events');
            setEvents(response.data);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/events', newEvent);
            setShowModal(false);
            fetchEvents();
        } catch (error) {
            alert('Error al crear evento');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Eliminar este evento?')) return;
        try {
            await api.delete(`/events/${id}`);
            fetchEvents();
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Calendar className="text-[#11355a]" />
                    Eventos y Reuniones
                </h1>
                {isSuperAdmin && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-[#11355a] text-white px-4 py-2 rounded flex items-center gap-2"
                    >
                        <Plus size={18} /> Nuevo Evento
                    </button>
                )}
            </div>

            {loading ? (
                <p>Cargando...</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {events.map(event => (
                        <div key={event._id} className="bg-white p-5 rounded-lg shadow border-l-4 border-[#11355a]">
                            <div className="flex justify-between items-start">
                                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${event.type === 'reunion' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                    {event.type}
                                </span>
                                {isSuperAdmin && (
                                    <button onClick={() => handleDelete(event._id)} className="text-gray-400 hover:text-red-500">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                            <h3 className="font-bold text-lg mt-2 text-gray-800">{event.title}</h3>
                            <p className="text-gray-600 text-sm mt-1 line-clamp-2">{event.description}</p>

                            <div className="mt-4 space-y-2 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <Clock size={14} />
                                    {new Date(event.date).toLocaleDateString()} {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} />
                                    {event.location || 'Lugar por confirmar'}
                                </div>
                            </div>
                        </div>
                    ))}
                    {events.length === 0 && <p className="text-gray-500 col-span-3">No hay eventos programados.</p>}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Programar Actividad</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Título</label>
                                <input required className="w-full border p-2 rounded"
                                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Descripción</label>
                                <textarea className="w-full border p-2 rounded"
                                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Fecha y Hora</label>
                                    <input type="datetime-local" required className="w-full border p-2 rounded"
                                        onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Tipo</label>
                                    <select className="w-full border p-2 rounded bg-white"
                                        onChange={e => setNewEvent({ ...newEvent, type: e.target.value as any })}>
                                        <option value="evento">Evento</option>
                                        <option value="reunion">Reunión de Apoderados</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Lugar</label>
                                <input className="w-full border p-2 rounded"
                                    onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-[#11355a] text-white rounded">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventsPage;
