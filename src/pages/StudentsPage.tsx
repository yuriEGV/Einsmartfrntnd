
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { Plus, Trash2, Search, Mail, School, Printer } from 'lucide-react';

interface Student {
    _id: string;
    nombres: string;
    apellidos: string;
    rut?: string;
    matricula?: string;
    email: string;
    grado: string;
    edad?: number;
}

const StudentsPage = () => {
    const { canManageStudents } = usePermissions();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [currentStudent, setCurrentStudent] = useState<Partial<Student>>({});

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await api.get('/estudiantes');
            setStudents(response.data);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = async (studentId: string) => {
        try {
            const response = await api.get(`/reports/student/${studentId}`);
            const data = response.data;

            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Reporte - ${data.student.nombres}</title>
                            <style>
                                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                                .header { border-bottom: 3px solid #11355a; margin-bottom: 30px; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: center;}
                                .header h1 { margin: 0; color: #11355a; }
                                .section { margin-bottom: 40px; }
                                .section h2 { border-bottom: 1px solid #eee; padding-bottom: 10px; color: #11355a; font-size: 1.2rem; }
                                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                                th, td { border: 1px solid #eee; padding: 12px; text-align: left; }
                                th { background: #f8fafc; font-weight: bold; }
                                .stats-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 20px; margin-top: 15px; }
                                .stat-card { background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; }
                                .stat-val { display: block; font-size: 1.5rem; font-weight: bold; color: #11355a; }
                                .stat-lab { font-size: 0.8rem; color: #666; text-transform: uppercase; }
                                .negativa { color: #e11d48; }
                                .positiva { color: #10b981; }
                                @media print { .no-print { display: none; } }
                            </style>
                        </head>
                        <body>
                            <div class="header">
                                <div>
                                    <h1>Ficha del Estudiante</h1>
                                    <p>Generado el: ${new Date().toLocaleString()}</p>
                                </div>
                                <div style="text-align: right">
                                    <h2 style="margin:0">${data.student.nombres} ${data.student.apellidos}</h2>
                                    <p style="margin:0">RUT: ${data.student.rut || 'N/A'} | Curso: ${data.student.grado || 'N/A'}</p>
                                </div>
                            </div>
                            
                            <div class="section">
                                <h2>Calificaciones</h2>
                                <table>
                                    <thead><tr><th>Evaluación</th><th>Puntaje</th><th>Fecha</th></tr></thead>
                                    <tbody>
                                        ${data.grades.length ? data.grades.map((g: any) => `
                                            <tr><td>${g.title}</td><td>${g.score}/${g.maxScore}</td><td>${new Date(g.date).toLocaleDateString()}</td></tr>
                                        `).join('') : '<tr><td colspan="3">No hay calificaciones registradas</td></tr>'}
                                    </tbody>
                                </table>
                            </div>

                            <div class="section">
                                <h2>Asistencia</h2>
                                <div class="stats-grid">
                                    <div class="stat-card"><span class="stat-val">${data.attendance.total}</span><span class="stat-lab">Días Totales</span></div>
                                    <div class="stat-card"><span class="stat-val">${data.attendance.present}</span><span class="stat-lab">Presente</span></div>
                                    <div class="stat-card"><span class="stat-val">${data.attendance.absent}</span><span class="stat-lab">Ausente</span></div>
                                    <div class="stat-card"><span class="stat-val">${data.attendance.total ? ((data.attendance.present / data.attendance.total) * 100).toFixed(1) : 0}%</span><span class="stat-lab">% Asistencia</span></div>
                                </div>
                            </div>

                            <div class="section">
                                <h2>Observaciones y Anotaciones</h2>
                                ${data.annotations.length ? data.annotations.map((a: any) => `
                                    <div style="border-left: 4px solid ${a.tipo === 'negativa' ? '#e11d48' : '#10b981'}; padding: 10px 15px; background: #fafafa; margin-bottom: 10px;">
                                        <div style="display: flex; justify-content: space-between">
                                            <strong class="${a.tipo}">${a.titulo} (${a.tipo.toUpperCase()})</strong>
                                            <span style="font-size: 0.8rem; color: #888">${new Date(a.fecha).toLocaleDateString()}</span>
                                        </div>
                                        <p style="margin: 5px 0 0 0; font-size: 0.9rem;">${a.descripcion}</p>
                                        <span style="font-size: 0.7rem; color: #aaa">Registrado por: ${a.autor || 'Sistema'}</span>
                                    </div>
                                `).join('') : '<p>No hay anotaciones registradas.</p>'}
                            </div>

                            <button class="no-print" onclick="window.print()" style="padding: 10px 20px; background: #11355a; color: white; border: none; border-radius: 5px; cursor: pointer;">Imprimir ahora</button>
                        </body>
                    </html>
                `);
                printWindow.document.close();
            }
        } catch (error) {
            console.error('Error printing student report:', error);
            alert('Error al generar el reporte imprimible.');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (modalMode === 'create') {
                await api.post('/estudiantes', currentStudent);
            } else {
                await api.put(`/estudiantes/${currentStudent._id}`, currentStudent);
            }
            setShowModal(false);
            fetchStudents();
        } catch (error) {
            alert('Error al guardar estudiante');
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar este estudiante?')) return;
        try {
            await api.delete(`/estudiantes/${id}`);
            fetchStudents();
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    const filteredStudents = students.filter(s =>
        (s.nombres + ' ' + s.apellidos).toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-10 space-y-6 md:space-y-10 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-2 md:p-3 bg-blue-50 rounded-2xl border border-blue-100/50">
                            <School size={24} className="text-[#11355a] md:w-10 md:h-10" />
                        </div>
                        Estudiantes
                    </h1>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2 ml-1">
                        Gestión académica y expedientes
                    </p>
                </div>
                {canManageStudents && (
                    <button
                        onClick={() => {
                            setModalMode('create');
                            setCurrentStudent({});
                            setShowModal(true);
                        }}
                        className="w-full md:w-auto bg-[#11355a] text-white px-8 py-4 px-10 rounded-[1.5rem] flex items-center justify-center gap-3 hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/20 active:scale-95 font-black uppercase text-xs tracking-widest"
                    >
                        <Plus size={20} /> NUEVO ALUMNO
                    </button>
                )}
            </div>

            {/* Enhanced Search Bar */}
            <div className="bg-white p-2 rounded-[1.5rem] shadow-xl shadow-blue-900/5 border border-slate-50 flex items-center gap-2 group focus-within:ring-4 focus-within:ring-blue-500/5 transition-all">
                <div className="p-4 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Search size={22} />
                </div>
                <input
                    type="text"
                    placeholder="Buscar alumnos por nombre, RUT o correo electrónico..."
                    className="flex-1 outline-none text-slate-700 font-extrabold text-sm md:text-base bg-transparent py-4 placeholder:text-slate-300 placeholder:font-bold"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List - Premium Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                    <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Sincronizando expedientes...</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredStudents.map((student, idx) => (
                        <div
                            key={student._id}
                            className="bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-slate-50 hover:translate-y-[-5px] transition-all group relative overflow-hidden"
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            {/* Decorative Background Element */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 -z-0 opacity-50 group-hover:scale-150 transition-transform"></div>

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-black text-2xl shadow-lg border-4 border-white">
                                            {student.nombres.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-800 text-lg leading-tight uppercase tracking-tighter truncate max-w-[150px]">
                                                {student.nombres} {student.apellidos}
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-blue-500 font-black text-[10px] uppercase tracking-wider mt-0.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                {student.grado || 'SIN GRADO'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handlePrint(student._id)}
                                            className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                            title="Imprimir Ficha"
                                        >
                                            <Printer size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3 bg-slate-50/50 p-5 rounded-[1.5rem] border border-slate-100/50 mb-6 flex-1">
                                    <div className="flex items-center gap-3 text-slate-500 font-extrabold text-xs">
                                        <Mail size={14} className="text-slate-300" />
                                        <span className="truncate">{student.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-400 font-mono text-[10px] bg-white px-3 py-1.5 rounded-lg border border-slate-100 w-fit">
                                        <span className="font-black text-slate-300 mr-1 opacity-50">EXP:</span>
                                        {student.matricula || student.rut || 'NO REGISTRADO'}
                                    </div>
                                </div>

                                {canManageStudents && (
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                        <button
                                            onClick={() => {
                                                setModalMode('edit');
                                                setCurrentStudent(student);
                                                setShowModal(true);
                                            }}
                                            className="flex-1 py-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest border border-blue-100"
                                        >
                                            EDITAR
                                        </button>
                                        <button
                                            onClick={() => handleDelete(student._id)}
                                            className="px-4 py-3 bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all border border-rose-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}

                                <div className="md:hidden flex gap-2 pt-2">
                                    <button
                                        onClick={() => {
                                            setModalMode('edit');
                                            setCurrentStudent(student);
                                            setShowModal(true);
                                        }}
                                        className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-blue-100"
                                    >
                                        EDITAR
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredStudents.length === 0 && !loading && (
                        <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100">
                            <Search size={64} className="mx-auto text-slate-200 mb-6" />
                            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">No hay resultados</h3>
                            <p className="text-xs font-bold text-slate-300 mt-2">Intenta con otros términos de búsqueda.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Refined Premium Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-[0_0_80px_rgba(0,0,0,0.3)] border-8 border-white animate-in zoom-in-95 duration-500 max-h-[95vh] overflow-y-auto custom-scrollbar">
                        <div
                            className="p-10 text-white relative overflow-hidden"
                            style={{ backgroundColor: '#11355a' }}
                        >
                            <div className="relative z-10">
                                <h2 className="text-3xl font-black tracking-tighter uppercase leading-none mb-2">
                                    {modalMode === 'create' ? 'Matricular Alumno' : 'Actualizar Ficha'}
                                </h2>
                                <p className="text-blue-300 font-extrabold uppercase text-[10px] tracking-[0.3em]">
                                    {modalMode === 'create' ? 'ALTA DE NUEVO ESTUDIANTE' : 'MODIFICACIÓN DE EXPEDIENTE'}
                                </p>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                        </div>

                        <form onSubmit={handleSave} className="p-10 space-y-6 bg-slate-50/30">
                            <div className="space-y-6">
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">NOMBRES DEL ESTUDIANTE</label>
                                    <input
                                        required
                                        maxLength={50}
                                        className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:shadow-xl focus:shadow-blue-500/5 transition-all outline-none font-black text-slate-700"
                                        placeholder="Ej: Juan Antonio"
                                        value={currentStudent.nombres || ''}
                                        onChange={e => setCurrentStudent({ ...currentStudent, nombres: e.target.value })}
                                    />
                                </div>
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">APELLIDOS DEL ESTUDIANTE</label>
                                    <input
                                        required
                                        maxLength={50}
                                        className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:shadow-xl focus:shadow-blue-500/5 transition-all outline-none font-black text-slate-700"
                                        placeholder="Ej: Pérez González"
                                        value={currentStudent.apellidos || ''}
                                        onChange={e => setCurrentStudent({ ...currentStudent, apellidos: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="group">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">RUT / DNI</label>
                                        <input
                                            className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-black text-slate-700 font-mono"
                                            maxLength={12}
                                            placeholder="12.345.678-9"
                                            value={currentStudent.rut || ''}
                                            onChange={e => setCurrentStudent({ ...currentStudent, rut: e.target.value.trim() })}
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1"># MATRÍCULA</label>
                                        <input
                                            className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-black text-slate-700"
                                            placeholder="2024-001"
                                            value={currentStudent.matricula || ''}
                                            onChange={e => setCurrentStudent({ ...currentStudent, matricula: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">EMAIL INSTITUCIONAL</label>
                                    <input
                                        required
                                        type="email"
                                        maxLength={100}
                                        className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-400 transition-all outline-none font-black text-blue-600"
                                        placeholder="alumno@colegio.cl"
                                        value={currentStudent.email || ''}
                                        onChange={e => setCurrentStudent({ ...currentStudent, email: e.target.value.trim().toLowerCase() })}
                                    />
                                </div>
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">GRADO / NIVEL ACADÉMICO</label>
                                    <input
                                        className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-black text-slate-700"
                                        placeholder="Ej: 1° Medio A"
                                        value={currentStudent.grado || ''}
                                        onChange={e => setCurrentStudent({ ...currentStudent, grado: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-8 flex flex-col md:flex-row gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-5 text-slate-400 font-black hover:bg-slate-100 rounded-2xl transition-all uppercase tracking-widest text-xs"
                                >
                                    DESCARTAR
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-5 bg-[#11355a] text-white rounded-2xl font-black hover:bg-blue-900 shadow-2xl shadow-blue-900/20 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                                >
                                    <Plus size={18} />
                                    {modalMode === 'create' ? 'CONFIRMAR MATRÍCULA' : 'GUARDAR CAMBIOS'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentsPage;
