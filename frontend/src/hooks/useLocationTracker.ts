import { useEffect, useRef, useState } from 'react';
import api from '../api/api';

export const useLocationTracker = (active: boolean) => {
    const [tracking, setTracking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const watchId = useRef<number | null>(null);
    const lastSent = useRef<{ lat: number; lng: number } | null>(null);

    const send = async (lat: number, lng: number, accuracy?: number) => {
        // Bỏ qua nếu vị trí không đổi đáng kể (< 10m)
        if (lastSent.current) {
            const dlat = Math.abs(lastSent.current.lat - lat);
            const dlng = Math.abs(lastSent.current.lng - lng);
            if (dlat < 0.0001 && dlng < 0.0001) return;
        }
        try {
            await api.post('/location', { lat, lng, accuracy });
            lastSent.current = { lat, lng };
        } catch {
            // silent — không làm phiền user
        }
    };

    useEffect(() => {
        if (!active) return;
        if (!navigator.geolocation) {
            setError('Trình duyệt không hỗ trợ định vị');
            return;
        }

        watchId.current = navigator.geolocation.watchPosition(
            (pos) => {
                setTracking(true);
                setError(null);
                send(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
            },
            (err) => {
                setTracking(false);
                setError(err.message);
            },
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
        );

        return () => {
            if (watchId.current !== null) {
                navigator.geolocation.clearWatch(watchId.current);
                watchId.current = null;
            }
            setTracking(false);
        };
    }, [active]);

    return { tracking, error };
};
