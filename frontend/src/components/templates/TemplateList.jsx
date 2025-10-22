import React from 'react';
import { FileText, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const TemplateList = ({ templates, onSelect, onEdit, onDelete, isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-4">
        <p className="text-gray-500 text-center">Cargando plantillas...</p>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="p-8 text-center">
        <FileText size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">No hay plantillas creadas</p>
        <p className="text-gray-400 text-sm mt-2">Crea tu primera plantilla para comenzar</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {templates.map((template) => (
        <div
          key={template.id}
          className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => onSelect(template)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
                <p className="text-sm text-gray-500 capitalize">{template.category}</p>
                <p className="text-xs text-gray-400 mt-1">{template.steps?.length || 0} pasos</p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(template); }}>
                  <Edit size={16} className="mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDelete(template.id); }}
                  className="text-red-600"
                >
                  <Trash2 size={16} className="mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TemplateList;