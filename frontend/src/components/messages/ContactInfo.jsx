import React, { useState } from 'react';
import { Edit2, Save, X, Mail, Phone, Tag, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

const ContactInfo = ({ contact, onUpdateContact, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState(contact || {});

  const handleSave = async () => {
    try {
      await onUpdateContact(editedContact);
      setIsEditing(false);
      toast.success('Contacto actualizado');
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Error al actualizar contacto');
    }
  };

  const handleCancel = () => {
    setEditedContact(contact);
    setIsEditing(false);
  };

  if (!contact) {
    return (
      <div className="w-80 bg-white border-l border-gray-300 flex items-center justify-center">
        <p className="text-gray-500">Selecciona un contacto</p>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-300 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-[#2E3192] to-[#0071BC] text-white">
        <div className="flex justify-between items-center">
          <h3 className="font-bold">Información del Contacto</h3>
          {!isEditing ? (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              className="text-white hover:bg-blue-700"
            >
              <Edit2 size={18} />
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSave}
                className="text-white hover:bg-blue-700"
              >
                <Save size={18} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCancel}
                className="text-white hover:bg-blue-700"
              >
                <X size={18} />
              </Button>
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {/* Avatar y nombre */}
        <div className="text-center mb-6">
          <div className="w-24 h-24 rounded-full bg-[#0071BC] text-white flex items-center justify-center font-bold text-3xl mx-auto mb-3">
            {contact.name?.charAt(0).toUpperCase() || contact.contact_name?.charAt(0).toUpperCase() || '?'}
          </div>
          {isEditing ? (
            <Input
              value={editedContact.name || editedContact.contact_name || ''}
              onChange={(e) => setEditedContact({ ...editedContact, name: e.target.value })}
              className="text-center text-xl font-bold"
            />
          ) : (
            <h2 className="text-xl font-bold">{contact.name || contact.contact_name}</h2>
          )}
        </div>

        {/* Campos de información */}
        <div className="space-y-4">
          {/* Teléfono */}
          <div>
            <Label className="flex items-center gap-2 text-gray-600 mb-1">
              <Phone size={16} />
              Teléfono
            </Label>
            {isEditing ? (
              <Input
                value={editedContact.phone || editedContact.contact_phone || ''}
                onChange={(e) => setEditedContact({ ...editedContact, phone: e.target.value })}
              />
            ) : (
              <p className="text-gray-900">{contact.phone || contact.contact_phone || 'No especificado'}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <Label className="flex items-center gap-2 text-gray-600 mb-1">
              <Mail size={16} />
              Email
            </Label>
            {isEditing ? (
              <Input
                type="email"
                value={editedContact.email || ''}
                onChange={(e) => setEditedContact({ ...editedContact, email: e.target.value })}
              />
            ) : (
              <p className="text-gray-900">{contact.email || 'No especificado'}</p>
            )}
          </div>

          {/* Etiquetas */}
          <div>
            <Label className="flex items-center gap-2 text-gray-600 mb-1">
              <Tag size={16} />
              Etiquetas
            </Label>
            {isEditing ? (
              <Input
                value={editedContact.tags?.join(', ') || ''}
                onChange={(e) => setEditedContact({ 
                  ...editedContact, 
                  tags: e.target.value.split(',').map(t => t.trim()) 
                })}
                placeholder="Ej: VIP, Nuevo paciente"
              />
            ) : (
              <div className="flex flex-wrap gap-1">
                {contact.tags?.length > 0 ? (
                  contact.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {tag}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">Sin etiquetas</p>
                )}
              </div>
            )}
          </div>

          {/* Notas */}
          <div>
            <Label className="flex items-center gap-2 text-gray-600 mb-1">
              <FileText size={16} />
              Notas
            </Label>
            {isEditing ? (
              <Textarea
                value={editedContact.notes || ''}
                onChange={(e) => setEditedContact({ ...editedContact, notes: e.target.value })}
                rows={4}
                placeholder="Notas sobre el contacto..."
              />
            ) : (
              <p className="text-gray-900 whitespace-pre-wrap">
                {contact.notes || 'Sin notas'}
              </p>
            )}
          </div>

          {/* Información adicional */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-2">Información adicional</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Creado:</span>
                <span className="text-gray-900">
                  {contact.created_at ? new Date(contact.created_at).toLocaleDateString('es-ES') : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Última actualización:</span>
                <span className="text-gray-900">
                  {contact.updated_at ? new Date(contact.updated_at).toLocaleDateString('es-ES') : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ID WhatsApp:</span>
                <span className="text-gray-900 text-xs truncate max-w-[150px]">
                  {contact.whatsapp_id || '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ContactInfo;
