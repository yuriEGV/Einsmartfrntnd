import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getCurrentUser, login as authLogin, logout as authLogout } from '../services/authService';

interface AuthContextType {
    user: any;
    login: (credentials: any) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const user = getCurrentUser();
        if (user) {
            setUser(user);
        }
        setIsLoading(false);
    }, []);

    const login = async (credentials: any) => {
        const data = await authLogin(credentials);
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            // Assuming tenantId is part of user or response, otherwise handle it
            if (data.tenantId) {
                localStorage.setItem('tenantId', data.tenantId);
            }
            setUser(data.user);
        }
    };

    const logout = () => {
        authLogout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
