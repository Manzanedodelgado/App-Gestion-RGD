import React from 'react';
import { MessageSquare } from 'lucide-react';

const TemplatePreview = ({ template }) => {
  if (!template) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{template.name}</h2>
          <p className="text-sm text-gray-500 capitalize mt-1">Categoría: {template.category}</p>
        </div>

        <div className="space-y-4">
          {template.steps?.map((step, index) => (
            <div key={step.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <span className="text-sm font-semibold text-gray-700">Paso {index + 1}</span>
              </div>

              <div className="bg-white rounded-lg p-3 mb-3">
                <MessageSquare size={16} className="text-gray-400 mb-2" />
                <p className="text-gray-700 whitespace-pre-wrap">{step.content}</p>
              </div>

              {step.attachments && step.attachments.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-2">Archivos adjuntos:</p>
                  <div className="space-y-1">
                    {step.attachments.map((attachment, idx) => (
                      <div key={idx} className="text-xs text-blue-600">
                        📎 {attachment.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step.buttons && step.buttons.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Botones:</p>
                  <div className="flex flex-wrap gap-2">
                    {step.buttons.map((button) => (
                      <div
                        key={button.id}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm"
                      >
                        {button.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;