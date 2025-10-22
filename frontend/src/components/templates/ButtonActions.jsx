import React, { useState } from 'react';
import { Plus, X, MessageSquare, RefreshCw, PlayCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const ButtonActions = ({ button, onChange }) => {
  const [actions, setActions] = useState(button.actions || []);

  const handleAddAction = () => {
    const newAction = {
      id: `action-${Date.now()}`,
      type: 'send_message',
      value: ''
    };
    const updatedActions = [...actions, newAction];
    setActions(updatedActions);
    onChange({ ...button, actions: updatedActions });
  };

  const handleRemoveAction = (actionId) => {
    const updatedActions = actions.filter(a => a.id !== actionId);
    setActions(updatedActions);
    onChange({ ...button, actions: updatedActions });
  };

  const handleActionChange = (actionId, field, value) => {
    const updatedActions = actions.map(a =>
      a.id === actionId ? { ...a, [field]: value } : a
    );
    setActions(updatedActions);
    onChange({ ...button, actions: updatedActions });
  };

  const getActionIcon = (type) => {
    switch (type) {
      case 'send_message': return <MessageSquare size={16} />;
      case 'update_appointment_status': return <RefreshCw size={16} />;
      case 'start_flow': return <PlayCircle size={16} />;
      case 'send_consent': return <FileText size={16} />;
      default: return null;
    }
  };

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <Label className="text-sm font-semibold">Acciones del Botón: "{button.text}"</Label>
        <Button
          type="button"
          onClick={handleAddAction}
          size="sm"
          variant="outline"
          className="h-7"
        >
          <Plus size={14} className="mr-1" />
          Acción
        </Button>
      </div>

      {actions.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-2">
          No hay acciones configuradas. Agrega al menos una acción.
        </p>
      ) : (
        <div className="space-y-3">
          {actions.map((action, index) => (
            <div key={action.id} className="bg-white p-3 rounded border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getActionIcon(action.type)}
                  <span className="text-xs font-semibold text-gray-700">Acción {index + 1}</span>
                </div>
                <Button
                  type="button"
                  onClick={() => handleRemoveAction(action.id)}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-600"
                >
                  <X size={14} />
                </Button>
              </div>

              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Tipo de Acción</Label>
                  <Select
                    value={action.type}
                    onValueChange={(value) => handleActionChange(action.id, 'type', value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="send_message">Enviar Mensaje</SelectItem>
                      <SelectItem value="update_appointment_status">Actualizar Estado Cita</SelectItem>
                      <SelectItem value="start_flow">Iniciar Otro Flujo</SelectItem>
                      <SelectItem value="send_consent">Enviar Consentimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {action.type === 'send_message' && (
                  <div>
                    <Label className="text-xs">Mensaje a Enviar</Label>
                    <Textarea
                      value={action.value || ''}
                      onChange={(e) => handleActionChange(action.id, 'value', e.target.value)}
                      placeholder="Escribe el mensaje de respuesta..."
                      rows={2}
                      className="text-xs"
                    />
                  </div>
                )}

                {action.type === 'update_appointment_status' && (
                  <div>
                    <Label className="text-xs">Nuevo Estado</Label>
                    <Select
                      value={action.status || ''}
                      onValueChange={(value) => handleActionChange(action.id, 'status', value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Selecciona estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmada">Confirmada</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                        <SelectItem value="completada">Completada</SelectItem>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {action.type === 'start_flow' && (
                  <div>
                    <Label className="text-xs">ID del Flujo</Label>
                    <Input
                      value={action.flow_id || ''}
                      onChange={(e) => handleActionChange(action.id, 'flow_id', e.target.value)}
                      placeholder="ID de la plantilla a iniciar"
                      className="h-8 text-xs"
                    />
                  </div>
                )}

                {action.type === 'send_consent' && (
                  <div>
                    <Label className="text-xs">ID del Consentimiento</Label>
                    <Input
                      value={action.consent_id || ''}
                      onChange={(e) => handleActionChange(action.id, 'consent_id', e.target.value)}
                      placeholder="ID de la plantilla de consentimiento"
                      className="h-8 text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ButtonActions;
