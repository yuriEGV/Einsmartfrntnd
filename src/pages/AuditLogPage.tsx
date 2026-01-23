import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTenant } from '../context/TenantContext';
import TenantLogo from '../components/TenantLogo';
import { ShieldCheck, Search, Filter, Clock, User, AlertCircle } from 'lucide-react';

interface AuditLog {
    _id: string;
    action: string;
    entityType: string;
    user: { name: string; email: string; role: string };
    details: any;
    createdAt: string;
}

const AuditLogPage = () => {
    const { tenant } = useTenant();
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
            <div className="flex items-center gap-4 mb-6">
                {tenant?.logo && <TenantLogo size="small" showName={false} />}
                <h1 className="text-2xl md:text-3xl font-bold text-[#11355a] flex items-center gap-2">
                    <ShieldCheck className="text-blue-600" />
                    Central de Auditoría
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
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#11355a]"></div>
                </div>
            ) : filteredLogs.length > 0 ? (
                <>
                {/* Tabla para desktop */}
                <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden border">
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

                {/* Cards para mobile */}
                <div className="md:hidden space-y-3">
                    {filteredLogs.map(log => (
                        <div key={log._id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="bg-gray-100 p-2 rounded-full text-gray-600"><User size={16} /></div>
                                <div>
                                    <p className="font-bold text-gray-900">{log.user?.name}</p>
                                    <p className="text-xs text-gray-500">{log.user?.role}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <Clock size={14} className="text-gray-400" />
                                <p className="text-xs text-gray-600">{new Date(log.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="mb-2">
                                {getActionBadge(log.action)}
                            </div>
                            <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{JSON.stringify(log.details)}</p>
                        </div>
                    ))}
                </div>
                </>
            ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                    <AlertCircle size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-bold">No hay registros de auditoría.</p>
                </div>
            )}
        </div>
    );
};

export default AuditLogPage;
