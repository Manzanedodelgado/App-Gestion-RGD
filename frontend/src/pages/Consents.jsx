import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Consents = () => {
  const [consents, setConsents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingConsent, setEditingConsent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    treatment_type: '',
    content: '',
    fields: []
  });

  useEffect(() => {
    loadConsents();
  }, []);

  const loadConsents = async () => {
    try {
      const response = await axios.get(`${API}/consent-templates`);
      setConsents(response.data);
    } catch (error) {
      console.error('Error loading consents:', error);
      toast.error('Error al cargar consentimientos');
    }
  };

  const handleCreate = () => {
    setEditingConsent(null);
    setFormData({ name: '', treatment_type: '', content: '', fields: [] });
    setShowForm(true);
  };

  const handleEdit = (consent) => {
    setEditingConsent(consent);
    setFormData({
      name: consent.name,
      treatment_type: consent.treatment_type,
      content: consent.content,
      fields: consent.fields || []
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este consentimiento?')) return;

    try {
      await axios.delete(`${API}/consent-templates/${id}`);
      toast.success('Consentimiento eliminado');
      loadConsents();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Error al eliminar');
    }
  };

  const handleSave = async () => {
    try {
      if (editingConsent) {
        await axios.put(`${API}/consent-templates/${editingConsent.id}`, formData);
        toast.success('Consentimiento actualizado');
      } else {
        await axios.post(`${API}/consent-templates`, formData);
        toast.success('Consentimiento creado');
      }
      setShowForm(false);
      loadConsents();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Error al guardar');
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#283593] to-[#0071BC] rounded-lg p-6 mb-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gestión de Consentimientos Informados</h1>
            <p className="text-white/80">Crea y gestiona plantillas de consentimiento para tus tratamientos</p>
          </div>
          <Button onClick={handleCreate} className="bg-white text-blue-600 hover:bg-gray-100">
            <Plus size={20} className="mr-2" />
            Nuevo Consentimiento
          </Button>
        </div>
      </div>

      {/* Lista de consentimientos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {consents.map((consent) => (
          <Card key={consent.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <FileText className="text-blue-600" size={24} />
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(consent)}>
                    <Edit size={16} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(consent.id)} className="text-red-600">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-lg mt-2">{consent.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">{consent.treatment_type}</p>
              <Button size="sm" variant="outline" className="w-full">
                <ExternalLink size={14} className="mr-2" />
                Ver Formulario
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingConsent ? 'Editar' : 'Nuevo'} Consentimiento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nombre del Consentimiento</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: LOPD, Cuestionario de Salud"
                />
              </div>
              <div>
                <Label>Tipo de Tratamiento</Label>
                <Input
                  value={formData.treatment_type}
                  onChange={(e) => setFormData({ ...formData, treatment_type: e.target.value })}
                  placeholder="Ej: Blanqueamiento, Ortodoncia"
                />
              </div>
              <div>
                <Label>Contenido del Formulario (HTML)</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  placeholder="Contenido HTML del formulario..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button onClick={handleSave} className="bg-blue-600">Guardar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Consents;