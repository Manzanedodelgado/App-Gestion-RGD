import os
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import asyncio
from dotenv import load_dotenv
from pathlib import Path
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Google Sheets setup
SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
SPREADSHEET_ID = '1MBDBHQ08XGuf5LxVHCFhHDagIazFkpBnxwqyEQIBJrQ'
RANGE_NAME = 'Hoja 1!A:Z'

# MongoDB setup
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

def get_google_sheets_service():
    """Initialize Google Sheets API service"""
    creds = service_account.Credentials.from_service_account_file(
        ROOT_DIR / 'credentials.json', scopes=SCOPES)
    service = build('sheets', 'v4', credentials=creds)
    return service

def parse_date_time(date_str, time_str):
    """Parse date and time strings to datetime object"""
    try:
        # Intenta varios formatos de fecha
        date_formats = [
            '%d/%m/%Y',
            '%d-%m-%Y',
            '%Y-%m-%d',
            '%d/%m/%y',
            '%d.%m.%Y'
        ]
        
        parsed_date = None
        for fmt in date_formats:
            try:
                parsed_date = datetime.strptime(date_str.strip(), fmt)
                break
            except ValueError:
                continue
        
        if not parsed_date:
            print(f"No se pudo parsear la fecha: {date_str}")
            return None
        
        # Parsear hora
        time_str = time_str.strip()
        time_formats = ['%H:%M', '%H:%M:%S', '%I:%M %p']
        
        parsed_time = None
        for fmt in time_formats:
            try:
                parsed_time = datetime.strptime(time_str, fmt).time()
                break
            except ValueError:
                continue
        
        if not parsed_time:
            print(f"No se pudo parsear la hora: {time_str}")
            return None
        
        # Combinar fecha y hora
        combined = datetime.combine(parsed_date.date(), parsed_time)
        # Convertir a UTC
        return combined.replace(tzinfo=timezone.utc)
        
    except Exception as e:
        print(f"Error parseando fecha/hora: {date_str} {time_str} - {str(e)}")
        return None

async def sync_appointments():
    """Sync appointments from Google Sheets to MongoDB"""
    try:
        print("Iniciando sincronización con Google Sheets...")
        
        # Obtener datos de Google Sheets
        service = get_google_sheets_service()
        sheet = service.spreadsheets()
        result = sheet.values().get(spreadsheetId=SPREADSHEET_ID, range=RANGE_NAME).execute()
        values = result.get('values', [])
        
        if not values:
            print('No se encontraron datos en la hoja.')
            return
        
        # Primera fila son los headers
        headers = values[0]
        print(f"Headers encontrados: {headers}")
        
        # Mapear índices de columnas
        column_map = {}
        for i, header in enumerate(headers):
            column_map[header.lower().strip()] = i
        
        print(f"Mapa de columnas: {column_map}")
        
        # Procesar filas
        appointments_synced = 0
        patients_synced = 0
        
        for row_idx, row in enumerate(values[1:], start=2):
            try:
                # Saltar filas vacías
                if not row or len(row) < 3:
                    continue
                
                # Obtener valores
                def get_value(col_name):
                    idx = column_map.get(col_name.lower().strip())
                    if idx is not None and idx < len(row):
                        return row[idx].strip() if row[idx] else ''
                    return ''
                
                # Extraer datos del paciente según los headers de la sheet
                apellidos = get_value('apellidos')
                nombre_pila = get_value('nombre')
                nombre = f"{nombre_pila} {apellidos}".strip() if (nombre_pila or apellidos) else ''
                telefono = get_value('telmovil') or get_value('teléfono') or get_value('telefono')
                fecha = get_value('fecha')
                hora = get_value('hora')
                tratamiento = get_value('tratamiento') or get_value('tipo') or get_value('motivo')
                doctor = get_value('odontologo') or get_value('doctor') or get_value('dra')
                notas = get_value('notas') or get_value('observaciones')
                
                # Validar datos mínimos
                if not nombre or not telefono or not fecha or not hora:
                    print(f"Fila {row_idx}: Datos incompletos, saltando...")
                    continue
                
                # Parsear fecha y hora
                appointment_datetime = parse_date_time(fecha, hora)
                if not appointment_datetime:
                    print(f"Fila {row_idx}: No se pudo parsear fecha/hora, saltando...")
                    continue
                
                # Buscar o crear paciente
                patient = await db.patients.find_one({"phone": telefono})
                
                if not patient:
                    patient_id = str(uuid.uuid4())
                    patient_doc = {
                        "id": patient_id,
                        "name": nombre,
                        "phone": telefono,
                        "email": "",
                        "notes": "",
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                    await db.patients.insert_one(patient_doc)
                    patient = patient_doc
                    patients_synced += 1
                    print(f"✓ Paciente creado: {nombre}")
                else:
                    patient_id = patient['id']
                
                # Buscar si ya existe una cita con la misma fecha/hora y paciente
                existing_appointment = await db.appointments.find_one({
                    "patient_id": patient_id,
                    "date": appointment_datetime.isoformat()
                })
                
                if existing_appointment:
                    print(f"Fila {row_idx}: Cita ya existe para {nombre} en {fecha} {hora}")
                    continue
                
                # Crear cita
                appointment_doc = {
                    "id": str(uuid.uuid4()),
                    "patient_id": patient_id,
                    "patient_name": nombre,
                    "patient_phone": telefono,
                    "title": tratamiento or "Consulta",
                    "date": appointment_datetime.isoformat(),
                    "duration_minutes": 30,
                    "notes": notas,
                    "status": "planificada",
                    "doctor": doctor or "Dra. Virginia Tresgallo",
                    "reminder_enabled": True,
                    "reminder_minutes_before": 1440,  # 1 día antes
                    "reminder_sent": False,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                
                await db.appointments.insert_one(appointment_doc)
                appointments_synced += 1
                print(f"✓ Cita creada: {nombre} - {fecha} {hora}")
                
            except Exception as e:
                print(f"Error procesando fila {row_idx}: {str(e)}")
                continue
        
        print(f"\n✅ Sincronización completada:")
        print(f"   - Pacientes nuevos: {patients_synced}")
        print(f"   - Citas sincronizadas: {appointments_synced}")
        
        return {
            "success": True,
            "patients_synced": patients_synced,
            "appointments_synced": appointments_synced
        }
        
    except Exception as e:
        print(f"❌ Error en la sincronización: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        client.close()

if __name__ == "__main__":
    result = asyncio.run(sync_appointments())
    print(f"\nResultado: {result}")
