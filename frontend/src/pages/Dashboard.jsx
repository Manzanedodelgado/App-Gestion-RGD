import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MessageSquare, Users, Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const statusConfig = {
  planificada: {
    color: 'bg-[#00C1DE]/10 text-[#00C1DE] border-[#00C1DE]',
    label: 'Planificada'
  },
  confirmada: {
    color: 'bg-[#00D6B9]/10 text-[#00D6B9] border-[#00D6B9]',
    label: 'Confirmada'
  }
};

function DashboardContent() {
  const [appointments, setAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [whatsappStatus, setWhatsappStatus] = useState({ ready: false });
  const [priorityConversations, setPriorityConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [appointmentsRes, patientsRes, whatsappRes, conversationsRes] = await Promise.all([
        axios.get(`${API}/appointments`),
        axios.get(`${API}/patients`),
        axios.get(`${API}/whatsapp/status`),
        axios.get(`${API}/conversations`)
      ]);

      setAppointments(appointmentsRes.data);
      setPatients(patientsRes.data);
      setWhatsappStatus(whatsappRes.data);
      
      // Filtrar conversaciones prioritarias (AZUL y AMARILLO)
      const priority = conversationsRes.data.filter(conv => 
        conv.color_code === 'AZUL' || conv.color_code === 'AMARILLO'
      );
      setPriorityConversations(priority);

      const today = format(new Date(), 'yyyy-MM-dd');
      const filtered = appointmentsRes.data.filter(apt => {
        if (!apt.date) return false;
        const aptDate = format(new Date(apt.date), 'yyyy-MM-dd');
        return aptDate === today;
      });
      filtered.sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
      });
      setTodayAppointments(filtered);
    } catch (error) {
      console.error('Error loading data:', error);
      setAppointments([]);
      setTodayAppointments([]);
      setPatients([]);
      setPriorityConversations([]);
    }
    setIsLoading(false);
  };

  const confirmedToday = todayAppointments.filter(a => a.reminder_sent).length;
  const amarilloCount = priorityConversations.filter(c => c.color_code === 'AMARILLO').length;
  const azulCount = priorityConversations.filter(c => c.color_code === 'AZUL').length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="bg-gradient-to-r from-[#2E3192] to-[#0071BC] px-6 py-6 rounded-3xl shadow-xl">
          <h1 className="text-xl font-bold text-white mb-1">Panel de Control</h1>
          <p className="text-xs text-[#9EEDFC]">Rubio García DentApp - Sistema de Gestión Dental</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-[#0071BC] to-[#65C8D0] rounded-xl shadow-md p-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/90 font-medium">Citas de Hoy</p>
              <p className="text-3xl font-bold text-white">{todayAppointments.length}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#65C8D0] to-[#9EEDFC] rounded-xl shadow-md p-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-[#2E3192]" />
            </div>
            <div>
              <p className="text-xs text-[#2E3192] font-medium">Confirmadas</p>
              <p className="text-3xl font-bold text-[#2E3192]">{confirmedToday}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FBBF24] to-[#F59E0B] rounded-xl shadow-md p-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-white font-medium">Urgentes</p>
              <p className="text-3xl font-bold text-white">{amarilloCount}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0000FF] to-[#0071BC] rounded-xl shadow-md p-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-white font-medium">Requieren Atención</p>
              <p className="text-3xl font-bold text-white">{azulCount}</p>
            </div>
          </div>
        </div>

        {/* Cards Principales */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Citas de Hoy */}
          <Card className="bg-white rounded-2xl shadow-lg overflow-hidden border-none">
            <CardHeader className="bg-gradient-to-r from-[#0071BC] to-[#65C8D0] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-white">Citas de Hoy</CardTitle>
                    <p className="text-xs text-white/80 mt-0.5">
                      {format(new Date(), "d 'de' MMMM", { locale: es })} - {format(new Date(), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white">{todayAppointments.length}</div>
              </div>
            </CardHeader>
            <CardContent className="p-4 max-h-[400px] overflow-y-auto">
              {todayAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No hay citas programadas hoy</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {todayAppointments.map((apt) => {
                    const statusInfo = statusConfig.planificada;
                    return (
                      <div key={apt.id} className="flex items-start gap-3 p-3 bg-white border-l-4 border-[#0071BC] rounded-lg hover:shadow transition-shadow">
                        <div className="text-center min-w-[65px] flex-shrink-0">
                          <div className="text-lg font-bold text-white bg-gradient-to-br from-[#2E3192] to-[#0071BC] px-2 py-1.5 rounded-lg">
                            {format(new Date(apt.date), 'HH:mm')}
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1.5">{apt.duration_minutes}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 leading-tight">{apt.patient_name}</h4>
                          <p className="text-xs text-gray-600 mt-0.5">{apt.title}</p>
                          {apt.notes && (
                            <p className="text-[10px] text-gray-500 mt-1 uppercase">{apt.notes}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1 ${statusInfo.color} border rounded-full text-[10px] font-semibold whitespace-nowrap flex-shrink-0`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversaciones Prioritarias */}
          <Card className="bg-white rounded-2xl shadow-lg overflow-hidden border-none">
            <CardHeader className="bg-gradient-to-r from-[#FBBF24] via-[#F59E0B] to-[#0000FF] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-white">Conversaciones Prioritarias</CardTitle>
                    <p className="text-xs text-white/80 mt-0.5">
                      🟡 {amarilloCount} Urgentes • 🔵 {azulCount} Requieren Atención
                    </p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white">{priorityConversations.length}</div>
              </div>
            </CardHeader>
            <CardContent className="p-4 max-h-[400px] overflow-y-auto">
              {priorityConversations.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No hay conversaciones prioritarias pendientes</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {priorityConversations.map((conv) => {
                    const isUrgent = conv.color_code === 'AMARILLO';
                    const borderColor = isUrgent ? 'border-[#FBBF24]' : 'border-[#0071BC]';
                    const textColor = isUrgent ? 'text-[#F59E0B]' : 'text-[#0071BC]';
                    const avatarTextColor = isUrgent ? 'text-yellow-500' : 'text-blue-600';
                    const avatarBorderColor = isUrgent ? 'border-yellow-500' : 'border-blue-600';
                    const dotColor = isUrgent ? 'bg-[#FBBF24]' : 'bg-[#0071BC]';
                    
                    return (
                      <Link
                        key={conv.id}
                        to="/messages"
                        className={`flex items-center gap-3 p-3 bg-white border-l-4 ${borderColor} rounded-lg hover:shadow transition-shadow`}
                      >
                        <div className="relative flex-shrink-0">
                          <div className={`w-12 h-12 bg-white border-2 ${avatarBorderColor} rounded-full flex items-center justify-center`}>
                            <span className={`${avatarTextColor} font-semibold text-base`}>
                              {conv.contact_name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${dotColor} rounded-full border-2 border-white shadow-sm`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 truncate uppercase">{conv.contact_name}</h4>
                          <p className="text-xs text-gray-600 truncate mt-0.5">{conv.last_message}</p>
                          <p className={`text-xs ${textColor} italic truncate mt-1`}>
                            {isUrgent ? 'Urgente' : 'Requiere atención'}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-white rounded-2xl shadow-lg border-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-[#0071BC]" />
                <h3 className="text-base font-semibold text-gray-900">Estadísticas de Citas</h3>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Citas Confirmadas</span>
                  <span className="text-sm font-bold text-[#0071BC]">
                    {todayAppointments.length > 0 ? Math.round((confirmedToday / todayAppointments.length) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-[#0071BC] to-[#65C8D0] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${todayAppointments.length > 0 ? (confirmedToday / todayAppointments.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl shadow-lg border-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-[#8FF38B]" />
                <h3 className="text-base font-semibold text-gray-900">Tiempo de Respuesta</h3>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Menos de 4 horas</span>
                  <span className="text-sm font-bold text-gray-900">0%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-[#8FF38B] h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}