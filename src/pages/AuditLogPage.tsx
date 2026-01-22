import { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldCheck, Search, Filter, Clock, User } from 'lucide-react';

interface AuditLog {
    _id: string;
    action: string;
    entityType: string;
    user: { name: string; email: string; role: string };
    details: any;
    createdAt: string;
}

const AuditLogPage = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await api.get('/audit-logs');
            setLogs(response.data);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionBadge = (action: string) => {
        const colors: any = {
            'DELETE_GRADE': 'bg-red-100 text-red-700 border-red-200',
            'UPDATE_GRADE': 'bg-yellow-100 text-yellow-700 border-yellow-200',
            'CREATE_GRADE': 'bg-green-100 text-green-700 border-green-200',
            'LOGIN': 'bg-blue-100 text-blue-700 border-blue-200'
        };
        return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors[action] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>{action}</span>;
    };

    const filteredLogs = logs.filter(log =>
        log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <ShieldCheck className="text-[#11355a]" />
                    Central de Auditoría (Fiscalización)
                </h1>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 flex items-center gap-4">
                <div className="flex-1 flex items-center gap-2 border-r pr-4">
                    <Search className="text-gray-400" size={20} />
                    <input
                        placeholder="Buscar por usuario o acción..."
                        className="w-full outline-none text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Filter size={18} />
                    <span>Últimos {logs.length} registros</span>
                </div>
            </div>

            {loading ? (
                <p>Cargando bitácora...</p>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden border">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha y Hora</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalles</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {filteredLogs.map(log => (
                                    <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <Clock size={12} />
                                                {new Date(log.createdAt).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-gray-100 p-1.5 rounded-full text-gray-600"><User size={14} /></div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{log.user?.name}</div>
                                                    <div className="text-[10px] text-gray-500">{log.user?.role}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getActionBadge(log.action)}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            <div className="max-w-xs truncate">
                                                {JSON.stringify(log.details)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogPage;
