import { useState, useEffect } from 'react';
import api from '../services/api';
import { Send, User, MessageCircle, Search } from 'lucide-react';

interface Message {
    _id: string;
    senderId: { _id: string; name: string; role: string };
    receiverId: { _id: string; name: string; role: string };
    content: string;
    subject?: string;
    createdAt: string;
}

interface Contact {
    _id: string;
    name: string;
    role: string;
    email: string;
}

const MessagesPage = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [subject, setSubject] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [msgRes, contactRes] = await Promise.all([
                api.get('/messages'),
                api.get('/messages/contacts')
            ]);
            setMessages(msgRes.data);
            setContacts(contactRes.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedContact || !newMessage.trim()) return;

        try {
            await api.post('/messages', {
                receiverId: selectedContact._id,
                content: newMessage,
                subject: subject || 'Sin asunto'
            });
            setNewMessage('');
            setSubject('');
            fetchData();
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const chatMessages = messages.filter(m =>
        selectedContact && (
            (m.senderId._id === selectedContact._id) ||
            (m.receiverId._id === selectedContact._id)
        )
    );

    return (
        <div className="p-6 h-[calc(100vh-64px)] overflow-hidden flex flex-col">
            <h1 className="text-3xl font-black text-[#11355a] mb-6 flex items-center gap-3">
                <MessageCircle size={32} />
                Centro de Mensajes
            </h1>

            <div className="flex-1 bg-white rounded-3xl shadow-xl overflow-hidden flex border border-gray-100">
                {/* Contacts List */}
                <div className="w-80 border-r flex flex-col bg-gray-50/50">
                    <div className="p-4 border-b bg-white">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                placeholder="Buscar contacto..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredContacts.map(contact => (
                            <button
                                key={contact._id}
                                onClick={() => setSelectedContact(contact)}
                                className={`w-full p-4 flex items-center gap-3 hover:bg-blue-50 transition-colors border-b last:border-0 ${selectedContact?._id === contact._id ? 'bg-blue-50 border-r-4 border-blue-500' : ''}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                    {contact.name.charAt(0)}
                                </div>
                                <div className="text-left overflow-hidden">
                                    <div className="font-bold text-sm truncate">{contact.name}</div>
                                    <div className="text-[10px] uppercase font-black text-gray-400 tracking-widest">{contact.role}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col">
                    {selectedContact ? (
                        <>
                            <div className="p-4 border-b flex items-center justify-between bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="font-bold text-lg">{selectedContact.name}</div>
                                    <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">{selectedContact.role}</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                                {chatMessages.map(msg => {
                                    const isMe = msg.senderId._id !== selectedContact._id;
                                    return (
                                        <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-md p-4 rounded-2xl shadow-sm ${isMe ? 'bg-[#11355a] text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                                                <div className="text-[10px] opacity-50 mb-1 font-bold">{new Date(msg.createdAt).toLocaleString()}</div>
                                                <div className="font-bold text-xs mb-1 opacity-75">{msg.subject}</div>
                                                <p className="text-sm font-medium">{msg.content}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                {chatMessages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                        <div className="bg-gray-100 p-6 rounded-full mb-4">
                                            <MessageCircle size={48} />
                                        </div>
                                        <p className="font-bold italic">No hay historial de mensajes con este contacto.</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-white border-t">
                                <form onSubmit={handleSendMessage} className="space-y-3">
                                    <input
                                        placeholder="Asunto (opcional)"
                                        className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none text-xs font-bold"
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <textarea
                                            placeholder="Escribe tu mensaje aquí..."
                                            className="flex-1 px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 resize-none font-medium h-20"
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                        />
                                        <button
                                            type="submit"
                                            className="bg-blue-600 text-white p-4 rounded-xl self-end shadow-lg hover:bg-blue-700 transition-all active:scale-95"
                                        >
                                            <Send size={24} />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <div className="bg-gray-50 p-10 rounded-full mb-6">
                                <User size={80} className="text-gray-200" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-300">Selecciona un contacto</h3>
                            <p className="font-medium">Inicia una conversación con profesores o compañeros.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessagesPage;
