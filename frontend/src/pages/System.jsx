import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Database, MessageSquare, Zap, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const System = () => {
  const [systemStatus, setSystemStatus] = useState({
    backend: { status: 'checking', uptime: 0 },
    database: { status: 'checking', connected: false },
    whatsapp: { status: 'checking', ready: false },
    automations: { status: 'checking', active: 0 }
  });

  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkSystemStatus = async () => {
    try {
      const [backendRes, dbRes, whatsappRes, autoRes] = await Promise.all([
        axios.get(`${API}/health`).catch(() => ({ data: { status: 'error' } })),
        axios.get(`${API}/database/status`).catch(() => ({ data: { connected: false } })),
        axios.get(`${API}/whatsapp/status`).catch(() => ({ data: { ready: false } })),
        axios.get(`${API}/automations`).catch(() => ({ data: [] }))
      ]);

      setSystemStatus({
        backend: { status: backendRes.data.status === 'ok' ? 'online' : 'error', uptime: backendRes.data.uptime || 0 },
        database: { status: dbRes.data.connected ? 'online' : 'error', connected: dbRes.data.connected },
        whatsapp: { status: whatsappRes.data.ready ? 'online' : 'offline', ready: whatsappRes.data.ready },
        automations: { status: 'online', active: autoRes.data.filter(a => a.active).length }
      });
    } catch (error) {
      console.error('Error checking system:', error);
    }
  };

  const restartService = async (service) => {
    try {
      await axios.post(`${API}/system/restart/${service}`);
      toast.success(`Servicio ${service} reiniciado`);
      setTimeout(checkSystemStatus, 3000);
    } catch (error) {
      toast.error(`Error al reiniciar ${service}`);
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'online') return <CheckCircle className="text-green-500" size={20} />;
    if (status === 'offline') return <AlertCircle className="text-yellow-500" size={20} />;
    return <AlertCircle className="text-red-500" size={20} />;
  };

  const getStatusText = (status) => {
    if (status === 'online') return 'En Línea';
    if (status === 'offline') return 'Desconectado';
    if (status === 'checking') return 'Verificando...';
    return 'Error';
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#283593] to-[#0071BC] rounded-lg p-6 mb-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Estado del Sistema</h1>
            <p className="text-white/80">Monitoreo en tiempo real de los servicios</p>
          </div>
          <Button onClick={checkSystemStatus} className="bg-white text-blue-600 hover:bg-gray-100">
            <RefreshCw size={20} className="mr-2" />
            Actualizar Estado
          </Button>
        </div>
      </div>

      {/* Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Backend API</CardTitle>
            <Activity className="text-blue-600" size={20} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(systemStatus.backend.status)}
              <span className="text-2xl font-bold">{getStatusText(systemStatus.backend.status)}</span>
            </div>
            <p className="text-xs text-gray-500">Uptime: {Math.floor(systemStatus.backend.uptime / 60)}m</p>
            <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => restartService('backend')}>
              Reiniciar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Base de Datos</CardTitle>
            <Database className="text-green-600" size={20} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(systemStatus.database.status)}
              <span className="text-2xl font-bold">{getStatusText(systemStatus.database.status)}</span>
            </div>
            <p className="text-xs text-gray-500">
              {systemStatus.database.connected ? 'Conectada' : 'Desconectada'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">WhatsApp</CardTitle>
            <MessageSquare className="text-green-500" size={20} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(systemStatus.whatsapp.status)}
              <span className="text-2xl font-bold">{getStatusText(systemStatus.whatsapp.status)}</span>
            </div>
            <p className="text-xs text-gray-500">
              {systemStatus.whatsapp.ready ? 'Conectado' : 'Desconectado'}
            </p>
            <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => restartService('whatsapp')}>
              Reiniciar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Automatizaciones</CardTitle>
            <Zap className="text-yellow-500" size={20} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(systemStatus.automations.status)}
              <span className="text-2xl font-bold">{systemStatus.automations.active}</span>
            </div>
            <p className="text-xs text-gray-500">Automatizaciones activas</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
            <div>Sistema iniciado correctamente</div>
            <div>WhatsApp conectado - Rubio García Dental</div>
            <div>Base de datos: test_database conectada</div>
            <div>Sincronización Google Sheets activa</div>
            <div>Sistema de plantillas iniciado</div>
            <div>Esperando eventos...</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default System;
