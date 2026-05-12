import React, { createContext, useContext, useState, ReactNode } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import PromptModal from '../components/PromptModal';

interface ConfirmationOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
}

interface ConfirmationContextType {
    confirm: (options: ConfirmationOptions) => Promise<boolean>;
    prompt: (options: { title: string; message: string; defaultValue?: string }) => Promise<string | null>;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const useConfirm = () => {
    const context = useContext(ConfirmationContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmationProvider');
    }
    return context.confirm;
};

export const ConfirmationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        options: ConfirmationOptions;
        resolve: (value: boolean) => void;
    } | null>(null);

    const [promptState, setPromptState] = useState<{
        isOpen: boolean;
        options: { title: string; message: string; defaultValue?: string };
        resolve: (value: string | null) => void;
    } | null>(null);

    const confirm = (options: ConfirmationOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setModalState({
                isOpen: true,
                options,
                resolve
            });
        });
    };

    const prompt = (options: { title: string; message: string; defaultValue?: string }): Promise<string | null> => {
        return new Promise((resolve) => {
            setPromptState({
                isOpen: true,
                options,
                resolve
            });
        });
    };

    const handleConfirm = () => {
        if (modalState) {
            modalState.resolve(true);
            setModalState(null);
        }
    };

    const handleCancel = () => {
        if (modalState) {
            modalState.resolve(false);
            setModalState(null);
        }
    };

    const handlePromptConfirm = (value: string) => {
        if (promptState) {
            promptState.resolve(value);
            setPromptState(null);
        }
    };

    const handlePromptCancel = () => {
        if (promptState) {
            promptState.resolve(null);
            setPromptState(null);
        }
    };

    return (
        <ConfirmationContext.Provider value={{ confirm, prompt }}>
            {children}
            {modalState && (
                <ConfirmModal
                    isOpen={modalState.isOpen}
                    title={modalState.options.title}
                    message={modalState.options.message}
                    confirmText={modalState.options.confirmText}
                    cancelText={modalState.options.cancelText}
                    isDanger={modalState.options.isDanger}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
            {promptState && (
                <PromptModal
                    isOpen={promptState.isOpen}
                    title={promptState.options.title}
                    message={promptState.options.message}
                    defaultValue={promptState.options.defaultValue}
                    onConfirm={handlePromptConfirm}
                    onCancel={handlePromptCancel}
                />
            )}
        </ConfirmationContext.Provider>
    );
};
