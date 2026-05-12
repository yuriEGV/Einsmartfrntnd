import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface PromptModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    defaultValue?: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
}

const PromptModal: React.FC<PromptModalProps> = ({
    isOpen,
    title,
    message,
    defaultValue = '',
    onConfirm,
    onCancel,
    confirmText = 'Aceptar',
    cancelText = 'Cancelar'
}) => {
    const [value, setValue] = useState(defaultValue);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-white scale-in-center">
                <div className="p-8">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <HelpCircle size={32} />
                    </div>
                    
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter text-center mb-2">{title}</h2>
                    <p className="text-slate-500 font-bold text-sm leading-relaxed text-center mb-8">
                        {message}
                    </p>

                    <input 
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:border-blue-500 outline-none transition-all mb-8"
                        autoFocus
                    />

                    <div className="flex gap-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => onConfirm(value)}
                            className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
                
                <button 
                    onClick={onCancel}
                    className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};

export default PromptModal;
