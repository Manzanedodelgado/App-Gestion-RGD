import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, Smile, Paperclip, Mic, MoreVertical, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import MessageBubble from './MessageBubble';
import { toast } from 'sonner';

const ChatArea = ({ 
  selectedContact, 
  messages, 
  onSendMessage, 
  onBack,
  messageTemplates = [],
  isMobile = false 
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [newMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(newMessage);
      setNewMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar mensaje');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTemplateClick = (template) => {
    setNewMessage(template.content);
    textareaRef.current?.focus();
  };

  if (!selectedContact) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center max-w-md mx-auto px-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#0071BC] to-[#2E3192] flex items-center justify-center shadow-lg">
            <Send className="text-white" size={40} />
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-3">Bienvenido a Mensajes</h3>
          <p className="text-gray-600 text-lg">Selecciona una conversación de la lista para comenzar a chatear</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
      {/* Header refinado */}
      <div className="p-4 bg-gradient-to-r from-[#2E3192] via-[#0071BC] to-[#65C8D0] text-white shadow-md border-b border-blue-400/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isMobile && onBack && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack} 
                className="text-white hover:bg-white/20 transition-colors"
              >
                <ArrowLeft size={20} />
              </Button>
            )}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-300 to-blue-500 flex items-center justify-center font-bold text-xl shadow-md border-2 border-white/50">
                {selectedContact.contact_name?.charAt(0).toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white shadow-sm" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{selectedContact.contact_name}</h3>
              <p className="text-sm text-blue-100 font-medium">{selectedContact.contact_phone}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/20 transition-colors"
          >
            <MoreVertical size={20} />
          </Button>
        </div>
      </div>

      {/* Messages Area con patrón sutil */}
      <ScrollArea className="flex-1 p-6" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(229 231 235 / 0.3) 1px, transparent 0)', backgroundSize: '40px 40px' }}>
        {messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-gray-500">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4 shadow-inner">
              <Send className="text-gray-400" size={28} />
            </div>
            <p className="text-lg font-semibold">No hay mensajes</p>
            <p className="text-sm text-gray-400 mt-1">Inicia una conversación</p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <MessageBubble key={msg.id || index} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </ScrollArea>

      {/* Templates con mejor diseño */}
      {messageTemplates.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-blue-600" />
            <p className="text-xs font-semibold text-blue-700">Respuestas rápidas</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {messageTemplates.slice(0, 5).map((template) => (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                onClick={() => handleTemplateClick(template)}
                className="text-xs border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all shadow-sm"
              >
                {template.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area mejorado */}
      <div className="p-4 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex items-end gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="flex-shrink-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Smile size={22} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="flex-shrink-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Paperclip size={22} />
          </Button>
          
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe un mensaje..."
            className="flex-1 resize-none border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0071BC] focus:border-transparent max-h-32 transition-all shadow-sm hover:border-gray-300"
            rows="1"
          />
          
          <Button 
            onClick={handleSend} 
            disabled={!newMessage.trim() || isSending}
            className="bg-gradient-to-r from-[#0071BC] to-[#2E3192] hover:from-[#2E3192] hover:to-[#0071BC] flex-shrink-0 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            size="icon"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <Send size={20} />
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="flex-shrink-0 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Mic size={22} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;