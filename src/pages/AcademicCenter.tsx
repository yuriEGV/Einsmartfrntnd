import { useState } from 'react';
import {
    ClipboardList, Target, LayoutDashboard, Database, BarChart3, Calendar, Wand2, Table, BookOpen
} from 'lucide-react';
import EvaluationsPage from './EvaluationsPage';
import QuestionBankPage from './QuestionBankPage';
import CurriculumMaterialPage from './CurriculumMaterialPage';
import GradesPage from './GradesPage';
import PlanningPage from './PlanningPage';
import RubricsPage from './RubricsPage';
import TestWizard from '../components/TestWizard';

const AcademicCenter = () => {
    const [activeTab, setActiveTab] = useState('planning');
    const [showWizard, setShowWizard] = useState(false);
    const [wizardCategory, setWizardCategory] = useState<'planificada' | 'sorpresa'>('planificada');

    const tabs = [
        { id: 'planning', label: 'Planificaciones', icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'materials', label: 'Material Didáctico', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { id: 'evaluations', label: 'Pruebas y Evaluaciones', icon: ClipboardList, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'questions', label: 'Banco de Preguntas', icon: Database, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'rubrics', label: 'Rúbricas', icon: Table, color: 'text-purple-600', bg: 'bg-purple-50' },
        { id: 'results', label: 'Resultados (Notas)', icon: BarChart3, color: 'text-rose-600', bg: 'bg-rose-50' }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'planning': return <PlanningPage hideHeader={true} />;
            case 'materials': return <CurriculumMaterialPage hideHeader={true} />;
            case 'evaluations': return <EvaluationsPage hideHeader={true} />;
            case 'questions': return <QuestionBankPage hideHeader={true} />;
            case 'rubrics': return <RubricsPage hideHeader={true} />;
            case 'results': return <GradesPage hideHeader={true} />;
            default: return <PlanningPage />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Header Hub */}
            <div className="bg-white border-b border-slate-100 px-6 py-8 md:px-10 md:py-12 relative overflow-hidden">
                <div className="max-w-[1600px] mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
                                    <LayoutDashboard size={20} />
                                </div>
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Centro de Gestión</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter">
                                Hub <span className="text-blue-600">Académico</span>
                            </h1>
                            <p className="text-sm font-bold text-slate-400 mt-2 max-w-xl">
                                Unifique su flujo de trabajo: planifique objetivos, gestione su banco de preguntas, cree evaluaciones y revise resultados en un solo lugar.
                            </p>
                        </div>


                        {/* Quick Actions - Compact and Elegant */}
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <button
                                onClick={() => {
                                    setWizardCategory('sorpresa');
                                    setShowWizard(true);
                                }}
                                className="w-full sm:w-auto bg-amber-500 text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] hover:scale-[1.02] hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2.5 group"
                            >
                                <div className="p-1.5 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                                    <Wand2 size={16} />
                                </div>
                                Generar Prueba
                            </button>
                            <button
                                onClick={() => {
                                    setWizardCategory('planificada');
                                    setShowWizard(true);
                                }}
                                className="w-full sm:w-auto bg-emerald-600 text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] hover:scale-[1.02] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2.5 group"
                            >
                                <div className="p-1.5 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                                    <Calendar size={16} />
                                </div>
                                Programar Prueba
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs - Mobile Scrollable */}
                    <div className="flex gap-2 mt-10 overflow-x-auto pb-2 scrollbar-hide">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-3 px-6 py-4 rounded-2xl transition-all whitespace-nowrap border-2
                                        ${isActive
                                            ? `${tab.bg} border-blue-600/10 shadow-xl shadow-blue-900/5 -translate-y-1`
                                            : 'bg-white border-transparent hover:border-slate-100 text-slate-400 opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    <div className={`p-2 rounded-xl ${isActive ? tab.bg : 'bg-slate-50'} ${tab.color}`}>
                                        <Icon size={18} />
                                    </div>
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            </div>

            {/* Content Area */}
            <div className="max-w-[1600px] mx-auto p-4 md:p-8">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {renderContent()}
                </div>
            </div>

            {/* Test Wizard */}
            <TestWizard
                isOpen={showWizard}
                onClose={() => setShowWizard(false)}
                initialCategory={wizardCategory}
                onSuccess={() => {
                    setShowWizard(false);
                    // Optionally refresh the current tab if needed
                    setActiveTab('evaluations');
                }}
            />
        </div>
    );
};

export default AcademicCenter;
