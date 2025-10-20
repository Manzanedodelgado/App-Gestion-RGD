import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Search, Upload, Sparkles, UploadCloud, Users, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import ContactForm from './ContactForm';
import ContactList from './ContactList';
import ContactFilters from './ContactFilters';
import BulkCsvSender from './BulkCsvSender';
import { AnimatePresence } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ status: 'todos' });
  const [showForm, setShowForm] = useState(false);
  const [showBulkCsv, setShowBulkCsv] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [parentContact, setParentContact] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API}/patients`);
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Error al cargar pacientes');
    }
    setIsLoading(false);
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingPatient) {
        await axios.put(`${API}/patients/${editingPatient.id}`, formData);
        toast.success('Paciente actualizado');
      } else {
        await axios.post(`${API}/patients`, formData);
        toast.success('Paciente creado');
      }

      setShowForm(false);
      setEditingPatient(null);
      setParentContact(null);
      fetchPatients();
    } catch (error) {
      console.error('Error saving patient:', error);
      toast.error('Error al guardar paciente');
    }
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

  const handleCancel = () => {
    setShowForm(false);
    setEditingPatient(null);
    setParentContact(null);
  };

  const filteredPatients = (() => {
    let result = patients;

    // Filtro de búsqueda
    if (searchQuery.trim()) {
      result = result.filter((patient) =>
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.phone.includes(searchQuery)
      );
    }

    // Filtro de estado
    if (filters.status !== 'todos') {
      result = result.filter(patient => patient.status === filters.status);
    }

    return result;
  })();

  const activePatients = patients.filter(p => p.email || p.phone).length;

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
                onClick={() => setShowBulkCsv(true)}
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

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre, teléfono o número de paciente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-gray-200 text-base rounded-lg focus:ring-[#0071bc] focus:border-[#0071bc]"
                data-testid="search-patients-input"
              />
            </div>
            <ContactFilters 
              filters={filters}
              setFilters={setFilters}
            />
          </div>
        </div>

        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <ContactForm
              contact={editingPatient}
              parentContact={parentContact}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          )}
        </AnimatePresence>

        {/* Bulk CSV Sender Modal */}
        {showBulkCsv && (
          <BulkCsvSender onClose={() => setShowBulkCsv(false)} />
        )}

        {/* Patients List */}
        <ContactList
          contacts={filteredPatients}
          allContacts={patients}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAddFamilyMember={handleAddFamilyMember}
        />
      </div>
    </div>
  );
};

export default Patients;