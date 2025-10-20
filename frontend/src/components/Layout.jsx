import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Calendar,
  FileText,
  Zap,
  Bot,
  Users2,
  FileSignature,
  HeartPulse,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  BookText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// --- Sidebar Component ---
function Sidebar({ isMobile, isOpen, setIsOpen, navItems, userName, onLogout, location }) {
  const brandName = 'Rubio García Dental';
  const appName = 'DentApp';
  const userRole = 'Administrador';

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col bg-gradient-to-b from-[#2E3192] to-[#0071BC] text-white shadow-lg transition-all duration-300 ease-in-out',
        isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0',
        'custom-scrollbar'
      )}
    >
      {/* Sidebar Header/Logo */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-2 shadow-lg relative">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e4584a4b0ee8a4f61b7f2e/609880e58_IMG_0203.jpeg"
              alt="Logo"
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#65C8D0] rounded-b-2xl"></div>
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-base">{brandName}</p>
            <p className="text-[#9EEDFC] text-xs font-semibold">{appName}</p>
          </div>
        </div>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/10 ml-auto"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Cerrar menú</span>
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => isMobile && setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? '!bg-[#65C8D0] !text-white hover:!bg-[#65C8D0] shadow-lg font-bold'
                    : '!bg-white/10 !text-white hover:!bg-white/20 hover:!text-white'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="space-y-3">
          <div>
            <p className="text-white/70 text-xs font-semibold mb-2">Sesión Activa</p>
            <div className="flex items-center gap-3 bg-white/10 rounded-xl px-3 py-2">
              <div className="w-9 h-9 rounded-full bg-[#65C8D0] flex items-center justify-center text-white font-bold text-sm shadow-md">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">{userName}</p>
                <p className="text-white/70 text-xs">{userRole}</p>
              </div>
            </div>
          </div>

          <Button
            onClick={onLogout}
            variant="ghost"
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl px-3 py-2 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-semibold">Cerrar Sesión</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}

// --- Header Component ---
function Header({ onMenuClick, userName, onLogout }) {
  const brandName = 'Rubio García';
  const appName = 'DentApp';

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-gradient-to-r from-[#2E3192] to-[#0071BC] px-4 shadow-sm md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="text-white hover:bg-white/10"
        onClick={onMenuClick}
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>
      <Link to="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-white">
        <span>{brandName} <span className="text-[#9EEDFC]">{appName}</span></span>
      </Link>
      <div className="ml-auto flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10 rounded-full focus-visible:ring-offset-0 focus-visible:ring-transparent">
              <UserIcon className="h-6 w-6" />
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground">Administrador</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// --- MainContent Component ---
function MainContent({ children }) {
  return (
    <main className="flex-1 bg-gradient-to-br from-gray-50 to-blue-50 overflow-y-auto">
      {children}
    </main>
  );
}

// --- Main Layout Component ---
export default function Layout({ children }) {
  const location = useLocation();
  const [userName, setUserName] = useState('Juan Antonio Manzanedo Delgado');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    console.log('Logout clicked');
  };

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/messages', icon: MessageSquare, label: 'Mensajes' },
    { href: '/patients', icon: Users, label: 'Pacientes' },
    { href: '/appointments', icon: Calendar, label: 'Citas' },
    { href: '/templates', icon: FileText, label: 'Plantillas' },
    { href: '/consents', icon: FileSignature, label: 'Consentimientos' },
    { href: '/automations', icon: Bot, label: 'Automatizaciones' },
    { href: '/users', icon: Users2, label: 'Usuarios' },
    { href: '/system', icon: HeartPulse, label: 'Estado Sistema' },
    { href: '/docs', icon: BookText, label: 'Documentación' },
  ];

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.4);
        }
      `}</style>
      <div className="flex h-screen bg-gray-50 antialiased overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar
            isMobile={false}
            isOpen={true}
            setIsOpen={() => {}}
            navItems={navItems}
            userName={userName}
            onLogout={handleLogout}
            location={location}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
        )}

        {/* Mobile Sidebar */}
        <Sidebar
          isMobile={true}
          isOpen={mobileMenuOpen}
          setIsOpen={setMobileMenuOpen}
          navItems={navItems}
          userName={userName}
          onLogout={handleLogout}
          location={location}
        />

        {/* Main content area */}
        <div className="flex flex-1 flex-col md:ml-64 min-w-0">
          <Header
            onMenuClick={() => setMobileMenuOpen(true)}
            userName={userName}
            onLogout={handleLogout}
          />
          <MainContent>
            {children}
          </MainContent>
        </div>
        <Toaster />
      </div>
    </>
  );
}