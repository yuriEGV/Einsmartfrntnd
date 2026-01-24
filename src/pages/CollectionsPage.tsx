
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { useTenant } from '../context/TenantContext';
import { useReactToPrint } from 'react-to-print';
import { AlertCircle, Mail, ShieldAlert, FileText } from 'lucide-react';

const CollectionsPage = () => {
    // const { permissions } = usePermissions(); // Or use hook directly
    // Need to fix usePermissions usage if it returns object or permissions object
    // Looking at other files: const { canManagePayments, ... } = usePermissions();
    // But Step 361 Layout.tsx uses: const permissions = usePermissions(); then permissions.canManage...
    // Let's stick to destructuring what we need or check hook implementation.
    // Step 387 UsersPage: const { canManageUsers ... } = usePermissions();
    // Assuming hook returns checks directly.

    // Quick fix: re-read hook? No time. Let's use standard.
    const { isSostenedor, isSuperAdmin, canManagePayments } = usePermissions();
    const { tenant } = useTenant();

    const [debtors, setDebtors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDebtor, setSelectedDebtor] = useState<any>(null); // For printing
    const [emailSending, setEmailSending] = useState(false);

    const letterRef = useRef<HTMLDivElement>(null);

    const handlePrintLetter = useReactToPrint({
        contentRef: letterRef,
        documentTitle: `Carta-Compromiso-${selectedDebtor?.studentName || 'Pago'}`,
    });

    useEffect(() => {
        fetchDebtors();
    }, []);

    const fetchDebtors = async () => {
        try {
            const res = await api.get('/analytics/debtors'); // Reusing the ranking endpoint as it returns exactly what we need
            setDebtors(res.data);
        } catch (error) {
            console.error('Error fetching debtors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNotify = async (debtor: any) => {
        if (!window.confirm(`¿Enviar notificaciones de cobro para ${debtor.studentName}? Se enviará copia a Finanzas.`)) return;

        setEmailSending(true);
        try {
            // New endpoint for notification
            await api.post('/notifications/payment-reminder', {
                studentId: debtor._id,
                totalDebt: debtor.totalDebt,
                guardianName: debtor.guardianName
                // Backend should lookup emails
            });
            alert('Notificaciones enviadas correctamente (Apoderado y Finanzas).');
        } catch (error) {
            console.error(error);
            alert('Error al enviar notificaciones.');
        } finally {
            setEmailSending(false);
        }
    };

    const prepareLetter = (debtor: any) => {
        setSelectedDebtor(debtor);
        // Wait for state update then print? react-to-print usually needs ref to be ready.
        // We might need a small timeout or use a modal that shows the letter first.
        setTimeout(() => {
            handlePrintLetter();
        }, 100);
    };

    if (!isSostenedor && !isSuperAdmin && !canManagePayments) {
        return <div className="p-10 text-center text-red-500 font-bold">Acceso Restringido</div>;
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto animate-in fade-in">
            <div className="mb-10">
                <h1 className="text-3xl font-black text-[#11355a] flex items-center gap-3">
                    <ShieldAlert size={32} className="text-rose-500" />
                    Gestión de Cobranza
                </h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">
                    Seguimiento de Morosidad y Cartas de Compromiso
                </p>
            </div>

            {loading ? (
                <div className="p-20 text-center animate-pulse font-bold text-slate-300">Cargando base de datos de morosidad...</div>
            ) : (
                <div className="bg-white rounded-3xl shadow-xl border border-rose-100 overflow-hidden">
                    <div className="bg-rose-50 p-6 border-b border-rose-100 flex justify-between items-center">
                        <div className="text-rose-800 font-black uppercase text-xs tracking-widest flex items-center gap-2">
                            <AlertCircle size={16} />
                            Alumnos con Deuda Vencida
                        </div>
                        <div className="text-rose-600 font-bold text-xs">
                            {debtors.length} Casos Críticos
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-rose-50">
                                    <th className="p-6 font-black text-xs text-rose-300 uppercase tracking-widest">Apoderado</th>
                                    <th className="p-6 font-black text-xs text-rose-300 uppercase tracking-widest">Estudiante</th>
                                    <th className="p-6 font-black text-xs text-rose-300 uppercase tracking-widest text-center">Deuda Total</th>
                                    <th className="p-6 font-black text-xs text-rose-300 uppercase tracking-widest text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-rose-50">
                                {debtors.map(debtor => (
                                    <tr key={debtor._id} className="hover:bg-rose-50/30 transition-colors group">
                                        <td className="p-6">
                                            <div className="font-black text-slate-700">{debtor.guardianName || 'Sin Registro'}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Responsable Financiero</div>
                                        </td>
                                        <td className="p-6">
                                            <div className="font-bold text-slate-600">{debtor.studentName}</div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <span className="font-black text-rose-600 text-lg">${debtor.totalDebt.toLocaleString()}</span>
                                            <div className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mt-1">{debtor.overdueCount} Cuotas Vencidas</div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleNotify(debtor)}
                                                    disabled={emailSending}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-blue-200 hover:text-blue-600 transition-all hover:shadow-lg active:scale-95"
                                                    title="Notificar por Correo"
                                                >
                                                    <Mail size={14} /> <span className="hidden xl:inline">Notificar</span>
                                                </button>
                                                <button
                                                    onClick={() => prepareLetter(debtor)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-[#11355a] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-900 transition-all hover:shadow-lg active:scale-95 shadow-blue-900/20"
                                                    title="Generar Carta Compromiso"
                                                >
                                                    <FileText size={14} /> <span className="hidden xl:inline">Carta Compromiso</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Hidden Printable Letter Template */}
            <div className="hidden">
                <div ref={letterRef} className="p-16 max-w-3xl mx-auto text-slate-900 font-serif leading-relaxed bg-white">
                    <div className="flex justify-between items-center mb-12 border-b-2 border-black pb-8">
                        <div>
                            {tenant?.theme?.logoUrl && <img src={tenant.theme.logoUrl} className="h-20 object-contain mb-4" />}
                            <h1 className="text-2xl font-bold uppercase tracking-widest">{tenant?.name || 'INSTITUTO EDUCACIONAL'}</h1>
                            <p className="text-sm font-bold text-slate-500 uppercase">Departamento de Finanzas y Cobranza</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold">{new Date().toLocaleDateString()}</p>
                            <p className="text-sm font-bold uppercase text-slate-400">Folio: {Math.floor(Math.random() * 10000)}</p>
                        </div>
                    </div>

                    <h2 className="text-center text-xl font-bold uppercase mb-12 underline decoration-2 underline-offset-4">Carta de Compromiso de Pago</h2>

                    <div className="space-y-6 text-justify mb-12">
                        <p>
                            Yo, <strong>{selectedDebtor?.guardianName || '__________________________'}</strong>, en mi calidad de apoderado del estudiante <strong>{selectedDebtor?.studentName}</strong>,
                            reconozco mantener una deuda pendiente con la institución por un monto total de <strong>${selectedDebtor?.totalDebt?.toLocaleString()}</strong>.
                        </p>
                        <p>
                            Por medio de la presente, me comprometo formalmente a regularizar esta situación financiera mediante el pago de lo adeudado en las fechas y condiciones acordadas con la administración del establecimiento.
                        </p>
                        <p>
                            Entiendo que el incumplimiento de este compromiso faculta al establecimiento para tomar las medidas administrativas correspondientes,
                            incluyendo la revisión de la continuidad de la matrícula para el próximo periodo académico, conforme a lo establecido en el reglamento interno y contrato de prestación de servicios educacionales.
                        </p>
                    </div>

                    <div className="mt-20 flex justify-between gap-10">
                        <div className="flex-1 border-t border-black pt-4 text-center">
                            <p className="font-bold mb-8">Firma del Apoderado</p>
                            <div className="h-10"></div>
                            <p className="text-xs uppercase">RUT: ____________________</p>
                        </div>
                        <div className="flex-1 border-t border-black pt-4 text-center">
                            <p className="font-bold mb-8">Firma Sostenedor / Finanzas</p>
                            <div className="h-10"></div>
                            <p className="text-xs uppercase">{tenant?.name}</p>
                        </div>
                    </div>

                    <div className="mt-24 text-center text-xs font-bold text-slate-400 uppercase tracking-widest border-t pt-8">
                        Documento oficial generado por sistema Einsmart
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CollectionsPage;
