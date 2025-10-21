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
      return <Clock size={12} className="text-white" />;
    } else if (diff < 10) {
      return <Check size={12} className="text-white" />;
    } else {
      return <CheckCheck size={12} className="text-white" />;
    }
  };

  return (
    <div className={`flex mb-3 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] px-4 py-2 rounded-lg ${
          isOutbound
            ? 'bg-[#2563eb] text-white'
            : 'bg-[#dbeafe] text-gray-900'
        }`}
      >
        <p className="break-words whitespace-pre-wrap">{message.text}</p>
        
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className={`text-xs ${isOutbound ? 'text-white' : 'text-gray-600'}`}>
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