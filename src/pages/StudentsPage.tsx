
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { Plus, Edit, Trash2, Search, Mail, School } from 'lucide-react';

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
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <School className="text-[#11355a]" />
                    Gestión de Estudiantes
                </h1>
                {canManageStudents && (
                    <button
                        onClick={() => {
                            setModalMode('create');
                            setCurrentStudent({});
                            setShowModal(true);
                        }}
                        className="bg-[#11355a] text-white px-4 py-2 rounded flex items-center gap-2 hover:opacity-90 transition"
                    >
                        <Plus size={18} /> Nuevo Estudiante
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
                                {canManageStudents && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setModalMode('edit');
                                                setCurrentStudent(student);
                                                setShowModal(true);
                                            }}
                                            className="text-gray-500 hover:text-blue-600"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(student._id)}
                                            className="text-gray-500 hover:text-red-600"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )}
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
                                    className="w-full border p-2 rounded"
                                    value={currentStudent.nombres || ''}
                                    onChange={e => setCurrentStudent({ ...currentStudent, nombres: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Apellidos</label>
                                <input
                                    required
                                    className="w-full border p-2 rounded"
                                    value={currentStudent.apellidos || ''}
                                    onChange={e => setCurrentStudent({ ...currentStudent, apellidos: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">RUT</label>
                                    <input
                                        className="w-full border p-2 rounded"
                                        value={currentStudent.rut || ''}
                                        onChange={e => setCurrentStudent({ ...currentStudent, rut: e.target.value })}
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
                                    className="w-full border p-2 rounded"
                                    value={currentStudent.email || ''}
                                    onChange={e => setCurrentStudent({ ...currentStudent, email: e.target.value })}
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
