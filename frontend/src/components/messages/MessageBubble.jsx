import React from 'react';
import { CheckCheck, Check, Clock, Bot } from 'lucide-react';

const MessageBubble = ({ message }) => {
  const isOutbound = message.from_me;

  const getStatusIcon = () => {
    if (!isOutbound) return null;
    
    // Simulamos estados basados en timestamp reciente
    const now = new Date();
    const msgTime = new Date(message.timestamp);
    const diff = (now - msgTime) / 1000; // segundos

    if (diff < 2) {
      return <Clock size={14} className="text-blue-200" />;
    } else if (diff < 10) {
      return <Check size={14} className="text-blue-200" />;
    } else {
      return <CheckCheck size={14} className="text-blue-200" />;
    }
  };

  return (
    <div className={`flex mb-3 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] px-4 py-2 rounded-lg shadow-sm ${
          isOutbound
            ? 'bg-[#0071BC] text-white rounded-br-none'
            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
        }`}
      >
        {/* Contenido del mensaje */}
        <p className="break-words whitespace-pre-wrap">{message.text}</p>
        
        {/* Transcripción de audio si existe */}
        {message.transcription && (
          <div className={`mt-2 pt-2 border-t ${isOutbound ? 'border-blue-400' : 'border-gray-300'}`}>
            <p className={`text-xs ${isOutbound ? 'text-blue-100' : 'text-gray-500'}`}>
              🎤 Transcripción: {message.transcription}
            </p>
          </div>
        )}

        {/* Footer: hora, estado, IA */}
        <div className="flex items-center justify-end gap-1 mt-1">
          {message.is_ai_generated && (
            <Bot size={12} className={isOutbound ? 'text-blue-200' : 'text-gray-400'} />
          )}
          <span className={`text-xs ${isOutbound ? 'text-blue-100' : 'text-gray-500'}`}>
            {new Date(message.timestamp).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          {getStatusIcon()}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
