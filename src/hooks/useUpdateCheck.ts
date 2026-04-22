import { useEffect, useRef, useState } from 'react';
import api from '../services/api';

interface UpdateStatus {
    hasUpdate: boolean;
    localHash: string;
    remoteHash: string;
    lastChecked: string | null;
}

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes

export const useUpdateCheck = (enabled: boolean = true) => {
    const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
        hasUpdate: false,
        localHash: '',
        remoteHash: '',
        lastChecked: null,
    });
    const [isRunningUpdate, setIsRunningUpdate] = useState(false);
    const notifiedRef = useRef(false);

    const checkForUpdates = async () => {
        try {
            const res = await api.get('/updates/check');
            const data = res.data;
            setUpdateStatus(data);

            // Show desktop notification only once per session
            if (data.hasUpdate && !notifiedRef.current) {
                notifiedRef.current = true;
                sendDesktopNotification();
            }
        } catch {
            // Silently fail — could be a network issue or unsupported environment
        }
    };

    const sendDesktopNotification = () => {
        if (!('Notification' in window)) return;

        const showNotif = () => {
            new Notification('🔄 Actualización Disponible — Einsmart', {
                body: 'Hay una nueva versión del sistema. Haz clic para ir al Centro de Actualización.',
                icon: '/Imagelogo.png',
                badge: '/Imagelogo.png',
                tag: 'einsmart-update',
                requireInteraction: true,
            });
        };

        if (Notification.permission === 'granted') {
            showNotif();
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then((perm) => {
                if (perm === 'granted') showNotif();
            });
        }
    };

    const runUpdate = async (): Promise<{ ok: boolean; message: string }> => {
        setIsRunningUpdate(true);
        try {
            const res = await api.post('/updates/run');
            notifiedRef.current = false; // allow re-notification after next check
            return { ok: true, message: res.data.message };
        } catch (err: any) {
            return { ok: false, message: err.response?.data?.message || 'Error al ejecutar la actualización.' };
        } finally {
            setIsRunningUpdate(false);
        }
    };

    useEffect(() => {
        if (!enabled) return;

        // Initial check after 10s on mount
        const initial = setTimeout(checkForUpdates, 10_000);
        const interval = setInterval(checkForUpdates, CHECK_INTERVAL_MS);

        return () => {
            clearTimeout(initial);
            clearInterval(interval);
        };
    }, [enabled]);

    return { updateStatus, isRunningUpdate, checkForUpdates, runUpdate };
};
