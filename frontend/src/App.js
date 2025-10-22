import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Messages from './pages/Messages';
import Patients from './pages/Patients';
import AppointmentsNew from './pages/AppointmentsNew';
import Templates from './pages/Templates';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/appointments" element={<AppointmentsNew />} />
          <Route path="/templates" element={<div className="p-8"><h1 className="text-3xl font-bold">Plantillas</h1><p className="text-gray-600 mt-2">Próximamente...</p></div>} />
          <Route path="/consents" element={<div className="p-8"><h1 className="text-3xl font-bold">Consentimientos</h1><p className="text-gray-600 mt-2">Próximamente...</p></div>} />
          <Route path="/automations" element={<Automations />} />
          <Route path="/users" element={<div className="p-8"><h1 className="text-3xl font-bold">Usuarios</h1><p className="text-gray-600 mt-2">Próximamente...</p></div>} />
          <Route path="/system" element={<div className="p-8"><h1 className="text-3xl font-bold">Estado del Sistema</h1><p className="text-gray-600 mt-2">Próximamente...</p></div>} />
          <Route path="/docs" element={<div className="p-8"><h1 className="text-3xl font-bold">Documentación</h1><p className="text-gray-600 mt-2">Próximamente...</p></div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;