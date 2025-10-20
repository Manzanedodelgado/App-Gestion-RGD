import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Search, Edit, Trash2, Calendar as CalendarIcon, Clock, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [formData, setFormData] = useState({
    patient_id: '',
    title: '',
    date: '',
    duration_minutes: 60,
    notes: '',
    reminder_enabled: false,
    reminder_minutes_before: 60
  });

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, []);

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
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast.error('Error al guardar cita');
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
      reminder_enabled: false,
      reminder_minutes_before: 60
    });
    setEditingAppointment(null);
  };

  const filteredAppointments = appointments.filter((apt) =>
    apt.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const upcomingAppointments = filteredAppointments.filter(
    apt => new Date(apt.date) >= new Date()
  );

  const pastAppointments = filteredAppointments.filter(
    apt => new Date(apt.date) < new Date()
  );

  return (
    <div className="page-container" data-testid="appointments-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Citas</h1>
          <p className="page-subtitle">Gestiona y programa citas con recordatorios automáticos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="btn-primary" data-testid="add-appointment-btn">
              <Plus size={18} className="mr-2" />
              Nueva Cita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" data-testid="appointment-dialog">
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
                    <SelectTrigger data-testid="patient-select">
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
                    data-testid="appointment-title-input"
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
                    data-testid="appointment-date-input"
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
                    data-testid="appointment-duration-input"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">Notas</Label>
                  <textarea
                    id="notes"
                    className="w-full min-h-[60px] px-3 py-2 border rounded-md"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    data-testid="appointment-notes-input"
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
                    data-testid="reminder-switch"
                  />
                </div>

                {formData.reminder_enabled && (
                  <div>
                    <Label htmlFor="reminder_time">Enviar recordatorio antes de:</Label>
                    <Select
                      value={formData.reminder_minutes_before.toString()}
                      onValueChange={(value) => setFormData({ ...formData, reminder_minutes_before: parseInt(value) })}
                    >
                      <SelectTrigger data-testid="reminder-time-select">
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
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="cancel-btn">
                  Cancelar
                </Button>
                <Button type="submit" data-testid="save-appointment-btn">
                  {editingAppointment ? 'Actualizar' : 'Guardar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="page-content">
        <div className="search-bar">
          <Search className="search-icon" size={18} />
          <Input
            type="text"
            placeholder="Buscar por paciente o título..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            data-testid="search-appointments-input"
          />
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <CalendarIcon size={20} />
            Próximas Citas ({upcomingAppointments.length})
          </h2>
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Título</th>
                  <th>Fecha y Hora</th>
                  <th>Duración</th>
                  <th>Recordatorio</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {upcomingAppointments.map((apt) => (
                  <tr key={apt.id} data-testid={`appointment-row-${apt.id}`}>
                    <td className="font-medium">{apt.patient_name}</td>
                    <td>{apt.title}</td>
                    <td>
                      <div className="text-sm">
                        <div className="font-medium">
                          {format(new Date(apt.date), "d 'de' MMMM, yyyy", { locale: es })}
                        </div>
                        <div className="text-slate-600">
                          {format(new Date(apt.date), 'HH:mm', { locale: es })}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock size={14} />
                        {apt.duration_minutes} min
                      </div>
                    </td>
                    <td>
                      {apt.reminder_enabled ? (
                        <div className="flex items-center gap-1 text-green-600 text-sm">
                          <Bell size={14} />
                          {apt.reminder_sent ? 'Enviado' : 'Programado'}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-slate-400 text-sm">
                          <BellOff size={14} />
                          Desactivado
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(apt)}
                          data-testid={`edit-appointment-${apt.id}`}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(apt.id)}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`delete-appointment-${apt.id}`}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {upcomingAppointments.length === 0 && (
              <div className="empty-state">
                <p>No hay citas programadas</p>
              </div>
            )}
          </div>
        </div>

        {pastAppointments.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-600 mb-3">Citas Pasadas ({pastAppointments.length})</h2>
            <div className="data-table opacity-75">
              <table>
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Título</th>
                    <th>Fecha y Hora</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pastAppointments.slice(0, 10).map((apt) => (
                    <tr key={apt.id}>
                      <td>{apt.patient_name}</td>
                      <td>{apt.title}</td>
                      <td className="text-sm">
                        {format(new Date(apt.date), "d 'de' MMMM, yyyy - HH:mm", { locale: es })}
                      </td>
                      <td>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(apt.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;