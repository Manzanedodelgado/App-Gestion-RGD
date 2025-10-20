import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, Users, XCircle, ChevronLeft, ChevronRight, Clock, Check, Send, MoreVertical, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AppointmentsNew = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({ total: 0, confirmadas: 0, canceladas: 0 });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isConfirmationMode, setIsConfirmationMode] = useState(false);
  const [selectedAppointments, setSelectedAppointments] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('recordatorio_cita');
  const [formData, setFormData] = useState({
    patient_id: '',
    title: '',
    date: '',
    duration_minutes: 60,
    notes: '',
    status: 'planificada',
    doctor: '',
    reminder_enabled: false,
    reminder_minutes_before: 60
  });

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    fetchStats();
  }, [selectedDate]);

  // Sincronizar al cargar la página por primera vez
  useEffect(() => {
    const syncOnLoad = async () => {
      try {
        console.log('🔄 Sincronizando citas al cargar la página...');
        await axios.post(`${API}/appointments/sync-google-sheets`);
        console.log('✅ Sincronización inicial completada');
        fetchAppointments();
        fetchStats();
      } catch (error) {
        console.error('Error en sincronización inicial:', error);
      }
    };
    
    syncOnLoad();
  }, []); // Solo se ejecuta una vez al montar el componente

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${API}/appointments`);
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Error al cargar citas');
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await axios.get(`${API}/patients`);
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/appointments/stats/summary`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({ total: 0, confirmadas: 0, canceladas: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingAppointment) {
        await axios.put(`${API}/appointments/${editingAppointment.id}`, formData);
        toast.success('Cita actualizada');
      } else {
        await axios.post(`${API}/appointments`, formData);
        toast.success('Cita creada');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAppointments();
      fetchStats();
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast.error('Error al guardar cita');
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await axios.patch(`${API}/appointments/${appointmentId}/status?status=${newStatus}`);
      toast.success(`Cita ${newStatus}`);
      fetchAppointments();
      fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar estado');
    }
  };

  const handleSendReminder = async (appointmentId) => {
    try {
      await axios.post(`${API}/appointments/${appointmentId}/send-reminder`);
      toast.success('Recordatorio enviado');
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error('Error al enviar recordatorio');
    }
  };

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      patient_id: appointment.patient_id,
      title: appointment.title,
      date: new Date(appointment.date).toISOString().slice(0, 16),
      duration_minutes: appointment.duration_minutes,
      notes: appointment.notes || '',
      status: appointment.status || 'planificada',
      doctor: appointment.doctor || '',
      reminder_enabled: appointment.reminder_enabled,
      reminder_minutes_before: appointment.reminder_minutes_before
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta cita?')) return;

    try {
      await axios.delete(`${API}/appointments/${id}`);
      toast.success('Cita eliminada');
      fetchAppointments();
      fetchStats();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Error al eliminar cita');
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: '',
      title: '',
      date: '',
      duration_minutes: 60,
      notes: '',
      status: 'planificada',
      doctor: '',
      reminder_enabled: false,
      reminder_minutes_before: 60
    });
    setEditingAppointment(null);
  };

  const filteredAppointments = appointments.filter((apt) => {
    // Usar el campo 'fecha' del Google Sheet, no 'date'
    if (!apt.fecha) return false;
    
    // Convertir la fecha del appointment al formato yyyy-MM-dd
    let aptDateStr = apt.fecha;
    if (aptDateStr.includes('/')) {
      // Si viene en formato dd/mm/yyyy, convertir a yyyy-MM-dd
      const parts = aptDateStr.split('/');
      if (parts.length === 3) {
        aptDateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    return aptDateStr === selectedDateStr;
  });

  const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(new Date());

  const handleSelectAppointment = (aptId) => {
    setSelectedAppointments(prev => 
      prev.includes(aptId) ? prev.filter(id => id !== aptId) : [...prev, aptId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAppointments.length === filteredAppointments.length) {
      setSelectedAppointments([]);
    } else {
      setSelectedAppointments(filteredAppointments.map(apt => apt.id));
    }
  };

  const handleSendConfirmations = async () => {
    if (selectedAppointments.length === 0) {
      toast.error('Selecciona al menos una cita');
      return;
    }

    try {
      for (const aptId of selectedAppointments) {
        await axios.post(`${API}/appointments/${aptId}/send-reminder`);
      }
      toast.success(`${selectedAppointments.length} confirmaciones enviadas`);
      setSelectedAppointments([]);
    } catch (error) {
      console.error('Error sending confirmations:', error);
      toast.error('Error al enviar confirmaciones');
    }
  };

  const handleSyncGoogleSheets = async () => {
    setIsSyncing(true);
    try {
      const response = await axios.post(`${API}/appointments/sync-google-sheets`);
      toast.success(
        `Sincronización completada: ${response.data.appointments_synced} citas, ${response.data.patients_synced} pacientes nuevos`
      );
      setLastSyncTime(new Date());
      fetchAppointments();
      fetchStats();
    } catch (error) {
      console.error('Error syncing:', error);
      toast.error('Error al sincronizar con Google Sheets');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
      {/* Header - Reducido 25% */}
      <div className="rounded-xl shadow-lg p-4 mb-4 bg-gradient-to-r from-[#2E3192] to-[#0071BC]">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-white mb-1">Agenda de Citas</h1>
            <p className="text-xs text-[#2E3192] opacity-80">Rubio García DentApp - Sistema de Gestión Dental</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white text-xs font-medium">{isConfirmationMode ? 'Modo Confirmaciones' : 'Modo Agenda'}</span>
            <Switch
              checked={isConfirmationMode}
              onCheckedChange={setIsConfirmationMode}
              className="data-[state=checked]:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Statistics Cards - Reducidas 50% */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 space-y-0">
        <div className="rounded-lg p-3 text-white shadow-lg bg-gradient-to-br from-[#0071BC] to-[#65C8D0]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-xs mb-0.5">Total</p>
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
            </div>
            <div className="w-6 h-6 flex items-center justify-center">
              <CalendarIcon size={24} className="opacity-30" />
            </div>
          </div>
        </div>
        
        <div className="rounded-lg p-3 text-white shadow-lg bg-gradient-to-br from-[#0000FF] to-[#0071BC]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-xs mb-0.5">Confirmadas</p>
              <p className="text-2xl font-bold">{stats?.confirmadas || 0}</p>
            </div>
            <div className="w-6 h-6 flex items-center justify-center">
              <Users size={24} className="opacity-30" />
            </div>
          </div>
        </div>
        
        <div className="rounded-lg p-3 text-white shadow-lg bg-gradient-to-br from-[#FBBF24] to-[#F59E0B]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-xs mb-0.5">Canceladas</p>
              <p className="text-2xl font-bold">{stats?.canceladas || 0}</p>
            </div>
            <div className="w-6 h-6 flex items-center justify-center">
              <XCircle size={24} className="opacity-30" />
            </div>
          </div>
        </div>
      </div>

      {/* Date Navigation - Reducido 25% */}
      <div className="rounded-lg shadow-md p-4 mt-4 mb-4 bg-gradient-to-br from-[#0071BC] to-[#65C8D0]">
        <div className="flex items-center gap-1.5 mb-3">
          <CalendarIcon className="text-white" size={18} />
          <h2 className="text-base font-bold text-white">Navegación de Fechas</h2>
        </div>
        
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousDay}
            className="h-8 w-8 rounded-full bg-white border-0 hover:bg-gray-100"
          >
            <ChevronLeft size={16} className="text-gray-700" />
          </Button>
          
          <div className="flex items-center gap-2 h-8 w-54 bg-white rounded-lg px-3 justify-center">
            <CalendarIcon size={14} className="text-gray-700" />
            <span className="text-xs font-medium text-gray-700">
              {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextDay}
            className="h-8 w-8 rounded-full bg-white border-0 hover:bg-gray-100"
          >
            <ChevronRight size={16} className="text-gray-700" />
          </Button>
          
          <Button
            onClick={goToToday}
            className="h-8 text-white rounded-full px-4 text-xs font-medium border-0 bg-[#2E3192] hover:bg-[#0071BC]"
          >
            <Clock size={14} className="mr-1.5" />
            Hoy
          </Button>
        </div>
      </div>

      {/* Confirmation Mode Controls */}
      {isConfirmationMode && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedAppointments.length === filteredAppointments.length && filteredAppointments.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                Seleccionar todo ({selectedAppointments.length} seleccionadas)
              </label>
              
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="w-64 h-8 text-xs">
                  <SelectValue placeholder="Plantilla" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recordatorio_cita">Recordatorio de Cita</SelectItem>
                  <SelectItem value="confirmacion_cita">Confirmación de Cita</SelectItem>
                  <SelectItem value="cancelacion_cita">Cancelación de Cita</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              onClick={handleSendConfirmations}
              disabled={selectedAppointments.length === 0}
              className="h-8 text-white text-xs font-bold rounded-lg border-0"
              style={{ background: 'linear-gradient(to right, #0071BC, #65C8D0)' }}
            >
              <Send size={14} className="mr-1.5" />
              Enviar ({selectedAppointments.length})
            </Button>
          </div>
        </div>
      )}

      {/* Action Buttons - Reducido 25% */}
      <div className="mb-3 flex justify-between items-center">
        <div className="text-xs text-gray-600">
          {lastSyncTime ? (
            <span>Última sincronización: {format(lastSyncTime, "HH:mm:ss")}</span>
          ) : (
            <span>🔄 Sincronización automática cada 5 minutos</span>
          )}
        </div>
        
        <div className="flex gap-2">
          {!isConfirmationMode && (
            <>
              <Button 
                onClick={handleSyncGoogleSheets}
                disabled={isSyncing}
                className="h-8 text-white text-xs rounded-full px-4 border-0 bg-[#0071BC] hover:bg-[#2E3192]"
              >
                <RefreshCw size={14} className={`mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
              </Button>
              
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="h-8 text-white text-xs rounded-full px-4 border-0 bg-[#65C8D0] hover:bg-[#9EEDFC]">
                    <Plus size={14} className="mr-1.5" />
                    Nueva Cita
                  </Button>
                </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingAppointment ? 'Editar Cita' : 'Nueva Cita'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="patient">Paciente *</Label>
                  <Select
                    value={formData.patient_id}
                    onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name} - {patient.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="title">Título de la cita *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Ej: Limpieza dental"
                  />
                </div>
                <div>
                  <Label htmlFor="date">Fecha y Hora *</Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duración (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    min="15"
                    step="15"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="doctor">Doctor</Label>
                  <Input
                    id="doctor"
                    value={formData.doctor}
                    onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                    placeholder="Ej: Dra. Virginia Tresgallo"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">Notas</Label>
                  <textarea
                    id="notes"
                    className="w-full min-h-[60px] px-3 py-2 border rounded-md"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label>Recordatorio automático</Label>
                    <p className="text-sm text-slate-600">Enviar recordatorio por WhatsApp</p>
                  </div>
                  <Switch
                    checked={formData.reminder_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, reminder_enabled: checked })}
                  />
                </div>

                {formData.reminder_enabled && (
                  <div>
                    <Label htmlFor="reminder_time">Enviar recordatorio antes de:</Label>
                    <Select
                      value={formData.reminder_minutes_before.toString()}
                      onValueChange={(value) => setFormData({ ...formData, reminder_minutes_before: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                        <SelectItem value="120">2 horas</SelectItem>
                        <SelectItem value="1440">1 día</SelectItem>
                        <SelectItem value="2880">2 días</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingAppointment ? 'Actualizar' : 'Guardar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <CalendarIcon size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">No hay citas programadas para esta fecha</p>
          </div>
        ) : (
          filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow border-l-4"
              style={{ 
                borderLeftColor: apt.estado_cita === 'confirmada' || apt.estado_cita === 'finalizada' ? '#0071BC' :
                                 apt.estado_cita === 'cancelada' ? '#FBBF24' :
                                 apt.estado_cita === 'anulada' ? '#F59E0B' : '#0000FF'
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                {isConfirmationMode && (
                  <input
                    type="checkbox"
                    checked={selectedAppointments.includes(apt.id)}
                    onChange={() => handleSelectAppointment(apt.id)}
                    className="w-5 h-5 text-blue-600 rounded mt-1"
                  />
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900">{apt.nombre} {apt.apellidos}</h3>
                  <p className="text-sm text-gray-600 mt-1">{apt.tratamiento || apt.title}</p>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold text-white ml-3`}
                  style={{ 
                    background: apt.estado_cita === 'confirmada' || apt.estado_cita === 'finalizada' ? 
                      'linear-gradient(to right, #0071BC, #65C8D0)' :
                      apt.estado_cita === 'cancelada' || apt.estado_cita === 'anulada' ? 
                      'linear-gradient(to right, #FBBF24, #F59E0B)' :
                      'linear-gradient(to right, #0000FF, #0071BC)'
                  }}>
                  {apt.estado_cita === 'confirmada' ? 'Confirmada' :
                   apt.estado_cita === 'cancelada' ? 'Cancelada' :
                   apt.estado_cita === 'anulada' ? 'Anulada' :
                   apt.estado_cita === 'finalizada' ? 'Finalizada' : 'Planificada'}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-700 mb-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon size={14} style={{ color: '#0071BC' }} />
                  <span className="font-medium">{apt.fecha}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} style={{ color: '#0071BC' }} />
                  <span className="font-medium">{apt.hora}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} style={{ color: '#0071BC' }} />
                  <span className="font-medium">{apt.odontologo || apt.doctor || 'Sin asignar'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📞</span>
                  <span className="font-medium">{apt.tel_movil || apt.patient_phone}</span>
                </div>
              </div>

              {(apt.notas || apt.notes) && (
                <div className="mt-3 text-sm rounded-lg p-3 border-l-4" style={{ 
                  backgroundColor: '#F3F4F6',
                  borderLeftColor: '#FCD34D',
                  color: '#4B5563'
                }}>
                  <span className="font-bold" style={{ color: '#F59E0B' }}>📝 Nota:</span> {apt.notas || apt.notes}
                </div>
              )}

              <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                {(apt.estado_cita === 'planificada' || apt.status === 'planificada') && (
                  <Button
                    onClick={() => handleStatusChange(apt.id, 'confirmada')}
                    className="h-8 text-white text-xs font-bold rounded-lg border-0"
                    style={{ background: 'linear-gradient(to right, #0071BC, #65C8D0)' }}
                  >
                    <Check size={14} className="mr-1" />
                    Confirmar
                  </Button>
                )}
                <Button
                  onClick={() => handleSendReminder(apt.id)}
                  variant="outline"
                  className="h-8 text-xs font-bold rounded-lg"
                  style={{ borderColor: '#0071BC', color: '#0071BC' }}
                >
                  <Send size={14} className="mr-1" />
                  Recordatorio
                </Button>
                <Button
                  onClick={() => handleEdit(apt)}
                  variant="outline"
                  className="h-8 w-8 rounded-lg p-0"
                  style={{ borderColor: '#6B7280', color: '#6B7280' }}
                >
                  <MoreVertical size={14} />
                </Button>
              </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AppointmentsNew;
