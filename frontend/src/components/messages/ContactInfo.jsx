import React, { useState } from 'react';
import { Edit2, Save, X, Mail, Phone, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const ContactInfo = ({ contact, onUpdateContact, appointments = [] }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState(contact || {});

  const getAvatarColor = (colorCode) => {
    const colors = {
      'AMARILLO': 'bg-white text-yellow-500 border-2 border-yellow-500',
      'AZUL': 'bg-white text-blue-600 border-2 border-blue-600',
      'VERDE': 'bg-white text-green-600 border-2 border-green-600'
    };
    return colors[colorCode] || 'bg-gray-300 text-gray-700';
  };

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
      <div className="w-80 bg-white border-l border-gray-200 flex items-center justify-center">
        <p className="text-gray-500">Selecciona un contacto</p>
      </div>
    );
  }

  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.fecha);
    return aptDate >= new Date();
  });

  const pastAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.fecha);
    return aptDate < new Date();
  });

  return (
    <div className="w-80 bg-white flex flex-col">
      {/* Cabecera con avatar y botones */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-gray-900">Información del Paciente</h3>
          {!isEditing ? (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsEditing(true)}
            >
              <Edit2 size={16} />
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSave}
              >
                <Save size={16} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCancel}
              >
                <X size={16} />
              </Button>
            </div>
          )}
        </div>

        {/* Avatar y nombre */}
        <div className="text-center mb-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-2 ${getAvatarColor(contact.color_code)}`}>
            {contact.name?.charAt(0).toUpperCase() || contact.contact_name?.charAt(0).toUpperCase() || '?'}
          </div>
          <h2 className="text-xl font-bold text-gray-900 uppercase">
            {contact.name || contact.contact_name}
          </h2>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Información en recuadros limpios */}
        <div className="p-4 space-y-4">
          {/* Nº Paciente */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <Label className="flex items-center gap-2 text-gray-600 text-xs mb-1">
              <User size={14} />
              Nº Paciente
            </Label>
            <p className="text-gray-900 font-medium">{contact.patient_number || contact.id || 'No asignado'}</p>
          </div>

          {/* Teléfono */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <Label className="flex items-center gap-2 text-gray-600 text-xs mb-1">
              <Phone size={14} />
              Teléfono
            </Label>
            {isEditing ? (
              <Input
                value={editedContact.phone || editedContact.contact_phone || ''}
                onChange={(e) => setEditedContact({ ...editedContact, phone: e.target.value })}
                className="mt-1"
              />
            ) : (
              <p className="text-gray-900 font-medium">{contact.phone || contact.contact_phone || 'No especificado'}</p>
            )}
          </div>

          {/* Email */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <Label className="flex items-center gap-2 text-gray-600 text-xs mb-1">
              <Mail size={14} />
              Email
            </Label>
            {isEditing ? (
              <Input
                type="email"
                value={editedContact.email || ''}
                onChange={(e) => setEditedContact({ ...editedContact, email: e.target.value })}
                className="mt-1"
              />
            ) : (
              <p className="text-gray-900 font-medium">{contact.email || 'No especificado'}</p>
            )}
          </div>

          {/* Notas */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <Label className="flex items-center gap-2 text-gray-600 text-xs mb-1">
              <FileText size={14} />
              Notas
            </Label>
            {isEditing ? (
              <Textarea
                value={editedContact.notes || ''}
                onChange={(e) => setEditedContact({ ...editedContact, notes: e.target.value })}
                rows={3}
                className="mt-1"
              />
            ) : (
              <p className="text-gray-900 whitespace-pre-wrap">
                {contact.notes || 'Sin notas'}
              </p>
            )}
          </div>
        </div>

        {/* Pestañas de Citas */}
        <div className="p-4">
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="upcoming">Próximas</TabsTrigger>
              <TabsTrigger value="history">Historial</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming" className="space-y-2">
              {upcomingAppointments.length === 0 ? (
                <p className="text-center text-gray-500 py-4 text-sm">No hay citas próximas</p>
              ) : (
                upcomingAppointments.map((apt, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="font-semibold text-sm text-gray-900">{apt.tratamiento}</p>
                    <p className="text-xs text-gray-600 mt-1">{apt.fecha} - {apt.hora}</p>
                    <p className="text-xs text-blue-600 mt-1">{apt.status}</p>
                  </div>
                ))
              )}
            </TabsContent>
            
            <TabsContent value="history" className="space-y-2">
              {pastAppointments.length === 0 ? (
                <p className="text-center text-gray-500 py-4 text-sm">No hay historial</p>
              ) : (
                pastAppointments.map((apt, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="font-semibold text-sm text-gray-900">{apt.tratamiento}</p>
                    <p className="text-xs text-gray-600 mt-1">{apt.fecha} - {apt.hora}</p>
                    <p className="text-xs text-gray-500 mt-1">{apt.status}</p>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ContactInfo;