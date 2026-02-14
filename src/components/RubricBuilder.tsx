
import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';

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
    title: string;
    description: string;
    levels: Level[];
    criteria: Criterion[];
}

interface Props {
    onSave: (rubric: Rubric) => void;
    onCancel: () => void;
    initialData?: Rubric | null;
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
        <div className="bg-white rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Constructor de Rúbricas</h2>
                <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </button>
            </div>

            <div className="space-y-6">
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
                    <table className="w-full text-left border-collapse">
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
                                                placeholder="Descripción del desempeño..."
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

                <div className="flex justify-between items-center">
                    <button
                        type="button"
                        onClick={addCriterion}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold"
                    >
                        <Plus size={20} /> Añadir Criterio
                    </button>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => onSave(rubric)}
                            disabled={!rubric.title || rubric.criteria.some(c => !c.name)}
                            className="px-8 py-2.5 bg-[#11355a] text-white rounded-xl hover:bg-[#1a4a7c] transition-all font-bold shadow-lg disabled:opacity-50"
                        >
                            Guardar Rúbrica
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RubricBuilder;
