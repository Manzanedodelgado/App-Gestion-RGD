import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Plus, Search, Edit, Trash2, Phone, Mail, Upload, Sparkles, UploadCloud, Users, Tag, Save, X, UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [parentContact, setParentContact] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    status: 'activo',
    relationship_type: 'titular',
    parent_contact_id: null
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (editingPatient) {
      setFormData({
        name: editingPatient.name || '',
        phone: editingPatient.phone || '',
        email: editingPatient.email || '',
        notes: editingPatient.notes || '',
        status: 'activo',
        relationship_type: 'titular',
        parent_contact_id: null
      });
    } else if (parentContact) {
      setFormData({
        name: '',
        phone: parentContact.phone,
        email: '',
        notes: '',
        status: 'activo',
        relationship_type: 'familiar',
        parent_contact_id: parentContact.id
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        notes: '',
        status: 'activo',
        relationship_type: 'titular',
        parent_contact_id: null
      });
    }
  }, [editingPatient, parentContact]);

  const fetchPatients = async () => {
    try {
      const response = await axios.get(`${API}/patients`);
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Error al cargar pacientes');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingPatient) {
        await axios.put(`${API}/patients/${editingPatient.id}`, formData);
        toast.success('Paciente actualizado');
      } else {
        await axios.post(`${API}/patients`, formData);
        toast.success('Paciente creado');
      }

      setShowForm(false);
      resetForm();
      fetchPatients();
    } catch (error) {
      console.error('Error saving patient:', error);
      toast.error('Error al guardar paciente');
    }
    setIsSaving(false);
  };

  const handleEdit = (patient) => {
    setEditingPatient(patient);
    setParentContact(null);
    setShowForm(true);
  };

  const handleAddFamilyMember = (titular) => {
    setEditingPatient(null);
    setParentContact(titular);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este paciente?')) return;

    try {
      await axios.delete(`${API}/patients/${id}`);
      toast.success('Paciente eliminado');
      fetchPatients();
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error('Error al eliminar paciente');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      notes: '',
      status: 'activo',
      relationship_type: 'titular',
      parent_contact_id: null
    });
    setEditingPatient(null);
    setParentContact(null);
  };

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone.includes(searchQuery)
  );

  const activePatients = patients.filter(p => p.email || p.phone).length;
  const isFamiliar = formData.relationship_type === 'familiar';

  return (
    <div className="bg-[#f0f4f8] min-h-screen">
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="bg-gradient-to-r from-[#2e3192] to-[#0071bc] px-6 py-6 rounded-3xl shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white mb-1">Pacientes</h1>
              <p className="text-xs text-gray-200">Gestiona tu base de datos de pacientes</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 h-9 text-sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar CSV
              </Button>

              <Button 
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 h-9 text-sm"
              >
                <UploadCloud className="w-4 h-4 mr-2" />
                Envío Masivo por CSV
              </Button>

              <Button
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 h-9 text-sm"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Limpiar Duplicados
              </Button>
              
              <Button 
                className="bg-gradient-to-r from-[#65C8D0] to-[#9EEDFC] text-[#2E3192] hover:from-[#55B8C0] hover:to-[#8EDDEC] shadow-lg h-9 text-sm font-bold"
                onClick={() => {
                  setShowForm(true);
                  setEditingPatient(null);
                  setParentContact(null);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Paciente
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-[#0071bc] to-[#2e3192] rounded-xl shadow-lg p-5 flex items-center gap-4 text-white">
            <div className="p-3 bg-white/20 rounded-full">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold">{patients.length}</p>
              <p className="text-sm opacity-80">Titulares</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#65c8d0] to-[#00a2e7] rounded-xl shadow-lg p-5 flex items-center gap-4 text-white">
            <div className="p-3 bg-white/20 rounded-full">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold">{activePatients}</p>
              <p className="text-sm opacity-80">Pacientes Activos</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] rounded-xl shadow-lg p-5 flex items-center gap-4 text-white">
            <div className="p-3 bg-white/20 rounded-full">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm opacity-80">Etiquetas Usadas</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre, teléfono o número de paciente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 border-gray-200 text-base rounded-lg focus:ring-[#0071bc] focus:border-[#0071bc]"
              data-testid="search-patients-input"
            />
            <Button 
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-[#0071bc]"
            >
              <Users className="w-5 h-5 mr-2" />
              Todos los...
            </Button>
          </div>
        </div>

        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setShowForm(false)}
            >
              <Card className="w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {editingPatient ? <UserCheck className="w-6 h-6 text-[#0071bc]" /> : <UserPlus className="w-6 h-6 text-[#0071bc]" />}
                          {editingPatient ? 'Editar Paciente' : (isFamiliar ? 'Añadir Familiar' : 'Nuevo Paciente Titular')}
                        </CardTitle>
                        {isFamiliar && parentContact && <CardDescription>Familiar de: {parentContact.name}</CardDescription>}
                      </div>
                      <Button variant="ghost" size="icon" type="button" onClick={() => setShowForm(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto p-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre Completo *</Label>
                        <Input 
                          id="name" 
                          value={formData.name} 
                          onChange={(e) => handleChange('name', e.target.value)} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono Móvil *</Label>
                        <Input 
                          id="phone" 
                          type="tel" 
                          value={formData.phone} 
                          onChange={(e) => handleChange('phone', e.target.value)} 
                          required 
                          disabled={isFamiliar} 
                        />
                        {isFamiliar && <p className="text-xs text-gray-500">Los familiares usan el teléfono del titular.</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Correo Electrónico</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={formData.email} 
                        onChange={(e) => handleChange('email', e.target.value)} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notas Internas</Label>
                      <Textarea 
                        id="notes" 
                        value={formData.notes} 
                        onChange={(e) => handleChange('notes', e.target.value)} 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Estado del Paciente</Label>
                      <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="activo">Activo</SelectItem>
                          <SelectItem value="inactivo">Inactivo</SelectItem>
                          <SelectItem value="bloqueado">Bloqueado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                  <div className="p-4 border-t flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={isSaving}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Guardar Paciente
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Patients List */}
        <div className="space-y-3">
          {filteredPatients.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron pacientes</p>
            </div>
          ) : (
            filteredPatients.map((patient) => (
              <div 
                key={patient.id} 
                className="bg-white rounded-2xl shadow-md p-4 flex items-center gap-4 hover:shadow-lg transition-shadow border-2 border-[#0071bc]"
                data-testid={`patient-row-${patient.id}`}
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0071bc] to-[#2e3192] flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {patient.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-gray-900">{patient.name}</h3>
                    <Badge className="bg-green-100 text-green-700 border-green-300 text-xs px-2 py-0.5">
                      Activo
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <span>{patient.phone}</span>
                    </div>
                    {patient.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span>{patient.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => handleAddFamilyMember(patient)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Familiar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(patient)}
                    className="text-gray-600 hover:text-[#0071bc] hover:bg-blue-50"
                    data-testid={`edit-patient-${patient.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(patient.id)}
                    className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                    data-testid={`delete-patient-${patient.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Patients;