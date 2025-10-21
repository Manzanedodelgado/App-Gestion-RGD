import React from 'react';
import { Search, Filter, Archive, Trash2 } from 'lucide-react';
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
  const getColorBar = (colorCode) => {
    const colors = {
      'AMARILLO': 'bg-yellow-500',
      'AZUL': 'bg-blue-500',
      'VERDE': 'bg-green-500'
    };
    return colors[colorCode] || 'bg-gray-300';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    }
  };

  return (
    <div
      onClick={() => onSelect(conversation)}
      className={`flex items-start p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors relative ${
        isSelected ? 'bg-blue-50' : ''
      }`}
    >
      {/* Barra de color lateral */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getColorBar(conversation.color_code)}`} />
      
      {/* Avatar */}
      <div className="flex-shrink-0 ml-2">
        <div className="w-12 h-12 rounded-full bg-[#0071BC] text-white flex items-center justify-center font-bold text-lg">
          {conversation.contact_name?.charAt(0).toUpperCase() || '?'}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 ml-3 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-semibold text-gray-900 truncate">{conversation.contact_name}</h4>
          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
            {formatTime(conversation.last_message_at)}
          </span>
        </div>
        <p className="text-sm text-gray-600 truncate mb-1">{conversation.last_message}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{conversation.contact_phone}</span>
          <div className="flex items-center gap-2">
            {conversation.unread_count > 0 && (
              <span className="bg-[#0071BC] text-white text-xs font-bold rounded-full px-2 py-0.5">
                {conversation.unread_count}
              </span>
            )}
            
            {/* Menú de acciones */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <span className="text-gray-400">⋮</span>
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
  onDelete 
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filter, setFilter] = React.useState('all'); // all, unread, priority

  const filteredConversations = React.useMemo(() => {
    let filtered = conversations;

    // Filtro de búsqueda
    if (searchQuery) {
      filtered = filtered.filter(conv =>
        conv.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.contact_phone?.includes(searchQuery)
      );
    }

    // Filtro de tipo
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
    <div className="flex flex-col h-full bg-white border-r border-gray-300">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-[#2E3192] to-[#0071BC] text-white">
        <h2 className="text-xl font-bold mb-1">Mensajes</h2>
        <p className="text-sm text-blue-100">
          {conversations.length} conversación{conversations.length !== 1 ? 'es' : ''}
        </p>
      </div>

      {/* Búsqueda */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Buscar conversaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 p-3 border-b border-gray-200">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-[#0071BC]' : ''}
        >
          Todos
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
          className={filter === 'unread' ? 'bg-[#0071BC]' : ''}
        >
          No leídos
        </Button>
        <Button
          variant={filter === 'priority' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('priority')}
          className={filter === 'priority' ? 'bg-[#0071BC]' : ''}
        >
          Prioritarios
        </Button>
      </div>

      {/* Lista de conversaciones */}
      <ScrollArea className="flex-1">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg font-semibold mb-2">No hay conversaciones</p>
            <p className="text-sm">
              {searchQuery ? 'No se encontraron resultados' : 'Los mensajes aparecerán aquí'}
            </p>
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
