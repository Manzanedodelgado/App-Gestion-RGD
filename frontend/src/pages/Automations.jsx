import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, MessageSquare, FileText, Brain, Clock, Book } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Automations = () => {
  const [activeTab, setActiveTab] = useState('flows'); // flows, consents, ai
  const [messageFlows, setMessageFlows] = useState([]);
  const [consentTemplates, setConsentTemplates] = useState([]);
  const [aiConfig, setAIConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [flowsRes, templatesRes, aiRes] = await Promise.all([
        axios.get(`${API}/message-flows`),
        axios.get(`${API}/consent-templates`),
        axios.get(`${API}/ai-config`)
      ]);
      
      setMessageFlows(flowsRes.data);
      setConsentTemplates(templatesRes.data);
      setAIConfig(aiRes.data);
    } catch (error) {
      console.error('Error loading automation data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 mb-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Sistema de Automatizaciones</h1>
            <p className="text-indigo-100">Gestiona flujos de mensajes, consentimientos y asistente IA</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <Brain className="w-12 h-12 text-white" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 bg-white rounded-xl p-2 shadow-md">
        <button
          onClick={() => setActiveTab('flows')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'flows'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare size={20} />
          Flujos de Mensajes
        </button>
        <button
          onClick={() => setActiveTab('consents')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'consents'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText size={20} />
          Consentimientos
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'ai'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Brain size={20} />
          Entrenamiento IA
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {activeTab === 'flows' && <MessageFlowsTab flows={messageFlows} onReload={loadData} />}
          {activeTab === 'consents' && <ConsentsTab templates={consentTemplates} onReload={loadData} />}
          {activeTab === 'ai' && <AITrainingTab config={aiConfig} onReload={loadData} />}
        </>
      )}
    </div>
  );
};

// Message Flows Tab
const MessageFlowsTab = ({ flows, onReload }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Flujos de Mensajes (Plantillas)</h2>
        <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
          <Plus className="mr-2" size={18} />
          Nuevo Flujo
        </Button>
      </div>

      <div className="grid gap-4">
        {flows.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="mx-auto mb-4 text-slate-400" size={48} />
            <p className="text-slate-600">No hay flujos de mensajes creados</p>
            <p className="text-slate-400 text-sm mt-2">Crea tu primer flujo para automatizar mensajes</p>
          </Card>
        ) : (
          flows.map(flow => (
            <Card key={flow.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{flow.name}</h3>
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {flow.category}
                  </span>
                  <p className="text-slate-600 mt-2">{flow.steps?.length || 0} paso(s)</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Editar</Button>
                  <Button variant="outline" size="sm" className="text-red-600">Eliminar</Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

// Consents Tab
const ConsentsTab = ({ templates, onReload }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Gestión de Consentimientos Informados</h2>
        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
          <Plus className="mr-2" size={18} />
          Nueva Plantilla
        </Button>
      </div>

      <div className="grid gap-4">
        {templates.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="mx-auto mb-4 text-slate-400" size={48} />
            <p className="text-slate-600">No hay plantillas de consentimiento creadas</p>
            <p className="text-slate-400 text-sm mt-2">Crea plantillas para diferentes tratamientos</p>
          </Card>
        ) : (
          templates.map(template => (
            <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{template.treatment_name}</h3>
                  <code className="inline-block mt-2 px-3 py-1 bg-slate-100 text-slate-700 rounded text-sm font-mono">
                    {template.code}
                  </code>
                  <p className="text-slate-600 mt-2">{template.title}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Editar</Button>
                  <Button variant="outline" size="sm" className="text-red-600">Eliminar</Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

// AI Training Tab
const AITrainingTab = ({ config, onReload }) => {
  const [aiActive, setAIActive] = useState(config?.ai_active || false);
  const [autoResponse, setAutoResponse] = useState(config?.auto_response || false);

  const updateAIConfig = async (updates) => {
    try {
      await axios.put(`${API}/ai-config`, { ...config, ...updates });
      onReload();
    } catch (error) {
      console.error('Error updating AI config:', error);
    }
  };

  return (
    <div>
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-6 mb-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Entrenamiento de IA</h2>
            <p className="text-emerald-100">Configura y entrena tu asistente virtual inteligente</p>
          </div>
          <Button className="bg-white text-emerald-600 hover:bg-emerald-50">
            <Brain className="mr-2" size={18} />
            Probar IA
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm mb-1">Estado IA</p>
              <p className="text-2xl font-bold text-slate-800">{aiActive ? 'Activa' : 'Inactiva'}</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${aiActive ? 'bg-green-500' : 'bg-slate-300'}`} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm mb-1">Auto-Respuesta</p>
              <p className="text-2xl font-bold text-slate-800">{autoResponse ? 'Activa' : 'Inactiva'}</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${autoResponse ? 'bg-green-500' : 'bg-slate-300'}`} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm mb-1">Conocimiento</p>
              <p className="text-2xl font-bold text-slate-800">{config?.knowledge_topics?.length || 0} temas</p>
            </div>
            <Book className="text-slate-400" size={24} />
          </div>
        </Card>
      </div>

      {/* Configuration */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Configuración General</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-800">Activar IA</p>
              <p className="text-sm text-slate-600">Habilitar el asistente virtual</p>
            </div>
            <Switch
              checked={aiActive}
              onCheckedChange={(checked) => {
                setAIActive(checked);
                updateAIConfig({ ai_active: checked });
              }}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-800">Auto-Respuesta</p>
              <p className="text-sm text-slate-600">Responder automáticamente los mensajes</p>
            </div>
            <Switch
              checked={autoResponse}
              onCheckedChange={(checked) => {
                setAutoResponse(checked);
                updateAIConfig({ auto_response: checked });
              }}
            />
          </div>
        </div>
      </Card>

      {/* Personality */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Personalidad del Asistente</h3>
        <p className="text-slate-600 mb-4">Define cómo debe comportarse y comunicarse el asistente</p>
        <textarea
          className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          rows={4}
          defaultValue={config?.personality || ''}
          placeholder="Ej: Soy el asistente virtual de Rubio García Dental..."
        />
        <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
          Actualizar Personalidad
        </Button>
      </Card>
    </div>
  );
};

export default Automations;
