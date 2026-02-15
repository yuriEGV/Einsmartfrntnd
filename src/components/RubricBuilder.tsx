
import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Level {
    name: string;
    points: number;
}

interface Descriptor {
    levelName: string;
    text: string;
}

interface Criterion {
    name: string;
    descriptors: Descriptor[];
}

interface Rubric {
    _id?: string;
    title: string;
    description: string;
    levels: Level[];
    criteria: Criterion[];
    subjectId?: { _id: string; name: string } | string;
    teacherId?: { _id: string; name: string } | string;
}

interface Props {
    onSave: (rubric: Rubric) => void;
    onCancel: () => void;
    initialData?: Rubric | any;
}

const RubricBuilder: React.FC<Props> = ({ onSave, onCancel, initialData }) => {
    const [rubric, setRubric] = useState<Rubric>(initialData || {
        title: '',
        description: '',
        levels: [
            { name: 'Destacado', points: 4 },
            { name: 'Logrado', points: 3 },
            { name: 'En Proceso', points: 2 },
            { name: 'No Logrado', points: 1 }
        ],
        criteria: [
            {
                name: '',
                descriptors: [
                    { levelName: 'Destacado', text: '' },
                    { levelName: 'Logrado', text: '' },
                    { levelName: 'En Proceso', text: '' },
                    { levelName: 'No Logrado', text: '' }
                ]
            }
        ]
    });

    const addCriterion = () => {
        setRubric({
            ...rubric,
            criteria: [
                ...rubric.criteria,
                {
                    name: '',
                    descriptors: rubric.levels.map(l => ({ levelName: l.name, text: '' }))
                }
            ]
        });
    };

    const removeCriterion = (index: number) => {
        const newCriteria = [...rubric.criteria];
        newCriteria.splice(index, 1);
        setRubric({ ...rubric, criteria: newCriteria });
    };

    const handleCriterionNameChange = (index: number, name: string) => {
        const newCriteria = [...rubric.criteria];
        newCriteria[index].name = name;
        setRubric({ ...rubric, criteria: newCriteria });
    };

    const handleDescriptorChange = (cIndex: number, dIndex: number, text: string) => {
        const newCriteria = [...rubric.criteria];
        newCriteria[cIndex].descriptors[dIndex].text = text;
        setRubric({ ...rubric, criteria: newCriteria });
    };

    return (
        <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header - Fixed */}
            <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 bg-white shrink-0">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Constructor de Rúbricas</h2>
                <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Título de la Rúbrica</label>
                        <input
                            required
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            value={rubric.title}
                            onChange={e => setRubric({ ...rubric, title: e.target.value })}
                            placeholder="Ej: Rúbrica de Ensayo Histórico"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Descripción (Opcional)</label>
                        <textarea
                            rows={2}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            value={rubric.description}
                            onChange={e => setRubric({ ...rubric, description: e.target.value })}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-sm">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-[#11355a] text-white">
                            <tr>
                                <th className="p-4 border-b font-semibold min-w-[200px]">Criterio</th>
                                {rubric.levels.map((level, i) => (
                                    <th key={i} className="p-4 border-b font-semibold text-center min-w-[150px]">
                                        {level.name} ({level.points} pts)
                                    </th>
                                ))}
                                <th className="p-4 border-b w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rubric.criteria.map((criterion, cIndex) => (
                                <tr key={cIndex}>
                                    <td className="p-4 align-top">
                                        <input
                                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium"
                                            value={criterion.name}
                                            onChange={e => handleCriterionNameChange(cIndex, e.target.value)}
                                            placeholder="Nombre del criterio..."
                                        />
                                    </td>
                                    {criterion.descriptors.map((descriptor, dIndex) => (
                                        <td key={dIndex} className="p-4 align-top">
                                            <textarea
                                                rows={3}
                                                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs resize-none"
                                                value={descriptor.text}
                                                onChange={e => handleDescriptorChange(cIndex, dIndex, e.target.value)}
                                                placeholder="Descripción..."
                                            />
                                        </td>
                                    ))}
                                    <td className="p-4 align-top">
                                        <button
                                            onClick={() => removeCriterion(cIndex)}
                                            className="text-red-400 hover:text-red-600 p-1"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <button
                    type="button"
                    onClick={addCriterion}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold w-full justify-center p-2 border-2 border-dashed border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
                >
                    <Plus size={20} /> Añadir Criterio
                </button>
            </div>

            {/* Footer - Fixed */}
            <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50 shrink-0 flex flex-col-reverse md:flex-row gap-3 md:justify-end">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-white font-medium text-gray-700 w-full md:w-auto"
                >
                    Cancelar
                </button>
                <button
                    onClick={() => {
                        if (!rubric.title.trim()) {
                            toast.error('Por favor, ingresa un título para la rúbrica');
                            return;
                        }
                        if (rubric.criteria.some(c => !c.name.trim())) {
                            toast.error('Todos los criterios deben tener un nombre');
                            return;
                        }
                        console.log('Saving rubric:', rubric);
                        onSave(rubric);
                    }}
                    className="px-8 py-3 bg-[#11355a] text-white rounded-xl hover:bg-[#1a4a7c] transition-all font-bold shadow-lg w-full md:w-auto active:scale-95"
                >
                    Guardar Rúbrica
                </button>
            </div>
        </div>
    );
};

export default RubricBuilder;
