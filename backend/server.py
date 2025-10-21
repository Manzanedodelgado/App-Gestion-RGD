from fastapi import FastAPI, APIRouter, HTTPException, Request, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# WhatsApp service URL
WHATSAPP_SERVICE_URL = "http://localhost:3001"


# Define Models
class Patient(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    email: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PatientCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    notes: Optional[str] = None

class Appointment(BaseModel):
    model_config = ConfigDict(extra="allow")  # Permitir campos adicionales
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    patient_name: str
    patient_phone: str
    title: str
    date: datetime
    duration_minutes: int = 60
    notes: Optional[str] = None
    status: str = "planificada"  # planificada, confirmada, cancelada
    doctor: Optional[str] = None
    reminder_enabled: bool = False
    reminder_minutes_before: int = 60
    reminder_sent: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # Campos adicionales para el frontend
    registro: Optional[str] = None
    nombre: Optional[str] = None
    apellidos: Optional[str] = None
    fecha: Optional[str] = None
    hora: Optional[str] = None
    tratamiento: Optional[str] = None
    estado_cita: Optional[str] = None
    odontologo: Optional[str] = None
    tel_movil: Optional[str] = None

class AppointmentCreate(BaseModel):
    patient_id: str
    title: str
    date: str
    duration_minutes: int = 60
    notes: Optional[str] = None
    status: str = "planificada"
    doctor: Optional[str] = None
    reminder_enabled: bool = False
    reminder_minutes_before: int = 60

class SendMessageRequest(BaseModel):
    number: str
    message: str

class WhatsAppStatus(BaseModel):
    ready: bool
    hasQR: bool
    info: Optional[dict] = None


# WhatsApp endpoints
@api_router.get("/whatsapp/status")
async def get_whatsapp_status():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{WHATSAPP_SERVICE_URL}/status")
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/whatsapp/qr")
async def get_whatsapp_qr():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{WHATSAPP_SERVICE_URL}/qr")
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/whatsapp/chats")
async def get_whatsapp_chats():
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{WHATSAPP_SERVICE_URL}/chats")
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/whatsapp/messages/{chat_id}")
async def get_whatsapp_messages(chat_id: str):
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{WHATSAPP_SERVICE_URL}/messages/{chat_id}")
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/whatsapp/send-message")
async def send_whatsapp_message(request: SendMessageRequest):
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(f"{WHATSAPP_SERVICE_URL}/send-message", json={
                "number": request.number,
                "message": request.message
            })
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/whatsapp/logout")
async def logout_whatsapp():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{WHATSAPP_SERVICE_URL}/logout")
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Patients endpoints
@api_router.post("/patients", response_model=Patient)
async def create_patient(patient: PatientCreate):
    patient_obj = Patient(**patient.model_dump())
    doc = patient_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.patients.insert_one(doc)
    return patient_obj

@api_router.get("/patients", response_model=List[Patient])
async def get_patients():
    patients = await db.patients.find({}, {"_id": 0}).to_list(1000)
    for patient in patients:
        if isinstance(patient['created_at'], str):
            patient['created_at'] = datetime.fromisoformat(patient['created_at'])
    return patients

@api_router.get("/patients/{patient_id}", response_model=Patient)
async def get_patient(patient_id: str):
    patient = await db.patients.find_one({"id": patient_id}, {"_id": 0})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if isinstance(patient['created_at'], str):
        patient['created_at'] = datetime.fromisoformat(patient['created_at'])
    return patient

@api_router.put("/patients/{patient_id}", response_model=Patient)
async def update_patient(patient_id: str, patient: PatientCreate):
    existing = await db.patients.find_one({"id": patient_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    update_data = patient.model_dump()
    await db.patients.update_one({"id": patient_id}, {"$set": update_data})
    
    updated = await db.patients.find_one({"id": patient_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/patients/{patient_id}")
async def delete_patient(patient_id: str):
    result = await db.patients.delete_one({"id": patient_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"success": True}


# Appointments endpoints
@api_router.post("/appointments", response_model=Appointment)
async def create_appointment(appointment: AppointmentCreate):
    # Get patient info
    patient = await db.patients.find_one({"id": appointment.patient_id}, {"_id": 0})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    appointment_data = appointment.model_dump()
    appointment_data['date'] = datetime.fromisoformat(appointment.date)
    appointment_data['patient_name'] = patient['name']
    appointment_data['patient_phone'] = patient['phone']
    appointment_data['reminder_sent'] = False
    
    appointment_obj = Appointment(**appointment_data)
    doc = appointment_obj.model_dump()
    doc['date'] = doc['date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.appointments.insert_one(doc)
    return appointment_obj

@api_router.get("/appointments", response_model=List[Appointment])
async def get_appointments():
    appointments = await db.appointments.find({}, {"_id": 0}).to_list(None)  # Devolver TODAS las citas
    for apt in appointments:
        if isinstance(apt['date'], str):
            apt['date'] = datetime.fromisoformat(apt['date'])
        if isinstance(apt['created_at'], str):
            apt['created_at'] = datetime.fromisoformat(apt['created_at'])
    return sorted(appointments, key=lambda x: x['date'])

@api_router.get("/appointments/{appointment_id}", response_model=Appointment)
async def get_appointment(appointment_id: str):
    appointment = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if isinstance(appointment['date'], str):
        appointment['date'] = datetime.fromisoformat(appointment['date'])
    if isinstance(appointment['created_at'], str):
        appointment['created_at'] = datetime.fromisoformat(appointment['created_at'])
    return appointment

@api_router.put("/appointments/{appointment_id}", response_model=Appointment)
async def update_appointment(appointment_id: str, appointment: AppointmentCreate):
    existing = await db.appointments.find_one({"id": appointment_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Get patient info
    patient = await db.patients.find_one({"id": appointment.patient_id}, {"_id": 0})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    update_data = appointment.model_dump()
    update_data['date'] = datetime.fromisoformat(update_data['date']).isoformat()
    update_data['patient_name'] = patient['name']
    update_data['patient_phone'] = patient['phone']
    
    await db.appointments.update_one({"id": appointment_id}, {"$set": update_data})
    
    updated = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if isinstance(updated['date'], str):
        updated['date'] = datetime.fromisoformat(updated['date'])
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/appointments/{appointment_id}")
async def delete_appointment(appointment_id: str):
    result = await db.appointments.delete_one({"id": appointment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")

# Update appointment status
@api_router.patch("/appointments/{appointment_id}/status")
async def update_appointment_status(appointment_id: str, status: str):
    valid_statuses = ["planificada", "confirmada", "cancelada"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
    
    result = await db.appointments.update_one(
        {"id": appointment_id},
        {"$set": {"status": status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    return {"success": True, "status": status}

# Send individual reminder
@api_router.post("/appointments/{appointment_id}/send-reminder")
async def send_appointment_reminder(appointment_id: str):
    appointment = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    apt_date = datetime.fromisoformat(appointment['date']) if isinstance(appointment['date'], str) else appointment['date']
    message = f"Recordatorio: Tiene una cita '{appointment['title']}' programada para el {apt_date.strftime('%d/%m/%Y a las %H:%M')}."
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(f"{WHATSAPP_SERVICE_URL}/send-message", json={
                "number": appointment['patient_phone'],
                "message": message
            })
        
        return {"success": True, "message": "Recordatorio enviado"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al enviar recordatorio: {str(e)}")


# Get appointment statistics
@api_router.get("/appointments/stats/summary")
async def get_appointment_stats():
    all_appointments = await db.appointments.find({}, {"_id": 0}).to_list(None)  # Todas las citas
    
    total = len(all_appointments)
    confirmadas = sum(1 for apt in all_appointments if apt.get('status') == 'confirmada')
    canceladas = sum(1 for apt in all_appointments if apt.get('status') == 'cancelada')
    
    return {
        "total": total,
        "confirmadas": confirmadas,
        "canceladas": canceladas
    }

# Google Sheets Sync
@api_router.post("/appointments/sync-google-sheets")
async def sync_google_sheets():
    """Sync appointments from Google Sheets"""
    try:
        # Import the sync function
        import sys
        sys.path.insert(0, str(ROOT_DIR))
        from sync_google_sheets import sync_appointments
        
        # Run sync
        result = await sync_appointments()
        
        if result.get('success'):
            return {
                "success": True,
                "message": "Sincronización completada exitosamente",
                "patients_synced": result.get('patients_synced', 0),
                "appointments_synced": result.get('appointments_synced', 0)
            }
        else:
            raise HTTPException(status_code=500, detail=result.get('error', 'Error desconocido'))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en la sincronización: {str(e)}")

    confirmadas = sum(1 for apt in all_appointments if apt.get('status') == 'confirmada')
    canceladas = sum(1 for apt in all_appointments if apt.get('status') == 'cancelada')
    
    return {
        "total": total,
        "confirmadas": confirmadas,
        "canceladas": canceladas
    }

    return {"success": True}


# Background task to check and send reminders
async def check_and_send_reminders():
    while True:
        try:
            now = datetime.now(timezone.utc)
            # Find appointments that need reminders
            appointments = await db.appointments.find({
                "reminder_enabled": True,
                "reminder_sent": False
            }, {"_id": 0}).to_list(1000)
            
            for apt in appointments:
                apt_date = datetime.fromisoformat(apt['date']) if isinstance(apt['date'], str) else apt['date']
                reminder_time = apt_date - timedelta(minutes=apt['reminder_minutes_before'])
                
                if now >= reminder_time and now < apt_date:
                    # Send reminder
                    message = f"Recordatorio: Tiene una cita '{apt['title']}' programada para el {apt_date.strftime('%d/%m/%Y a las %H:%M')}."
                    
                    try:
                        async with httpx.AsyncClient(timeout=30.0) as client:
                            await client.post(f"{WHATSAPP_SERVICE_URL}/send-message", json={
                                "number": apt['patient_phone'],
                                "message": message
                            })
                        
                        # Mark as sent
                        await db.appointments.update_one(
                            {"id": apt['id']},
                            {"$set": {"reminder_sent": True}}
                        )
                        logging.info(f"Reminder sent for appointment {apt['id']}")
                    except Exception as e:
                        logging.error(f"Error sending reminder: {e}")
            
            await asyncio.sleep(60)  # Check every minute
        except Exception as e:
            logging.error(f"Error in reminder task: {e}")
            await asyncio.sleep(60)


@api_router.get("/")
async def root():
    return {"message": "WhatsApp Pro Web API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Start reminder background task
# Scheduler para sincronización automática
scheduler = AsyncIOScheduler()

async def auto_sync_appointments():
    """Función que se ejecuta automáticamente para sincronizar citas"""
    try:
        print("🔄 Iniciando sincronización automática de citas...")
        import sys
        sys.path.insert(0, str(ROOT_DIR))
        from sync_google_sheets import sync_appointments
        
        result = await sync_appointments()
        
        if result.get('success'):
            print(f"✅ Sincronización automática completada: {result.get('appointments_synced', 0)} citas, {result.get('patients_synced', 0)} pacientes")
        else:
            print(f"❌ Error en sincronización automática: {result.get('error', 'Error desconocido')}")
    except Exception as e:
        print(f"❌ Excepción en sincronización automática: {str(e)}")

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(check_and_send_reminders())
    
    # Configurar sincronización automática cada 5 minutos
    scheduler.add_job(
        auto_sync_appointments,
        trigger=IntervalTrigger(minutes=5),
        id='sync_appointments_job',
        name='Sincronizar citas desde Google Sheets',
        replace_existing=True
    )
    scheduler.start()
    print("✅ Scheduler de sincronización automática iniciado (cada 5 minutos)")
    
    # Ejecutar una sincronización inmediata al iniciar
    asyncio.create_task(auto_sync_appointments())



# ============================================
# AUTOMATION SYSTEM - Message Flows & Templates
# ============================================

from automation_service import AIAssistant, MessageFlowEngine, ReminderScheduler
from google_sheets_service import GoogleSheetsService

# Initialize services
ai_assistant = AIAssistant()
google_sheets_service = GoogleSheetsService()

# Pydantic models for Automation
class MessageFlowStep(BaseModel):
    name: str
    message: str
    actions: List[Dict] = []
    delay: int = 0

class MessageFlow(BaseModel):
    id: Optional[str] = None
    name: str
    category: str
    steps: List[MessageFlowStep] = []
    active: bool = True

class ConsentTemplate(BaseModel):
    id: Optional[str] = None
    treatment_name: str
    code: str
    title: str
    description: str
    risks: List[str] = []
    alternatives: str = ""
    post_care: str = ""

class AIConfig(BaseModel):
    ai_active: bool = False
    auto_response: bool = False
    classification_active: bool = True
    personality: str = "Soy el asistente virtual de Rubio García Dental. Soy profesional, amable y siempre dispuesto a ayudar con consultas sobre tratamientos dentales."
    knowledge_topics: List[str] = []
    work_schedules: List[Dict] = []

# ============================================
# MESSAGE FLOWS ENDPOINTS
# ============================================

@api_router.get("/message-flows")
async def get_message_flows():
    """Get all message flows"""
    try:
        flows = await db.message_flows.find().to_list(None)
        return flows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/message-flows")
async def create_message_flow(flow: MessageFlow):
    """Create a new message flow"""
    try:
        flow_dict = flow.dict(exclude={'id'})
        flow_dict['id'] = str(uuid.uuid4())
        flow_dict['created_at'] = datetime.now(timezone.utc).isoformat()
        
        await db.message_flows.insert_one(flow_dict)
        return {"success": True, "flow": flow_dict}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/message-flows/{flow_id}")
async def update_message_flow(flow_id: str, flow: MessageFlow):
    """Update a message flow"""
    try:
        flow_dict = flow.dict(exclude={'id'})
        flow_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        result = await db.message_flows.update_one(
            {'id': flow_id},
            {'$set': flow_dict}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Flow not found")
        
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/message-flows/{flow_id}")
async def delete_message_flow(flow_id: str):
    """Delete a message flow"""
    try:
        result = await db.message_flows.delete_one({'id': flow_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Flow not found")
        
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# CONSENT TEMPLATES ENDPOINTS
# ============================================

@api_router.get("/consent-templates")
async def get_consent_templates():
    """Get all consent templates"""
    try:
        templates = await db.consent_templates.find().to_list(None)
        return templates
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/consent-templates")
async def create_consent_template(template: ConsentTemplate):
    """Create a new consent template"""
    try:
        template_dict = template.dict(exclude={'id'})
        template_dict['id'] = str(uuid.uuid4())
        template_dict['created_at'] = datetime.now(timezone.utc).isoformat()
        
        await db.consent_templates.insert_one(template_dict)
        return {"success": True, "template": template_dict}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/consent-templates/{template_id}")
async def update_consent_template(template_id: str, template: ConsentTemplate):
    """Update a consent template"""
    try:
        template_dict = template.dict(exclude={'id'})
        template_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        result = await db.consent_templates.update_one(
            {'id': template_id},
            {'$set': template_dict}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/consent-templates/{template_id}")
async def delete_consent_template(template_id: str):
    """Delete a consent template"""
    try:
        result = await db.consent_templates.delete_one({'id': template_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# AI CONFIGURATION ENDPOINTS
# ============================================

@api_router.get("/ai-config")
async def get_ai_config():
    """Get AI configuration"""
    try:
        config = await db.ai_config.find_one()
        if not config:
            # Return default config
            default_config = {
                'ai_active': False,
                'auto_response': False,
                'classification_active': True,
                'personality': ai_assistant.personality,
                'knowledge_topics': [],
                'work_schedules': []
            }
            return default_config
        return config
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/ai-config")
async def update_ai_config(config: AIConfig):
    """Update AI configuration"""
    try:
        config_dict = config.dict()
        config_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        # Update assistant personality if changed
        if config.personality:
            ai_assistant.personality = config.personality
        
        # Upsert config
        await db.ai_config.update_one(
            {},
            {'$set': config_dict},
            upsert=True
        )
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai-classify")
async def classify_message(message: Dict):
    """Classify a message using AI"""
    try:
        text = message.get('text', '')
        classification = ai_assistant.classify_conversation(text)
        return {"classification": classification}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai-respond")
async def generate_ai_response(request: Dict):
    """Generate AI response to a message"""
    try:
        message = request.get('message', '')
        context = request.get('context', [])
        
        response = await ai_assistant.generate_response(message, context)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# MESSAGING SYSTEM - Import from separate router
# ============================================

from messaging_routes import messaging_router, init_messaging_routes

# Initialize messaging routes with database and WhatsApp URL
init_messaging_routes(db, WHATSAPP_SERVICE_URL)

# Include messaging router
app.include_router(messaging_router)

print("✅ Sistema de mensajería completo iniciado")
print("   - Gestión de contactos y conversaciones")
print("   - Clasificación automática con IA")
print("   - Botones interactivos")
print("   - Transcripción de audio (pendiente configurar Whisper)")


# ============================================
# AUTOMATIC REMINDERS
# ============================================

async def run_reminder_scheduler():
    """Background task to check and send reminders"""
    while True:
        try:
            await ReminderScheduler.check_and_send_reminders(
                db, 
                WHATSAPP_SERVICE_URL, 
                google_sheets_service
            )
        except Exception as e:
            print(f"Error in reminder scheduler: {e}")
        
        # Wait 1 hour before next check
        await asyncio.sleep(3600)

# Add reminder scheduler job
scheduler.add_job(
    lambda: asyncio.create_task(run_reminder_scheduler()),
    trigger=IntervalTrigger(hours=1),
    id='reminder_scheduler_job',
    name='Check and send appointment reminders',
    replace_existing=True
)

print("✅ Sistema de automatizaciones iniciado")
print("   - Flujos de mensajes")
print("   - Plantillas de consentimiento")
print("   - Asistente IA con DeepSeek (gratuito)")
print("   - Recordatorios automáticos cada hora")

@app.on_event("shutdown")
async def shutdown_db_client():
    scheduler.shutdown()
    client.close()