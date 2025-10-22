import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import TemplateList from '@/components/templates/TemplateList';
import TemplateForm from '@/components/templates/TemplateForm';
import TemplatePreview from '@/components/templates/TemplatePreview';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Templates = () => {
  const [messageTemplates, setMessageTemplates] = useState([]);
  const [consentTemplates, setConsentTemplates] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [templatesRes, consentsRes, automationsRes] = await Promise.all([
        axios.get(`${API}/message-templates`),
        axios.get(`${API}/consent-templates`),
        axios.get(`${API}/automations`)
      ]);

      setMessageTemplates(templatesRes.data);
      setConsentTemplates(consentsRes.data);
      setAutomations(automationsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setShowForm(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta plantilla?')) return;

    try {
      await axios.delete(`${API}/message-templates/${templateId}`);
      toast.success('Plantilla eliminada');
      loadData();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Error al eliminar plantilla');
    }
  };

  const handleSave = async (templateData) => {
    console.log('=== GUARDANDO PLANTILLA ===');
    console.log('Template data:', JSON.stringify(templateData, null, 2));
    
    try {
      if (editingTemplate) {
        console.log('Actualizando plantilla existente:', editingTemplate.id);
        const response = await axios.put(`${API}/message-templates/${editingTemplate.id}`, templateData);
        console.log('Respuesta PUT:', response.data);
        toast.success('Plantilla actualizada');
      } else {
        console.log('Creando nueva plantilla en:', `${API}/message-templates`);
        const response = await axios.post(`${API}/message-templates`, templateData);
        console.log('Respuesta POST:', response.data);
        toast.success('Plantilla creada');
      }
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('=== ERROR AL GUARDAR ===');
      console.error('Error completo:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error(`Error al guardar plantilla: ${error.response?.data?.detail || error.message}`);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Plantillas de Mensajes</h1>
            <p className="text-sm text-gray-600 mt-1">Diseña flujos de conversación automatizados</p>
          </div>
          <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
            <Plus size={20} className="mr-2" />
            Nueva Plantilla
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Lista de plantillas */}
        <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto">
          <TemplateList
            templates={messageTemplates}
            onSelect={setSelectedTemplate}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        </div>

        {/* Vista previa */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedTemplate ? (
            <TemplatePreview template={selectedTemplate} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Selecciona una plantilla para ver su vista previa</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <TemplateForm
          template={editingTemplate}
          onSave={handleSave}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default Templates;