import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Search, MoreVertical, Send, Smile, Paperclip, Mic, Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
// Socket connection to WhatsApp service
// In production, this would need to be proxied through the backend
// For now, we'll use polling for QR updates instead of socket
const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : null;

const Messages = () => {
  const [whatsappStatus, setWhatsappStatus] = useState({ ready: false, hasQR: false });
  const [qrCode, setQrCode] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    checkWhatsAppStatus();
    
    // Only use socket in development (localhost)
    if (SOCKET_URL) {
      const socketConnection = io(SOCKET_URL);
      setSocket(socketConnection);

      socketConnection.on('qr', (qr) => {
        setQrCode(qr);
        setWhatsappStatus({ ready: false, hasQR: true });
      });

      socketConnection.on('ready', () => {
        setWhatsappStatus({ ready: true, hasQR: false });
        setQrCode(null);
        fetchChats();
        toast.success('WhatsApp conectado exitosamente');
      });

      socketConnection.on('authenticated', () => {
        toast.success('Autenticación exitosa');
      });

      socketConnection.on('message', (message) => {
        if (selectedChat && message.from === selectedChat.id) {
          setMessages((prev) => [...prev, message]);
        }
        fetchChats();
      });

      socketConnection.on('disconnected', () => {
        setWhatsappStatus({ ready: false, hasQR: false });
        toast.error('WhatsApp desconectado');
      });

      return () => {
        socketConnection.disconnect();
      };
    } else {
      // In production, use polling instead of socket
      const pollInterval = setInterval(() => {
        checkWhatsAppStatus();
      }, 3000); // Poll every 3 seconds
      
      return () => clearInterval(pollInterval);
    }
  }, []);

  useEffect(() => {
    if (whatsappStatus.ready) {
      fetchChats();
      const interval = setInterval(fetchChats, 10000);
      return () => clearInterval(interval);
    }
  }, [whatsappStatus.ready]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkWhatsAppStatus = async () => {
    try {
      const response = await axios.get(`${API}/whatsapp/status`);
      setWhatsappStatus(response.data);
      if (response.data.hasQR) {
        const qrResponse = await axios.get(`${API}/whatsapp/qr`);
        setQrCode(qrResponse.data.qr);
      }
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
    }
  };

  const fetchChats = async () => {
    try {
      const response = await axios.get(`${API}/whatsapp/chats`);
      setChats(response.data.filter(chat => !chat.isGroup));
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const selectChat = async (chat) => {
    setSelectedChat(chat);
    try {
      const response = await axios.get(`${API}/whatsapp/messages/${chat.id}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Error al cargar mensajes');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const number = selectedChat.id.split('@')[0];
      await axios.post(`${API}/whatsapp/send-message`, {
        number,
        message: newMessage
      });

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          body: newMessage,
          fromMe: true,
          timestamp: Date.now() / 1000,
          type: 'chat'
        }
      ]);

      setNewMessage('');
      toast.success('Mensaje enviado');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar mensaje');
    }
  };

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!whatsappStatus.ready && qrCode) {
    return (
      <div className="whatsapp-container" data-testid="whatsapp-qr-container">
        <div className="qr-container">
          <h2 className="qr-title">Conectar WhatsApp</h2>
          <p className="qr-subtitle">Escanea el código QR con tu teléfono</p>
          <div className="qr-code">
            <img src={qrCode} alt="QR Code" />
          </div>
          <div className="qr-instructions">
            <p>1. Abre WhatsApp en tu teléfono</p>
            <p>2. Ve a Configuración → Dispositivos vinculados</p>
            <p>3. Toca "Vincular un dispositivo"</p>
            <p>4. Escanea este código QR</p>
          </div>
        </div>
      </div>
    );
  }

  if (!whatsappStatus.ready) {
    return (
      <div className="whatsapp-container" data-testid="whatsapp-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Iniciando WhatsApp...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="whatsapp-container" data-testid="whatsapp-main">
      {/* Chats List */}
      <div className="chats-panel">
        <div className="chats-header">
          <h2 className="chats-title">Chats</h2>
          <Button variant="ghost" size="icon" data-testid="new-chat-btn">
            <MoreVertical size={20} />
          </Button>
        </div>

        <div className="chats-search">
          <Search className="search-icon" size={18} />
          <Input
            type="text"
            placeholder="Buscar o empezar un chat nuevo"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            data-testid="chat-search-input"
          />
        </div>

        <div className="chats-tabs">
          <button className="chat-tab chat-tab-active" data-testid="tab-all">Todos</button>
          <button className="chat-tab" data-testid="tab-unread">No leídos</button>
          <button className="chat-tab" data-testid="tab-priority">Prioritarios</button>
        </div>

        <ScrollArea className="chats-list">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${selectedChat?.id === chat.id ? 'chat-item-active' : ''}`}
              onClick={() => selectChat(chat)}
              data-testid={`chat-item-${chat.id}`}
            >
              <div className="chat-avatar">
                {chat.name.charAt(0).toUpperCase()}
              </div>
              <div className="chat-info">
                <div className="chat-header-row">
                  <h3 className="chat-name">{chat.name}</h3>
                  <span className="chat-time">
                    {chat.lastMessage ? new Date(chat.lastMessage.timestamp * 1000).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : ''}
                  </span>
                </div>
                <div className="chat-message-row">
                  <p className="chat-last-message">
                    {chat.lastMessage?.body || 'Sin mensajes'}
                  </p>
                  {chat.unreadCount > 0 && (
                    <span className="chat-unread-badge">{chat.unreadCount}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Messages Area */}
      <div className="messages-panel">
        {selectedChat ? (
          <>
            <div className="messages-header">
              <div className="flex items-center gap-3">
                <div className="chat-avatar">
                  {selectedChat.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{selectedChat.name}</h3>
                  <p className="text-xs text-slate-500">Click para ver info del contacto</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" data-testid="voice-call-btn">
                  <Phone size={20} />
                </Button>
                <Button variant="ghost" size="icon" data-testid="video-call-btn">
                  <Video size={20} />
                </Button>
                <Button variant="ghost" size="icon" data-testid="chat-options-btn">
                  <MoreVertical size={20} />
                </Button>
              </div>
            </div>

            <ScrollArea className="messages-area">
              <div className="messages-list">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message ${message.fromMe ? 'message-sent' : 'message-received'}`}
                    data-testid={`message-${message.id}`}
                  >
                    <div className="message-content">
                      <p>{message.body}</p>
                      <span className="message-time">
                        {new Date(message.timestamp * 1000).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="messages-input">
              <Button variant="ghost" size="icon" data-testid="emoji-btn">
                <Smile size={22} className="text-slate-600" />
              </Button>
              <Button variant="ghost" size="icon" data-testid="attach-btn">
                <Paperclip size={22} className="text-slate-600" />
              </Button>
              <Input
                type="text"
                placeholder="Escribe un mensaje"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 border-none focus-visible:ring-0"
                data-testid="message-input"
              />
              {newMessage.trim() ? (
                <Button onClick={sendMessage} size="icon" className="bg-teal-600 hover:bg-teal-700" data-testid="send-message-btn">
                  <Send size={20} />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" data-testid="voice-message-btn">
                  <Mic size={22} className="text-slate-600" />
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="messages-empty">
            <div className="text-center">
              <h2 className="text-3xl font-light text-indigo-700 mb-3">WhatsApp Pro Web</h2>
              <p className="text-slate-600">Selecciona un chat de la lista o crea uno nuevo para comenzar a enviar mensajes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;