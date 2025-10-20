from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import asyncio


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
    all_appointments = await db.appointments.find({}, {"_id": 0}).to_list(10000)
    
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
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(check_and_send_reminders())

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()