import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export function useGPSTracker(alternanciaId: string | null) {
    const [isTracking, setIsTracking] = useState(false);

    useEffect(() => {
        let intervalId: any;

        if (isTracking && alternanciaId) {
            // Function to get location and post it
            const postLocation = () => {
                if (!navigator.geolocation) {
                    toast.error('Geolocalización no soportada por su navegador');
                    return;
                }

                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        try {
                            await api.post(`/alternancias/${alternanciaId}/gps`, {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude,
                                accuracy: position.coords.accuracy
                            });
                        } catch (error) {
                            console.error('Failed to post location', error);
                        }
                    },
                    (error) => {
                        console.error('Error obtaining location', error);
                        if (error.code === 1) {
                            if (error.message.includes('secure origins')) {
                                toast.error('Geo tracking en red local requiere HTTPS o entrar por localhost.', { duration: 6000 });
                            } else {
                                toast.error('Debe otorgar permisos de ubicación para rastrear Alternancia');
                            }
                            setIsTracking(false);
                        }
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            };

            // Post immediately then every 5 minutes (300000 ms)
            postLocation();
            intervalId = setInterval(postLocation, 5 * 60 * 1000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isTracking, alternanciaId]);

    const toggleTracking = () => {
        setIsTracking(!isTracking);
    };

    return { isTracking, toggleTracking };
}
