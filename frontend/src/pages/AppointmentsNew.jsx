import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, Users, XCircle, ChevronLeft, ChevronRight, Clock, Check, Send, MoreVertical, Plus } from 'lucide-react';
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
    const aptDate = new Date(apt.date);
    return format(aptDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
  });

  const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(new Date());

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Agenda de Citas</h1>
            <p className="text-blue-100">Rubio García DentApp - Sistema de Gestión Dental</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white font-medium">Modo Agenda</span>
            <div className="bg-white rounded-full p-1">
              <div className="bg-blue-600 w-12 h-6 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 mb-1">Total</p>
              <p className="text-4xl font-bold">{stats.total}</p>
            </div>
            <CalendarIcon size={48} className="opacity-30" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-300 to-cyan-400 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 mb-1">Confirmadas</p>
              <p className="text-4xl font-bold">{stats.confirmadas}</p>
            </div>
            <Users size={48} className="opacity-30" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 mb-1">Canceladas</p>
              <p className="text-4xl font-bold">{stats.canceladas}</p>
            </div>
            <XCircle size={48} className="opacity-30" />
          </div>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarIcon className="text-blue-600" size={24} />
          <h2 className="text-xl font-semibold text-slate-800">Navegación de Fechas</h2>
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousDay}
            className="rounded-full"
          >
            <ChevronLeft size={20} />
          </Button>
          
          <div className="flex items-center gap-3 flex-1 justify-center">
            <CalendarIcon size={20} className="text-slate-600" />
            <span className="text-lg font-medium text-slate-800">
              {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextDay}
            className="rounded-full"
          >
            <ChevronRight size={20} />
          </Button>
          
          <Button
            onClick={goToToday}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
          >
            <Clock size={18} className="mr-2" />
            Hoy
          </Button>
        </div>
      </div>

      {/* New Appointment Button */}
      <div className="mb-4 flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-full px-6">
              <Plus size={18} className="mr-2" />
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
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <CalendarIcon size={64} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 text-lg">No hay citas programadas para esta fecha</p>
          </div>
        ) : (
          filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-slate-800">{apt.patient_name}</h3>
                    <span className={`px-4 py-1 rounded-full text-sm font-medium ${
                      apt.status === 'confirmada' ? 'bg-green-100 text-green-700' :
                      apt.status === 'cancelada' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {apt.status === 'confirmada' ? 'Confirmada' :
                       apt.status === 'cancelada' ? 'Cancelada' : 'Planificada'}
                    </span>
                  </div>
                  
                  <p className="text-slate-600 mb-4">{apt.title}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <CalendarIcon size={16} />
                      <span>{format(new Date(apt.date), "d 'oct' yyyy", { locale: es })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock size={16} />
                      <span>{format(new Date(apt.date), 'HH:mm', { locale: es })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Users size={16} />
                      <span>{apt.doctor || 'Sin asignar'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <span>📞</span>
                      <span>{apt.patient_phone}</span>
                    </div>
                  </div>
                  
                  {apt.notes && (
                    <div className="mt-3 text-sm text-slate-600 bg-slate-50 rounded p-2">
                      <span className="font-medium">Nota:</span> {apt.notes}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {apt.status === 'planificada' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleStatusChange(apt.id, 'confirmada')}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      title="Confirmar cita"
                    >
                      <Check size={20} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleSendReminder(apt.id)}
                    className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
                    title="Enviar recordatorio"
                  >
                    <Send size={20} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(apt)}
                    className="text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                    title="Más opciones"
                  >
                    <MoreVertical size={20} />
                  </Button>
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
