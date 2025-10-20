import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import os
from dotenv import load_dotenv
import uuid

load_dotenv('/app/backend/.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def create_sample_data():
    # Clear existing data
    await db.patients.delete_many({})
    await db.appointments.delete_many({})
    
    # Create sample patients
    patients = [
        {
            "id": str(uuid.uuid4()),
            "name": "Carolina Unjyan",
            "phone": "605765988",
            "email": "carolina@example.com",
            "notes": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Adrian Daniel Careja",
            "phone": "654955374",
            "email": "adrian@example.com",
            "notes": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Atanase Arragea",
            "phone": "613789267",
            "email": "atanase@example.com",
            "notes": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Ibrahim El Kallali",
            "phone": "687123456",
            "email": "ibrahim@example.com",
            "notes": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.patients.insert_many(patients)
    print(f"✅ Created {len(patients)} patients")
    
    # Create sample appointments for today
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    appointments = [
        {
            "id": str(uuid.uuid4()),
            "patient_id": patients[0]["id"],
            "patient_name": patients[0]["name"],
            "patient_phone": patients[0]["phone"],
            "title": "Mensualidad Ortodoncia",
            "date": (today + timedelta(hours=11, minutes=30)).isoformat(),
            "duration_minutes": 15,
            "notes": "",
            "status": "planificada",
            "doctor": "Dra. Virginia Tresgallo",
            "reminder_enabled": True,
            "reminder_minutes_before": 60,
            "reminder_sent": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "patient_id": patients[1]["id"],
            "patient_name": patients[1]["name"],
            "patient_phone": patients[1]["phone"],
            "title": "Retirar Ortodoncia",
            "date": (today + timedelta(hours=16, minutes=0)).isoformat(),
            "duration_minutes": 30,
            "notes": "QUITAR",
            "status": "planificada",
            "doctor": "Dra. Virginia Tresgallo",
            "reminder_enabled": True,
            "reminder_minutes_before": 120,
            "reminder_sent": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "patient_id": patients[2]["id"],
            "patient_name": patients[2]["name"],
            "patient_phone": patients[2]["phone"],
            "title": "Mensualidad Ortodoncia",
            "date": (today + timedelta(hours=16, minutes=30)).isoformat(),
            "duration_minutes": 15,
            "notes": "",
            "status": "planificada",
            "doctor": "Dra. Virginia Tresgallo",
            "reminder_enabled": True,
            "reminder_minutes_before": 60,
            "reminder_sent": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "patient_id": patients[3]["id"],
            "patient_name": patients[3]["name"],
            "patient_phone": patients[3]["phone"],
            "title": "Colocacion Ortodoncia",
            "date": (today + timedelta(hours=16, minutes=45)).isoformat(),
            "duration_minutes": 30,
            "notes": "COLOCAR INFERIORES. ABONA TB LA ULTIMA REVISION",
            "status": "planificada",
            "doctor": "Dra. Virginia Tresgallo",
            "reminder_enabled": True,
            "reminder_minutes_before": 1440,
            "reminder_sent": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "patient_id": patients[0]["id"],
            "patient_name": patients[0]["name"],
            "patient_phone": patients[0]["phone"],
            "title": "Revisión General",
            "date": (today + timedelta(days=1, hours=10, minutes=0)).isoformat(),
            "duration_minutes": 45,
            "notes": "",
            "status": "confirmada",
            "doctor": "Dra. Virginia Tresgallo",
            "reminder_enabled": True,
            "reminder_minutes_before": 1440,
            "reminder_sent": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.appointments.insert_many(appointments)
    print(f"✅ Created {len(appointments)} appointments")
    
    client.close()
    print("✅ Sample data created successfully!")

if __name__ == "__main__":
    asyncio.run(create_sample_data())
