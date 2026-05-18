import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTenant } from '../context/TenantContext';
import TenantLogo from '../components/TenantLogo';
import { usePermissions } from '../hooks/usePermissions';
import { ShieldCheck, Search, Filter, Clock, User, AlertCircle, Globe, LogIn, Building2 } from 'lucide-react';

interface AuditLog {
    _id: string;
    action: string;
    entityType: string;
    user: { name: string; email: string; role: string };
    tenantId?: { _id: string; name: string } | null;
    details: any;
    createdAt: string;
}

const AuditLogPage = () => {
    const { tenant } = useTenant();
    const permissions = usePermissions();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [globalView, setGlobalView] = useState(true);

    const isGlobalAdmin = permissions.isSuperAdmin;

    useEffect(() => {
        fetchLogs();
    }, [globalView]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = isGlobalAdmin && globalView ? '?global=true&limit=500' : '?limit=200';
            const response = await api.get(`/audit-logs${params}`);
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
            'LOGIN': 'bg-blue-100 text-blue-700 border-blue-200',
            'DELETE_USER': 'bg-red-100 text-red-700 border-red-200',
            'CREATE_USER': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        };
        const icon = action === 'LOGIN' ? <LogIn size={10} className="inline mr-1" /> : null;
        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors[action] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                {icon}{action}
            </span>
        );
    };

    const filteredLogs = logs.filter(log =>
        (log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.tenantId as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const loginCount = filteredLogs.filter(l => l.action === 'LOGIN').length;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-4">
                    {!isGlobalAdmin && tenant?.logo && <TenantLogo size="small" showName={false} />}
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-[#11355a] flex items-center gap-2">
                            <ShieldCheck className="text-blue-600" />
                            {isGlobalAdmin ? 'Trazabilidad Global' : 'Central de Auditoría'}
                        </h1>
                        {isGlobalAdmin && (
                            <p className="text-sm text-slate-500 mt-1">
                                Registro de accesos y acciones de <strong>toda la plataforma</strong>
                            </p>
                        )}
                    </div>
                </div>

                {/* KPI chips */}
                {isGlobalAdmin && (
                    <div className="flex gap-3 flex-wrap">
                        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-2">
                            <LogIn size={16} className="text-blue-500" />
                            <span className="text-xs font-black text-blue-700">{loginCount} Inicios de sesión</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2">
                            <Globe size={16} className="text-slate-500" />
                            <span className="text-xs font-black text-slate-700">{filteredLogs.length} registros totales</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Search + Toggle */}
            <div className="bg-white p-4 rounded-xl shadow-sm border mb-6 flex flex-wrap items-center gap-4">
                <div className="flex-1 flex items-center gap-2 border-r pr-4 min-w-[200px]">
                    <Search className="text-gray-400 shrink-0" size={20} />
                    <input
                        placeholder="Buscar por usuario, email, colegio o acción..."
                        className="w-full outline-none text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Filter size={18} />
                    <span>Últimos {logs.length} registros</span>
                </div>
                {isGlobalAdmin && (
                    <button
                        onClick={() => setGlobalView(v => !v)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black border transition-all ${globalView ? 'bg-[#11355a] text-white border-[#11355a]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#11355a]'}`}
                    >
                        <Globe size={14} />
                        {globalView ? 'Vista Global (ON)' : 'Vista Global (OFF)'}
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#11355a]"></div>
                </div>
            ) : filteredLogs.length > 0 ? (
                <>
                {/* Tabla desktop */}
                <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden border">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Fecha y Hora</th>
                                    <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Usuario</th>
                                    {isGlobalAdmin && globalView && (
                                        <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">
                                            <span className="flex items-center gap-1"><Building2 size={12} />Colegio</span>
                                        </th>
                                    )}
                                    <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Acción</th>
                                    <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Detalles</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {filteredLogs.map(log => (
                                    <tr key={log._id} className={`hover:bg-slate-50 transition-colors ${log.action === 'LOGIN' ? 'border-l-4 border-blue-300' : ''}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <Clock size={12} className="shrink-0" />
                                                {new Date(log.createdAt).toLocaleString('es-CL')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-full text-white text-xs font-black ${log.action === 'LOGIN' ? 'bg-blue-500' : 'bg-slate-400'}`}>
                                                    <User size={12} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900">{log.user?.name || '—'}</div>
                                                    <div className="text-[10px] text-gray-400">{log.user?.email || log.user?.role || '—'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        {isGlobalAdmin && globalView && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                                                    {(log.tenantId as any)?.name || '—'}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getActionBadge(log.action)}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500 max-w-xs">
                                            {log.action === 'LOGIN' ? (
                                                <span className="text-blue-500">IP: {log.details?.ip || '—'}</span>
                                            ) : (
                                                <span className="truncate block">{JSON.stringify(log.details)}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Cards mobile */}
                <div className="md:hidden space-y-3">
                    {filteredLogs.map(log => (
                        <div key={log._id} className={`bg-white rounded-xl border p-4 shadow-sm ${log.action === 'LOGIN' ? 'border-l-4 border-blue-400' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`p-2 rounded-full text-white ${log.action === 'LOGIN' ? 'bg-blue-500' : 'bg-slate-400'}`}><User size={14} /></div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">{log.user?.name || '—'}</p>
                                    <p className="text-xs text-gray-500">{log.user?.role || '—'}</p>
                                </div>
                                <div className="ml-auto">{getActionBadge(log.action)}</div>
                            </div>
                            {isGlobalAdmin && globalView && (log.tenantId as any)?.name && (
                                <p className="text-xs text-slate-500 font-bold mb-1 flex items-center gap-1">
                                    <Building2 size={10} />{(log.tenantId as any).name}
                                </p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock size={12} />{new Date(log.createdAt).toLocaleString('es-CL')}
                            </div>
                            {log.action === 'LOGIN' && (
                                <p className="text-xs text-blue-500 mt-1">IP: {log.details?.ip || '—'}</p>
                            )}
                        </div>
                    ))}
                </div>
                </>
            ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                    <AlertCircle size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-bold">No hay registros de auditoría.</p>
                    <p className="text-gray-400 text-sm mt-1">Los inicios de sesión se registrarán a partir de ahora.</p>
                </div>
            )}
        </div>
    );
};

export default AuditLogPage;
