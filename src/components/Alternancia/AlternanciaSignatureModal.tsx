import React, { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { X, KeyRound, CheckCircle2 } from 'lucide-react';

interface Props {
    alternanciaId: string;
    bitacoraId: string;
    onSuccess: () => void;
    onClose: () => void;
}

export function AlternanciaSignatureModal({ alternanciaId, bitacoraId, onSuccess, onClose }: Props) {
    const [pin, setPin] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);
    const inputRefs = [React.useRef<HTMLInputElement>(null), React.useRef<HTMLInputElement>(null), React.useRef<HTMLInputElement>(null), React.useRef<HTMLInputElement>(null)];

    const handlePinChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);

        if (value && index < 3) {
            inputRefs[index + 1].current?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const handleSign = async () => {
        const fullPin = pin.join('');
        if (fullPin.length !== 4) {
            toast.error('Ingrese el PIN de 4 dígitos');
            return;
        }

        try {
            setLoading(true);
            await api.put(`/alternancias/${alternanciaId}/bitacora/${bitacoraId}/sign`, { pin: fullPin });
            toast.success('Bitácora firmada exitosamente');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al validar PIN de firma');
            setPin(['', '', '', '']);
            inputRefs[0].current?.focus();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#002447]/60 backdrop-blur-md p-4 animate-in fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl flex flex-col border border-white scale-in-center">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-[#002447] to-[#004080] text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#2DAAB8] rounded-xl">
                            <KeyRound size={20} />
                        </div>
                        <h2 className="font-black uppercase tracking-widest text-sm">Firma Digital</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 flex flex-col items-center">
                    <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                        Ingrese su PIN personal para firmar legalmente esta bitácora de alternancia.
                    </p>

                    <div className="flex gap-4 justify-center mb-8">
                        {pin.map((digit, i) => (
                            <input
                                key={i}
                                ref={inputRefs[i] as any}
                                type="password"
                                value={digit}
                                onChange={(e) => handlePinChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                maxLength={1}
                                className="w-14 h-16 text-center text-3xl font-black text-[#002447] bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-[#2DAAB8] focus:bg-white outline-none transition-all shadow-inner"
                            />
                        ))}
                    </div>

                    <button
                        onClick={handleSign}
                        disabled={loading || pin.join('').length !== 4}
                        className="w-full bg-[#002447] hover:bg-[#003666] disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex justify-center items-center gap-2 shadow-xl shadow-[#002447]/20 active:scale-95"
                    >
                        {loading ? 'Verificando...' : <><CheckCircle2 size={18} /> Firmar Bitácora</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
