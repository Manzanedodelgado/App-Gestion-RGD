import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Search, MoreVertical, Send, Smile, Paperclip, Mic, Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Messages = () => {
  const [whatsappStatus, setWhatsappStatus] = useState({ ready: false, hasQR: false });
  const [qrCode, setQrCode] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    checkWhatsAppStatus();
    fetchConversations();
    
    // Poll for new messages
    const pollInterval = setInterval(() => {
      checkWhatsAppStatus();
      fetchConversations();
    }, 5000);
    
    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkWhatsAppStatus = async () => {
    try {
      const response = await axios.get(`${API}/whatsapp/status`);
      setWhatsappStatus(response.data);
      
      if (response.data.hasQR) {
        const qrResponse = await axios.get(`${API}/whatsapp/qr`);
        setQrCode(qrResponse.data.qr);
      } else {
        setQrCode(null);
      }
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API}/conversations`);
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/conversations/${conversationId}/messages`);
      setMessages(response.data);
      
      // Mark as read
      await axios.post(`${API}/conversations/${conversationId}/mark-read`);
      
      // Update conversation in list
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 } 
            : conv
        )
      );
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Error al cargar mensajes');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const tempMessage = {
      id: Date.now().toString(),
      text: newMessage,
      from_me: true,
      timestamp: new Date().toISOString(),
      conversation_id: selectedConversation.id
    };

    try {
      // Añadir mensaje inmediatamente para feedback instantáneo
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');

      const response = await axios.post(
        `${API}/conversations/${selectedConversation.id}/send`,
        { message: newMessage }
      );

      if (response.data.success) {
        // Actualizar con el mensaje real del servidor
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id ? response.data.message : msg
          )
        );
        toast.success('Mensaje enviado');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Eliminar mensaje temporal si falla
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      toast.error('Error al enviar mensaje');
    }
  };

  const getColorClass = (colorCode) => {
    switch (colorCode) {
      case 'AMARILLO':
        return 'bg-yellow-100 border-l-4 border-yellow-500';
      case 'AZUL':
        return 'bg-blue-100 border-l-4 border-blue-500';
      case 'VERDE':
        return 'bg-green-100 border-l-4 border-green-500';
      default:
        return 'bg-gray-100';
    }
  };

  const getColorBadge = (colorCode) => {
    switch (colorCode) {
      case 'AMARILLO':
        return <span className="px-2 py-1 text-xs font-semibold bg-yellow-500 text-white rounded">Urgente</span>;
      case 'AZUL':
        return <span className="px-2 py-1 text-xs font-semibold bg-blue-500 text-white rounded">Atención</span>;
      case 'VERDE':
        return <span className="px-2 py-1 text-xs font-semibold bg-green-500 text-white rounded">Resuelta</span>;
      default:
        return null;
    }
  };


  const filteredConversations = conversations.filter(conv =>
    conv.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.contact_phone?.includes(searchQuery)
  );

  // QR Code screen
  if (!whatsappStatus.ready && qrCode) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-800">Conectar WhatsApp</h2>
          <p className="text-center text-gray-600 mb-6">Escanea el código QR con tu teléfono</p>
          <div className="flex justify-center mb-6 bg-white p-4 rounded-xl border-2 border-[#0071BC]">
            <img src={qrCode} alt="QR Code" className="w-64 h-64" />
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p className="flex items-center gap-2"><span className="font-bold text-[#0071BC]">1.</span> Abre WhatsApp en tu teléfono</p>
            <p className="flex items-center gap-2"><span className="font-bold text-[#0071BC]">2.</span> Ve a Configuración → Dispositivos vinculados</p>
            <p className="flex items-center gap-2"><span className="font-bold text-[#0071BC]">3.</span> Toca "Vincular un dispositivo"</p>
            <p className="flex items-center gap-2"><span className="font-bold text-[#0071BC]">4.</span> Escanea este código QR</p>
          </div>
        </div>
      </div>
    );
  }

  // Loading screen
  if (!whatsappStatus.ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#0071BC] mx-auto mb-4"></div>
          <p className="text-xl text-gray-700 font-semibold">Iniciando WhatsApp...</p>
        </div>
      </div>
    );
  }

  // Main chat interface
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Conversations List */}
      <div className="w-1/3 bg-white border-r border-gray-300 flex flex-col">
        <div className="p-4 bg-gradient-to-r from-[#2E3192] to-[#0071BC] text-white">
          <h2 className="text-xl font-bold">WhatsApp Pro Web</h2>
          <p className="text-sm text-blue-100">
            {conversations.length} conversacion{conversations.length !== 1 ? 'es' : ''}
          </p>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Buscar conversaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg font-semibold mb-2">No hay conversaciones</p>
              <p className="text-sm">Los mensajes que recibas aparecerán aquí</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                } ${getColorClass(conv.color_code)}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{conv.contact_name}</h3>
                    {getColorBadge(conv.color_code)}
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="bg-[#0071BC] text-white text-xs font-bold rounded-full px-2 py-1">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 truncate">{conv.last_message}</p>
                <p className="text-xs text-gray-400 mt-1">{conv.contact_phone}</p>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-gradient-to-r from-[#2E3192] to-[#0071BC] text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{selectedConversation.contact_name}</h3>
                <p className="text-sm text-blue-100">{selectedConversation.contact_phone}</p>
              </div>
              <div className="flex gap-2">
                {getColorBadge(selectedConversation.color_code)}
                <Button variant="ghost" size="sm" className="text-white hover:bg-blue-700">
                  <Phone size={20} />
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:bg-blue-700">
                  <Video size={20} />
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:bg-blue-700">
                  <MoreVertical size={20} />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4 bg-gray-50">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center items-center h-full text-gray-500">
                  <p>No hay mensajes en esta conversación</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={msg.id || index}
                    className={`flex mb-4 ${msg.from_me ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg shadow ${
                        msg.from_me
                          ? 'bg-green-500 text-white'
                          : 'bg-white text-gray-800'
                      }`}
                    >
                      <p className="break-words">{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.from_me ? 'text-green-100' : 'text-gray-500'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-300 flex gap-2">
              <Button variant="ghost" size="icon">
                <Smile className="text-gray-600" />
              </Button>
              <Button variant="ghost" size="icon">
                <Paperclip className="text-gray-600" />
              </Button>
              <Input
                type="text"
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1"
              />
              <Button onClick={sendMessage} className="bg-green-600 hover:bg-green-700">
                <Send size={20} />
              </Button>
              <Button variant="ghost" size="icon">
                <Mic className="text-gray-600" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <h3 className="text-2xl font-bold mb-2">WhatsApp Pro Web</h3>
              <p>Selecciona una conversación para comenzar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
