import React from 'react';
import { useTenant } from '../context/TenantContext';

interface TenantLogoProps {
    size?: 'small' | 'medium' | 'large';
    showName?: boolean;
}

const TenantLogo: React.FC<TenantLogoProps> = ({ size = 'medium', showName = true }) => {
    const { tenant } = useTenant();

    const sizeClass = {
        small: 'h-8 w-auto',
        medium: 'h-12 w-auto',
        large: 'h-24 w-auto'
    }[size];

    const nameSize = {
        small: 'text-xs',
        medium: 'text-sm',
        large: 'text-lg'
    }[size];

    return (
        <div className="flex items-center gap-2">
            {tenant?.logo ? (
                <img
                    src={tenant.logo}
                    alt={tenant.name}
                    className={`${sizeClass} object-contain`}
                    title={tenant.name}
                />
            ) : (
                <div className={`${sizeClass} flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-lg font-bold`}>
                    {tenant?.name?.charAt(0) || 'E'}
                </div>
            )}
            {showName && (
                <div className={`font-black uppercase tracking-tight ${nameSize} text-gray-800 hidden sm:block`}>
                    {tenant?.name || 'EINSMART'}
                </div>
            )}
        </div>
    );
};

export default TenantLogo;
