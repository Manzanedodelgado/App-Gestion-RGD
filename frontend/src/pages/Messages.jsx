import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import ConversationList from '@/components/messages/ConversationList';
import ChatArea from '@/components/messages/ChatArea';
import ContactInfo from '@/components/messages/ContactInfo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Messages = () => {
  // Estado central
  const [conversations, setConversations] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageTemplates, setMessageTemplates] = useState([]);
  const [whatsappStatus, setWhatsappStatus] = useState({ ready: false });
  const [qrCode, setQrCode] = useState(null);
  
  // Estado de UI
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showContactInfo, setShowContactInfo] = useState(window.innerWidth >= 1280);
  
  // Responsive handling
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setShowContactInfo(width >= 1280);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Carga inicial
  useEffect(() => {
    checkWhatsAppStatus();
    loadInitialData();
  }, []);

  // Poll para actualizaciones - separado para capturar selectedContact correctamente
  useEffect(() => {
    const pollInterval = setInterval(() => {
      checkWhatsAppStatus();
      if (selectedContact) {
        fetchMessages(selectedContact.id);
      }
      fetchConversations();
    }, 5000);
    
    return () => clearInterval(pollInterval);
  }, [selectedContact]);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id);
    }
  }, [selectedContact]);

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

  const loadInitialData = async () => {
    await Promise.all([
      fetchConversations(),
      fetchMessageTemplates()
    ]);
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
      
      // Marcar como leído
      await axios.post(`${API}/conversations/${conversationId}/mark-read`);
      
      // Actualizar contador en la lista
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
        )
      );
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Error al cargar mensajes');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessageTemplates = async () => {
    try {
      const response = await axios.get(`${API}/message-flows`);
      setMessageTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleSelectContact = (conversation) => {
    setSelectedContact(conversation);
  };

  const handleSendMessage = async (messageText) => {
    if (!selectedContact) return;

    const tempMessage = {
      id: Date.now().toString(),
      text: messageText,
      from_me: true,
      timestamp: new Date().toISOString(),
      conversation_id: selectedContact.id
    };

    // Feedback instantáneo
    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await axios.post(
        `${API}/conversations/${selectedContact.id}/send`,
        { message: messageText }
      );

      if (response.data.success) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempMessage.id ? response.data.message : msg
          )
        );
        toast.success('Mensaje enviado');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      toast.error('Error al enviar mensaje');
      throw error;
    }
  };

  const handleClassify = async (conversationId, classification) => {
    try {
      // Llamar API para guardar clasificación MANUAL
      if (classification) {
        await axios.post(`${API}/conversations/${conversationId}/set-classification`, null, {
          params: { classification }
        });
      } else {
        // Si es null, eliminar clasificación
        await axios.delete(`${API}/conversations/${conversationId}/classification`);
      }
      
      // Actualizar localmente
      setSelectedContact(prev => ({ ...prev, color_code: classification }));
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId ? { ...conv, color_code: classification } : conv
        )
      );
      
      toast.success(`Conversación clasificada como: ${classification || 'Sin clasificar'}`);
    } catch (error) {
      console.error('Error classifying:', error);
      toast.error('Error al clasificar');
    }
  };

  const handleNewChat = () => {
    const name = prompt('Nombre del contacto:');
    if (!name) return;
    
    const phone = prompt('Número de teléfono (con código de país, ej: 34600000000):');
    if (!phone) return;
    
    // TODO: Crear contacto y conversación en el backend
    toast.info('Funcionalidad de nuevo chat en desarrollo. Por ahora puedes iniciar conversaciones cuando recibes mensajes.');
  };

  const handleArchive = (conversationId) => {
    // TODO: Implementar archivo de conversación
    toast.info('Funcionalidad de archivar próximamente');
  };

  const handleDelete = async (conversationId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta conversación?')) return;
    
    try {
      // TODO: Implementar eliminación en el backend
      // await axios.delete(`${API}/conversations/${conversationId}`);
      
      // Por ahora solo remover localmente
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (selectedContact?.id === conversationId) {
        setSelectedContact(null);
      }
      toast.success('Conversación eliminada (solo local por ahora)');
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Error al eliminar');
    }
  };

  const handleUpdateContact = async (updatedContact) => {
    try {
      await axios.put(`${API}/contacts/${updatedContact.id}`, updatedContact);
      setSelectedContact(updatedContact);
      
      // Actualizar en la lista de conversaciones
      setConversations(prev =>
        prev.map(conv =>
          conv.contact_id === updatedContact.id
            ? { ...conv, contact_name: updatedContact.name }
            : conv
        )
      );
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  };

  const handleArchive = async (conversation) => {
    toast.info('Función de archivar próximamente');
  };

  const handleDelete = async (conversation) => {
    if (window.confirm('¿Eliminar esta conversación?')) {
      toast.info('Función de eliminar próximamente');
    }
  };

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

  // Vista móvil - una columna a la vez
  if (isMobile) {
    if (!selectedContact) {
      return (
        <div className="h-screen">
          <ConversationList
            conversations={conversations}
            selectedContact={selectedContact}
            onSelectContact={handleSelectContact}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onNewChat={handleNewChat}
          />
        </div>
      );
    } else {
      return (
        <div className="h-screen">
          <ChatArea
            selectedContact={selectedContact}
            messages={messages}
            onSendMessage={handleSendMessage}
            onBack={() => setSelectedContact(null)}
            onClassify={handleClassify}
            messageTemplates={messageTemplates}
            isMobile={true}
          />
        </div>
      );
    }
  }

  // Vista desktop/tablet - 2 o 3 columnas
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Columna 1: Lista de conversaciones */}
      <div className="w-80 flex-shrink-0">
        <ConversationList
          conversations={conversations}
          selectedContact={selectedContact}
          onSelectContact={handleSelectContact}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Separador amarillo vibrante #facc15 - más grueso */}
      <div className="w-2 bg-[#facc15] flex-shrink-0"></div>

      {/* Columna 2: Área de chat */}
      <div className="flex-1">
        <ChatArea
          selectedContact={selectedContact}
          messages={messages}
          onSendMessage={handleSendMessage}
          onClassify={handleClassify}
          messageTemplates={messageTemplates}
          isMobile={false}
        />
      </div>

      {/* Columna 3: Info del contacto (solo en pantallas grandes) */}
      {showContactInfo && selectedContact && (
        <>
          {/* Separador amarillo vibrante #facc15 - más grueso */}
          <div className="w-2 bg-[#facc15] flex-shrink-0"></div>
          
          <ContactInfo
            contact={selectedContact}
            onUpdateContact={handleUpdateContact}
          />
        </>
      )}
    </div>
  );
};

export default Messages;
