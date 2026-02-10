import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { FileText, Printer } from 'lucide-react';
import { useTenant } from '../context/TenantContext';

interface CertificadoAlumnoRegularProps {
    estudiante: {
        _id: string;
        nombres: string;
        apellidos: string;
        rut?: string;
    };
    curso?: {
        name: string;
        level?: string;
        letter?: string;
    };
}

const CertificadoAlumnoRegular: React.FC<CertificadoAlumnoRegularProps> = ({ estudiante, curso }) => {
    const certificateRef = useRef<HTMLDivElement>(null);
    const { tenant } = useTenant();

    const handlePrint = useReactToPrint({
        contentRef: certificateRef,
        documentTitle: `Certificado_Alumno_Regular_${estudiante.rut}`,
    });

    const currentDate = new Date().toLocaleDateString('es-CL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div>
            <button
                onClick={handlePrint}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg"
            >
                <Printer size={20} />
                Generar Certificado
            </button>

            {/* Hidden printable certificate */}
            <div className="hidden print:block">
                <div ref={certificateRef} className="p-16 bg-white">
                    {/* Header con logo institucional */}
                    <div className="text-center mb-10 pb-8 border-b-4 border-slate-900">
                        {tenant?.theme?.logoUrl && (
                            <img
                                src={tenant.theme.logoUrl}
                                alt="Logo institucional"
                                className="w-24 h-24 mx-auto mb-4"
                            />
                        )}
                        <h1 className="text-4xl font-black uppercase tracking-tight mb-2">
                            {tenant?.name || 'Institución Educativa'}
                        </h1>
                        <p className="text-slate-600 font-bold">RBD: {tenant?.rbd || 'N/A'}</p>
                    </div>

                    {/* Título del documento */}
                    <div className="text-center my-12">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <FileText size={32} className="text-blue-600" />
                            <h2 className="text-3xl font-black uppercase">
                                Certificado de Alumno Regular
                            </h2>
                        </div>
                        <div className="w-32 h-1 bg-blue-600 mx-auto"></div>
                    </div>

                    {/* Cuerpo del certificado */}
                    <div className="my-12 space-y-8 text-lg leading-relaxed">
                        <p className="text-center font-medium">
                            La Dirección del establecimiento educacional{' '}
                            <span className="font-black">{tenant?.name || 'Institución Educativa'}</span>,
                            RBD <span className="font-black">{tenant?.rbd || 'N/A'}</span>, certifica que:
                        </p>

                        <div className="bg-blue-50 p-8 rounded-2xl border-2 border-blue-200">
                            <p className="text-center mb-6">
                                <span className="text-2xl font-black block mb-2">
                                    {estudiante.nombres.toUpperCase()} {estudiante.apellidos.toUpperCase()}
                                </span>
                                <span className="text-slate-600 font-bold">
                                    RUT: {estudiante.rut}
                                </span>
                            </p>

                            {curso && (
                                <p className="text-center font-bold text-lg">
                                    Se encuentra matriculado(a) como <span className="font-black">ALUMNO REGULAR</span>
                                    <br />
                                    en el curso <span className="font-black">{curso.name || `${curso.level} ${curso.letter}`}</span>
                                    <br />
                                    durante el año académico <span className="font-black">{new Date().getFullYear()}</span>
                                </p>
                            )}
                        </div>

                        <p className="text-center font-medium mt-8">
                            Se extiende el presente certificado a petición del(la) interesado(a) para los fines que estime conveniente.
                        </p>
                    </div>

                    {/* Footer con fecha y firma */}
                    <div className="mt-16 pt-8 border-t-2 border-slate-200">
                        <p className="text-center font-bold mb-12">
                            {currentDate}
                        </p>

                        <div className="text-center mt-20">
                            <div className="w-64 h-px bg-slate-900 mx-auto mb-2"></div>
                            <p className="font-black text-sm uppercase tracking-wider">Director(a) del Establecimiento</p>
                            <p className="text-slate-600 font-bold text-xs mt-1">{tenant?.name || 'Institución Educativa'}</p>
                        </div>
                    </div>

                    {/* Timbre institucional (decorativo) */}
                    <div className="absolute bottom-16 right-16 opacity-10">
                        <div className="w-32 h-32 rounded-full border-8 border-blue-900 flex items-center justify-center">
                            <span className="text-xs font-black text-center">TIMBRE<br />INSTITUCIONAL</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CertificadoAlumnoRegular;
