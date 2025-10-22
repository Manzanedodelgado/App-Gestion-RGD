import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import ButtonActions from '@/components/templates/ButtonActions';

const TemplateForm = ({ template, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'confirmacion',
    steps: []
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        category: template.category || 'confirmacion',
        steps: template.steps || []
      });
    }
  }, [template]);

  const handleAddStep = () => {
    const newStep = {
      id: `step-${Date.now()}`,
      order: formData.steps.length,
      content: '',
      attachments: [],
      buttons: []
    };
    setFormData({
      ...formData,
      steps: [...formData.steps, newStep]
    });
  };

  const handleRemoveStep = (stepId) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter(s => s.id !== stepId)
    });
  };

  const handleStepChange = (stepId, field, value) => {
    setFormData({
      ...formData,
      steps: formData.steps.map(s =>
        s.id === stepId ? { ...s, [field]: value } : s
      )
    });
  };

  const handleAddButton = (stepId) => {
    const newButton = {
      id: `btn-${Date.now()}`,
      text: '',
      actions: []
    };
    setFormData({
      ...formData,
      steps: formData.steps.map(s =>
        s.id === stepId ? { ...s, buttons: [...(s.buttons || []), newButton] } : s
      )
    });
  };

  const handleRemoveButton = (stepId, buttonId) => {
    setFormData({
      ...formData,
      steps: formData.steps.map(s =>
        s.id === stepId ? { ...s, buttons: s.buttons.filter(b => b.id !== buttonId) } : s
      )
    });
  };

  const handleButtonChange = (stepId, buttonId, updatedButton) => {
    setFormData({
      ...formData,
      steps: formData.steps.map(s =>
        s.id === stepId
          ? {
              ...s,
              buttons: s.buttons.map(b =>
                b.id === buttonId ? updatedButton : b
              )
            }
          : s
      )
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Por favor ingresa un nombre para la plantilla');
      return;
    }
    if (formData.steps.length === 0) {
      alert('Agrega al menos un paso a la plantilla');
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Editar Plantilla' : 'Nueva Plantilla'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información General */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre de la Plantilla</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Recordatorio 24h"
              />
            </div>

            <div>
              <Label htmlFor="category">Categoría</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmacion">Confirmación</SelectItem>
                  <SelectItem value="consentimiento">Consentimiento</SelectItem>
                  <SelectItem value="recordatorio">Recordatorio</SelectItem>
                  <SelectItem value="seguimiento">Seguimiento</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pasos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Pasos del Flujo</Label>
              <Button type="button" onClick={handleAddStep} size="sm" variant="outline">
                <Plus size={16} className="mr-2" />
                Agregar Paso
              </Button>
            </div>

            {formData.steps.map((step, index) => (
              <div key={step.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Paso {index + 1}</span>
                  <Button
                    type="button"
                    onClick={() => handleRemoveStep(step.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-600"
                  >
                    <X size={16} />
                  </Button>
                </div>

                <div>
                  <Label>Contenido del Mensaje</Label>
                  <Textarea
                    value={step.content}
                    onChange={(e) => handleStepChange(step.id, 'content', e.target.value)}
                    placeholder="Escribe el mensaje... Puedes usar {{nombre}}, {{fecha}}, {{hora}}"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Variables disponibles: {`{{nombre}} {{fecha}} {{hora}} {{doctor}}`}
                  </p>
                </div>

                {/* Botones */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Botones Interactivos</Label>
                    <Button
                      type="button"
                      onClick={() => handleAddButton(step.id)}
                      size="sm"
                      variant="outline"
                    >
                      <Plus size={14} className="mr-1" />
                      Botón
                    </Button>
                  </div>

                  {step.buttons && step.buttons.length > 0 && (
                    <div className="space-y-3">
                      {step.buttons.map((button) => (
                        <div key={button.id} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={button.text}
                              onChange={(e) => handleButtonChange(step.id, button.id, { ...button, text: e.target.value })}
                              placeholder="Texto del botón (ej: Confirmar, Cancelar)"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              onClick={() => handleRemoveButton(step.id, button.id)}
                              size="sm"
                              variant="ghost"
                              className="text-red-600"
                            >
                              <X size={14} />
                            </Button>
                          </div>
                          
                          {/* Acciones del botón */}
                          <ButtonActions
                            button={button}
                            onChange={(updatedButton) => handleButtonChange(step.id, button.id, updatedButton)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {template ? 'Actualizar' : 'Crear'} Plantilla
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateForm;
