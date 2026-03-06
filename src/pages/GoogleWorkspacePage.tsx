import { useAuth } from '../context/AuthContext';
import { Cloud, Video, HardDrive, Mail, ExternalLink } from 'lucide-react';

const GoogleWorkspacePage = () => {
    const { user } = useAuth();
    const userEmail = user?.email || '';

    const wrapUrl = (url: string) => {
        if (!userEmail) return url;
        return `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(userEmail)}&continue=${encodeURIComponent(url)}`;
    };

    const tools = [
        {
            name: 'Google Classroom',
            description: 'Gestión de clases, tareas y calificaciones centralizadas.',
            icon: <Cloud size={40} className="text-emerald-500" />,
            url: wrapUrl('https://classroom.google.com'),
            color: 'bg-emerald-50 border-emerald-100 hover:border-emerald-300',
            buttonColor: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
        },
        {
            name: 'Google Drive',
            description: 'Almacenamiento en la nube para documentos y material educativo.',
            icon: <HardDrive size={40} className="text-blue-500" />,
            url: wrapUrl('https://drive.google.com'),
            color: 'bg-blue-50 border-blue-100 hover:border-blue-300',
            buttonColor: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
        },
        {
            name: 'Google Meet',
            description: 'Videoconferencias seguras para clases remotas y reuniones.',
            icon: <Video size={40} className="text-green-500" />,
            url: wrapUrl('https://meet.google.com'),
            color: 'bg-green-50 border-green-100 hover:border-green-300',
            buttonColor: 'bg-green-600 hover:bg-green-700 shadow-green-600/20'
        },
        {
            name: 'Gmail Institucional',
            description: 'Correo electrónico seguro para comunicaciones académicas.',
            icon: <Mail size={40} className="text-red-500" />,
            url: wrapUrl('https://mail.google.com'),
            color: 'bg-red-50 border-red-100 hover:border-red-300',
            buttonColor: 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
        }
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="p-6 bg-white/10 rounded-3xl backdrop-blur-xl border border-white/10 shadow-inner">
                        <Cloud size={64} className="text-blue-300" />
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4">
                            Google Workspace
                        </h1>
                        <p className="text-slate-300 text-lg sm:text-xl font-medium max-w-2xl leading-relaxed">
                            Accede a las herramientas de colaboración de Google integradas en tu entorno institucional.
                        </p>
                    </div>
                </div>
            </div>

            {/* Grid Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tools.map((tool, index) => (
                    <div
                        key={index}
                        className={`p-8 rounded-3xl border-2 transition-all duration-300 group hover:shadow-xl ${tool.color} flex flex-col h-full`}
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                                {tool.icon}
                            </div>
                        </div>

                        <div className="flex-grow">
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
                                {tool.name}
                            </h3>
                            <p className="text-slate-600 font-medium leading-relaxed mb-8">
                                {tool.description}
                            </p>
                        </div>

                        <a
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-full py-4 px-6 rounded-xl text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${tool.buttonColor} shadow-lg`}
                        >
                            Acceder a {tool.name.split(' ')[1] || tool.name} <ExternalLink size={18} />
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GoogleWorkspacePage;
