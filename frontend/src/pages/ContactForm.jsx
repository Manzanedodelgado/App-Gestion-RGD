import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Save, UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ContactForm({ contact, parentContact, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    status: 'activo',
    relationship_type: 'titular',
    parent_contact_id: null,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || '',
        phone: contact.phone || '',
        email: contact.email || '',
        notes: contact.notes || '',
        status: contact.status || 'activo',
        relationship_type: contact.relationship_type || 'titular',
        parent_contact_id: contact.parent_contact_id || null,
      });
    } else if (parentContact) {
      setFormData({
        name: '',
        phone: parentContact.phone,
        email: '',
        notes: '',
        status: 'activo',
        relationship_type: 'familiar',
        parent_contact_id: parentContact.id,
      });
    } else {
      setFormData({
        name: '', phone: '', email: '', notes: '', status: 'activo', relationship_type: 'titular', parent_contact_id: null,
      });
    }
  }, [contact, parentContact]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await onSubmit(formData);
    setIsSaving(false);
  };
  
  const isFamiliar = formData.relationship_type === 'familiar';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <Card className="w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {contact ? <UserCheck className="w-6 h-6 text-[#0071bc]" /> : <UserPlus className="w-6 h-6 text-[#0071bc]" />}
                    {contact ? 'Editar Paciente' : (isFamiliar ? 'Añadir Familiar' : 'Nuevo Paciente Titular')}
                  </CardTitle>
                  {isFamiliar && parentContact && <CardDescription>Familiar de: {parentContact.name}</CardDescription>}
                </div>
                <Button variant="ghost" size="icon" type="button" onClick={onCancel}>
                  <X className="w-4 h-4" />
                </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto p-4">
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input id="name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono Móvil *</Label>
                <Input id="phone" type="tel" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} required disabled={isFamiliar} />
                 {isFamiliar && <p className="text-xs text-gray-500">Los familiares usan el teléfono del titular.</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notas Internas</Label>
              <Textarea id="notes" value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado del Paciente</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                  <SelectItem value="bloqueado">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <div className="p-4 border-t flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar Paciente
              </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}