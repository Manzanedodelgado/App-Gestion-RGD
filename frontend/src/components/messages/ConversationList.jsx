import React from 'react';
import { Search, Plus, MoreVertical, Archive, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ConversationItem = ({ conversation, isSelected, onSelect, onArchive, onDelete }) => {
  const getColorBorder = (colorCode) => {
    const colors = {
      'AMARILLO': 'border-l-4 border-yellow-500',
      'AZUL': 'border-l-4 border-blue-500',
      'VERDE': 'border-l-4 border-green-500'
    };
    return colors[colorCode] || 'border-l-4 border-gray-300';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (hours < 168) {
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      return days[date.getDay()];
    } else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    }
  };

  return (
    <div
      onClick={() => onSelect(conversation)}
      className={`flex items-start p-3 cursor-pointer border-b border-gray-200 ${getColorBorder(conversation.color_code)} ${
        isSelected ? 'bg-slate-100' : 'hover:bg-slate-50'
      }`}
    >
      {/* Avatar simple */}
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-gray-400 text-white flex items-center justify-center font-semibold">
          {conversation.contact_name?.charAt(0).toUpperCase() || '?'}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 ml-3 min-w-0">
        <div className="flex justify-between items-start mb-1">
          {/* NOMBRE EN MAYÚSCULAS */}
          <h4 className="font-semibold text-gray-900 truncate uppercase">
            {conversation.contact_name}
          </h4>
          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
            {formatTime(conversation.last_message_at)}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 truncate mb-1">{conversation.last_message}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{conversation.contact_phone}</span>
          
          <div className="flex items-center gap-2">
            {conversation.unread_count > 0 && (
              <span className="bg-blue-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                {conversation.unread_count}
              </span>
            )}
            
            {/* Menú de 3 puntos */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical size={14} className="text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(conversation); }}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archivar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(conversation); }}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConversationList = ({ 
  conversations, 
  selectedContact, 
  onSelectContact,
  onArchive,
  onDelete,
  onNewChat 
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filter, setFilter] = React.useState('all');

  const filteredConversations = React.useMemo(() => {
    let filtered = conversations;

    if (searchQuery) {
      filtered = filtered.filter(conv =>
        conv.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.contact_phone?.includes(searchQuery)
      );
    }

    if (filter === 'unread') {
      filtered = filtered.filter(conv => conv.unread_count > 0);
    } else if (filter === 'priority') {
      filtered = filtered.filter(conv => 
        conv.color_code === 'AMARILLO' || conv.color_code === 'AZUL'
      );
    }

    return filtered;
  }, [conversations, searchQuery, filter]);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Cabecera con fondo azul oscuro corporativo */}
      <div className="p-4 bg-[#2E3192] text-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Chats</h2>
          <Button 
            onClick={onNewChat}
            size="sm" 
            variant="ghost" 
            className="text-white hover:bg-white/20"
          >
            <Plus size={20} />
          </Button>
        </div>
        
        {/* Filtros en la cabecera */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter('all')}
            className={`text-white hover:bg-white/20 ${filter === 'all' ? 'bg-white/20' : ''}`}
          >
            Todos
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter('unread')}
            className={`text-white hover:bg-white/20 ${filter === 'unread' ? 'bg-white/20' : ''}`}
          >
            No leídos
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter('priority')}
            className={`text-white hover:bg-white/20 ${filter === 'priority' ? 'bg-white/20' : ''}`}
          >
            Prioritarios
          </Button>
        </div>
      </div>

      {/* Búsqueda con fondo oscuro */}
      <div className="p-3 bg-[#2E3192] border-b border-[#1E2082]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300" size={18} />
          <Input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300"
          />
        </div>
      </div>

      {/* Lista de conversaciones con fondo slate-50 */}
      <ScrollArea className="flex-1">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No hay conversaciones</p>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isSelected={selectedContact?.id === conv.id}
              onSelect={onSelectContact}
              onArchive={onArchive}
              onDelete={onDelete}
            />
          ))
        )}
      </ScrollArea>
    </div>
  );
};

export default ConversationList;