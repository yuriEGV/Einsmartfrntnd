import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTenant } from '../context/TenantContext';
import { usePermissions } from '../hooks/usePermissions';
import { Building2, Save, Palette, Phone, Mail, MapPin, ShieldCheck } from 'lucide-react';

const SchoolSettingsPage = () => {
    const { tenant, refreshTenant } = useTenant();
    const { isSuperAdmin, user } = usePermissions();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        contactEmail: '',
        theme: {
            primaryColor: '#11355a',
            secondaryColor: '#3b82f6'
        }
    });

    useEffect(() => {
        if (tenant) {
            setFormData({
                name: tenant.name || '',
                address: tenant.address || '',
                phone: tenant.phone || '',
                contactEmail: tenant.contactEmail || '',
                theme: {
                    primaryColor: tenant.theme?.primaryColor || '#11355a',
                    secondaryColor: tenant.theme?.secondaryColor || '#3b82f6'
                }
            });
        }
    }, [tenant]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/tenants/my', formData);
            await refreshTenant();
            alert('Configuración guardada correctamente');
        } catch (err) {
            console.error(err);
            alert('Error al guardar configuración');
        } finally {
            setLoading(false);
        }
    };

    if (user?.role !== 'sostenedor' && !isSuperAdmin) {
        return <div className="p-10 text-center font-bold text-rose-500">No tienes permisos para acceder a esta configuración.</div>;
    }

    return (
        <div className="p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-[#11355a] flex items-center gap-3">
                    <Building2 size={32} />
                    Configuración de la Institución
                </h1>
                <p className="text-gray-500 text-lg">Personaliza la identidad visual y datos de contacto de tu colegio.</p>
            </header>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Basic Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-xl border p-8 space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 border-b pb-4 flex items-center gap-2">
                            <ShieldCheck className="text-blue-600" />
                            Información General
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre de la Institución</label>
                                <input
                                    className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none font-bold"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                                        <MapPin size={14} /> Dirección
                                    </label>
                                    <input
                                        className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                                        <Phone size={14} /> Teléfono
                                    </label>
                                    <input
                                        className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                                    <Mail size={14} /> Correo de Contacto
                                </label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none"
                                    value={formData.contactEmail}
                                    onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl border p-8">
                        <h2 className="text-xl font-bold text-gray-800 border-b pb-4 flex items-center gap-2 mb-6">
                            <Palette className="text-purple-600" />
                            Identidad Visual (Branding)
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">Color Primario (Sidebar / Botones)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="color"
                                        className="w-16 h-16 rounded-xl cursor-pointer border-none p-0"
                                        value={formData.theme.primaryColor}
                                        onChange={e => setFormData({ ...formData, theme: { ...formData.theme, primaryColor: e.target.value } })}
                                    />
                                    <div className="font-mono text-sm uppercase bg-gray-100 px-3 py-1 rounded-lg">
                                        {formData.theme.primaryColor}
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400">Este color se usará en el fondo del menú lateral.</p>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">Color Secundario (Iconos / Acentos)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="color"
                                        className="w-16 h-16 rounded-xl cursor-pointer border-none p-0"
                                        value={formData.theme.secondaryColor}
                                        onChange={e => setFormData({ ...formData, theme: { ...formData.theme, secondaryColor: e.target.value } })}
                                    />
                                    <div className="font-mono text-sm uppercase bg-gray-100 px-3 py-1 rounded-lg">
                                        {formData.theme.secondaryColor}
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400">Este color se usará para iconos y elementos resaltados.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Preview */}
                <div className="lg:col-span-1">
                    <div className="sticky top-8 space-y-6">
                        <div className="bg-white border-4 border-dashed border-gray-200 rounded-3xl p-6 text-center">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Previsualización</p>

                            {/* Mini Sidebar Preview */}
                            <div className="w-full h-48 rounded-xl shadow-lg flex overflow-hidden border">
                                <div className="w-1/3 h-full" style={{ backgroundColor: formData.theme.primaryColor }}>
                                    <div className="p-3 border-b border-white/10 flex items-center gap-1 justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                        <div className="h-2 w-10 bg-white/30 rounded"></div>
                                    </div>
                                    <div className="p-3 space-y-2">
                                        <div className="h-3 w-full bg-white/10 rounded-lg"></div>
                                        <div className="h-3 w-full bg-white/10 rounded-lg"></div>
                                    </div>
                                </div>
                                <div className="w-2/3 h-full bg-gray-50 p-4 space-y-2">
                                    <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="h-12 bg-white rounded border border-gray-100 shadow-sm"></div>
                                        <div className="h-12 bg-white rounded border border-gray-100 shadow-sm"></div>
                                    </div>
                                </div>
                            </div>
                            <p className="mt-4 text-xs font-bold text-gray-500">Vista previa del Dashboard</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-blue-900 py-4 rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            {loading ? 'GUARDANDO...' : (
                                <>
                                    <Save size={24} />
                                    GUARDAR CAMBIOS
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default SchoolSettingsPage;
