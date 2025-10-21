import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, Smile, Paperclip, Mic, MoreVertical } from 'lucide-react';
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
    // Auto-resize textarea
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
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <h3 className="text-2xl font-bold mb-2">Bienvenido a Mensajes</h3>
          <p>Selecciona una conversación para comenzar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-[#2E3192] to-[#0071BC] text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isMobile && onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="text-white hover:bg-blue-700">
              <ArrowLeft size={20} />
            </Button>
          )}
          <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center font-bold">
            {selectedContact.contact_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold">{selectedContact.contact_name}</h3>
            <p className="text-sm text-blue-100">{selectedContact.contact_phone}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-white hover:bg-blue-700">
          <MoreVertical size={20} />
        </Button>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            <p>No hay mensajes en esta conversación</p>
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

      {/* Templates (Acciones Rápidas) */}
      {messageTemplates.length > 0 && (
        <div className="p-3 bg-white border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Respuestas rápidas:</p>
          <div className="flex flex-wrap gap-2">
            {messageTemplates.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                onClick={() => handleTemplateClick(template)}
                className="text-xs"
              >
                {template.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-300">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <Smile className="text-gray-600" size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <Paperclip className="text-gray-600" size={20} />
          </Button>
          
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe un mensaje..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0071BC] max-h-32"
            rows="1"
          />
          
          <Button 
            onClick={handleSend} 
            disabled={!newMessage.trim() || isSending}
            className="bg-[#0071BC] hover:bg-[#2E3192] flex-shrink-0"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <Send size={20} />
            )}
          </Button>
          
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <Mic className="text-gray-600" size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
