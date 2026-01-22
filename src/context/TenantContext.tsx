import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

interface TenantTheme {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
}

interface Tenant {
    _id: string;
    name: string;
    theme: TenantTheme;
    paymentType: 'paid' | 'free';
    address?: string;
    phone?: string;
    contactEmail?: string;
}

interface TenantContextType {
    tenant: Tenant | null;
    isLoading: boolean;
    refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated } = useAuth();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTenantData = async () => {
        if (!isAuthenticated) {
            setTenant(null);
            setIsLoading(false);
            return;
        }

        try {
            const res = await api.get('/tenants/my');
            setTenant(res.data);
            applyTheme(res.data.theme);
        } catch (err) {
            console.error('Error fetching tenant data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const applyTheme = (theme: TenantTheme) => {
        if (!theme) return;
        document.documentElement.style.setProperty('--primary-color', theme.primaryColor || '#11355a');
        document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor || '#1e293b');
    };

    useEffect(() => {
        fetchTenantData();
    }, [isAuthenticated]);

    return (
        <TenantContext.Provider value={{ tenant, isLoading, refreshTenant: fetchTenantData }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
};
