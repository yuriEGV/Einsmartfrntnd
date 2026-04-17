import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../../services/api';
import { RefreshCw, X, MapPin } from 'lucide-react';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface LocationData {
    _id: string; // alternanciaId
    userId: { name: string, role: string };
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: string;
    numeroChip?: string;
    estudianteId?: { firstName: string, lastName: string, rut: string };
    empresa?: { razonSocial: string };
}

export function GPSMonitor({ onClose }: { onClose: () => void }) {
    const [locations, setLocations] = useState<LocationData[]>([]);
    const [loading, setLoading] = useState(true);

    const loadLocations = async () => {
        try {
            setLoading(true);
            const res = await api.get('/alternancias/gps/monitoring');
            setLocations(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLocations();
        const intId = setInterval(loadLocations, 60000); // refresh every minute
        return () => clearInterval(intId);
    }, []);

    const center: [number, number] = locations.length > 0 ? [locations[0].lat, locations[0].lng] : [-33.4372, -70.6506];

    return (
        <div className="fixed inset-0 z-[110] flex flex-col bg-white animate-in slide-in-from-bottom-full duration-500">
            <div className="p-4 bg-[#002447] text-white flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-3">
                    <MapPin size={24} className="text-[#2DAAB8]" />
                    <h2 className="text-xl font-black uppercase">Monitor Satelital Alternancias</h2>
                    <span className="bg-[#2DAAB8]/20 px-3 py-1 rounded-full text-xs font-bold text-[#2DAAB8] animate-pulse">
                        LIVE
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={loadLocations} className="flex items-center gap-2 hover:text-[#2DAAB8] transition font-black text-xs uppercase tracking-widest">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refrescar
                    </button>
                    <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition">
                        <X size={20} />
                    </button>
                </div>
            </div>
            
            <div className="flex-1 relative z-0">
                <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {locations.map((loc) => {
                         const userName = loc.userId?.name || 'Usuario';
                         const studentName = loc.estudianteId ? `${loc.estudianteId.firstName} ${loc.estudianteId.lastName}` : '';
                         const corp = loc.empresa?.razonSocial || '';
                         
                         return (
                            <Marker key={loc._id} position={[loc.lat, loc.lng]}>
                                <Popup>
                                    <div className="text-sm">
                                        <p className="font-black text-[#002447] uppercase">{userName}</p>
                                        <p className="text-[10px] uppercase text-slate-500 font-bold mb-2">Rol: {loc.userId?.role}</p>
                                        {studentName && <p className="text-xs"><strong>Estudiante:</strong> {studentName}</p>}
                                        {corp && <p className="text-xs"><strong>Empresa:</strong> {corp}</p>}
                                        {loc.numeroChip && <p className="text-xs text-[#2DAAB8] uppercase font-black tracking-widest mt-1"><strong>N° Chip:</strong> {loc.numeroChip}</p>}
                                        <p className="text-[#2DAAB8] font-bold text-xs mt-2">
                                            Actualizado: {new Date(loc.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </Popup>
                            </Marker>
                        )
                    })}
                </MapContainer>
                
                {locations.length === 0 && !loading && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 p-6 rounded-2xl shadow-2xl z-[1000] text-center border-2 border-slate-100 backdrop-blur">
                        <MapPin size={48} className="mx-auto text-slate-300 mb-3" />
                        <h3 className="text-slate-500 font-black uppercase tracking-widest">No hay alternancias rastreables en este momento</h3>
                    </div>
                )}
            </div>
        </div>
    );
}
