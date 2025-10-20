import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, MoreVertical, Plus, Edit, Trash2, Users, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AnimatePresence, motion } from 'framer-motion';

const statusConfig = {
  activo: { color: 'bg-green-100 text-green-800', label: 'Activo' },
  inactivo: { color: 'bg-yellow-100 text-yellow-800', label: 'Inactivo' },
  bloqueado: { color: 'bg-red-100 text-red-800', label: 'Bloqueado' },
};

const RelationshipBadge = ({ type }) => {
  if (type === 'familiar') {
    return <Badge className="bg-purple-100 text-purple-800 text-xs">Familiar</Badge>;
  }
  return <Badge className="bg-blue-100 text-blue-800 text-xs">Titular</Badge>;
};

const FamilyMemberCard = ({ member, onEdit, onDelete }) => (
  <div className="flex items-center justify-between p-2 pl-4 ml-8 border-l-2 border-gray-200 bg-white rounded-r-lg">
    <div className="flex items-center gap-3">
      <User className="w-4 h-4 text-gray-500" />
      <span className="text-sm font-medium text-gray-700">{member.name}</span>
      <RelationshipBadge type={member.relationship_type} />
    </div>
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={() => onEdit(member)} className="h-8 w-8 text-gray-500 hover:bg-gray-100"><Edit className="w-4 h-4" /></Button>
      <Button variant="ghost" size="icon" onClick={() => onDelete(member.id)} className="h-8 w-8 text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
    </div>
  </div>
);

export default function ContactList({ contacts, allContacts, isLoading, onEdit, onDelete, onAddFamilyMember }) {

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center p-12 bg-white rounded-2xl shadow-lg">
        <Users className="w-16 h-16 text-gray-300 mx-auto" />
        <h3 className="mt-4 text-xl font-semibold text-gray-700">No se encontraron pacientes</h3>
        <p className="mt-2 text-sm text-gray-500">Prueba a cambiar los filtros o el término de búsqueda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {contacts.map((contact) => {
          const familyMembers = allContacts.filter(c => c.parent_contact_id === contact.id);
          const statusInfo = statusConfig[contact.status] || { color: 'bg-gray-200', label: 'Desconocido' };

          return (
            <motion.div
              key={contact.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="shadow-lg border-l-4 border-[#0071bc] overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#2e3192] to-[#0071bc] rounded-full flex items-center justify-center text-white text-xl font-bold">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
      
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                           <h3 className="font-bold text-xl text-gray-900">{contact.name}</h3>
                           <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{contact.phone || 'No disponible'}</span>
                          </div>
                          {contact.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span>{contact.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-center">
                       <Button variant="outline" size="sm" onClick={() => onAddFamilyMember(contact)} className="h-9">
                          <Plus className="w-4 h-4 mr-2" /> Familiar
                       </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9"><MoreVertical className="w-5 h-5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(contact)}><Edit className="w-4 h-4 mr-2" />Editar Titular</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDelete(contact.id)} className="text-red-500 focus:bg-red-50 focus:text-red-600"><Trash2 className="w-4 h-4 mr-2" />Eliminar Titular</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {familyMembers.length > 0 && (
                    <div className="px-4 pb-3 space-y-1">
                      {familyMembers.map(member => (
                        <FamilyMemberCard key={member.id} member={member} onEdit={onEdit} onDelete={onDelete} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}