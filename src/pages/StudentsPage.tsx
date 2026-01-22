
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { Plus, Edit, Trash2, Search, Mail, School, Printer } from 'lucide-react';

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
        <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <School className="text-[#11355a]" />
                    Estudiantes
                </h1>
                {canManageStudents && (
                    <button
                        onClick={() => {
                            setModalMode('create');
                            setCurrentStudent({});
                            setShowModal(true);
                        }}
                        className="w-full md:w-auto bg-[#11355a] text-white px-4 py-3 md:py-2 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition font-bold"
                    >
                        <Plus size={18} /> Nuevo Alumno
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex items-center gap-2 border">
                <Search className="text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o correo..."
                    className="flex-1 outline-none text-gray-700"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List */}
            {loading ? (
                <p>Cargando...</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredStudents.map(student => (
                        <div key={student._id} className="bg-white p-5 rounded-lg shadow border hover:shadow-md transition">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 p-3 rounded-full text-blue-800 font-bold">
                                        {student.nombres.charAt(0)}{student.apellidos.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{student.nombres} {student.apellidos}</h3>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            <Mail size={12} /> {student.email}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">
                                            {student.grado || 'Sin grado'}
                                        </p>
                                        <p className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1 mt-1 inline-block rounded">
                                            ID: {student.matricula || student.rut || 'S/N'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handlePrint(student._id)}
                                        className="text-gray-500 hover:text-[#11355a] p-1 rounded hover:bg-gray-100"
                                        title="Imprimir Ficha"
                                    >
                                        <Printer size={18} />
                                    </button>
                                    {canManageStudents && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setModalMode('edit');
                                                    setCurrentStudent(student);
                                                    setShowModal(true);
                                                }}
                                                className="text-gray-500 hover:text-blue-600 p-1 rounded hover:bg-gray-100"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(student._id)}
                                                className="text-gray-500 hover:text-red-600 p-1 rounded hover:bg-gray-100"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">
                            {modalMode === 'create' ? 'Nuevo Estudiante' : 'Editar Estudiante'}
                        </h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombres</label>
                                <input
                                    required
                                    maxLength={50}
                                    className="w-full border p-2 rounded font-bold"
                                    value={currentStudent.nombres || ''}
                                    onChange={e => setCurrentStudent({ ...currentStudent, nombres: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Apellidos</label>
                                <input
                                    required
                                    maxLength={50}
                                    className="w-full border p-2 rounded font-bold"
                                    value={currentStudent.apellidos || ''}
                                    onChange={e => setCurrentStudent({ ...currentStudent, apellidos: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">RUT</label>
                                    <input
                                        className="w-full border p-2 rounded font-mono"
                                        maxLength={12}
                                        pattern="^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$"
                                        title="Formato: 12.345.678-9"
                                        value={currentStudent.rut || ''}
                                        onChange={e => setCurrentStudent({ ...currentStudent, rut: e.target.value.trim() })}
                                        placeholder="12.345.678-9"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Matrícula</label>
                                    <input
                                        className="w-full border p-2 rounded"
                                        value={currentStudent.matricula || ''}
                                        onChange={e => setCurrentStudent({ ...currentStudent, matricula: e.target.value })}
                                        placeholder="Auto/Manual"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input
                                    required
                                    type="email"
                                    maxLength={100}
                                    className="w-full border p-2 rounded font-bold text-blue-600"
                                    value={currentStudent.email || ''}
                                    onChange={e => setCurrentStudent({ ...currentStudent, email: e.target.value.trim().toLowerCase() })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Grado/Curso</label>
                                <input
                                    className="w-full border p-2 rounded"
                                    value={currentStudent.grado || ''}
                                    onChange={e => setCurrentStudent({ ...currentStudent, grado: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#11355a] text-white rounded hover:opacity-90"
                                >
                                    Guardar
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
