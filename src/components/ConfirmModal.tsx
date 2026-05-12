import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    isDanger = true
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-white scale-in-center">
                <div className="p-8 text-center">
                    <div className={`w-20 h-20 ${isDanger ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'} rounded-[2rem] flex items-center justify-center mx-auto mb-6`}>
                        <AlertTriangle size={40} />
                    </div>
                    
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">{title}</h2>
                    <p className="text-slate-500 font-bold text-sm leading-relaxed mb-8">
                        {message}
                    </p>

                    <div className="flex gap-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 py-4 ${isDanger ? 'bg-rose-600 shadow-rose-900/20' : 'bg-blue-600 shadow-blue-900/20'} text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all`}
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

export default ConfirmModal;
