import React from 'react';
import { CheckCheck, Check, Clock } from 'lucide-react';

const MessageBubble = ({ message }) => {
  const isOutbound = message.from_me;

  const getStatusIcon = () => {
    if (!isOutbound) return null;
    
    const now = new Date();
    const msgTime = new Date(message.timestamp);
    const diff = (now - msgTime) / 1000;

    if (diff < 2) {
      return <Clock size={12} className=\"text-gray-400\" />;
    } else if (diff < 10) {
      return <Check size={12} className=\"text-gray-400\" />;
    } else {
      return <CheckCheck size={12} className=\"text-blue-500\" />;
    }
  };

  return (
    <div className={`flex mb-3 ${isOutbound ? 'justify-end' : 'justify-start'}`}>\n      <div\n        className={`max-w-[70%] px-4 py-2 rounded-lg ${\n          isOutbound\n            ? 'bg-blue-100 text-gray-900'\n            : 'bg-gray-200 text-gray-900'\n        }`}\n      >\n        <p className=\"break-words whitespace-pre-wrap\">{message.text}</p>\n        \n        <div className=\"flex items-center justify-end gap-1 mt-1\">\n          <span className=\"text-xs text-gray-600\">\n            {new Date(message.timestamp).toLocaleTimeString('es-ES', {\n              hour: '2-digit',\n              minute: '2-digit'\n            })}\n          </span>\n          {getStatusIcon()}\n        </div>\n      </div>\n    </div>\n  );\n};\n\nexport default MessageBubble;
import { CheckCheck, Check, Clock, Bot } from 'lucide-react';

const MessageBubble = ({ message }) => {
  const isOutbound = message.from_me;

  const getStatusIcon = () => {
    if (!isOutbound) return null;
    
    const now = new Date();
    const msgTime = new Date(message.timestamp);
    const diff = (now - msgTime) / 1000;

    if (diff < 2) {
      return <Clock size={12} className="text-blue-300" />;
    } else if (diff < 10) {
      return <Check size={12} className="text-blue-300" />;
    } else {
      return <CheckCheck size={12} className="text-blue-300" />;
    }
  };

  return (
    <div className={`flex mb-4 ${isOutbound ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div
        className={`group relative max-w-[75%] px-4 py-3 rounded-2xl shadow-sm transition-all hover:shadow-md ${
          isOutbound
            ? 'bg-gradient-to-br from-[#0071BC] to-[#2E3192] text-white rounded-br-sm'
            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm hover:border-gray-300'
        }`}
      >
        {/* Contenido del mensaje */}
        <p className="break-words whitespace-pre-wrap text-[15px] leading-relaxed">
          {message.text}
        </p>
        
        {/* Transcripción de audio si existe */}
        {message.transcription && (
          <div className={`mt-3 pt-3 border-t ${isOutbound ? 'border-blue-400/30' : 'border-gray-200'}`}>
            <div className="flex items-start gap-2">
              <span className="text-lg">🎤</span>
              <p className={`text-xs leading-relaxed ${isOutbound ? 'text-blue-100' : 'text-gray-600'}`}>
                {message.transcription}
              </p>
            </div>
          </div>
        )}

        {/* Footer: hora, estado, IA */}
        <div className="flex items-center justify-end gap-1.5 mt-2">
          {message.is_ai_generated && (
            <div className="flex items-center gap-1 mr-1">
              <Bot size={12} className={isOutbound ? 'text-blue-200' : 'text-gray-400'} />
              <span className={`text-[10px] font-medium ${isOutbound ? 'text-blue-200' : 'text-gray-400'}`}>
                IA
              </span>
            </div>
          )}
          <span className={`text-[11px] font-medium ${isOutbound ? 'text-blue-200' : 'text-gray-500'}`}>
            {new Date(message.timestamp).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          {getStatusIcon()}
        </div>

        {/* Pequeña cola de la burbuja */}
        <div className={`absolute bottom-0 ${isOutbound ? 'right-0 -mr-1' : 'left-0 -ml-1'}`}>
          <div className={`w-3 h-3 ${
            isOutbound ? 'bg-[#2E3192]' : 'bg-white border-l border-b border-gray-200'
          } transform rotate-45`} />
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
