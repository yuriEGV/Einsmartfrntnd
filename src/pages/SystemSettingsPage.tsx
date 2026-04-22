import { useState } from 'react';
import { RefreshCw, CheckCircle, AlertTriangle, Download, Wifi, Info, Clock, TerminalSquare } from 'lucide-react';
import { useUpdateCheck } from '../hooks/useUpdateCheck';
import { usePermissions } from '../hooks/usePermissions';

const SystemSettingsPage = () => {
    const { isAdmin, isDirector } = usePermissions();
    const canUpdate = isAdmin || isDirector;
    const { updateStatus, isRunningUpdate, checkForUpdates, runUpdate } = useUpdateCheck(true);
    const [updateLog, setUpdateLog] = useState<string[]>([]);
    const [isChecking, setIsChecking] = useState(false);

    const handleCheck = async () => {
        setIsChecking(true);
        await checkForUpdates();
        setIsChecking(false);
    };

    const handleRunUpdate = async () => {
        if (!window.confirm('¿Confirmar la actualización del sistema? El servidor se reiniciará brevemente.')) return;
        
        setUpdateLog(['⏳ Iniciando proceso de actualización...', '📥 Descargando cambios desde GitHub...', '🔧 Reconstruyendo contenedores Docker...', '⚠️ El servidor estará inactivo por ~1-2 minutos.']);
        const result = await runUpdate();
        if (result.ok) {
            setUpdateLog(prev => [...prev, '✅ ' + result.message]);
        } else {
            setUpdateLog(prev => [...prev, '❌ Error: ' + result.message]);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tighter">
                    <RefreshCw className="text-blue-600" size={32} />
                    Centro de Actualización
                </h1>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                    Gestión de versiones del sistema Einsmart
                </p>
            </div>

            {/* Status Card */}
            <div className={`rounded-[2.5rem] p-8 border-2 ${updateStatus.hasUpdate ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-100'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-2xl ${updateStatus.hasUpdate ? 'bg-amber-500' : 'bg-emerald-500'} text-white shadow-lg`}>
                            {updateStatus.hasUpdate ? <AlertTriangle size={28} /> : <CheckCircle size={28} />}
                        </div>
                        <div>
                            <h2 className={`text-xl font-black uppercase tracking-tighter ${updateStatus.hasUpdate ? 'text-amber-900' : 'text-emerald-900'}`}>
                                {updateStatus.hasUpdate ? '¡Nueva Versión Disponible!' : 'Sistema al Día'}
                            </h2>
                            <p className={`text-sm font-bold ${updateStatus.hasUpdate ? 'text-amber-700/70' : 'text-emerald-700/70'}`}>
                                {updateStatus.lastChecked
                                    ? `Última verificación: ${new Date(updateStatus.lastChecked).toLocaleTimeString()}`
                                    : 'Verificando...'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCheck}
                            disabled={isChecking}
                            className="bg-white border-2 border-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={isChecking ? 'animate-spin' : ''} />
                            {isChecking ? 'Verificando...' : 'Verificar Ahora'}
                        </button>
                        
                        {updateStatus.hasUpdate && canUpdate && (
                            <button
                                onClick={handleRunUpdate}
                                disabled={isRunningUpdate}
                                className="bg-amber-500 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-amber-600 transition-all shadow-xl shadow-amber-200 active:scale-95 disabled:opacity-50"
                            >
                                <Download size={16} />
                                {isRunningUpdate ? 'Actualizando...' : 'Actualizar Ahora'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Version info */}
                {(updateStatus.localHash || updateStatus.remoteHash) && (
                    <div className="mt-6 grid grid-cols-2 gap-4">
                        <div className="bg-white/60 rounded-2xl p-4 border border-white">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Versión Instalada</p>
                            <code className="text-sm font-black text-slate-700">{updateStatus.localHash || '—'}</code>
                        </div>
                        <div className="bg-white/60 rounded-2xl p-4 border border-white">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Versión Disponible</p>
                            <code className={`text-sm font-black ${updateStatus.hasUpdate ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {updateStatus.remoteHash || '—'}
                            </code>
                        </div>
                    </div>
                )}
            </div>

            {/* Update Log */}
            {updateLog.length > 0 && (
                <div className="bg-slate-900 rounded-[2rem] p-8 border border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                        <TerminalSquare className="text-emerald-400" size={20} />
                        <h3 className="text-emerald-400 font-black text-xs uppercase tracking-widest">Log de Actualización</h3>
                    </div>
                    <div className="space-y-2 font-mono">
                        {updateLog.map((line, i) => (
                            <p key={i} className="text-sm text-slate-300">{line}</p>
                        ))}
                        {isRunningUpdate && (
                            <div className="flex items-center gap-2 text-blue-400 pt-2">
                                <RefreshCw size={14} className="animate-spin" />
                                <span className="text-sm font-black uppercase tracking-widest">Procesando...</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-start gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0"><Wifi size={20} /></div>
                    <div>
                        <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">Red LAN</h4>
                        <p className="text-xs text-slate-400 font-bold mt-1">El servidor actualiza todos los terminales automáticamente.</p>
                    </div>
                </div>
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-start gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0"><Clock size={20} /></div>
                    <div>
                        <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">Tiempo de Inactividad</h4>
                        <p className="text-xs text-slate-400 font-bold mt-1">La actualización tarda ~1-2 min. Planifícala en horario libre.</p>
                    </div>
                </div>
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-start gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0"><Info size={20} /></div>
                    <div>
                        <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">Verificación Automática</h4>
                        <p className="text-xs text-slate-400 font-bold mt-1">El sistema verifica GitHub cada 5 minutos y notifica al escritorio.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemSettingsPage;
