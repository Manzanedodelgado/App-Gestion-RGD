import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Users, Calendar, FileText, FileCheck, Zap, User, Activity, BookOpen, LogOut } from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/messages', icon: MessageSquare, label: 'Mensajes' },
    { path: '/patients', icon: Users, label: 'Pacientes' },
    { path: '/appointments', icon: Calendar, label: 'Citas' },
    { path: '/templates', icon: FileText, label: 'Plantillas' },
    { path: '/consents', icon: FileCheck, label: 'Consentimientos' },
    { path: '/automations', icon: Zap, label: 'Automatizaciones' },
    { path: '/users', icon: User, label: 'Usuarios' },
    { path: '/system', icon: Activity, label: 'Estado Sistema' },
    { path: '/docs', icon: BookOpen, label: 'Documentación' },
  ];

  return (
    <aside className="sidebar" data-testid="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-placeholder">R</div>
        </div>
        <h1 className="sidebar-title">Rubio García Dental</h1>
        <p className="sidebar-subtitle">DentApp</p>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
            data-testid={`nav-${item.label.toLowerCase()}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-session">
          <p className="text-xs text-slate-400 mb-2">Sesión Activa</p>
          <div className="flex items-center gap-3 p-3 bg-blue-700/30 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold">
              J
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Juan Antonio</p>
              <p className="text-xs text-slate-400">Manzanedo Delgado</p>
              <p className="text-xs text-slate-500">Administrador</p>
            </div>
          </div>
          <button className="sidebar-logout" data-testid="logout-btn">
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;