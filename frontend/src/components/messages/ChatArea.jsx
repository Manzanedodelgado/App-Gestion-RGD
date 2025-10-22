import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, Paperclip, Mic, MoreVertical, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import MessageBubble from './MessageBubble';
import { toast } from 'sonner';

const ChatArea = ({ 
  selectedContact, 
  messages, 
  onSendMessage, 
  onBack,
  onClassify,
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

  const handleAttachFile = () => {
    // Crear input file temporal
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf,.doc,.docx';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        // TODO: Implementar subida de archivo
        console.log('Archivo seleccionado:', file.name);
        alert(`Archivo seleccionado: ${file.name}\n\nFuncionalidad de envío de archivos próximamente.`);
      }
    };
    input.click();
  };

  const handleVoiceRecord = () => {
    // TODO: Implementar grabación de voz
    alert('Funcionalidad de grabación de voz próximamente.');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTemplateSelect = (templateType) => {
    toast.info(`Plantilla de ${templateType} seleccionada`);
  };

  const handleClassificationChange = (classification) => {
    if (onClassify) {
      onClassify(selectedContact.id, classification);
    }
  };

  const getAvatarColor = (colorCode) => {
    if (!colorCode) {
      // Sin clasificar: fondo blanco, letra azul oscuro
      return 'bg-white text-[#312ea3] border-2 border-gray-300';
    }
    
    // Con clasificación: fondo del color, letra blanca
    const colors = {
      'AMARILLO': 'bg-yellow-500 text-white',
      'AZUL': 'bg-blue-600 text-white',
      'VERDE': 'bg-green-600 text-white'
    };
    return colors[colorCode] || 'bg-white text-[#312ea3] border-2 border-gray-300';
  };

  if (!selectedContact) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Selecciona una conversación</h3>
          <p className="text-gray-600">Elige un chat de la lista para comenzar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#e0f2fe]">
      {/* Cabecera con fondo azul claro */}
      <div className="p-4 bg-[#e0f2fe] border-b border-gray-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isMobile && onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft size={20} />
              </Button>
            )}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg ${getAvatarColor(selectedContact.color_code)}`}>
              {selectedContact.contact_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 uppercase">{selectedContact.contact_name}</h3>
              <p className="text-sm text-gray-600">{selectedContact.contact_phone}</p>
            </div>
          </div>
          
          {/* Menú de clasificación con 3 puntos */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical size={20} className="text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => handleClassificationChange('AMARILLO')}>
                <Circle className="mr-2 h-4 w-4 fill-yellow-500 text-yellow-500" />
                Urgente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleClassificationChange('AZUL')}>
                <Circle className="mr-2 h-4 w-4 fill-blue-500 text-blue-500" />
                Requiere Atención
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleClassificationChange('VERDE')}>
                <Circle className="mr-2 h-4 w-4 fill-green-500 text-green-500" />
                Resuelta
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleClassificationChange(null)}>
                <Circle className="mr-2 h-4 w-4 fill-gray-300 text-gray-300" />
                Sin Clasificar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area con fondo azul claro */}
      <ScrollArea className="flex-1 p-4 bg-[#e0f2fe]">
        {messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            <p>No hay mensajes</p>
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

      {/* Input Area con menús desplegables */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        {/* Menús desplegables para plantillas */}
        <div className="flex gap-2 mb-3">
          <Select onValueChange={handleTemplateSelect}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Confirmación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cita-24h">Recordatorio 24h</SelectItem>
              <SelectItem value="cita-1h">Recordatorio 1h</SelectItem>
              <SelectItem value="confirmar">Confirmar cita</SelectItem>
            </SelectContent>
          </Select>
          
          <Select onValueChange={handleTemplateSelect}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Consentimientos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lopd">LOPD</SelectItem>
              <SelectItem value="salud">Cuestionario Salud</SelectItem>
              <SelectItem value="implante">Implante</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Área de entrada de texto */}
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={handleAttachFile}>
            <Paperclip className="text-gray-600" size={20} />
          </Button>
          
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe un mensaje..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32"
            rows="1"
          />
          
          <Button 
            onClick={handleSend} 
            disabled={!newMessage.trim() || isSending}
            className="bg-blue-500 hover:bg-blue-600 flex-shrink-0"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <Send size={20} />
            )}
          </Button>
          
          <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={handleVoiceRecord}>
            <Mic className="text-gray-600" size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;