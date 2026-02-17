import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    Search, User, FileText,
    CheckCircle, AlertCircle,
    CreditCard, Building, Printer
} from 'lucide-react';

interface Student {
    _id: string;
    nombres: string;
    apellidos: string;
    rut: string;
    cursoId?: { name: string };
}

interface DebtDetail {
    id: string;
    concepto: string;
    amount: number;
    estado: string;
    fechaVencimiento: string;
}

interface StudentDebt {
    studentId: string;
    totalDebt: number;
    details: DebtDetail[];
}

const SecretariaPage = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [debtData, setDebtData] = useState<StudentDebt | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const searchStudents = async () => {
        if (searchTerm.length < 3) return;
        setLoading(true);
        try {
            const res = await api.get(`/estudiantes?search=${searchTerm}`);
            setStudents(res.data);
            setError(null);
        } catch (err) {
            setError('Error al buscar estudiantes');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentDebt = async (student: Student) => {
        setSelectedStudent(student);
        setLoading(true);
        try {
            const res = await api.get(`/payments/student/${student._id}/debt`);
            setDebtData(res.data);
            setError(null);
        } catch (err) {
            setError('Error al cargar deuda del estudiante');
        } finally {
            setLoading(false);
        }
    };

    const handleProcessOfficePayment = async (paymentId: string) => {
        if (!window.confirm('¿Confirmar recepción de pago en EFECTIVO para este item?')) return;
        try {
            await api.post(`/payments/${paymentId}/pay-cash`);
            setSuccessMessage('Pago procesado correctamente');
            if (selectedStudent) fetchStudentDebt(selectedStudent);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError('Error al procesar el pago');
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-[#11355a] flex items-center gap-4 tracking-tighter">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner">
                            <Building size={32} />
                        </div>
                        Oficina de Secretaría
                    </h1>
                    <p className="text-slate-400 font-bold ml-1 uppercase text-[10px] tracking-widest">Módulo de Recaudación y Cobranza en Caja</p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Caja Abierta: {user?.name}</span>
                </div>
            </div>

            {successMessage && (
                <div className="bg-emerald-500 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
                    <CheckCircle size={20} />
                    {successMessage}
                </div>
            )}

            {error && (
                <div className="bg-rose-500 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-3">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Search Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-50">
                        <h2 className="text-lg font-black text-[#11355a] mb-6 uppercase tracking-widest flex items-center gap-2">
                            <Search size={18} /> Búsqueda de Alumno
                        </h2>
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="RUT o Nombre del alumno..."
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 transition-all outline-none font-bold text-slate-700 placeholder:text-slate-300"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && searchStudents()}
                            />
                            <button
                                onClick={searchStudents}
                                className="absolute right-2 top-2 bottom-2 bg-[#11355a] text-white px-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-900 transition-all"
                            >
                                BUSCAR
                            </button>
                        </div>

                        <div className="mt-8 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {students.map(s => (
                                <button
                                    key={s._id}
                                    onClick={() => fetchStudentDebt(s)}
                                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${selectedStudent?._id === s._id ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-50 hover:border-slate-200 bg-white'}`}
                                >
                                    <div className={`p-2 rounded-xl ${selectedStudent?._id === s._id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-800 text-sm leading-none mb-1">{s.nombres} {s.apellidos}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.rut} • {s.cursoId?.name || 'S/C'}</div>
                                    </div>
                                </button>
                            ))}
                            {searchTerm && students.length === 0 && !loading && (
                                <p className="text-center py-10 text-slate-300 font-bold italic">No se encontraron resultados.</p>
                            )}
                            {loading && !selectedStudent && <div className="text-center py-10 animate-pulse text-emerald-500 font-black">BUSCANDO...</div>}
                        </div>
                    </div>
                </div>

                {/* Details Panel */}
                <div className="lg:col-span-2 space-y-6">
                    {selectedStudent ? (
                        <div className="space-y-6">
                            {/* Student Info Card */}
                            <div className="bg-gradient-to-br from-[#11355a] to-blue-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                    <User size={200} />
                                </div>
                                <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
                                    <div>
                                        <p className="text-blue-300 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Expediente Financiero Estudiantil</p>
                                        <h3 className="text-4xl font-black tracking-tighter mb-1">{selectedStudent.nombres} {selectedStudent.apellidos}</h3>
                                        <div className="flex items-center gap-4 mt-4">
                                            <span className="px-3 py-1 bg-white/10 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest">{selectedStudent.rut}</span>
                                            <span className="px-3 py-1 bg-white/10 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest">Curso: {selectedStudent.cursoId?.name || 'S/C'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">Deuda Total Pendiente</p>
                                        <h4 className="text-5xl font-black font-mono tracking-tighter text-emerald-400">
                                            ${debtData?.totalDebt.toLocaleString() || '0'}
                                        </h4>
                                    </div>
                                </div>
                            </div>

                            {/* Unpaid Items Table */}
                            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-50 overflow-hidden">
                                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                                    <h3 className="text-lg font-black text-[#11355a] uppercase tracking-widest flex items-center gap-2">
                                        <FileText size={18} /> Detalle de Cobros Pendientes
                                    </h3>
                                    <button
                                        onClick={() => window.print()}
                                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                    >
                                        <Printer size={20} />
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Ítem / Concepto</th>
                                                <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimiento</th>
                                                <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                                                <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
                                                <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {debtData?.details.map(item => (
                                                <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <div className="font-bold text-slate-800">{item.concepto}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">{item.id}</div>
                                                    </td>
                                                    <td className="px-8 py-5 text-center text-sm font-bold text-slate-500">
                                                        {new Date(item.fechaVencimiento).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.estado === 'vencido' ? 'bg-rose-100 text-rose-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                            {item.estado === 'vencido' ? 'VENCIDO' : 'PENDIENTE'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right font-black text-[#11355a] font-mono tracking-tighter text-lg">
                                                        ${item.amount.toLocaleString()}
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <button
                                                            onClick={() => handleProcessOfficePayment(item.id)}
                                                            className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-950/10 hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 mx-auto"
                                                        >
                                                            <CreditCard size={12} /> COBRAR
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!debtData || debtData.details.length === 0) && (
                                                <tr>
                                                    <td colSpan={5} className="py-20 text-center text-slate-300 font-bold italic">No hay cobros pendientes para este alumno.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center p-20 text-center space-y-6">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                <FileText size={48} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter">Sin Alumno Seleccionado</h3>
                                <p className="text-slate-300 font-bold text-sm max-w-[300px] mt-2">Utilice el panel lateral para buscar un estudiante y gestionar su estado financiero.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SecretariaPage;
